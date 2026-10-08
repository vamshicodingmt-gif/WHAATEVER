import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import App from '@/App';
import { STORAGE_KEYS } from '@/lib/storage';

/**
 * Smoke coverage for the critical anonymous-posting journeys:
 *   1. The SPA boots, seeds the feed and publishes the keyword-optimised head.
 *   2. A visitor can publish an anonymous post from The Vault.
 *   3. Upvotes and comments persist their counts.
 *   4. Filter tabs switch the stream.
 */

function renderApp() {
  return render(<App />);
}

beforeEach(() => {
  window.localStorage.clear();
});

describe('WHAATEVER app shell', () => {
  it('boots, seeds the anonymous feed and injects the SEO head', async () => {
    renderApp();

    expect(await screen.findByRole('heading', { level: 1, name: /WHAATEVER/i })).toBeInTheDocument();

    // react-helmet-async should have taken over the document head.
    await waitFor(() => expect(document.title).toContain('WHAATEVER'));

    const description = document.querySelector('meta[name="description"]');
    expect(description?.getAttribute('content')).toContain('anonymous posting platform');
    expect(document.querySelector('meta[property="og:url"]')?.getAttribute('content')).toBe(
      'https://whaatever.vercel.app/',
    );
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe('https://whaatever.vercel.app/');
    expect(document.querySelector('script[type="application/ld+json"]')?.textContent).toContain('WebSite');

    // Seed content is installed into localStorage on first boot.
    const stored = window.localStorage.getItem(STORAGE_KEYS.posts);
    expect(stored).toBeTruthy();
    expect(JSON.parse(stored ?? '[]').length).toBeGreaterThan(5);

    // Ghost handle (the default anonymous identity) is visible on cards.
    const ghostMentions = await screen.findAllByText(/Anonymous Whaatever Ghost/i);
    expect(ghostMentions.length).toBeGreaterThan(0);

    // Seed posts hide keyword-optimised copy behind the feed.
    const posts = JSON.parse(stored ?? '[]') as {
      category: string;
      image: { dataUrl: string; width: number } | null;
    }[];
    expect(posts.some((post) => post.category === 'rant')).toBe(true);

    // Seeded poster artwork is a valid inline SVG data URL (no network requests).
    const withArt = posts.filter((post) => post.image && post.image.dataUrl.startsWith('data:image/svg+xml,'));
    expect(withArt.length).toBeGreaterThan(0);
    for (const post of withArt) {
      const svg = decodeURIComponent(post.image!.dataUrl.replace('data:image/svg+xml,', ''));
      expect(svg.startsWith('<svg')).toBe(true);
      const parsed = new DOMParser().parseFromString(svg, 'image/svg+xml');
      expect(parsed.querySelector('parsererror')).toBeNull();
      expect(parsed.documentElement.getAttribute('viewBox')).toBeTruthy();
    }

    // Seed timestamps are relative to "now", so the feed is never stale.
    const timestamps = JSON.parse(stored ?? '[]') as unknown as { createdAt: number }[];
    const newestPost = timestamps.reduce((latest, item) => Math.max(latest, item.createdAt), 0);
    expect(Date.now() - newestPost).toBeLessThan(60 * 60 * 1000);
  });

  it('publishes a new anonymous post through The Vault', async () => {
    renderApp();

    const [openVault] = await screen.findAllByRole('button', { name: /create post/i });
    fireEvent.click(openVault);

    const composer = await screen.findByLabelText(/say the unfiltered thing/i);
    fireEvent.change(composer, { target: { value: 'I have been pretending to enjoy my commute for two years.' } });

    fireEvent.click(screen.getByRole('button', { name: /^publish$/i }));

    // The post appears on the feed immediately (optimistic update).
    const published = await screen.findByText(/pretending to enjoy my commute/i);
    expect(published).toBeInTheDocument();

    // ...and it is flushed into localStorage (the write is debounced).
    await waitFor(
      () => {
        const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEYS.posts) ?? '[]') as {
          content: string;
          author: string | null;
        }[];
        const record = stored.find((post) => post.content.includes('pretending to enjoy my commute'));
        expect(record).toBeDefined();
        expect(record?.author).toBeNull();
      },
      { timeout: 3000 },
    );

    // A tactile success toast confirms the publish (the feed may also be
    // showing the "ghost mode engaged" welcome toast).
    const toasts = await screen.findAllByRole('status');
    const publishToast = toasts.find((toast) => /posted anonymously/i.test(toast.textContent ?? ''));
    expect(publishToast).toBeDefined();
    expect(publishToast).toHaveTextContent(/live on the whaatever feed/i);
  });

  it('upvotes a post and stores the interaction', async () => {
    renderApp();

    const upvoteButtons = await screen.findAllByRole('button', { name: /upvote this post/i });
    const first = upvoteButtons[0];
    expect(first).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(first);

    const toggled = await screen.findByRole('button', { name: /remove your upvote/i });
    expect(toggled).toHaveAttribute('aria-pressed', 'true');

    // The like must survive the debounced localStorage flush.
    await waitFor(
      () => {
        const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEYS.posts) ?? '[]') as {
          likedByMe: boolean;
        }[];
        expect(stored.some((post) => post.likedByMe)).toBe(true);
      },
      { timeout: 3000 },
    );
  });

  it('adds a comment inside the expandable drawer', async () => {
    renderApp();

    const [commentsToggle] = await screen.findAllByRole('button', { name: /comments/i });
    fireEvent.click(commentsToggle);

    const commentBox = await screen.findByLabelText(/add a comment to this anonymous post/i);
    fireEvent.change(commentBox, { target: { value: 'This is exactly how I feel about it too.' } });

    fireEvent.click(screen.getByRole('button', { name: /^reply$/i }));

    const comment = await screen.findByText(/exactly how I feel about it too/i);
    expect(comment).toBeInTheDocument();

    // Comment text is persisted with the post it belongs to.
    await waitFor(
      () => {
        const stored = window.localStorage.getItem(STORAGE_KEYS.posts) ?? '';
        expect(stored).toContain('exactly how I feel about it too');
      },
      { timeout: 3000 },
    );
  });

  it('switches the feed to the anonymous-only filter', async () => {
    renderApp();

    const anonymousTab = await screen.findByRole('tab', { name: /anonymous only/i });
    fireEvent.click(anonymousTab);

    expect(anonymousTab).toHaveAttribute('aria-selected', 'true');

    // Every rendered card under this filter must be a ghost post.
    const feed = document.querySelector('.masonry');
    expect(feed).toBeTruthy();
    const cards = within(feed as HTMLElement).getAllByRole('article');
    expect(cards.length).toBeGreaterThan(0);
    for (const card of cards) {
      expect(within(card).queryByText('Posted as')).toBeNull();
      expect(card.textContent).toContain('Ghost');
    }
  });
});
