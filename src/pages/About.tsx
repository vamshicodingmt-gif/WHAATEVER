import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Boxes, Cpu, Database, EyeOff, Ghost, Lock, PenSquare, Server, Sparkles, Zap } from 'lucide-react';
import { FAQS, SITE } from '@/lib/constants';
import { absoluteUrl } from '@/lib/constants';
import { baseGraph, breadcrumbGraph, faqGraph, howToGraph, pageGraph } from '@/lib/schema';
import { useFeed } from '@/context/FeedContext';
import SEOHead from '@/components/SEOHead';
import FaqSection from '@/components/FaqSection';
import { StatsRow } from '@/components/Navbar';

export interface AboutProps {
  onCreatePost: () => void;
}

const STEPS = [
  {
    title: 'Tap Create Post',
    copy: 'The Vault opens instantly. No interstitial, no cookie wall, no account gate — because there is no account.',
  },
  {
    title: 'Say the unfiltered thing',
    copy: 'Rant, confess, ask, celebrate. Swearing is allowed. Spelling is not judged. Nobody is grading you here.',
  },
  {
    title: 'Choose Ghost Mode or a name',
    copy: 'Ghost Mode is on by default. Flip the switch and type any pseudonym you want attached to the post instead.',
  },
  {
    title: 'Attach an image (optional)',
    copy: 'Drag, drop or paste. Your browser compresses it and converts it to a local base64 payload before publishing.',
  },
  {
    title: 'Publish anonymously',
    copy: 'The post lands at the top of the live feed immediately. Upvote it, comment on it, or delete it in one tap.',
  },
] as const;

const STACK = [
  { icon: Cpu, label: '100% client-side rendered', copy: 'Vite + React + TypeScript single page app. No SSR runtime, no API routes, no cloud functions.' },
  { icon: Database, label: 'localStorage persistence', copy: 'Posts, upvotes, comments, drafts, identity and images are serialised into your own browser storage.' },
  { icon: Server, label: 'Static hosting on Vercel', copy: 'The build outputs a plain `dist` folder of HTML, CSS and JS — deployable to any CDN with zero config.' },
  { icon: Lock, label: 'No backend, no trackers', copy: 'There is no database to breach, no analytics script, no ad network and no cookie banner to dismiss.' },
] as const;

/**
 * About — the authority page for the platform entity (AboutPage schema).
 */
