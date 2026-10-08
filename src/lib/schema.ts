import type { Post } from '@/types';
import { GHOST_HANDLE, SITE, absoluteUrl, type FaqItem } from '@/lib/constants';
import { countWords, slugify, truncate } from '@/lib/utils';

/**
 * Structured-data builders.
 *
 * Even though WHAATEVER is a 100% client-side rendered SPA, injecting schema.org
 * graphs at runtime gives crawlers that *do* execute JavaScript a rich,
 * entity-accurate picture of the site: the platform itself, the FAQ content,
 * the live feed as an ItemList, and every confession as a SocialMediaPosting.
 */

export type JsonLd = Record<string, unknown>;

const ORG_ID = `${SITE.url}/#organization`;
const SITE_ID = `${SITE.url}/#website`;

export function organizationNode(): JsonLd {
  return {
    '@type': 'Organization',
    '@id': ORG_ID,
    name: SITE.name,
    url: absoluteUrl('/'),
    logo: {
      '@type': 'ImageObject',
      url: absoluteUrl(SITE.ogImage),
      width: 1200,
      height: 630,
    },
    sameAs: [`https://twitter.com/${SITE.twitter.replace('@', '')}`],
  };
}

export function websiteNode(): JsonLd {
  return {
    '@type': 'WebSite',
    '@id': SITE_ID,
    url: absoluteUrl('/'),
    name: SITE.name,
    alternateName: [SITE.domain, 'WHAATEVER Anonymous Board'],
    description: SITE.description,
    inLanguage: 'en',
    publisher: { '@id': ORG_ID },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${absoluteUrl('/trending')}?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function webApplicationNode(): JsonLd {
  return {
    '@type': 'WebApplication',
    '@id': `${SITE.url}/#webapp`,
    name: SITE.name,
    url: absoluteUrl('/'),
    applicationCategory: 'SocialNetworkingApplication',
    operatingSystem: 'Any modern browser',
    browserRequirements: 'Requires JavaScript (100% client-side rendered SPA)',
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    description: SITE.longDescription,
    publisher: { '@id': ORG_ID },
    featureList: [
      'Anonymous posting as a ghost handle',
      'Optional named or pseudonymous posting',
      'Unfiltered rants, confessions and hot takes',
      'Instant base64 image attachments',
      'Upvotes and comment drawers',
      'Zero logins, zero backend, zero trackers',
    ],
  };
}

/** The default three-entity graph used on every route. */
export function baseGraph(): JsonLd {
  return { '@context': 'https://schema.org', '@graph': [organizationNode(), websiteNode(), webApplicationNode()] };
}

export function breadcrumbGraph(items: { name: string; path: string }[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function faqGraph(faqs: readonly FaqItem[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  };
}

function postAuthorNode(post: Post): JsonLd {
  if (post.author) {
    return { '@type': 'Person', name: post.author, url: `${absoluteUrl('/')}#author-${slugify(post.author)}` };
  }
  return { '@type': 'Person', name: GHOST_HANDLE, description: 'Anonymous poster on WHAATEVER' };
}

/** Turn a single confession/rant into a crawlable SocialMediaPosting node. */
export function postNode(post: Post): JsonLd {
  const node: JsonLd = {
    '@type': 'SocialMediaPosting',
    '@id': `${absoluteUrl('/')}#post-${post.id}`,
    headline: truncate(post.content.replace(/\s+/g, ' '), 110),
    articleBody: post.content,
    datePublished: new Date(post.createdAt).toISOString(),
    dateModified: new Date(post.createdAt).toISOString(),
    author: postAuthorNode(post),
    isPartOf: { '@id': SITE_ID },
    interactionStatistic: [
      {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/LikeAction',
        userInteractionCount: post.likes,
      },
      {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/CommentAction',
        userInteractionCount: post.comments.length,
      },
    ],
    commentCount: post.comments.length,
    wordCount: countWords(post.content),
    keywords: post.category,
    inLanguage: 'en',
    isAccessibleForFree: true,
  };

  if (post.image && post.image.dataUrl.length <= 4000) {
    // Base64 payloads are only embedded when they are small enough to keep the
    // JSON-LD payload sane — the seed SVG posters qualify, big uploads do not.
    node.image = {
      '@type': 'ImageObject',
      contentUrl: post.image.dataUrl,
      width: post.image.width,
      height: post.image.height,
      caption: 'Anonymous image attachment posted on WHAATEVER',
    };
  }

  if (post.comments.length > 0) {
    node.comment = post.comments.slice(0, 10).map((comment) => ({
      '@type': 'Comment',
      text: comment.content,
      dateCreated: new Date(comment.createdAt).toISOString(),
      author: comment.author
        ? { '@type': 'Person', name: comment.author }
        : { '@type': 'Person', name: GHOST_HANDLE },
      upvoteCount: comment.likes,
    }));
  }

  return node;
}

/** The live feed expressed as an ItemList, which is how the feed gets indexed. */
export function feedGraph(posts: Post[], listName: string, path = '/'): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${absoluteUrl(path)}#feed`,
    url: absoluteUrl(path),
    name: listName,
    description: `${listName} — anonymous confessions, unfiltered rants and unfiltered thoughts from the community at ${SITE.domain}.`,
    isPartOf: { '@id': SITE_ID },
    inLanguage: 'en',
    mainEntity: {
      '@type': 'ItemList',
      name: listName,
      numberOfItems: posts.length,
      itemListOrder: 'https://schema.org/ItemListOrderDescending',
      itemListElement: posts.slice(0, 20).map((post, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `${absoluteUrl('/')}#post-${post.id}`,
        name: truncate(post.content.replace(/\s+/g, ' '), 90),
        // Only the top three posts get a fully nested node so the emitted
        // JSON-LD payload stays lean no matter how big the local feed grows.
        ...(index < 3 ? { item: postNode(post) } : {}),
      })),
    },
  };
}

/** AboutPage / WebPage node for the static content routes. */
export function pageGraph(options: {
  path: string;
  name: string;
  description: string;
  type?: 'WebPage' | 'AboutPage';
}): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': options.type ?? 'WebPage',
    '@id': `${absoluteUrl(options.path)}#page`,
    url: absoluteUrl(options.path),
    name: options.name,
    description: options.description,
    isPartOf: { '@id': SITE_ID },
    inLanguage: 'en',
    publisher: { '@id': ORG_ID },
  };
}

