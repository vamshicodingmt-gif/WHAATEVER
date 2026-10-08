import { Link } from 'react-router-dom';
import { Download, Ghost, Heart, PenSquare, RotateCcw, ShieldCheck, Sparkles } from 'lucide-react';
import { CATEGORIES, NAV_LINKS, SITE, absoluteUrl } from '@/lib/constants';
import { formatCount } from '@/lib/utils';
import { useFeed } from '@/context/FeedContext';
import Ticker from '@/components/Ticker';

export interface FooterProps {
  onCreatePost: () => void;
  onExport: () => void;
  onRestoreSeed: () => void;
}

/**
 * Footer — semantic <footer> with the internal link mesh (routes + categories),
 * platform actions, the legal-ish routes and a final keyword-rich positioning
 * statement. Internal linking matters doubly here because the whole app is
 * client-side rendered.
 */
export default function Footer({ onCreatePost, onExport, onRestoreSeed }: FooterProps) {
  const { stats, storageAvailable } = useFeed();

  return (
    <footer className="mt-16 border-t-4 border-black bg-white">
      <Ticker tone="ink" />

      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <section aria-labelledby="footer-brand">
            <h2 id="footer-brand" className="flex items-center gap-2 font-display text-3xl uppercase tracking-tighter">
              <span className="flex h-9 w-9 items-center justify-center border-3 border-black bg-lemon-400 shadow-brutal-sm">
                <Ghost size={18} strokeWidth={2.75} aria-hidden />
              </span>
              WHAATEVER
            </h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-soft">
              <strong>{SITE.domain}</strong> is the anonymous posting platform, online confession board and unfiltered
              micro-blogging community. Post rants, secrets, confessions and images instantly — with zero logins, zero
              accounts and zero uploads to any server.
            </p>
            <p className="mt-3 flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-olive-700">
              <ShieldCheck size={13} strokeWidth={3} aria-hidden />
              100% client-side rendered SPA · no backend · no trackers
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={onCreatePost} className="btn btn-lemon btn-sm">
                <PenSquare size={13} strokeWidth={3} aria-hidden /> Post anonymously
              </button>
              <button type="button" onClick={onExport} className="btn btn-white btn-sm">
                <Download size={13} strokeWidth={3} aria-hidden /> Export feed
              </button>
              <button type="button" onClick={onRestoreSeed} className="btn btn-white btn-sm">
                <RotateCcw size={13} strokeWidth={3} aria-hidden /> Restore seed feed
              </button>
            </div>
          </section>

          <nav aria-labelledby="footer-explore">
            <h3 id="footer-explore" className="font-display text-sm uppercase tracking-widest text-ink">
              Explore
            </h3>
            <ul className="mt-3 space-y-2 text-sm">
              {NAV_LINKS.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="link-brutal" title={link.description}>
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <a href="/sitemap.xml" className="link-brutal">
                  Sitemap
                </a>
              </li>
              <li>
                <a href="/robots.txt" className="link-brutal">
                  Robots.txt
                </a>
              </li>
            </ul>
          </nav>

          <nav aria-labelledby="footer-categories">
            <h3 id="footer-categories" className="font-display text-sm uppercase tracking-widest text-ink">
              Confessions by type
            </h3>
            <ul className="mt-3 space-y-2 text-sm">
              {CATEGORIES.map((category) => (
                <li key={category.id}>
                  <Link to={`/?category=${category.id}`} className="link-brutal" title={category.blurb}>
                    {category.emoji} {category.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <section aria-labelledby="footer-live">
            <h3 id="footer-live" className="font-display text-sm uppercase tracking-widest text-ink">
              Live local stats
            </h3>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between border-2 border-black bg-cream px-2.5 py-1.5">
                <dt className="font-bold text-ink-muted">Posts in feed</dt>
                <dd className="font-display tabular-nums">{formatCount(stats.posts)}</dd>
              </div>
              <div className="flex items-center justify-between border-2 border-black bg-cream px-2.5 py-1.5">
                <dt className="font-bold text-ink-muted">Ghost posts</dt>
                <dd className="font-display tabular-nums">{formatCount(stats.ghosts)}</dd>
              </div>
              <div className="flex items-center justify-between border-2 border-black bg-cream px-2.5 py-1.5">
                <dt className="font-bold text-ink-muted">Upvotes</dt>
                <dd className="font-display tabular-nums">{formatCount(stats.likes)}</dd>
              </div>
              <div className="flex items-center justify-between border-2 border-black bg-cream px-2.5 py-1.5">
                <dt className="font-bold text-ink-muted">Images attached</dt>
                <dd className="font-display tabular-nums">{formatCount(stats.images)}</dd>
              </div>
              <div className="flex items-center justify-between border-2 border-black bg-beige px-2.5 py-1.5">
                <dt className="font-bold text-ink-muted">Storage mode</dt>
                <dd className="font-display text-xs uppercase">{storageAvailable ? 'localStorage' : 'session only'}</dd>
              </div>
            </dl>
          </section>
        </div>

        <section aria-labelledby="footer-seo" className="mt-10 border-3 border-black bg-cream p-4 shadow-brutal-sm">
          <h3 id="footer-seo" className="font-display text-xs uppercase tracking-widest text-ink">
            <Sparkles size={12} className="mr-1 inline" strokeWidth={3} aria-hidden />
            Anonymous posting, confessions and unfiltered thoughts
          </h3>
          <p className="mt-2 text-xs leading-relaxed text-ink-muted">
            Looking for an anonymous posting platform with no sign-up? WHAATEVER.VERCEL.APP is a free anonymous
            micro-blogging community and online confession board where you can post anonymously online in seconds, attach
            images, upvote the confessions that hit hardest and leave comments without ever revealing who you are. Rant
            anonymously, drop a secret, ask an unfiltered question, celebrate a quiet win — the live feed is public, your
            identity is not. Every post is stored in your own browser, which makes WHAATEVER one of the few places on the
            internet where your words outlive your identity.
          </p>
        </section>

        <div className="mt-8 flex flex-col items-start justify-between gap-4 border-t-3 border-black pt-5 sm:flex-row sm:items-center">
          <p className="text-xs font-bold uppercase tracking-widest text-ink-muted">
            © {new Date().getFullYear()} {SITE.name} · <a href={absoluteUrl('/')} className="link-brutal">{SITE.host}</a> · built for the unfiltered
          </p>
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-ink-muted">
            Made with <Heart size={13} strokeWidth={3} className="fill-current text-danger" aria-hidden /> and zero analytics
          </p>
        </div>
      </div>
    </footer>
  );
}
