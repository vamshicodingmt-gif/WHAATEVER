import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Cookie, Database, Download, Ghost, HardDrive, Info, Lock, PenSquare, ShieldCheck, Trash2, Wifi } from 'lucide-react';
import { SITE } from '@/lib/constants';
import { absoluteUrl } from '@/lib/constants';
import { baseGraph, breadcrumbGraph, pageGraph } from '@/lib/schema';
import { LIMITS } from '@/lib/constants';
import { humanBytes } from '@/lib/utils';
import { useFeed } from '@/context/FeedContext';
import SEOHead from '@/components/SEOHead';

export interface PrivacyProps {
  onCreatePost: () => void;
}

const STORED_KEYS = [
  {
    key: 'whaatever:posts:v1',
    purpose: 'Every post, upvote, comment, view count and base64 image attachment in your feed.',
  },
  {
    key: 'whaatever:identity:v1',
    purpose: 'Your Ghost Mode switch and the optional name / pseudonym you attach to named posts.',
  },
  {
    key: 'whaatever:draft:v1',
    purpose: 'The in-progress post you left in The Vault so it survives a refresh.',
  },
  {
    key: 'whaatever:visit:v1',
    purpose: 'A local visit counter and first-seen timestamp, used for the "visit #N" badge in the header.',
  },
] as const;

const NEVER_COLLECTED = [
  'Your name, email address, phone number or any account credentials — there is no account system.',
  'Your IP address, device fingerprint, precise location or behavioural profile.',
  'Cookies for advertising, retargeting or cross-site tracking.',
  'Analytics events, session recordings, heatmaps or crash telemetry.',
  'Any copy of the text or images you publish — they are never transmitted.',
] as const;

/**
 * Privacy — an honest, accurate data-handling page. Because WHAATEVER has no
 * backend, most privacy policies would be fiction here; this one documents what
 * actually happens in the browser instead.
 */