/** HowTo-ish list rendered on the About route. */
export function howToGraph(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'How to post anonymously on WHAATEVER in under 30 seconds',
    description:
      'Publish an anonymous confession, rant or thought to the WHAATEVER live feed with zero logins and zero accounts.',
    totalTime: 'PT30S',
    estimatedCost: { '@type': 'MonetaryAmount', currency: 'USD', value: '0' },
    step: [
      {
        '@type': 'HowToStep',
        position: 1,
        name: 'Tap Create Post',
        text: 'Open WHAATEVER.VERCEL.APP and press the Create Post button in the header to open The Vault.',
      },
      {
        '@type': 'HowToStep',
        position: 2,
        name: 'Type whatever you need to say',
        text: 'Write your confession, rant, secret or hot take. Explicit, unfiltered language is allowed.',
      },
      {
        '@type': 'HowToStep',
        position: 3,
        name: 'Choose Ghost Mode or a name',
        text: 'Leave Ghost Mode on to post as the Anonymous Whaatever Ghost, or switch it off to attach a pseudonym.',
      },
      {
        '@type': 'HowToStep',
        position: 4,
        name: 'Optionally attach an image',
        text: 'Drop or paste an image and it is compressed to a local base64 payload inside your browser.',
      },
      {
        '@type': 'HowToStep',
        position: 5,
        name: 'Publish anonymously',
        text: 'Hit Publish and the post lands on the live feed instantly with no signup, no email and no waiting.',
      },
    ],
  };
}
