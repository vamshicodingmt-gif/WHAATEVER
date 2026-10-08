import { Ghost } from 'lucide-react';
import { bucketOf, cn, initialsOf } from '@/lib/utils';
import { GHOST_HANDLE } from '@/lib/constants';

/** Brutalist avatar palette — cobalt, lemon, olive, beige, ink. */
const PALETTE = [
  'bg-cobalt-600 text-white',
  'bg-lemon-400 text-ink',
  'bg-olive-600 text-white',
  'bg-beige text-ink',
  'bg-ink text-lemon-400',
  'bg-cobalt-800 text-white',
];

const SIZES = {
  sm: 'h-7 w-7 text-[10px] border-2',
  md: 'h-9 w-9 text-[11px] border-2',
  lg: 'h-12 w-12 text-sm border-3',
} as const;

export interface AvatarProps {
  /** `null` renders the anonymous ghost glyph. */
  name: string | null;
  size?: keyof typeof SIZES;
  className?: string;
}

/**
 * Avatar — deterministic brutalist identity chip. Ghost posters get the
 * anonymous glyph, named posters get a colour-bucketed monogram so the same
 * pseudonym always looks the same across the feed.
 */
export default function Avatar({ name, size = 'md', className }: AvatarProps) {
  const base = cn(
    'flex shrink-0 items-center justify-center border-black font-display uppercase leading-none shadow-brutal-xs',
    SIZES[size],
    className,
  );

  if (!name) {
    return (
      <span className={cn(base, 'bg-ink text-lemon-400')} title={GHOST_HANDLE} aria-hidden>
        <Ghost size={size === 'lg' ? 20 : 14} strokeWidth={2.75} />
      </span>
    );
  }

  return (
    <span className={cn(base, PALETTE[bucketOf(name, PALETTE.length)])} aria-hidden title={name}>
      {initialsOf(name)}
    </span>
  );
}
