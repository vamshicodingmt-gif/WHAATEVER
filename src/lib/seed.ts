import type { CategoryId, MediaAttachment, Post, PostComment } from '@/types';
import { GHOST_HANDLE } from '@/lib/constants';

/**
 * Seed content for a first-time visitor.
 *
 * WHAATEVER ships with a vibrant, keyword-optimised feed so the app is never a
 * cold, empty room. Timestamps are generated relative to "now" so a fresh
 * install always looks like a community that is posting right now.
 */

/* ------------------------------------------------------------------ helpers */

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

interface SeedArtOptions {
  kicker: string;
  headline: string;
  footer: string;
  bg: string;
  fg: string;
  accent: string;
  width?: number;
  height?: number;
  pattern?: 'grid' | 'dots' | 'stripes';
}

/**
 * Builds a brutalist poster as an inline SVG data URL. Because the artwork is
 * a data URL, the seed feed needs no network requests and stays 100%
 * client-side while still exercising the real image-rendering pipeline.
 */
function seedArt({
  kicker,
  headline,
  footer,
  bg,
  fg,
  accent,
  width = 1200,
  height = 900,
  pattern = 'grid',
}: SeedArtOptions): MediaAttachment {
  const patternMarkup =
    pattern === 'dots'
      ? `<pattern id="p" width="26" height="26" patternUnits="userSpaceOnUse"><circle cx="4" cy="4" r="3" fill="${fg}" opacity="0.16"/></pattern>`
      : pattern === 'stripes'
        ? `<pattern id="p" width="22" height="22" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="10" height="22" fill="${fg}" opacity="0.14"/></pattern>`
        : `<pattern id="p" width="44" height="44" patternUnits="userSpaceOnUse"><path d="M44 0H0V44" fill="none" stroke="${fg}" stroke-opacity="0.14" stroke-width="2"/></pattern>`;

  const headlineWords = headline.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of headlineWords) {
    if ((current + ' ' + word).trim().length > 16 && current) {
      lines.push(current.trim());
      current = word;
    } else {
      current = `${current} ${word}`;
    }
  }
  if (current.trim()) lines.push(current.trim());

  const textLines = lines
    .slice(0, 3)
    .map(
      (line, index) =>
        `<text x="80" y="${330 + index * 108}" font-family="Archivo Black, Impact, sans-serif" font-size="94" fill="${fg}">${escapeXml(line.toUpperCase())}</text>`,
    )
    .join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeXml(
    headline,
  )}">
  <defs>${patternMarkup}</defs>
  <rect width="${width}" height="${height}" fill="${bg}"/>
  <rect width="${width}" height="${height}" fill="url(#p)"/>
  <rect x="0" y="0" width="${width}" height="18" fill="${accent}"/>
  <rect x="0" y="${height - 18}" width="${width}" height="18" fill="${accent}"/>
  <rect x="60" y="70" width="640" height="76" fill="${accent}" stroke="${fg}" stroke-width="7"/>
  <text x="84" y="122" font-family="Inter, system-ui, sans-serif" font-size="34" font-weight="800" letter-spacing="6" fill="${fg}">${escapeXml(
    kicker.toUpperCase(),
  )}</text>
  ${textLines}
  <text x="80" y="${height - 92}" font-family="Inter, system-ui, sans-serif" font-size="34" font-weight="700" fill="${fg}" opacity="0.85">${escapeXml(
    footer,
  )}</text>
  <text x="${width - 190}" y="${height - 78}" font-family="Archivo Black, Impact, sans-serif" font-size="72" fill="${fg}" opacity="0.9">W.</text>
