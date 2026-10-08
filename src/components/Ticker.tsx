import { TICKER_ITEMS } from '@/lib/constants';
import { cn } from '@/lib/utils';

export interface TickerProps {
  /** Tone of the strip — cobalt for the header, ink for the footer. */
  tone?: 'cobalt' | 'ink' | 'lemon';
  className?: string;
}

const TONES = {
  cobalt: 'bg-cobalt-600 text-white',
  ink: 'bg-ink text-lemon-400',
  lemon: 'bg-lemon-400 text-ink',
} as const;

/**
 * Ticker — the relentless scrolling brutalist banner that advertises the
 * platform's promise (zero logins, ghost mode, unfiltered thoughts).
 */
export default function Ticker({ tone = 'cobalt', className }: TickerProps) {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS];

  return (
    <div
      className={cn('marquee-mask relative overflow-hidden border-y-3 border-black', TONES[tone], className)}
      aria-hidden
    >
      <div className="flex w-max animate-marquee items-center gap-6 py-1.5">
        {items.map((item, index) => (
          <span key={`${item}-${index}`} className="flex items-center gap-6 whitespace-nowrap">
            <span className="font-display text-[11px] uppercase tracking-[0.22em]">{item}</span>
            <span className="text-[13px] leading-none">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}
