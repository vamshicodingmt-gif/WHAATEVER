import { Helmet } from 'react-helmet-async';
import { SITE, absoluteUrl } from '@/lib/constants';
import type { JsonLd } from '@/lib/schema';

export interface SEOHeadProps {
  /** Route title. Defaults to the primary keyword-optimised homepage title. */
  title?: string;
  description?: string;
  keywords?: string;
  /** Route path used for the canonical + og:url, e.g. "/trending". */
  path?: string;
  /** Absolute or root-relative share image. */
  image?: string;
  type?: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  /** Keep a route out of the index (used for nothing today, but wired up). */
  noindex?: boolean;
  /** One or more schema.org graphs injected as application/ld+json. */
  jsonLd?: JsonLd[];
}

/**
 * SEOHead — the dynamic head manager.
 *
 * Every route renders exactly one of these. It writes the full metadata
 * payload (title, description, keywords, canonical, Open Graph, Twitter Card,
 * robots directives and JSON-LD structured data) into the document head through
 * react-helmet-async.
 *
 * Because WHAATEVER is a 100% client-side rendered SPA, `index.html` already
 * ships static copies of the homepage tags so non-JavaScript crawlers get the
 * complete payload before React ever boots. Helmet adopts those tags at runtime
 * (they are marked data-rh="true") and upgrades them per route.
 */
export default function SEOHead({
  title = `${SITE.name} | ${SITE.tagline}`,
  description = SITE.description,
  keywords = SITE.keywords,
  path = '/',
  image = SITE.ogImage,
  type = 'website',
  publishedTime,
  modifiedTime,
  author = SITE.name,
  noindex = false,
  jsonLd = [],
}: SEOHeadProps) {
  const canonical = absoluteUrl(path);
  const imageUrl = absoluteUrl(image);
  const robotsContent = noindex
    ? 'noindex, nofollow'
    : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';

  return (
    <Helmet>
      {/* ------------------------------------------------------------ basics */}
      <html lang="en" />
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="robots" content={robotsContent} />
      <meta name="googlebot" content={robotsContent} />
      <meta name="author" content={author} />
      <meta name="publisher" content={SITE.domain} />
      <meta name="copyright" content={`${SITE.name} — ${SITE.domain}`} />
      <meta name="rating" content="general" />
      <meta name="revisit-after" content="1 days" />
      <meta name="theme-color" content="#FACC15" />
      <meta name="color-scheme" content="light" />
      <meta name="application-name" content={SITE.name} />
      <meta name="apple-mobile-web-app-title" content={SITE.name} />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="format-detection" content="telephone=no" />
      <meta name="geo.region" content="001" />
      <meta name="language" content="English" />
      <meta name="distribution" content="global" />

      {/* --------------------------------------------------------- canonical */}
      <link rel="canonical" href={canonical} />
      <link rel="alternate" hrefLang="en" href={canonical} />
      <link rel="alternate" hrefLang="x-default" href={absoluteUrl('/')} />

      {/* ------------------------------------------------------- open graph */}
      <meta property="og:site_name" content={SITE.name} />
      <meta property="og:locale" content={SITE.locale} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:secure_url" content={imageUrl} />
      <meta property="og:image:type" content="image/png" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta
        property="og:image:alt"
        content="WHAATEVER — the anonymous posting platform for unfiltered thoughts, rants and confessions."
      />
      {type === 'article' && publishedTime ? <meta property="article:published_time" content={publishedTime} /> : null}
      {type === 'article' && modifiedTime ? <meta property="article:modified_time" content={modifiedTime} /> : null}
      {type === 'article' ? <meta property="article:author" content={author} /> : null}
      {type === 'article' ? <meta property="article:section" content="Anonymous Confessions" /> : null}

      {/* ----------------------------------------------------------- twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={SITE.twitter} />
      <meta name="twitter:creator" content={SITE.twitter} />
      <meta name="twitter:domain" content={SITE.host} />
      <meta name="twitter:url" content={canonical} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
      <meta name="twitter:image:alt" content={`${SITE.name} — anonymous posting platform and confession board`} />
      <meta name="twitter:label1" content="Posting cost" />
      <meta name="twitter:data1" content="Free forever" />
      <meta name="twitter:label2" content="Account required" />
      <meta name="twitter:data2" content="None — zero logins" />

      {/* --------------------------------------------------------- json-ld */}
      {jsonLd.map((node, index) => (
        <script key={`jsonld-${index}`} type="application/ld+json">
          {JSON.stringify(node)}
        </script>
      ))}
    </Helmet>
  );
}
