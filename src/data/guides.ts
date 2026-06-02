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
    slug: 'why-chlorine-disappears-in-the-sun',
    path: '/guides/why-chlorine-disappears-in-the-sun',
    title: 'Why Your Chlorine Disappears in the Sun',
    shortTitle: 'Chlorine & sunlight',
    excerpt: 'UV destroys unprotected chlorine in minutes. Here’s the science and the fix.',
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
