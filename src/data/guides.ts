/**
 * Registry for the /guides content section. Source of truth for the guides hub,
 * the sitemap, and guide-to-guide links. Kept deliberately separate from the
 * tools registry and the tool pages — importing this only happens inside the
 * /guides chunk, so the calculators never load guide code.
 */
export type GuideStatus = 'live' | 'soon';

export interface Guide {
  slug: string;
  path: string;
  title: string;
  /** Short title for cards/nav. */
  shortTitle: string;
  excerpt: string;
  /** ISO date — shown as "Updated …" and used for Article schema. */
  updated: string;
  status: GuideStatus;
}

export const GUIDES: Guide[] = [
  {
    slug: 'how-to-fix-a-green-pool',
    path: '/guides/how-to-fix-a-green-pool',
    title: 'How to Fix a Green Pool Fast',
    shortTitle: 'Fixing a green pool',
    excerpt:
      'A green pool is an algae bloom — and chlorine at the right shock level for your CYA is what kills it. The step-by-step rescue with exact doses, how long each shade of green takes, and why “high chlorine but still green” happens.',
    updated: '2026-06-11',
    status: 'live',
  },
  {
    slug: 'how-to-drain-a-pool-with-a-garden-hose',
    path: '/guides/how-to-drain-a-pool-with-a-garden-hose',
    title: 'How to Drain a Pool With a Garden Hose (Siphon Method)',
    shortTitle: 'Draining with a hose',
    excerpt:
      'Partially drain your pool the free way — a garden-hose siphon, step by step with diagrams. Plus the one mistake that can wreck a pool: never fully drain it and leave it empty.',
    updated: '2026-06-11',
    status: 'live',
  },
  {
    slug: 'how-long-after-shocking-pool-can-you-swim',
    path: '/guides/how-long-after-shocking-pool-can-you-swim',
    title: 'How Long After Shocking a Pool Can You Swim?',
    shortTitle: 'Swim after shocking',
    excerpt:
      'The honest answer is a test reading, not a clock: swim once free chlorine is back at or below 5 ppm and you can see the bottom — usually 8–24 hours. Wait times by shock type, and the three checks before anyone gets in.',
    updated: '2026-06-11',
    status: 'live',
  },
  {
    slug: 'cyanuric-acid-and-chlorine',
    path: '/guides/cyanuric-acid-and-chlorine',
    title: 'Cyanuric Acid & Chlorine: the FC/CYA Relationship Explained',
    shortTitle: 'Cyanuric acid & chlorine',
    excerpt:
      'Why stabilizer makes chlorine last in the sun — and why too much makes it stop working. The free-chlorine-to-CYA ratio, in plain English.',
    updated: '2026-06-01',
    status: 'live',
  },
  {
    slug: 'ideal-pool-chemistry-levels',
    path: '/guides/ideal-pool-chemistry-levels',
    title: 'Ideal Pool Chemistry Levels (and Why They Matter)',
    shortTitle: 'Ideal pool levels',
    excerpt: 'Target ranges for chlorine, pH, alkalinity, CYA, calcium, and salt — and what happens when each drifts.',
    updated: '2026-06-01',
    status: 'soon',
  },
  {
    slug: 'why-wont-my-pool-hold-chlorine',
    path: '/guides/why-wont-my-pool-hold-chlorine',
    title: 'Why Won’t My Pool Hold Chlorine? (Causes & Fixes)',
    shortTitle: 'Pool won’t hold chlorine',
    excerpt:
      'The usual culprit is cyanuric acid: too little and sunlight burns chlorine off in hours, too much and it goes sluggish. How to tell which — plus algae and high chlorine demand — and the fix.',
    updated: '2026-06-01',
    status: 'soon',
  },
  {
    slug: 'how-to-lower-cyanuric-acid',
    path: '/guides/how-to-lower-cyanuric-acid',
    title: 'How to Lower Cyanuric Acid in a Pool',
    shortTitle: 'Lowering CYA',
    excerpt: 'Why no chemical removes CYA, and exactly how much water to drain to bring it back into range.',
    updated: '2026-06-01',
    status: 'soon',
  },
];

export const LIVE_GUIDES = GUIDES.filter((g) => g.status === 'live');

/** Other guides (live first) for "related reading". */
export const relatedGuides = (currentPath: string, limit = 3): Guide[] =>
  [...GUIDES.filter((g) => g.path !== currentPath)]
    .sort((a, b) => Number(b.status === 'live') - Number(a.status === 'live'))
    .slice(0, limit);
