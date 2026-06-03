import {
  Calculator,
  FlaskConical,
  Droplet,
  Waves,
  Thermometer,
  Beaker,
  Timer,
  Zap,
  type LucideIcon,
} from 'lucide-react';

/**
 * Central registry of every tool on the site. Source of truth for:
 *  - the homepage tools grid
 *  - "related tools" cross-links on each tool page (internal linking = SEO)
 *  - the sitemap (only `status: 'live'` tools are prerendered/indexed)
 *
 * Add a tool here, build its page + route, flip `status` to 'live'.
 */
export type ToolStatus = 'live' | 'soon';

export type Tool = {
  /** Route path (also the canonical path, with a trailing slash appended). */
  path: string;
  /** Short title for cards/nav. */
  title: string;
  /** One-line value prop for cards + meta descriptions. */
  blurb: string;
  icon: LucideIcon;
  status: ToolStatus;
};

export const TOOLS: Tool[] = [
  {
    path: '/pool-volume-calculator',
    title: 'Pool Volume Calculator',
    blurb:
      'How many gallons (or liters) your pool holds — any shape, sloped depths, spas included. The number you need before dosing anything.',
    icon: Calculator,
    status: 'live',
  },
  {
    path: '/chlorine-calculator',
    title: 'Chlorine Calculator',
    blurb: 'How much liquid chlorine, bleach, or shock to add to hit your target free chlorine.',
    icon: FlaskConical,
    status: 'live',
  },
  {
    path: '/pool-shock-calculator',
    title: 'Pool Shock Calculator',
    blurb: 'Exactly how much shock to add to clear algae or chloramines — CYA-aware shock levels, any pool size.',
    icon: Zap,
    status: 'live',
  },
  {
    path: '/cya-calculator',
    title: 'CYA / Stabilizer Calculator',
    blurb: 'Dial in cyanuric acid and the ideal FC/CYA ratio so your chlorine actually works.',
    icon: Droplet,
    status: 'live',
  },
  {
    path: '/salt-calculator',
    title: 'Salt Calculator',
    blurb: 'How much salt to add to reach your salt-chlorine generator’s target level.',
    icon: Waves,
    status: 'live',
  },
  {
    path: '/pool-heating-cost-calculator',
    title: 'Pool Heating Cost Calculator',
    blurb: 'Estimate the cost and time to heat your pool — gas heater vs. electric heat pump.',
    icon: Thermometer,
    status: 'live',
  },
  {
    path: '/lsi-calculator',
    title: 'Water Balance (LSI) Calculator',
    blurb: 'Check your Langelier Saturation Index so water isn’t scaling or corroding.',
    icon: Beaker,
    status: 'live',
  },
  {
    path: '/pool-pump-runtime-calculator',
    title: 'Pump Runtime Calculator',
    blurb: 'How many hours a day to run your pump for a full turnover — and what it costs.',
    icon: Timer,
    status: 'live',
  },
];

export const LIVE_TOOLS = TOOLS.filter((t) => t.status === 'live');

/** Tools other than the given path, live ones first — for "related tools". */
export const relatedTools = (currentPath: string, limit = 3): Tool[] => {
  const others = TOOLS.filter((t) => t.path !== currentPath);
  return [...others].sort((a, b) => Number(b.status === 'live') - Number(a.status === 'live')).slice(0, limit);
};
