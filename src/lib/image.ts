import type { MediaAttachment } from '@/types';
import { LIMITS } from '@/lib/constants';

/**
 * 100% client-side image pipeline.
 *
 * Files never touch a server: the browser decodes them, paints them onto a
 * canvas, re-encodes a compressed JPEG (or keeps an animated GIF verbatim) and
 * hands back a base64 data URL that can be stored directly in localStorage.
 */

const MAX_EDGE = 1600;
const JPEG_QUALITY = 0.82;
const GIF_PASSTHROUGH_BYTES = 600 * 1024;

export interface UploadRejection {
  ok: false;
  reason: string;
}

export interface UploadSuccess {
  ok: true;
  attachment: MediaAttachment;
  /** True when the source file was re-encoded / downscaled. */
  compressed: boolean;
  originalBytes: number;
}

export type UploadResult = UploadSuccess | UploadRejection;

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('That file could not be read by the browser.'));
    reader.readAsDataURL(file);
  });
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('That image could not be decoded.'));
    image.src = src;
  });
}

function scaleToFit(width: number, height: number, maxEdge: number): { width: number; height: number } {
  if (width <= maxEdge && height <= maxEdge) return { width, height };
  const ratio = width > height ? maxEdge / width : maxEdge / height;
  return { width: Math.max(1, Math.round(width * ratio)), height: Math.max(1, Math.round(height * ratio)) };
}

/**
 * Convert a user-selected file into a storable attachment.
 * Rejects anything that is not an image, anything gigantic, and anything the
 * browser cannot decode — with a human error message instead of a stack trace.
 */
export async function fileToAttachment(file: File): Promise<UploadResult> {
  if (!file.type.startsWith('image/')) {
    return { ok: false, reason: `"${file.name}" is not an image file. WHAATEVER only accepts image attachments.` };
  }

  if (file.size > LIMITS.uploadBytes) {
    return {
      ok: false,
      reason: `"${file.name}" is ${(file.size / 1024 / 1024).toFixed(1)}MB. Keep anonymous uploads under 8MB.`,
    };
  }

  const dataUrl = await readAsDataUrl(file);
  const image = await loadImageElement(dataUrl);
  const naturalWidth = image.naturalWidth || image.width;
  const naturalHeight = image.naturalHeight || image.height;

  // Animated GIFs are passed through untouched so the motion survives.
  if (file.type === 'image/gif' && file.size <= GIF_PASSTHROUGH_BYTES) {
    return {
      ok: true,
      compressed: false,
      originalBytes: file.size,
      attachment: {
        dataUrl,
        width: naturalWidth,
        height: naturalHeight,
        bytes: Math.round(dataUrl.length * 0.75),
        name: file.name,
      },
    };
  }

  const target = scaleToFit(naturalWidth, naturalHeight, MAX_EDGE);
  const canvas = document.createElement('canvas');
  canvas.width = target.width;
  canvas.height = target.height;

  const context = canvas.getContext('2d');
  if (!context) {
    // Extremely defensive: without canvas we still keep the original payload.
    return {
      ok: true,
      compressed: false,
      originalBytes: file.size,
      attachment: {
        dataUrl,
        width: naturalWidth,
        height: naturalHeight,
        bytes: Math.round(dataUrl.length * 0.75),
        name: file.name,
      },
    };
  }

  // White matte so transparent PNGs do not turn black when re-encoded as JPEG.
  context.fillStyle = '#FFFFFF';
  context.fillRect(0, 0, target.width, target.height);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(image, 0, 0, target.width, target.height);

  let encoded = canvas.toDataURL('image/jpeg', JPEG_QUALITY);

  // If JPEG somehow came out bigger than the source (tiny PNGs do this), keep the source.
  if (encoded.length > dataUrl.length && dataUrl.length < 700_000) {
    encoded = dataUrl;
  }

  const attachment: MediaAttachment = {
    dataUrl: encoded,
    width: encoded === dataUrl ? naturalWidth : target.width,
    height: encoded === dataUrl ? naturalHeight : target.height,
    bytes: Math.round(encoded.length * 0.75),
    name: encoded === dataUrl ? file.name : `${file.name.replace(/\.[a-z0-9]+$/i, '')}.jpg`,
  };

  return {
    ok: true,
    compressed: attachment.bytes < file.size,
    originalBytes: file.size,
    attachment,
  };
}

/** Pull every image out of a paste / drop event, if any. */
export function filesFromDataTransfer(dataTransfer: DataTransfer | null): File[] {
  if (!dataTransfer) return [];

  const files = Array.from(dataTransfer.files ?? []).filter((file) => file.type.startsWith('image/'));
  if (files.length > 0) return files;

  return Array.from(dataTransfer.items ?? [])
    .filter((item) => item.kind === 'file' && item.type.startsWith('image/'))
    .map((item) => item.getAsFile())
    .filter((file): file is File => file !== null);
}
