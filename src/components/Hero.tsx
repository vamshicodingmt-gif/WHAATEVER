import { Link } from 'react-router-dom';
import {
  ArrowRight,
  EyeOff,
  Fingerprint,
  Flame,
  Ghost,
  Image as ImageIcon,
  PenSquare,
  Sparkles,
  Timer,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { SEO_BADGES, SITE } from '@/lib/constants';
import { formatCount, timeAgo, truncate, trendingScore } from '@/lib/utils';
import { useFeed } from '@/context/FeedContext';
import { useNow } from '@/lib/hooks';
import { StatsRow } from '@/components/Navbar';

export interface HeroProps {
  onCreatePost: () => void;
}

const FEATURES = [
  {
    icon: Ghost,
    tone: 'bg-ink text-lemon-400',
    title: 'Ghost Mode by default',
    copy: 'Every post starts anonymous. Switch it off if you want a name or pseudonym attached — your call, every single time.',
  },
  {
    icon: Zap,
    tone: 'bg-lemon-400 text-ink',
    title: 'Zero-login publishing',
    copy: 'No account, no email, no phone number, no verification loop. Open the composer and publish in under thirty seconds.',
  },
  {
    icon: ImageIcon,
    tone: 'bg-cobalt-600 text-white',
    title: 'Instant image sharing',
    copy: 'Drop, paste or pick an image and it is compressed to local base64 in your browser before it ever hits the feed.',
  },
  {
    icon: Flame,
    tone: 'bg-danger text-white',
    title: 'Unfiltered expression',
    copy: 'Rants, confessions, secrets, hot takes and explicit language are all welcome. Raw beats polished around here.',
  },
  {
    icon: Fingerprint,
    tone: 'bg-olive-600 text-white',
    title: 'No backend, no tracking',
    copy: 'A 100% client-side rendered app. Your words live in your own localStorage — there is no server to leak them.',
  },
  {
    icon: Timer,
    tone: 'bg-beige text-ink',
    title: 'Lives for one tap',
    copy: 'Upvotes, comment threads and trending scores all persist locally, so the community you build is yours to keep.',
  },
] as const;

/**
 * Hero — the homepage headline block.
 *
 * Holds the primary <h1>, the keyword-rich positioning copy, the live trending
 * snapshot rail and the "why WHAATEVER" feature grid used for topical SEO.
 */
export default function Hero({ onCreatePost }: HeroProps) {
  const { visiblePosts, stats } = useFeed();
  const now = useNow(60_000);

  const trending = [...visiblePosts].sort((a, b) => trendingScore(b, now) - trendingScore(a, now)).slice(0, 3);

  return (
    <>
      <section aria-labelledby="hero-title" className="relative pt-8 sm:pt-10">
        <div className="grid gap-6 lg:grid-cols-[1.55fr_1fr]">
          {/* ------------------------------------------------------ headline */}
          <div className="border-4 border-black bg-white p-5 shadow-brutal-xl sm:p-7">
            <ul className="flex flex-wrap gap-2">
              {SEO_BADGES.map((badge) => (
                <li key={badge} className="badge badge-beige">
                  {badge}
                </li>
              ))}
              <li className="badge badge-lemon">
                <Sparkles size={10} strokeWidth={3} aria-hidden /> Live now
              </li>
            </ul>

            <h1
              id="hero-title"
              className="mt-4 font-display text-[13vw] uppercase leading-[0.86] tracking-tighter text-ink sm:text-6xl lg:text-7xl xl:text-8xl"
            >
              WHAAT<span className="text-cobalt-600">EVER</span>
              <span className="mt-1 block text-[5.2vw] text-lemon-500 sm:text-2xl lg:text-3xl">
                {SITE.domain}
              </span>
            </h1>

            <p className="mt-4 max-w-2xl text-base font-semibold leading-relaxed text-ink-soft sm:text-lg">
              The anonymous posting platform for <strong>unfiltered thoughts and rants</strong>. Drop a confession, spill
              a secret, start a public rant or share an anonymous image — instantly, with <strong>zero logins required</strong>{' '}
              and nothing stored anywhere but your own browser.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" onClick={onCreatePost} className="btn btn-cobalt btn-lg">
                <PenSquare size={18} strokeWidth={3} aria-hidden />
                Create Post — it is anonymous
              </button>
              <Link to="/trending" className="btn btn-lemon btn-lg">
                <Flame size={18} strokeWidth={3} aria-hidden />
                See what is trending
              </Link>
              <Link to="/about" className="btn btn-white btn-lg">
                <ArrowRight size={18} strokeWidth={3} aria-hidden />
                How it works
              </Link>
            </div>

            <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-black uppercase tracking-widest text-ink-muted">
              <span className="flex items-center gap-1.5">
                <EyeOff size={12} strokeWidth={3} aria-hidden /> Nothing leaves your device
              </span>
              <span className="flex items-center gap-1.5">
                <Ghost size={12} strokeWidth={3} aria-hidden /> {formatCount(stats.ghosts)} ghost posts live
              </span>
              <span className="flex items-center gap-1.5">
                <TrendingUp size={12} strokeWidth={3} aria-hidden /> {formatCount(stats.likes)} upvotes cast
              </span>
            </p>
          </div>

          {/* --------------------------------------------------- live snapshot */}
          <aside aria-labelledby="hero-live" className="border-4 border-black bg-ink p-4 text-white shadow-brutal-xl">
            <header className="flex items-center justify-between gap-2 border-b-3 border-white/25 pb-3">
              <h2 id="hero-live" className="font-display text-sm uppercase tracking-widest text-lemon-400">
                Right now on WHAATEVER
              </h2>
              <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest">
                <span className="h-2 w-2 animate-blink rounded-full bg-danger" aria-hidden />
                Live
              </span>
            </header>

            <ol className="mt-3 space-y-3">
              {trending.length === 0 ? (
                <li className="border-2 border-white/30 p-3 text-xs text-white/80">
                  The board is quiet. Publish the first confession and watch it climb.
                </li>
              ) : (
                trending.map((post, index) => (
                  <li key={post.id} className="border-3 border-white/30 bg-white/5 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="badge badge-lemon">#{index + 1} trending</span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/60">
                        {timeAgo(post.createdAt, now)}
                      </span>
                    </div>
                    <p className="mt-2 text-[13px] leading-snug text-white/90">
                      {truncate(post.content.replace(/\s+/g, ' '), 110)}
                    </p>
                    <p className="mt-2 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-lemon-400">
                      <span className="flex items-center gap-1">
                        <Flame size={10} strokeWidth={3} aria-hidden /> {formatCount(post.likes)} upvotes
                      </span>
                      <span>{formatCount(post.comments.length)} comments</span>
                      <span className="ml-auto text-white/60">{post.author ?? 'Ghost'}</span>
                    </p>
                  </li>
                ))
              )}
            </ol>

            <p className="mt-4 border-3 border-lemon-400 bg-lemon-400 p-3 text-[11px] font-bold uppercase leading-relaxed tracking-wide text-ink">
              Posts here are pulled live from this browser{'\u2019'}s local feed. Nothing is fetched from a server — because
              there is not one.
            </p>
          </aside>
        </div>

        <StatsRow className="mt-6" />
      </section>

      {/* ------------------------------------------------------- feature grid */}
      <section aria-labelledby="why-heading" className="mt-12">
        <h2 id="why-heading" className="font-display text-2xl uppercase leading-none tracking-tight sm:text-3xl">
          Anonymous posting, the way it should be
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-soft">
          WHAATEVER is an anonymous micro-blogging community and online confession board built for people who want to say
          the real thing without attaching their identity to it. Here is exactly what you get.
        </p>

        <ul className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <li key={feature.title} className="brutal-card brutal-hover p-4">
                <span className={`mb-3 flex h-10 w-10 items-center justify-center border-3 border-black ${feature.tone}`}>
                  <Icon size={18} strokeWidth={2.75} aria-hidden />
                </span>
                <h3 className="font-display text-sm uppercase leading-tight tracking-tight">{feature.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">{feature.copy}</p>
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}
