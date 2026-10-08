import { useEffect, useState } from 'react';
import { NavLink as RouterNavLink, useLocation } from 'react-router-dom';
import { Ghost, Flame, Menu, PenSquare, ShieldCheck, Sparkles, Users, X, Zap } from 'lucide-react';
import { NAV_LINKS, SEO_BADGES, SITE } from '@/lib/constants';
import { cn, formatCount } from '@/lib/utils';
import { useFeed } from '@/context/FeedContext';
import Ticker from '@/components/Ticker';

export interface NavbarProps {
  onCreatePost: () => void;
}

/**
 * Navbar — bold branding header for WHAATEVER.VERCEL.APP.
 *
 * Renders the wordmark, primary navigation, a live stats strip pulled straight
 * from the local feed, the SEO badge rail, a scrolling ticker and the always
 * visible "Create Post" call to action. Fully responsive with a brutalist
 * mobile drawer.
 */
export default function Navbar({ onCreatePost }: NavbarProps) {
  const { stats, visits } = useFeed();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname, location.search]);

  const ghostShare = stats.posts > 0 ? Math.round((stats.ghosts / stats.posts) * 100) : 0;

  return (
    <header className="sticky top-0 z-[100] border-b-4 border-black bg-white">
      {/* SEO badge rail */}
      <div className="hidden border-b-3 border-black bg-ink px-4 py-1.5 text-white sm:block">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2">
          <ul className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {SEO_BADGES.map((badge) => (
              <li key={badge} className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.18em]">
                <ShieldCheck size={11} strokeWidth={3} className="text-lemon-400" aria-hidden />
                {badge}
              </li>
            ))}
          </ul>
          <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-lemon-400">
            <Zap size={11} strokeWidth={3} aria-hidden />
            {SITE.domain} · visit #{visits.count} on this device
          </p>
        </div>
      </div>

      {/* Main bar */}
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-3 py-3 sm:px-4">
        <a
          href="#top"
          onClick={(event) => {
            event.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="group flex shrink-0 items-center gap-2"
          aria-label="WHAATEVER home"
        >
          <span className="flex h-10 w-10 items-center justify-center border-3 border-black bg-lemon-400 shadow-brutal-sm transition-transform group-hover:-rotate-6">
            <Ghost size={20} strokeWidth={2.75} aria-hidden />
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-display text-xl uppercase tracking-tighter text-ink sm:text-2xl">
              WHAAT<span className="text-cobalt-600">EVER</span>
              <span className="hidden text-lemon-500 sm:inline">.VERCEL.APP</span>
            </span>
            <span className="mt-0.5 hidden text-[9px] font-black uppercase tracking-[0.18em] text-ink-muted sm:block">
              Anonymous posting platform · confession board
            </span>
          </span>
        </a>

        {/* Desktop navigation */}
        <nav aria-label="Primary" className="ml-4 hidden items-center gap-1 xl:flex">
          {NAV_LINKS.map((link) => (
            <RouterNavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              title={link.description}
              className={({ isActive }) =>
                cn(
                  'push border-2 border-black px-3 py-1.5 text-[11px] font-black uppercase tracking-widest shadow-brutal-xs',
                  isActive ? 'bg-ink text-lemon-400' : 'bg-white text-ink hover:bg-beige',
                )
              }
            >
              {link.label}
            </RouterNavLink>
          ))}
        </nav>

        {/* Live stats */}
        <dl className="ml-auto hidden items-center gap-2 lg:flex">
          <div className="border-2 border-black bg-beige px-2.5 py-1 text-center shadow-brutal-xs">
            <dt className="text-[9px] font-black uppercase tracking-widest text-ink-muted">Posts</dt>
            <dd className="font-display text-sm tabular-nums">{formatCount(stats.posts)}</dd>
          </div>
          <div className="border-2 border-black bg-ink px-2.5 py-1 text-center text-white shadow-brutal-xs">
            <dt className="flex items-center justify-center gap-1 text-[9px] font-black uppercase tracking-widest text-lemon-400">
              <Ghost size={9} strokeWidth={3} aria-hidden /> Ghost
            </dt>
            <dd className="font-display text-sm tabular-nums">{ghostShare}%</dd>
          </div>
          <div className="border-2 border-black bg-olive-600 px-2.5 py-1 text-center text-white shadow-brutal-xs">
            <dt className="text-[9px] font-black uppercase tracking-widest">Upvotes</dt>
            <dd className="font-display text-sm tabular-nums">{formatCount(stats.likes)}</dd>
          </div>
          <div className="border-2 border-black bg-cobalt-600 px-2.5 py-1 text-center text-white shadow-brutal-xs">
            <dt className="text-[9px] font-black uppercase tracking-widest">Comments</dt>
            <dd className="font-display text-sm tabular-nums">{formatCount(stats.comments)}</dd>
          </div>
        </dl>

        {/* CTA */}
        <button type="button" onClick={onCreatePost} className="btn btn-cobalt ml-auto lg:ml-2">
          <PenSquare size={16} strokeWidth={3} aria-hidden />
          <span className="hidden sm:inline">Create Post</span>
          <span className="sm:hidden">Post</span>
        </button>

        <button
          type="button"
          onClick={() => setMenuOpen((value) => !value)}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          className="push border-3 border-black bg-white p-2 shadow-brutal-sm hover:bg-beige xl:hidden"
        >
          {menuOpen ? <X size={18} strokeWidth={3} aria-hidden /> : <Menu size={18} strokeWidth={3} aria-hidden />}
        </button>
      </div>

      {/* Mobile drawer */}
      {menuOpen ? (
        <nav
          id="mobile-menu"
          aria-label="Mobile"
          className="animate-fade-up border-t-3 border-black bg-cream px-4 py-4 xl:hidden"
        >
          <ul className="grid gap-2">
            {NAV_LINKS.map((link) => (
              <li key={link.to}>
                <RouterNavLink
                  to={link.to}
                  end={link.to === '/'}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center justify-between border-3 border-black px-3 py-2.5 text-xs font-black uppercase tracking-widest shadow-brutal-xs',
                      isActive ? 'bg-ink text-lemon-400' : 'bg-white text-ink',
                    )
                  }
                >
                  {link.label}
                  <span className="text-[10px] font-bold normal-case tracking-normal text-ink-muted">
                    {link.description}
                  </span>
                </RouterNavLink>
              </li>
            ))}
          </ul>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="border-2 border-black bg-white px-2 py-1.5 text-center shadow-brutal-xs">
              <p className="text-[9px] font-black uppercase tracking-widest text-ink-muted">Posts</p>
              <p className="font-display text-sm tabular-nums">{stats.posts}</p>
            </div>
            <div className="border-2 border-black bg-white px-2 py-1.5 text-center shadow-brutal-xs">
              <p className="text-[9px] font-black uppercase tracking-widest text-ink-muted">Ghosts</p>
              <p className="font-display text-sm tabular-nums">{stats.ghosts}</p>
            </div>
            <div className="border-2 border-black bg-white px-2 py-1.5 text-center shadow-brutal-xs">
              <p className="text-[9px] font-black uppercase tracking-widest text-ink-muted">Named</p>
              <p className="font-display text-sm tabular-nums">{stats.named}</p>
            </div>
          </div>
        </nav>
      ) : null}

      <Ticker tone="cobalt" />
    </header>
  );
}

