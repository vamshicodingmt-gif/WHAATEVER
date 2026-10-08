import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Ban, CheckCircle2, EyeOff, Ghost, HeartHandshake, PenSquare, Scale, ShieldCheck } from 'lucide-react';
import { SITE } from '@/lib/constants';
import { absoluteUrl } from '@/lib/constants';
import { baseGraph, breadcrumbGraph, faqGraph, pageGraph } from '@/lib/schema';
import SEOHead from '@/components/SEOHead';
import FaqSection from '@/components/FaqSection';

export interface GuidelinesProps {
  onCreatePost: () => void;
}

const ALLOWED = [
  'Swearing, venting and unfiltered rants about work, family, love and life.',
  'Confessions that would get you side-eyed at a dinner table but hurt nobody.',
  'Unpopular opinions, hot takes and arguments with strangers in the comments.',
  'Anonymously sharing screenshots, memes and photos that are yours to share.',
  'Asking for honest advice, comfort, or a reality check from strangers.',
  'Celebrating small wins that nobody in your real life would understand.',
] as const;

const NOT_ALLOWED = [
  'Doxxing. Never post anyone\u2019s real name, address, workplace, phone number or socials with intent to harm.',
  'Targeted harassment, threats of violence, or coordinating pile-ons against a person.',
  'Hate speech against any group based on race, religion, gender identity, sexuality or disability.',
  'Content involving minors, non-consensual sexual material, or anything illegal in your jurisdiction.',
  'Impersonating another real person to damage them, or sharing private media without consent.',
  'Spam, malware links, scams and referral-farming dressed up as a confession.',
] as const;

const RULES_FAQ = [
  {
    question: 'Is explicit language allowed on WHAATEVER?',
    answer:
      'Yes. Unfiltered language, swearing, shouting in caps lock and messy emotional rants are all part of the deal. WHAATEVER was built for raw expression, not corporate politeness.',
  },
  {
    question: 'Who moderates the anonymous feed if there are no accounts?',
    answer:
      'You do, locally. Any post can be hidden from your own view in one tap, and posts you created can be deleted permanently. Because there is no central server, there is no central moderation queue either — the community and the individual reader decide what they want to see.',
  },
  {
    question: 'What happens to a post I report or dislike?',
    answer:
      'Hiding a post removes it from your feed instantly and keeps it out until you unhide it from the feed toolbar. It only affects your browser — nothing is transmitted anywhere, because WHAATEVER has no backend to transmit to.',
  },
  {
    question: 'Can I delete something I regret posting?',
    answer:
      'Yes. Every post you created has a delete button in its header, and deleting it removes it from your local storage permanently. You can also use Reset in the feed toolbar to wipe the entire local board.',
  },
] as const;

/**
 * Guidelines — the house rules page, which doubles as the moderation policy
 * surface that makes an anonymous board sustainable.
 */