export default function Privacy({ onCreatePost }: PrivacyProps) {
  const { stats, storageAvailable } = useFeed();

  const jsonLd = useMemo(
    () => [
      baseGraph(),
      pageGraph({
        path: '/privacy',
        name: 'WHAATEVER privacy — how anonymous posting stays on your device',
        description:
          'WHAATEVER stores everything in browser localStorage. No backend, no cookies, no analytics and no copy of your posts anywhere but your own device.',
      }),
      breadcrumbGraph([
        { name: 'Home', path: '/' },
        { name: 'Privacy', path: '/privacy' },
      ]),
    ],
    [],
  );

  return (
    <>
      <SEOHead
        title="Privacy & Data Handling | WHAATEVER Anonymous Posting"
        description="WHAATEVER has no backend, no cookies and no analytics. Posts, comments and images live in your browser's localStorage — here is exactly what is stored, where, and how to wipe it."
        keywords={`WHAATEVER privacy, anonymous posting privacy, localStorage anonymous app, no tracking confession board, ${SITE.keywords}`}
        path="/privacy"
        type="website"
        jsonLd={jsonLd}
      />

      <section aria-labelledby="privacy-title" className="mt-8">
        <div className="border-4 border-black bg-white p-5 shadow-brutal-xl sm:p-8">
          <p className="badge badge-olive">
            <ShieldCheck size={10} strokeWidth={3} aria-hidden /> Privacy by architecture
          </p>
          <h1
            id="privacy-title"
            className="mt-3 font-display text-4xl uppercase leading-[0.9] tracking-tighter text-ink sm:text-6xl"
          >
            Your words stay on your device
          </h1>
          <p className="mt-4 max-w-3xl text-base font-semibold leading-relaxed text-ink-soft">
            WHAATEVER is a 100% client-side rendered application. That means the text you write, the images you attach, the
            posts you upvote and the comments you leave are all stored in <strong>your own browser</strong> — never sent to
            a server, because there is no server to send them to.
          </p>

          <dl className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="border-3 border-black bg-cream p-3 shadow-brutal-xs">
              <dt className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-ink-muted">
                <HardDrive size={12} strokeWidth={3} aria-hidden /> Stored locally
              </dt>
              <dd className="mt-1 font-display text-2xl tabular-nums">{humanBytes(stats.storageBytes)}</dd>
            </div>
            <div className="border-3 border-black bg-cream p-3 shadow-brutal-xs">
              <dt className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-ink-muted">
                <Database size={12} strokeWidth={3} aria-hidden /> Storage engine
              </dt>
              <dd className="mt-1 font-display text-lg uppercase">{storageAvailable ? 'localStorage' : 'session only'}</dd>
            </div>
            <div className="border-3 border-black bg-cream p-3 shadow-brutal-xs">
              <dt className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-ink-muted">
                <Lock size={12} strokeWidth={3} aria-hidden /> Data centres used
              </dt>
              <dd className="mt-1 font-display text-2xl">0</dd>
            </div>
          </dl>
        </div>
      </section>

      {/* ------------------------------------------------------- what is stored */}
      <section aria-labelledby="stored-heading" className="mt-12">
        <h2 id="stored-heading" className="font-display text-2xl uppercase leading-none tracking-tight sm:text-3xl">
          Exactly what is stored in your browser
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-soft">
          Four keys. That is the entire data model of WHAATEVER. You can inspect, copy or delete every one of them from
          your browser dev tools whenever you like.
        </p>

        <div className="mt-5 overflow-x-auto border-4 border-black bg-white shadow-brutal-lg">
          <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
            <caption className="sr-only">localStorage keys used by WHAATEVER and what each one contains</caption>
            <thead>
              <tr className="bg-ink text-white">
                <th scope="col" className="border-b-3 border-black px-4 py-3 font-display text-xs uppercase tracking-widest">
                  Key
                </th>
                <th scope="col" className="border-b-3 border-black px-4 py-3 font-display text-xs uppercase tracking-widest">
                  What it holds
                </th>
              </tr>
            </thead>
            <tbody>
              {STORED_KEYS.map((row) => (
                <tr key={row.key} className="odd:bg-cream">
                  <th scope="row" className="border-b-2 border-black px-4 py-3 align-top font-mono text-[12px] font-bold text-cobalt-700">
                    {row.key}
                  </th>
                  <td className="border-b-2 border-black px-4 py-3 align-top text-[13px] leading-relaxed text-ink-soft">
                    {row.purpose}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-3 flex items-start gap-2 text-[12px] font-semibold leading-relaxed text-ink-muted">
          <Info size={14} strokeWidth={3} className="mt-0.5 shrink-0" aria-hidden />
          Images are downscaled and re-encoded in-browser, then stored as base64 payloads inside that first key. Browsers
          typically cap localStorage at around 5MB, which is why WHAATEVER asks you to keep uploads under 8MB and shows you
          a live storage meter in the feed toolbar. Current soft budget: {humanBytes(LIMITS.storageSoftLimitBytes)}.
        </p>
      </section>

      {/* ------------------------------------------------------------ never */}
      <section aria-labelledby="never-heading" className="mt-12">
        <h2 id="never-heading" className="flex items-center gap-2 font-display text-2xl uppercase leading-none tracking-tight sm:text-3xl">
          <Cookie size={24} strokeWidth={3} aria-hidden />
          What WHAATEVER never collects
        </h2>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {NEVER_COLLECTED.map((item) => (
            <li key={item} className="flex gap-2.5 border-3 border-black bg-white px-3 py-2.5 text-[13px] leading-relaxed text-ink-soft shadow-brutal-xs">
              <Lock size={15} strokeWidth={3} className="mt-0.5 shrink-0 text-olive-700" aria-hidden />
              {item}
            </li>
          ))}
        </ul>
      </section>

      {/* ---------------------------------------------------------- third party */}
      <section aria-labelledby="third-party" className="mt-12 border-4 border-black bg-beige p-5 shadow-brutal-lg">
        <h2 id="third-party" className="flex items-center gap-2 font-display text-xl uppercase tracking-tight">
          <Wifi size={20} strokeWidth={3} aria-hidden />
          The honest fine print
        </h2>
        <ul className="mt-3 space-y-2.5 text-[13px] leading-relaxed text-ink-soft">
          <li>
            <strong className="font-black">Hosting.</strong> The static files are served by Vercel at{' '}
            {SITE.host}. Like any web host it may record standard access logs (IP, user agent) for security and
            abuse-prevention purposes when your browser requests the page. It never sees the content of your posts.
          </li>
          <li>
            <strong className="font-black">Fonts.</strong> Typography is loaded from the Google Fonts CDN, which means your
            browser makes a request to fonts.googleapis.com. If you would rather avoid that, block the domain — the app
            falls back to system fonts and keeps working.
          </li>
          <li>
            <strong className="font-black">No cookies, no analytics.</strong> WHAATEVER sets no cookies and includes no
            analytics, advertising or tracking scripts. Which is also why there is not a single cookie banner anywhere on
            this site.
          </li>
          <li>
            <strong className="font-black">Sustainability.</strong> WHAATEVER is free to run precisely because there is no
            infrastructure: no database, no API, no media storage. Nothing to pay for and nothing to sell.
          </li>
        </ul>
      </section>

      {/* ------------------------------------------------------------- controls */}
      <section aria-labelledby="controls-heading" className="mt-12">
        <h2 id="controls-heading" className="font-display text-2xl uppercase leading-none tracking-tight sm:text-3xl">
          Your controls
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <article className="brutal-card p-4">
            <span className="mb-3 flex h-9 w-9 items-center justify-center border-3 border-black bg-olive-600 text-white">
              <Download size={16} strokeWidth={3} aria-hidden />
            </span>
            <h3 className="font-display text-[13px] uppercase tracking-tight">Export everything</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">
              The Export button in the feed toolbar downloads your entire feed — posts, comments, upvotes and image
              payloads — as a JSON file you own outright.
            </p>
          </article>
          <article className="brutal-card p-4">
            <span className="mb-3 flex h-9 w-9 items-center justify-center border-3 border-black bg-danger text-white">
              <Trash2 size={16} strokeWidth={3} aria-hidden />
            </span>
            <h3 className="font-display text-[13px] uppercase tracking-tight">Delete everything</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">
              Reset in the feed toolbar wipes all local keys. So does clearing site data in your browser settings, or
              posting from a private window if you want nothing retained at all.
            </p>
          </article>
          <article className="brutal-card p-4">
            <span className="mb-3 flex h-9 w-9 items-center justify-center border-3 border-black bg-lemon-400">
              <Info size={16} strokeWidth={3} aria-hidden />
            </span>
            <h3 className="font-display text-[13px] uppercase tracking-tight">The trade-off</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">
              Because nothing is uploaded, nobody — including the WHAATEVER project — can recover your posts if you clear
              your browser data or switch devices. Anonymity and permanence are opposites; this platform picks anonymity.
            </p>
          </article>
        </div>
      </section>

      <section aria-labelledby="privacy-cta" className="mt-12 border-4 border-black bg-cobalt-600 p-6 text-white shadow-brutal-xl">
        <h2 id="privacy-cta" className="font-display text-2xl uppercase leading-none tracking-tight sm:text-3xl">
          Private enough to be honest?
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/90">
          Then the confession board is open. Post the unfiltered version — the one that never made it out of the notes app.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button type="button" onClick={onCreatePost} className="btn btn-lemon btn-lg">
            <PenSquare size={18} strokeWidth={3} aria-hidden /> Create a post
          </button>
          <Link to="/" className="btn btn-white btn-lg">
            <Ghost size={18} strokeWidth={3} aria-hidden /> Back to the feed
          </Link>
          <a href={absoluteUrl('/guidelines')} className="btn btn-white btn-lg">
            <ShieldCheck size={18} strokeWidth={3} aria-hidden /> House rules
          </a>
        </div>
      </section>
    </>
  );
}