</svg>`;

  const dataUrl = `data:image/svg+xml,${encodeURIComponent(svg)}`;

  return {
    dataUrl,
    width,
    height,
    bytes: Math.round(dataUrl.length * 0.75),
    name: `whaatever-${kicker.toLowerCase().replace(/\s+/g, '-')}.svg`,
  };
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

interface SeedCommentSpec {
  author: string | null;
  content: string;
  ago: number;
  likes: number;
}

interface SeedPostSpec {
  author: string | null;
  content: string;
  category: CategoryId;
  ago: number;
  likes: number;
  views: number;
  pinned?: boolean;
  image?: MediaAttachment;
  comments: SeedCommentSpec[];
}

/* -------------------------------------------------------------- seed content */

function buildSpecs(): SeedPostSpec[] {
  return [
    {
      author: null,
      category: 'rant',
      ago: 26 * MINUTE,
      likes: 428,
      views: 1620,
      pinned: true,
      content:
        "Pinned for every first-timer landing here: WHAATEVER is an anonymous posting platform with ZERO logins. No email, no phone number, no 'verify you're human' circus. You open The Vault, you type the thing you have been chewing on for weeks, you publish it as a ghost, and it is gone from your chest. That is the whole product. WHAATEVER.VERCEL.APP — go unload.",
      image: seedArt({
        kicker: 'Anonymous posting platform',
        headline: 'Say it here. No name required.',
        footer: 'whaatever.vercel.app · 0 logins',
        bg: '#FACC15',
        fg: '#0A0A0A',
        accent: '#2563EB',
        pattern: 'grid',
      }),
      comments: [
        {
          author: null,
          content: 'bookmarking this. the "gone from your chest" part hit harder than it should have.',
          ago: 18 * MINUTE,
          likes: 61,
        },
        {
          author: 'quietstorm',
          content: 'genuinely the only confession board I have used that did not ask me for an account in the first 4 seconds.',
          ago: 11 * MINUTE,
          likes: 34,
        },
        {
          author: null,
          content: 'posted three things in here tonight. nobody knows it is me. that is the point, right?',
          ago: 4 * MINUTE,
          likes: 12,
        },
      ],
    },
    {
      author: null,
      category: 'confession',
      ago: 2 * HOUR + 14 * MINUTE,
      likes: 312,
      views: 1180,
      content:
        "I have been telling everyone at work that I have a side project that is 'almost ready'. It has been almost ready for nineteen months. I open the repo, I stare at it, I close the repo, and I tell myself tomorrow. Tonight I finally deleted the half-finished branch I was ashamed of and started fresh. I am posting this anonymously so that at least one version of me is honest today.",
      comments: [
        {
          author: null,
          content: 'nineteen months is nothing, my side project turns four this winter.',
          ago: 1 * HOUR + 40 * MINUTE,
          likes: 88,
        },
        {
          author: 'ghostofaboxer',
          content: 'the honest version of you is doing fine. fresh branches feel like fresh lungs.',
          ago: 1 * HOUR + 2 * MINUTE,
          likes: 52,
        },
        {
          author: null,
          content: 'delete the branch, keep the lesson. that is the entire cheat code.',
          ago: 38 * MINUTE,
          likes: 19,
        },
      ],
    },
    {
      author: null,
      category: 'rant',
      ago: 5 * HOUR,
      likes: 264,
      views: 940,
      pinned: false,
      content:
        "UNFILTERED RANT: Meetings that could be a two-sentence message are being scheduled 45 minutes into my morning, EVERY morning, and the agenda is literally 'quick sync'. Quick. Sync. My headphones are the only boundary this company respects. If you are my manager and you are reading this: I love you, I am not sorry, and I will be 4 minutes late on purpose.",
      comments: [
        {
          author: null,
          content: 'the 4 minutes late on purpose detail is the most relatable thing on this site.',
          ago: 4 * HOUR + 12 * MINUTE,
          likes: 74,
        },
        {
          author: 'snooze_button',
          content: 'decline, propose async, repeat. taught my whole team this and we got our mornings back.',
          ago: 3 * HOUR + 20 * MINUTE,
          likes: 66,
        },
        {
          author: null,
          content: 'camera off, mic on mute, vibes immaculate.',
          ago: 2 * HOUR + 5 * MINUTE,
          likes: 41,
        },
      ],
    },
    {
      author: null,
      category: 'secret',
      ago: 8 * HOUR + 30 * MINUTE,
      likes: 198,
      views: 870,
      content:
        "I have been paying for my best friend's gym membership for eight months without telling her. She thinks her employer covers it. She has been going three times a week and she has never been louder or happier, and I would rather eat glass than have her find out and feel like a charity case. This secret stays in this box.",
      image: seedArt({
        kicker: 'Secret',
        headline: 'Kindness is quiet',
        footer: 'posted anonymously',
        bg: '#65A30D',
        fg: '#FDFBF7',
        accent: '#FACC15',
        pattern: 'dots',
      }),
      comments: [
        {
          author: null,
          content: 'this is the best thing I have read on the internet this year and it is anonymous. perfect.',
          ago: 7 * HOUR,
          likes: 129,
        },
        {
          author: 'tuesdaymotel',
          content: 'the quiet kind is the real kind. keep it quiet.',
          ago: 5 * HOUR + 30 * MINUTE,
          likes: 58,
        },
      ],
    },
    {
      author: 'ThirdCoffee',
      category: 'hottake',
      ago: 11 * HOUR,
      likes: 176,
      views: 720,
      content:
        "Hot take, and I am attaching my name to it because I am not a coward: nobody is 'bad at texting'. They read it. They drafted something. They decided the conversation could wait. We built a whole mythology around mysterious busy people when the truth is that everyone answers the messages they want to answer.",
      comments: [
        {
          author: null,
          content: 'ok but some of us are genuinely paralyzed by the reply box. not malicious, just frozen.',
          ago: 9 * HOUR + 30 * MINUTE,
          likes: 95,
        },
        {
          author: 'ThirdCoffee',
          content: 'fair. I will accept "frozen" and reject "too busy". different crimes.',
          ago: 9 * HOUR + 5 * MINUTE,
          likes: 63,
        },
        {
          author: null,
          content: 'the draft sitting in my outbox since june is reading this post and sweating.',
          ago: 6 * HOUR,
          likes: 44,
        },
      ],
    },
    {
      author: null,
      category: 'question',
      ago: 16 * HOUR,
      likes: 121,
      views: 640,
      content:
        'Honest question for the anonymous crowd: if money, family expectations and fear did not exist, what would you actually be doing with your day? Not the inspirational answer. The real one. I will go first in the comments so nobody feels alone down there.',
      comments: [
        {
          author: null,
          content: 'photographing abandoned swimming pools in the middle of nowhere and selling three prints a year.',
          ago: 15 * HOUR + 10 * MINUTE,
          likes: 47,
        },
        {
          author: 'latenightlaundry',
          content: 'running a tiny bakery that only opens at 6am. no online orders. no branding. just bread.',
          ago: 13 * HOUR,
          likes: 39,
        },
        {
          author: null,
          content: 'writing terrible folk songs in a caravan and never uploading a single one.',
          ago: 10 * HOUR + 22 * MINUTE,
          likes: 26,
        },
      ],
    },
    {
      author: null,
      category: 'win',
      ago: 20 * HOUR,
      likes: 154,
      views: 580,
      content:
        "Six years ago I dropped out of night school because the maths terrified me. Last night I finished my final exam paper. I did not tell anyone in my family because I want to have the certificate in my hands first. I am telling a feed of strangers instead, and I think that is exactly the right audience for news like this.",
      comments: [
        {
          author: null,
          content: 'CERTIFICATE IN HAND FIRST is such a good instinct. congratulations, you absolute unit.',
          ago: 19 * HOUR,
          likes: 71,
        },
        {
          author: 'hummingbird_404',
          content: 'maths was terrifying and you went back anyway. that is the whole news story.',
          ago: 14 * HOUR,
          likes: 48,
        },
      ],
    },
    {
      author: null,
      category: 'media',
      ago: 1 * DAY + 3 * HOUR,
      likes: 143,
      views: 700,
      content:
        "Anonymous image sharing test, and honestly the best screenshot I have taken all month. My landlord's maintenance notice said the heating would be back 'shortly'. This is what the notice looked like when my neighbour taped it back to the wall. We have been without hot water for eleven days and somehow this made me laugh instead of cry.",
      image: seedArt({
        kicker: 'Anonymous media',
        headline: 'Shortly is a spectrum',
        footer: '11 days without hot water',
        bg: '#2563EB',
        fg: '#FFFFFF',
        accent: '#FACC15',
        pattern: 'stripes',
      }),
      comments: [
        {
          author: null,
          content: 'please frame it. honestly frame it.',
          ago: 1 * DAY,
          likes: 52,
        },
        {
          author: 'brickwall_radio',
          content: 'landlords communicate exclusively through ominous stationery and it needs to be studied.',
          ago: 20 * HOUR,
          likes: 37,
        },
      ],
    },
    {
      author: null,
      category: 'confession',
      ago: 1 * DAY + 9 * HOUR,
      likes: 137,
      views: 610,
      content:
        "I read my mother's old diaries last winter when we were clearing the house. In one entry from 1994 she writes that she is terrified of becoming boring. She is the least boring person I have ever met and she has never once heard me say it. I am writing it here anonymously because the version of me who says it to her face still has not shown up.",
      comments: [
        {
          author: null,
          content: 'tell her. tonight if you can. they keep forever but so does the not telling.',
          ago: 1 * DAY + 4 * HOUR,
          likes: 96,
        },
        {
          author: 'paper_orchid',
          content: 'the people who are terrified of being boring are never the boring ones. rules of physics.',
          ago: 1 * DAY,
          likes: 44,
        },
      ],
    },
    {
      author: 'Midnight Kettle',
      category: 'hottake',
      ago: 2 * DAY + 2 * HOUR,
      likes: 118,
      views: 520,
      content:
        "Anonymous micro-blogging is more honest than every feed with my name on it, and I can prove it with one number: on this board I have written eleven posts and deleted zero. Everywhere else I have drafted four hundred things this year and posted six. The difference is not bravery. It is simply the absence of an audience that remembers me.",
      comments: [
        {
          author: null,
          content: 'the absence of an audience that remembers me. oof. saving that line.',
          ago: 2 * DAY,
          likes: 58,
        },
        {
          author: null,
          content: 'anonymity is not a mask, it is a permission slip.',
          ago: 1 * DAY + 18 * HOUR,
          likes: 33,
        },
      ],
    },
    {
      author: null,
      category: 'secret',
      ago: 2 * DAY + 14 * HOUR,
      likes: 104,
      views: 470,
      content:
        "I quit the job everybody congratulated me for. My family still thinks I am going into that office on Tuesdays. In reality I take the train to a public library, sit by the window, and apply to smaller, stranger jobs that pay half as much. I have no savings plan and no backup and I have never felt more awake.",
      comments: [
        {
          author: null,
          content: 'library job-hunting era is actually elite. window seat AND free heating.',
          ago: 2 * DAY + 6 * HOUR,
          likes: 40,
        },
        {
          author: 'sundaygreen',
          content: 'half the money and twice the pulse. been there, would do again.',
          ago: 1 * DAY + 22 * HOUR,
          likes: 29,
        },
      ],
    },
    {
      author: null,
      category: 'rant',
      ago: 3 * DAY + 6 * HOUR,
      likes: 96,
      views: 430,
      content:
        "Public rants should be a civic utility. I said it. Everybody is walking around with a full tank of things they will never say out loud, and we are all being extremely normal about it in supermarkets. A confession board is not depressing, it is a pressure valve. Post the thing, breathe, go buy milk. Nothing exploded.",
      comments: [
        {
          author: null,
          content: 'pressure valve is exactly the right metaphor. post, breathe, buy milk. new motto.',
          ago: 3 * DAY,
          likes: 41,
        },
        {
          author: 'nickel_and_dime',
          content: 'cities would be 40% calmer if everyone had somewhere to scream anonymously at 2am.',
          ago: 2 * DAY + 20 * HOUR,
          likes: 27,
        },
      ],
    },
    {
      author: null,
      category: 'question',
      ago: 4 * DAY + 5 * HOUR,
      likes: 84,
      views: 390,
      content:
        'Community check: what is the one piece of advice you would give the version of yourself from five years ago, if that version had to actually receive it and not argue? Mine is "the thing you are waiting to feel ready for is not going to send you a notification."',
      comments: [
        {
          author: null,
          content: '"nobody is thinking about you as much as you think they are." changed my whole twenties.',
          ago: 4 * DAY,
          likes: 52,
        },
        {
          author: null,
          content: 'sleep is not a reward you earn at the end of the day. it is the fuel you start with.',
          ago: 3 * DAY + 12 * HOUR,
          likes: 31,
        },
      ],
    },
  ];
}

/** Materialise the seed specs into full Post records. */
export function createSeedPosts(now = Date.now()): Post[] {
  return buildSpecs().map((spec, index) => {
    const createdAt = now - spec.ago;
    const comments: PostComment[] = spec.comments.map((commentSpec, commentIndex) => ({
      id: `seed_c${index}_${commentIndex}`,
      author: commentSpec.author,
      content: commentSpec.content,
      createdAt: now - commentSpec.ago,
      likes: commentSpec.likes,
      likedByMe: false,
      mine: false,
    }));

    return {
      id: `seed_p${index}`,
      author: spec.author,
      content: spec.content,
      category: spec.category,
      image: spec.image ?? null,
      createdAt,
      likes: spec.likes,
      likedByMe: false,
      comments,
      mine: false,
      hidden: false,
      pinned: spec.pinned ?? false,
      views: spec.views,
    } satisfies Post;
  });
}

/** Handle used when a seed visitor signs a post themselves. */
export const SEED_FALLBACK_HANDLE = GHOST_HANDLE;