export default function About({ onCreatePost }: AboutProps) {
  const { stats } = useFeed();

  const jsonLd = useMemo(
    () => [
      baseGraph(),
      pageGraph({
        path: '/about',
        name: 'About WHAATEVER — the anonymous posting platform',
        description:
          'What WHAATEVER is, how anonymous posting works, and why the whole platform runs client-side with zero logins.',
        type: 'AboutPage',
      }),
      breadcrumbGraph([
        { name: 'Home', path: '/' },
        { name: 'About', path: '/about' },
      ]),
      howToGraph(),
      faqGraph(FAQS),
    ],
    [],
  );

  return (
    <>
      <SEOHead
        title="About WHAATEVER | Anonymous Posting Platform, Confession Board & Micro-Blog"
        description="What is WHAATEVER? An anonymous posting platform and online confession board where you can post unfiltered rants, secrets and thoughts with zero logins — running entirely client-side in your browser."
        keywords={`what is WHAATEVER, about WHAATEVER, anonymous posting platform, online confession board, how to post anonymously, client-side anonymous app, ${SITE.keywords}`}
        path="/about"
        type="website"
        jsonLd={jsonLd}
      />

      {/* -------------------------------------------------------------- intro */}
      <section aria-labelledby="about-title" className="mt-8">
        <div className="border-4 border-black bg-white p-5 shadow-brutal-xl sm:p-8">
          <p className="badge badge-lemon">
            <Sparkles size={10} strokeWidth={3} aria-hidden /> About the platform
          </p>
          <h1
            id="about-title"
            className="mt-3 font-display text-4xl uppercase leading-[0.9] tracking-tighter text-ink sm:text-6xl"
          >
            What is WHAATEVER?
          </h1>
          <p className="mt-4 max-w-3xl text-base font-semibold leading-relaxed text-ink-soft">
            WHAATEVER is an <strong>anonymous posting platform</strong>, an <strong>online confession board</strong> and an
            unfiltered micro-blogging community rolled into one very loud page. It exists for the thoughts people delete
            before sending: the confessions, the rants, the unpopular opinions, the small quiet wins that do not fit on a
            feed with your real name at the top of it.
          </p>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-ink-soft">
            {SITE.domain} hosts the whole thing as a <strong>100% client-side rendered single page application</strong>.
            That is not marketing language — it is architecture. There is no backend, no database and no account system,
            which means there is nothing to sign up for and nothing of yours sitting in someone else{"\u2019"}s cloud.
            Open it, post it, close the tab.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" onClick={onCreatePost} className="btn btn-cobalt btn-lg">
              <PenSquare size={18} strokeWidth={3} aria-hidden /> Post something anonymous
            </button>
            <Link to="/guidelines" className="btn btn-white btn-lg">
              <Ghost size={18} strokeWidth={3} aria-hidden /> House rules
            </Link>
          </div>
        </div>

        <StatsRow className="mt-6" />
      </section>

      {/* ---------------------------------------------------------- how to use */}
      <section aria-labelledby="how-heading" className="mt-14">
        <h2 id="how-heading" className="font-display text-2xl uppercase leading-none tracking-tight sm:text-3xl">
          How to post anonymously in under 30 seconds
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-soft">
          Five steps, zero forms. This is the entire onboarding flow of WHAATEVER — there is nothing else to learn.
        </p>

        <ol className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {STEPS.map((step, index) => (
            <li key={step.title} className="brutal-card brutal-hover flex flex-col p-4">
              <span className="mb-3 flex h-10 w-10 items-center justify-center border-3 border-black bg-lemon-400 font-display text-lg shadow-brutal-xs">
                {index + 1}
              </span>
              <h3 className="font-display text-[13px] uppercase leading-tight tracking-tight">{step.title}</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">{step.copy}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* -------------------------------------------------------- under hood */}
      <section aria-labelledby="stack-heading" className="mt-14">
        <h2
          id="stack-heading"
          className="flex items-center gap-2 font-display text-2xl uppercase leading-none tracking-tight sm:text-3xl"
        >
          <Boxes size={24} strokeWidth={3} aria-hidden />
          Under the hood
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-soft">
          Transparency is cheap when you have nothing to hide. Here is exactly how WHAATEVER is built.
        </p>

        <ul className="mt-5 grid gap-4 sm:grid-cols-2">
          {STACK.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.label} className="brutal-panel flex gap-3 p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center border-3 border-black bg-cobalt-600 text-white">
                  <Icon size={18} strokeWidth={2.75} aria-hidden />
                </span>
                <div>
                  <h3 className="font-display text-[13px] uppercase leading-tight tracking-tight">{item.label}</h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">{item.copy}</p>
                </div>
              </li>
            );
          })}
        </ul>

        <p className="mt-4 border-3 border-black bg-ink p-4 text-xs leading-relaxed text-white/85 shadow-brutal-sm">
          <EyeOff size={14} strokeWidth={3} className="mr-1.5 inline text-lemon-400" aria-hidden />
          <strong className="text-lemon-400">A note on what {"\u201C"}anonymous{"\u201D"} means here:</strong> WHAATEVER never asks
          for your name, email or location, and it does not fingerprint you. Posts are stored in your browser and are not
          transmitted anywhere. The trade-off is honest and simple: your feed is yours alone, so clearing browser data
          clears your posts. Use the Export button in the feed toolbar if you want a copy.
        </p>
      </section>

      {/* --------------------------------------------------------- manifesto */}
      <section aria-labelledby="manifesto" className="mt-14 border-4 border-black bg-olive-600 p-6 text-white shadow-brutal-xl sm:p-8">
        <h2 id="manifesto" className="font-display text-2xl uppercase leading-none tracking-tight sm:text-4xl">
          Why build another anonymous board?
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <p className="text-sm leading-relaxed text-white/90">
            Because every confession app eventually wants your phone number. Because "anonymous" usually means "anonymous
            until we feel like deanonymising you". Because the most honest writing on the internet happens in private
            notes and group chats that were never meant to hold it.
          </p>
          <p className="text-sm leading-relaxed text-white/90">
            WHAATEVER takes the opposite approach: no identity layer to leak, no cloud copy to subpoena, no growth funnel
            to feed. Just a loud, uncompromising box you can shout into — currently holding{' '}
            <strong className="text-lemon-400">{stats.words.toLocaleString()} words</strong> of unfiltered thoughts in this
            browser.
          </p>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <button type="button" onClick={onCreatePost} className="btn btn-lemon btn-lg">
            <Zap size={18} strokeWidth={3} aria-hidden /> Create a post
          </button>
          <Link to="/" className="btn btn-white btn-lg">
            <Ghost size={18} strokeWidth={3} aria-hidden /> Back to the live feed
          </Link>
        </div>
      </section>

      <FaqSection
        items={FAQS}
        idPrefix="about-faq"
        heading="WHAATEVER questions, answered"
        subheading="The short version of everything above, in case you skimmed."
      />

      {/* ------------------------------------------------------ internal links */}
      <section aria-labelledby="about-links" className="mt-12 border-3 border-black bg-cream p-4 shadow-brutal-sm">
        <h2 id="about-links" className="font-display text-sm uppercase tracking-widest">
          Keep exploring
        </h2>
        <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <li>
            <a href={absoluteUrl('/')} className="link-brutal">
              Live anonymous feed and confessions
            </a>
          </li>
          <li>
            <a href={absoluteUrl('/trending')} className="link-brutal">
              Trending anonymous posts and rants
            </a>
          </li>
          <li>
            <a href={absoluteUrl('/guidelines')} className="link-brutal">
              Community guidelines
            </a>
          </li>
          <li>
            <a href={absoluteUrl('/privacy')} className="link-brutal">
              Privacy and data handling
            </a>
          </li>
        </ul>
      </section>
    </>
  );
}
