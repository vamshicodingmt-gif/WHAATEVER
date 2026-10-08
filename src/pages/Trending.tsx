import { useMemo } from 'react';
import { Flame, Trophy, TrendingUp } from 'lucide-react';
import { FAQS, SITE } from '@/lib/constants';
import { absoluteUrl } from '@/lib/constants';
import { baseGraph, breadcrumbGraph, faqGraph, feedGraph } from '@/lib/schema';
import { formatCount, heatPercent, timeAgo, trendingScore, truncate } from '@/lib/utils';
import { useFeed } from '@/context/FeedContext';
import { useNow } from '@/lib/hooks';
import SEOHead from '@/components/SEOHead';
import Feed from '@/components/Feed';
import FaqSection from '@/components/FaqSection';

export interface TrendingProps {
  onCreatePost: () => void;
}

const TRENDING_FAQS = FAQS.slice(0, 4);

/**
 * Trending — the engagement-ranked view of the anonymous feed.
 */
export default function Trending({ onCreatePost }: TrendingProps) {
  const { visiblePosts, stats } = useFeed();
  const now = useNow(60_000);

  const ranked = useMemo(
    () => [...visiblePosts].sort((a, b) => trendingScore(b, now) - trendingScore(a, now)),
    [visiblePosts, now],
  );

  const topScore = ranked.length > 0 ? trendingScore(ranked[0], now) : 0;
  const leaderboard = ranked.slice(0, 5);

  const jsonLd = useMemo(
    () => [
      baseGraph(),
      feedGraph(ranked.slice(0, 20), 'Trending Anonymous Posts & Rants', '/trending'),
      breadcrumbGraph([
        { name: 'Home', path: '/' },
        { name: 'Trending anonymous posts', path: '/trending' },
      ]),
      faqGraph(TRENDING_FAQS),
    ],
    [ranked],
  );

  return (
    <>
      <SEOHead
        title="Trending Anonymous Posts & Rants | WHAATEVER"
        description="See what the WHAATEVER anonymous posting platform is arguing about right now. Trending confessions, unfiltered rants and secrets ranked by real community upvotes — no logins required."
        keywords={`trending anonymous posts, WHAATEVER trending, viral confessions, popular rants, anonymous confession board, ${SITE.keywords}`}
        path="/trending"
        type="website"
        jsonLd={jsonLd}
      />

      <section aria-labelledby="trending-title" className="mt-8">
        <div className="border-4 border-black bg-lemon-400 p-5 shadow-brutal-xl sm:p-7">
          <p className="badge badge-ink">
            <TrendingUp size={10} strokeWidth={3} aria-hidden /> Ranked by upvotes, comments and recency
          </p>
          <h1
            id="trending-title"
            className="mt-3 font-display text-4xl uppercase leading-[0.9] tracking-tighter text-ink sm:text-6xl"
          >
            Trending on WHAATEVER
          </h1>
          <p className="mt-3 max-w-3xl text-sm font-semibold leading-relaxed text-ink-soft sm:text-base">
            These are the anonymous confessions, unfiltered rants and secrets the community is actually reacting to right
            now — {formatCount(stats.posts)} posts scored in this browser, {formatCount(stats.likes)} upvotes deep. No
            editorial hand-picking, no algorithm you cannot see.
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------- leaderboard */}
      <section aria-labelledby="leaderboard-heading" className="mt-8">
        <h2
          id="leaderboard-heading"
          className="flex items-center gap-2 font-display text-2xl uppercase leading-none tracking-tight sm:text-3xl"
        >
          <Trophy size={24} strokeWidth={3} aria-hidden />
          Top 5 anonymous posts right now
        </h2>

        <ol className="mt-4 space-y-3">
          {leaderboard.length === 0 ? (
            <li className="border-4 border-black bg-white p-5 text-center shadow-brutal-lg">
              <p className="font-display text-lg uppercase">Nothing is trending yet</p>
              <p className="mt-2 text-sm text-ink-soft">
                Publish the first post and you will be number one by default. Enjoy the crown while it lasts.
              </p>
              <button type="button" onClick={onCreatePost} className="btn btn-cobalt mt-4">
                <Flame size={15} strokeWidth={3} aria-hidden /> Start the fire
              </button>
            </li>
          ) : (
            leaderboard.map((post, index) => (
              <li
                key={post.id}
                className="flex flex-col gap-3 border-3 border-black bg-white p-3 shadow-brutal-sm sm:flex-row sm:items-center"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center border-3 border-black bg-lemon-400 font-display text-xl shadow-brutal-xs">
                  {index + 1}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-black uppercase tracking-widest text-ink-muted">
                    <span>{post.author ?? 'Anonymous Whaatever Ghost'}</span>
                    <span aria-hidden>·</span>
                    <span>{timeAgo(post.createdAt, now)}</span>
                    <span aria-hidden>·</span>
                    <span>{post.category}</span>
                  </p>
                  <p className="mt-1.5 text-[13px] leading-snug text-ink-soft">
                    {truncate(post.content.replace(/\s+/g, ' '), 150)}
                  </p>
                </div>

                <div className="shrink-0 sm:w-40">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-ink-muted">
                    <span>Heat</span>
                    <span className="tabular-nums">{heatPercent(post, topScore, now)}%</span>
                  </div>
                  <span className="mt-1 block h-2.5 border-2 border-black bg-beige" aria-hidden>
                    <span
                      className="block h-full bg-danger"
                      style={{ width: `${heatPercent(post, topScore, now)}%` }}
                    />
                  </span>
                  <p className="mt-1 flex items-center justify-between text-[10px] font-bold tabular-nums uppercase tracking-widest text-ink-muted">
                    <span>{formatCount(post.likes)} upvotes</span>
                    <span>{formatCount(post.comments.length)} replies</span>
                  </p>
                </div>

                <a href={`#post-${post.id}`} className="btn btn-sm btn-white sm:self-center">
                  Jump to post
                </a>
              </li>
            ))
          )}
        </ol>
      </section>

      <Feed
        heading="Trending Anonymous Posts & Rants"
        subheading="The full ranked stream. Upvote the ones that deserve it, argue in the comments, and post your own before the crown moves on."
        defaultFilter="trending"
        onCreatePost={onCreatePost}
      />

      <FaqSection
        items={TRENDING_FAQS}
        idPrefix="trending-faq"
        heading="How trending works"
        subheading="No dark magic — here is exactly how a post climbs the WHAATEVER leaderboard."
      />

      <section aria-labelledby="trending-seo" className="mt-12 border-4 border-black bg-beige p-5 shadow-brutal-lg">
        <h2 id="trending-seo" className="font-display text-lg uppercase tracking-tight">
          Trending confessions, unfiltered rants and anonymous secrets
        </h2>
        <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">
          The WHAATEVER trending feed is where the most upvoted anonymous posts on the platform surface. Because every
          post is scored from real local engagement — upvotes, comment volume and how recently it was published — the
          leaderboard rewards whatever the community genuinely reacted to instead of whatever an opaque ranking model
          decided you should see. Jump straight to the{' '}
          <a href={absoluteUrl('/trending')} className="link-brutal">
            trending anonymous posts
          </a>{' '}
          page any time you want the highlight reel, or{' '}
          <a href={absoluteUrl('/')} className="link-brutal">
            read the full live anonymous feed
          </a>{' '}
          for everything else.
        </p>
      </section>
    </>
  );
}
