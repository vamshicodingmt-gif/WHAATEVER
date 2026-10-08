import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Compass, Ghost, HeartHandshake, MessageSquareQuote, Shield, Sparkles, TrendingUp } from 'lucide-react';
import { CATEGORIES, FAQS, SITE } from '@/lib/constants';
import { baseGraph, faqGraph, feedGraph } from '@/lib/schema';
import { useFeed } from '@/context/FeedContext';
import SEOHead from '@/components/SEOHead';
import Hero from '@/components/Hero';
import Feed from '@/components/Feed';
import FaqSection from '@/components/FaqSection';

export interface HomeProps {
  onCreatePost: () => void;
}

const USE_CASES = [
  {
    icon: MessageSquareQuote,
    title: 'Confess something',
    copy: 'The classic. Say the thing you have never said out loud, to an audience that will never know it was you.',
    to: '/?category=confession',
    cta: 'Read confessions',
  },
  {
    icon: TrendingUp,
    title: 'Rant it out loud',
    copy: 'Public rants are a civic utility. Post the unfiltered version, then go about your day calmly.',
    to: '/?category=rant',
    cta: 'Read the rants',
  },
  {
    icon: Shield,
    title: 'Keep a secret',
    copy: 'Drop it on the confession board and let it stop living rent-free in your head.',
    to: '/?category=secret',
    cta: 'Browse secrets',
  },
  {
    icon: HeartHandshake,
    title: 'Ask the honest crowd',
    copy: 'Ask a question anonymously and get answers people would never give under their real names.',
    to: '/?category=question',
    cta: 'See questions',
  },
] as const;

/**
 * Home — the primary anonymous feed route ("/").
 */
export default function Home({ onCreatePost }: HomeProps) {
  const { visiblePosts, stats } = useFeed();

  const jsonLd = useMemo(
    () => [
      baseGraph(),
      feedGraph(visiblePosts.slice(0, 20), 'Live Anonymous Feed & Confessions', '/'),
      faqGraph(FAQS),
    ],
    [visiblePosts],
  );

  return (
    <>
      <SEOHead
        title={`${SITE.name} | The Ultimate Anonymous Posting & Confession Platform`}
        description={SITE.description}
        keywords={SITE.keywords}
        path="/"
        type="website"
        jsonLd={jsonLd}
      />

      <Hero onCreatePost={onCreatePost} />

      <Feed
        heading="Live Anonymous Feed & Confessions"
        subheading={`Every post below was written by someone who did not want their name on it — ${stats.posts} in this browser so far. Filter the stream, upvote what hits, and reply anonymously.`}
        defaultFilter="all"
        onCreatePost={onCreatePost}
      />

      {/* ------------------------------------------------------- use cases */}
      <section aria-labelledby="use-cases" className="mt-14">
        <h2 id="use-cases" className="font-display text-2xl uppercase leading-none tracking-tight sm:text-3xl">
          More ways to use the board
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-soft">
          WHAATEVER is more than a wall of secrets. It is an anonymous micro-blogging platform with categories for every
          kind of unfiltered thought, so you can post exactly the thing you came here to post.
        </p>

        <ul className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {USE_CASES.map((useCase) => {
            const Icon = useCase.icon;
            return (
              <li key={useCase.title} className="brutal-card brutal-hover flex flex-col p-4">
                <span className="mb-3 flex h-10 w-10 items-center justify-center border-3 border-black bg-beige">
                  <Icon size={18} strokeWidth={2.75} aria-hidden />
                </span>
                <h3 className="font-display text-sm uppercase leading-tight tracking-tight">{useCase.title}</h3>
                <p className="mt-2 flex-1 text-[13px] leading-relaxed text-ink-soft">{useCase.copy}</p>
                <Link to={useCase.to} className="btn btn-sm btn-white mt-3 self-start">
                  {useCase.cta}
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {/* ------------------------------------------------------ categories */}
      <section aria-labelledby="categories-heading" className="mt-14">
        <h2 id="categories-heading" className="flex items-center gap-2 font-display text-2xl uppercase leading-none tracking-tight sm:text-3xl">
          <Compass size={24} strokeWidth={3} aria-hidden />
          Confessions by type
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-soft">
          Pick a lane. Each category has its own filter, its own badge colour and its own flavour of unfiltered energy.
        </p>

        <ul className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {CATEGORIES.map((category) => (
            <li key={category.id}>
              <Link
                to={`/?category=${category.id}`}
                title={category.blurb}
                className="brutal-card brutal-hover flex h-full items-start gap-3 p-3"
              >
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center border-3 border-black ${category.accent}`}>
                  <span aria-hidden>{category.emoji}</span>
                </span>
                <span className="min-w-0">
                  <span className="block font-display text-[13px] uppercase tracking-tight text-ink">
                    {category.label}
                  </span>
                  <span className="mt-1 block text-[12px] leading-snug text-ink-muted">{category.blurb}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <FaqSection items={FAQS} />

      {/* -------------------------------------------------------- closing CTA */}
      <section aria-labelledby="cta-heading" className="mt-14 border-4 border-black bg-cobalt-600 p-6 text-white shadow-brutal-xl sm:p-8">
        <h2 id="cta-heading" className="font-display text-2xl uppercase leading-none tracking-tight sm:text-4xl">
          Post it anonymously. WHAATEVER.
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/90 sm:text-base">
          No email. No sign-up screen. No name. Just a text box, an optional image and a publish button — and a community
          of ghosts on the other side who have all been exactly where you are.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button type="button" onClick={onCreatePost} className="btn btn-lemon btn-lg">
            <Sparkles size={18} strokeWidth={3} aria-hidden />
            Open The Vault
          </button>
          <Link to="/guidelines" className="btn btn-white btn-lg">
            <Ghost size={18} strokeWidth={3} aria-hidden />
            Read the house rules
          </Link>
        </div>
      </section>
    </>
  );
}
