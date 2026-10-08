import { Link } from 'react-router-dom';
import { Compass, Ghost, PenSquare } from 'lucide-react';
import { NAV_LINKS } from '@/lib/constants';
import { baseGraph } from '@/lib/schema';
import SEOHead from '@/components/SEOHead';

export interface NotFoundProps {
  onCreatePost: () => void;
}

/** NotFound — brutalist 404 for any route that does not exist (kept noindex). */
export default function NotFound({ onCreatePost }: NotFoundProps) {
  return (
    <>
      <SEOHead
        title="404 — This confession does not exist | WHAATEVER"
        description="That page has vanished into the void. Head back to the WHAATEVER live anonymous feed and confessions."
        path="/404"
        noindex
        jsonLd={[baseGraph()]}
      />

      <section aria-labelledby="notfound-title" className="mt-10">
        <div className="border-4 border-black bg-white p-6 text-center shadow-brutal-2xl sm:p-12">
          <p className="badge badge-lemon mx-auto">
            <Ghost size={10} strokeWidth={3} aria-hidden /> Error 404
          </p>
          <h1
            id="notfound-title"
            className="mx-auto mt-4 max-w-3xl font-display text-5xl uppercase leading-[0.9] tracking-tighter text-ink sm:text-7xl"
          >
            WHAATEVER happened here?
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm font-semibold leading-relaxed text-ink-soft sm:text-base">
            This page does not exist — or it was so anonymous that even the router cannot find it. The live feed is still
            where you left it, and it is still full of unfiltered thoughts.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/" className="btn btn-cobalt btn-lg">
              <Compass size={18} strokeWidth={3} aria-hidden /> Back to the live feed
            </Link>
            <button type="button" onClick={onCreatePost} className="btn btn-lemon btn-lg">
              <PenSquare size={18} strokeWidth={3} aria-hidden /> Post something instead
            </button>
          </div>

          <nav aria-label="Popular routes" className="mt-8 border-t-3 border-black pt-5">
            <ul className="flex flex-wrap justify-center gap-2">
              {NAV_LINKS.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="btn btn-white btn-sm">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </section>
    </>
  );
}