/** A compact inline stats row reused by the hero and the about page. */
export function StatsRow({ className }: { className?: string }) {
  const { stats } = useFeed();

  const items = [
    { label: 'Anonymous posts', value: formatCount(stats.posts), icon: Ghost, tone: 'bg-ink text-lemon-400' },
    { label: 'Ghost share', value: `${stats.posts ? Math.round((stats.ghosts / stats.posts) * 100) : 0}%`, icon: Users, tone: 'bg-lemon-400 text-ink' },
    { label: 'Upvotes cast', value: formatCount(stats.likes), icon: Flame, tone: 'bg-cobalt-600 text-white' },
    { label: 'Words spilled', value: formatCount(stats.words), icon: Sparkles, tone: 'bg-olive-600 text-white' },
  ];

  return (
    <dl className={cn('grid grid-cols-2 gap-3 sm:grid-cols-4', className)}>
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.label} className="border-3 border-black bg-white p-3 shadow-brutal-sm">
            <span className={cn('mb-2 flex h-7 w-7 items-center justify-center border-2 border-black', item.tone)}>
              <Icon size={14} strokeWidth={3} aria-hidden />
            </span>
            <dd className="font-display text-2xl leading-none tabular-nums">{item.value}</dd>
            <dt className="mt-1 text-[10px] font-black uppercase tracking-widest text-ink-muted">{item.label}</dt>
          </div>
        );
      })}
    </dl>
  );
}
