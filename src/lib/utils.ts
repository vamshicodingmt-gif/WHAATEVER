import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Post } from '@/types';

/** Merge conditional class names and de-duplicate conflicting Tailwind classes. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Collision-resistant id that works without crypto.subtle / uuid libs. */
export function uid(prefix = 'wa'): string {
  const random = Math.random().toString(36).slice(2, 10);
  const stamp = Date.now().toString(36);
  return `${prefix}_${stamp}${random}`;
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

/** Compact relative timestamp: "just now", "12m", "3h", "4d", "Mar 4". */
export function timeAgo(timestamp: number, now = Date.now()): string {
  const diff = Math.max(0, now - timestamp);
  if (diff < 45_000) return 'just now';
  if (diff < HOUR) return `${Math.round(diff / MINUTE)}m ago`;
  if (diff < DAY) return `${Math.round(diff / HOUR)}h ago`;
  if (diff < WEEK) return `${Math.round(diff / DAY)}d ago`;
  if (diff < 5 * WEEK) return `${Math.round(diff / WEEK)}w ago`;
  return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/** Full, human-readable timestamp for tooltips and structured data. */
export function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** ISO-8601 string for <time dateTime> and schema.org datePublished. */
export function isoDate(timestamp: number): string {
  return new Date(timestamp).toISOString();
}

/** 1284 -> "1.3k" */
export function formatCount(value: number): string {
  if (value < 1000) return String(value);
  if (value < 1_000_000) {
    const k = value / 1000;
    return `${k >= 10 ? Math.round(k) : k.toFixed(1).replace(/\.0$/, '')}k`;
  }
  return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
}

/** Human readable byte size. */
export function humanBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max).trimEnd()}…`;
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${formatCount(count)} ${count === 1 ? singular : plural}`;
}

/** Deterministic 0..n-1 bucket for a string (used for avatar colours). */
export function bucketOf(value: string, buckets: number): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % buckets;
}

/** Initials for named posters: "Midnight Kettle" -> "MK". */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

/** Count words in a body of text (feeds the live stats strip). */
export function countWords(text: string): number {
  const matches = text.trim().match(/[^\s]+/g);
  return matches ? matches.length : 0;
}

/** Estimate the byte size of a UTF-16 string stored in localStorage. */
export function byteLength(value: string): number {
  return value.length * 2;
}

/**
 * Trending score: engagement weighted, then decayed by age so yesterday's
 * viral confession eventually hands the crown over to today's. Pinned posts
 * always float to the top.
 */
export function trendingScore(post: Post, now = Date.now()): number {
  const ageHours = Math.max(0, (now - post.createdAt) / HOUR);
  const engagement = post.likes * 3 + post.comments.length * 6 + Math.min(post.views, 400) * 0.4;
  const decay = 1 / Math.pow(1 + ageHours / 20, 1.35);
  const pinnedBoost = post.pinned ? 45 : 0;
  return engagement * decay + pinnedBoost;
}

/** Score -> 0..100 heat percentage for the trending meter. */
export function heatPercent(post: Post, topScore: number, now = Date.now()): number {
  if (topScore <= 0) return 0;
  return Math.max(6, Math.min(100, Math.round((trendingScore(post, now) / topScore) * 100)));
}

/** Copy text to the clipboard with a graceful legacy fallback. */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to the legacy path */
  }

  try {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.top = '-1000px';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(area);
    return ok;
  } catch {
    return false;
  }
}

/** Trigger a client-side file download (used by "Export feed"). */
export function downloadJson(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/** URL-safe slug for schema.org / share anchors. */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60);
}