export default function Guidelines({ onCreatePost }: GuidelinesProps) {
  const jsonLd = useMemo(
    () => [
      baseGraph(),
      pageGraph({
        path: '/guidelines',
        name: 'WHAATEVER community guidelines — anonymous posting house rules',
        description:
          'The house rules for posting anonymously on WHAATEVER: what is welcome on the confession board, what is not, and how local moderation works.',
      }),
      breadcrumbGraph([
        { name: 'Home', path: '/' },
        { name: 'Guidelines', path: '/guidelines' },
      ]),
      faqGraph(RULES_FAQ),
    ],
    [],
  );

  return (
    <>
      <SEOHead
        title="Community Guidelines & House Rules | WHAATEVER Anonymous Board"
        description="What is welcome on the WHAATEVER anonymous confession board, what gets you zapped, and how local moderation works on a platform with no accounts and no backend."
        keywords={`WHAATEVER rules, anonymous posting guidelines, confession board moderation, community guidelines anonymous app, ${SITE.keywords}`}
        path="/guidelines"
        type="website"
        jsonLd={jsonLd}
      />

      <section aria-labelledby="guidelines-title" className="mt-8">
        <div className="border-4 border-black bg-ink p-5 text-white shadow-brutal-xl sm:p-8">
          <p className="badge badge-lemon">
            <Scale size={10} strokeWidth={3} aria-hidden /> House rules
          </p>
          <h1
            id="guidelines-title"
            className="mt-3 font-display text-4xl uppercase leading-[0.9] tracking-tighter text-lemon-400 sm:text-6xl"
          >
            Community guidelines
          </h1>
          <p className="mt-4 max-w-3xl text-base font-semibold leading-relaxed text-white/90">
            WHAATEVER is built for unfiltered expression, which only works if the unfiltered part is aimed at ideas and
            feelings — never at making another human unsafe. The rules are short. Read them once and you will never need
            to read them again.
          </p>
        </div>
      </section>

      <section aria-labelledby="allowed-heading" className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="border-4 border-black bg-white p-5 shadow-brutal-lg">
          <h2 id="allowed-heading" className="flex items-center gap-2 font-display text-xl uppercase tracking-tight">
            <span className="flex h-9 w-9 items-center justify-center border-3 border-black bg-olive-600 text-white">
              <CheckCircle2 size={18} strokeWidth={3} aria-hidden />
            </span>
            Absolutely welcome
          </h2>
          <ul className="mt-4 space-y-2.5">
            {ALLOWED.map((item) => (
              <li key={item} className="flex gap-2.5 border-2 border-black bg-olive-100 px-3 py-2 text-[13px] leading-relaxed text-ink-soft">
                <CheckCircle2 size={15} strokeWidth={3} className="mt-0.5 shrink-0 text-olive-700" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="border-4 border-black bg-white p-5 shadow-brutal-lg">
          <h2 id="not-allowed-heading" className="flex items-center gap-2 font-display text-xl uppercase tracking-tight">
            <span className="flex h-9 w-9 items-center justify-center border-3 border-black bg-danger text-white">
              <Ban size={18} strokeWidth={3} aria-hidden />
            </span>
            Get you removed
          </h2>
          <ul className="mt-4 space-y-2.5">
            {NOT_ALLOWED.map((item) => (
              <li key={item} className="flex gap-2.5 border-2 border-black bg-danger/10 px-3 py-2 text-[13px] leading-relaxed text-ink-soft">
                <AlertTriangle size={15} strokeWidth={3} className="mt-0.5 shrink-0 text-danger" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ------------------------------------------------- how moderation works */}
      <section aria-labelledby="moderation-heading" className="mt-12">
        <h2
          id="moderation-heading"
          className="flex items-center gap-2 font-display text-2xl uppercase leading-none tracking-tight sm:text-3xl"
        >
          <ShieldCheck size={24} strokeWidth={3} aria-hidden />
          How moderation works with no accounts
        </h2>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <article className="brutal-card p-4">
            <span className="mb-3 flex h-9 w-9 items-center justify-center border-3 border-black bg-beige">
              <EyeOff size={16} strokeWidth={3} aria-hidden />
            </span>
            <h3 className="font-display text-[13px] uppercase tracking-tight">Hide anything, instantly</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">
              Every post on the feed has a hide control. One tap removes it from your view and keeps it hidden until you
              choose to restore it from the toolbar. Your feed, your rules.
            </p>
          </article>

          <article className="brutal-card p-4">
            <span className="mb-3 flex h-9 w-9 items-center justify-center border-3 border-black bg-lemon-400">
              <Ban size={16} strokeWidth={3} aria-hidden />
            </span>
            <h3 className="font-display text-[13px] uppercase tracking-tight">Delete what you posted</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">
              Posts you created carry a delete button that removes them from local storage permanently. Undo is available
              for a few seconds if you tap too fast.
            </p>
          </article>

          <article className="brutal-card p-4">
            <span className="mb-3 flex h-9 w-9 items-center justify-center border-3 border-black bg-cobalt-600 text-white">
              <HeartHandshake size={16} strokeWidth={3} aria-hidden />
            </span>
            <h3 className="font-display text-[13px] uppercase tracking-tight">The golden rule</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">
              Punch at power, systems and situations — not at people who cannot defend themselves. Anonymous does not mean
              unaccountable to your own conscience.
            </p>
          </article>
        </div>
      </section>

      <FaqSection
        items={RULES_FAQ}
        idPrefix="guidelines-faq"
        heading="Rules questions, answered"
        subheading="The edge cases people ask about before their first post."
      />

      <section aria-labelledby="guidelines-cta" className="mt-12 border-4 border-black bg-lemon-400 p-6 shadow-brutal-xl">
        <h2 id="guidelines-cta" className="font-display text-2xl uppercase leading-none tracking-tight sm:text-3xl">
          Read that and still want to post?
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-soft">
          Good. That is exactly the energy we are after. Say the thing, keep it human, and let somebody else in the feed
          feel less alone about it.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button type="button" onClick={onCreatePost} className="btn btn-cobalt btn-lg">
            <PenSquare size={18} strokeWidth={3} aria-hidden /> Create a post
          </button>
          <Link to="/" className="btn btn-white btn-lg">
            <Ghost size={18} strokeWidth={3} aria-hidden /> Back to the feed
          </Link>
          <a href={absoluteUrl('/privacy')} className="btn btn-white btn-lg">
            <ShieldCheck size={18} strokeWidth={3} aria-hidden /> Privacy details
          </a>
        </div>
      </section>
    </>
  );
}
