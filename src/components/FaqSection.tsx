import { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import type { FaqItem } from '@/lib/constants';
import { cn } from '@/lib/utils';

export interface FaqSectionProps {
  items: readonly FaqItem[];
  heading?: string;
  subheading?: string;
  idPrefix?: string;
}

/**
 * FaqSection — brutalist accordion that renders the same question set that is
 * exported as FAQPage structured data, which is what gets the rich result in
 * search while keeping the on-page copy keyword-rich and genuinely useful.
 */
export default function FaqSection({
  items,
  heading = 'Anonymous posting questions, answered',
  subheading = 'Everything people ask before they post their first confession on WHAATEVER.',
  idPrefix = 'faq',
}: FaqSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section aria-labelledby={`${idPrefix}-heading`} className="mt-12">
      <h2 id={`${idPrefix}-heading`} className="flex items-center gap-2 font-display text-2xl uppercase leading-none tracking-tight sm:text-3xl">
        <span className="flex h-9 w-9 items-center justify-center border-3 border-black bg-lemon-400 shadow-brutal-sm">
          <HelpCircle size={18} strokeWidth={3} aria-hidden />
        </span>
        {heading}
      </h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-soft">{subheading}</p>

      <div className="mt-5 divide-y-3 divide-black border-4 border-black bg-white shadow-brutal-lg">
        {items.map((item, index) => {
          const isOpen = openIndex === index;
          const panelId = `${idPrefix}-panel-${index}`;
          const buttonId = `${idPrefix}-button-${index}`;

          return (
            <div key={item.question} className="bg-white">
              <h3 className="m-0">
                <button
                  type="button"
                  id={buttonId}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className={cn(
                    'flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left transition-colors',
                    isOpen ? 'bg-lemon-200' : 'hover:bg-cream',
                  )}
                >
                  <span className="font-display text-[13px] uppercase leading-snug tracking-tight text-ink sm:text-sm">
                    {item.question}
                  </span>
                  <span
                    className={cn(
                      'flex h-7 w-7 shrink-0 items-center justify-center border-2 border-black bg-white shadow-brutal-xs transition-transform',
                      isOpen && 'rotate-180 bg-lemon-400',
                    )}
                    aria-hidden
                  >
                    <ChevronDown size={15} strokeWidth={3} />
                  </span>
                </button>
              </h3>

              <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                hidden={!isOpen}
                className="border-t-2 border-black bg-cream px-4 py-3"
              >
                <p className="text-[13px] leading-relaxed text-ink-soft">{item.answer}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
