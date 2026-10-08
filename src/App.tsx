import { useCallback, useEffect, useState } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { Ghost, PenSquare } from 'lucide-react';
import { SITE } from '@/lib/constants';
import { downloadJson, formatCount } from '@/lib/utils';
import { FeedProvider, useFeed } from '@/context/FeedContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import PostModal from '@/components/PostModal';
import About from '@/pages/About';
import Guidelines from '@/pages/Guidelines';
import Home from '@/pages/Home';
import NotFound from '@/pages/NotFound';
import Privacy from '@/pages/Privacy';
import Trending from '@/pages/Trending';

/**
 * ScrollManager — client-side routing nicety.
 *
 * A SPA does not reload between routes, so this restores the browser behaviour
 * visitors expect: plain route changes jump to the top, while `#post-<id>`
 * deep links scroll the target post into view once the feed has painted.
 */
function ScrollManager() {
  const location = useLocation();

  useEffect(() => {
    const { hash } = location;

    if (hash && hash.length > 1) {
      const id = hash.slice(1);
      const timer = window.setTimeout(() => {
        const target = document.getElementById(id);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          return;
        }
        window.scrollTo({ top: 0, behavior: 'auto' });
      }, 120);

      return () => window.clearTimeout(timer);
    }

    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [location]);

  return null;
}

/**
 * Shell — the persistent application chrome: header, routed <main>, footer and
 * the composer overlay. Kept inside the providers so every piece can read the
 * live feed.
 */
function Shell() {
  const { exportFeed, restoreSeedFeed, notify } = useFeed();
  const [vaultOpen, setVaultOpen] = useState(false);

  const openVault = useCallback(() => setVaultOpen(true), []);
  const closeVault = useCallback(() => setVaultOpen(false), []);

  const handleExport = useCallback(() => {
    const posts = exportFeed();
    downloadJson(`whaatever-feed-${new Date().toISOString().slice(0, 10)}.json`, {
      exportedFrom: `${SITE.url}/`,
      exportedAt: new Date().toISOString(),
      postCount: posts.length,
      posts,
    });
    notify({
      variant: 'success',
      title: 'Feed exported',
      message: `${formatCount(posts.length)} posts saved as JSON. Keep the file safe — there is no cloud copy.`,
      duration: 5000,
    });
  }, [exportFeed, notify]);

  const handleRestoreSeed = useCallback(() => {
    restoreSeedFeed();
    notify({
      variant: 'ghost',
      title: 'Seed feed restored',
      message: 'The keyword-optimised starter confessions are back at the top of your feed.',
      duration: 3600,
    });
  }, [notify, restoreSeedFeed]);

  /* Keyboard shortcut: press "n" anywhere (outside a field) to open The Vault. */
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target?.isContentEditable) return;

      if (event.key.toLowerCase() === 'n') {
        event.preventDefault();
        setVaultOpen(true);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div id="top" className="flex min-h-screen flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:border-3 focus:border-black focus:bg-lemon-400 focus:px-4 focus:py-2 focus:font-display focus:text-xs focus:uppercase focus:shadow-brutal"
      >
        Skip to the live anonymous feed
      </a>

      <Navbar onCreatePost={openVault} />

      <main id="main-content" className="mx-auto w-full max-w-7xl flex-1 px-3 pb-6 sm:px-4">
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<Home onCreatePost={openVault} />} />
            <Route path="/trending" element={<Trending onCreatePost={openVault} />} />
            <Route path="/about" element={<About onCreatePost={openVault} />} />
            <Route path="/guidelines" element={<Guidelines onCreatePost={openVault} />} />
            <Route path="/privacy" element={<Privacy onCreatePost={openVault} />} />
            <Route path="*" element={<NotFound onCreatePost={openVault} />} />
          </Routes>
        </ErrorBoundary>
      </main>

      <Footer onCreatePost={openVault} onExport={handleExport} onRestoreSeed={handleRestoreSeed} />

      <PostModal open={vaultOpen} onClose={closeVault} />

      {/* Mobile sticky composer trigger */}
      <button
        type="button"
        onClick={openVault}
        className="btn btn-cobalt fixed bottom-4 left-4 z-[90] shadow-brutal-lg lg:hidden"
        aria-label="Create an anonymous post"
      >
        <PenSquare size={16} strokeWidth={3} aria-hidden />
        <span>Post</span>
        <Ghost size={14} strokeWidth={3} className="text-lemon-400" aria-hidden />
      </button>
    </div>
  );
}

/**
 * App — root component.
 *
 * Provider order matters: HelmetProvider (SEO head management) → BrowserRouter
 * (client-side routing) → FeedProvider (localStorage-backed feed state and
 * toasts) → the routed shell.
 */
export default function App() {
  return (
    <HelmetProvider>
      <BrowserRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <FeedProvider>
          <ScrollManager />
          <Shell />
        </FeedProvider>
      </BrowserRouter>
    </HelmetProvider>
  );
}
