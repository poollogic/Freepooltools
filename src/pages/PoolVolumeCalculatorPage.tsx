import React, { useEffect, useMemo, useState } from 'react';
import { m, AnimatePresence } from 'motion/react';
import {
  Calculator,
  Square,
  Circle,
  Egg,
  Droplet,
  Shapes,
  Pill,
  Hexagon,
  Octagon,
  Plus,
  Trash2,
  Check,
  Info,
  Ruler,
  Layers,
  Maximize2,
  Save,
  FlaskConical,
  ArrowRight,
  Code2,
  Copy,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ShareButton } from '@/components/ShareButton';
import { RelatedTools } from '@/components/RelatedTools';
import { usePageMeta } from '@/lib/usePageMeta';
import { SITE_ORIGIN } from '@/lib/site';
import { saveProfile } from '@/lib/poolProfile';

// ── constants ─────────────────────────────────────────────────────
const GAL_PER_CUFT = 7.48052;
const L_PER_GAL = 3.78541;
const FT_PER_M = 3.28084;

// Top-level calculator mode. Picks which structures we ask about and what
// the result represents.
type CalcMode = 'pool' | 'pool+spa' | 'spa';

type Shape = 'rectangle' | 'round' | 'oval' | 'kidney' | 'roman' | 'grecian' | 'octagon' | 'freeform';
type LenUnit = 'ft' | 'm';
type VolUnit = 'gal' | 'L';
type DepthMode = 'avg' | 'sections';
type FreeformSectionShape = 'rectangle' | 'round';

interface FreeformSection {
  id: string;
  shape: FreeformSectionShape;
  length: string;
  width: string;
  diameter: string;
  depth: string;
}

const SHAPES: { id: Shape; label: string; icon: typeof Square }[] = [
  { id: 'rectangle', label: 'Rectangle', icon: Square },
  { id: 'round', label: 'Round', icon: Circle },
  { id: 'oval', label: 'Oval', icon: Egg },
  { id: 'kidney', label: 'Kidney', icon: Droplet },
  { id: 'roman', label: 'Roman', icon: Pill },
  { id: 'grecian', label: 'Grecian', icon: Hexagon },
  { id: 'octagon', label: 'Octagon', icon: Octagon },
  { id: 'freeform', label: 'Freeform', icon: Shapes },
];

// HowTo JSON-LD — covers every step a homeowner takes.
const howToSchema = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'How to calculate your swimming pool volume in gallons',
  description:
    'Estimate how many gallons of water your swimming pool holds using its shape, dimensions, and average depth — including rectangle, round, oval, kidney, Roman, Grecian, octagon, and freeform pools.',
  step: [
    { '@type': 'HowToStep', position: 1, name: 'Pick your pool shape', text: 'Choose rectangle, round, oval, kidney, Roman, Grecian, octagon, or freeform.' },
    { '@type': 'HowToStep', position: 2, name: 'Enter the dimensions', text: 'Enter length and width (or diameter) in feet or meters.' },
    { '@type': 'HowToStep', position: 3, name: 'Enter the depth', text: 'Use a single average depth, or enter shallow- and deep-end depths to auto-average.' },
    { '@type': 'HowToStep', position: 4, name: 'Read your volume', text: 'The calculator estimates your pool volume in gallons or liters.' },
  ],
};

// Common-questions content. Used both for the on-page section AND the
// FAQPage JSON-LD below — single source of truth.
const COMMON_QUESTIONS: { q: string; a: string }[] = [
  {
    q: 'How many gallons in a 16 × 32 pool?',
    a: 'A 16-by-32-foot rectangular pool holds roughly 19,150 gallons at an average depth of 5 feet, or about 23,000 gallons at 6 feet of average depth. Depth makes the biggest difference: every extra foot of average depth adds about 16 × 32 × 7.48 = 3,830 gallons.',
  },
  {
    q: "How do I measure my pool's average depth?",
    a: 'If your pool has a sloped bottom, add the shallow-end depth and the deep-end depth, then divide by two. That gives you the average for a uniform slope. For pools with a flat shallow section, a sloped middle, and a flat deep end, the sloped-sections mode in this calculator handles the geometry more precisely — measure each section length and the two depths.',
  },
  {
    q: 'How many gallons is a typical residential pool?',
    a: "Most in-ground residential pools in the US hold between 15,000 and 30,000 gallons. A common 16 × 32 with a 3-foot to 8-foot slope lands around 21,000 gallons. Above-ground pools are smaller: a 24-foot round above-ground pool at 4 feet deep is about 13,500 gallons.",
  },
  {
    q: 'How is a spa or hot tub different from a pool for volume?',
    a: "Spas and hot tubs are much smaller — most residential spas hold 300 to 1,000 gallons. The math is the same (cylinder or rectangular box), but spas often have a seat or step bench that takes up water space. Use the 'Spa has a seat / step bench' option in this calculator to subtract that bench from the footwell volume automatically.",
  },
  {
    q: 'How do I convert gallons to liters?',
    a: 'Multiply gallons by 3.785 to get liters. So a 20,000-gallon pool is about 75,700 liters. This calculator displays both — just toggle "Gallons" or "Liters" at the top.',
  },
  {
    q: 'Why does my pool volume matter so much for chemicals?',
    a: 'Almost every pool-chemistry dose is “add X amount per 10,000 gallons,” so your volume is the multiplier behind every calculation. Guess too high and you under-dose and never reach your target; guess too low and you over-dose, waste chemicals, and can push levels into an unsafe range. Getting an accurate gallon figure once, here, makes every later result — chlorine, salt, alkalinity, acid, calcium — correct. That is why we recommend finding your volume first, then carrying that number into the dosing calculators.',
  },
  {
    q: 'How accurate is a pool volume calculator?',
    a: 'For a standard rectangle, round, or oval with a uniform slope, a calculator is accurate to within a few percent — easily good enough for dosing. The main source of error is average depth, not the surface dimensions, so measure your shallow and deep ends carefully. Free-form and kidney-shaped pools are the hardest to estimate; for those, approximate the shape with the closest option and break unusual sections into pieces. When in doubt, round volume up slightly rather than down so you do not under-treat the water.',
  },
  {
    q: 'How many gallons is a round above-ground pool?',
    a: 'For a round pool, gallons = diameter × diameter × average depth × 5.9 (with all measurements in feet). A 24-foot round pool at 4 feet deep holds about 13,500 gallons; a 27-foot round at 4.5 feet is roughly 19,300 gallons; a smaller 15-foot round at 3.5 feet is around 4,650 gallons. Select the round shape above and enter your diameter and wall height to get the exact figure for your pool.',
  },
];

const faqPageSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: COMMON_QUESTIONS.map((item) => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: { '@type': 'Answer', text: item.a },
  })),
};

// Breadcrumb (Home › Pool Volume Calculator) — helps Google render a breadcrumb
// trail in the SERP instead of the raw URL.
const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Free Pool Tools', item: SITE_ORIGIN + '/' },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Pool Volume Calculator',
      item: SITE_ORIGIN + '/pool-volume-calculator/',
    },
  ],
};

// ── helpers ───────────────────────────────────────────────────────
const num = (v: string) => {
  const n = parseFloat(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

const toFeet = (v: number, unit: LenUnit) => (unit === 'm' ? v * FT_PER_M : v);

// Volume (gallons) for a single shape from raw input strings (in user's unit).
const volumeGallons = (
  shape: Exclude<Shape, 'freeform'> | FreeformSectionShape,
  inputs: { length?: string; width?: string; diameter?: string; depth: string },
  unit: LenUnit,
) => {
  const d = toFeet(num(inputs.depth), unit);
  if (!d) return 0;
  let area = 0;
  if (shape === 'rectangle') {
    area = toFeet(num(inputs.length || ''), unit) * toFeet(num(inputs.width || ''), unit);
  } else if (shape === 'round') {
    const r = toFeet(num(inputs.diameter || ''), unit) / 2;
    area = Math.PI * r * r;
  } else if (shape === 'oval') {
    area =
      Math.PI *
      (toFeet(num(inputs.length || ''), unit) / 2) *
      (toFeet(num(inputs.width || ''), unit) / 2);
  } else if (shape === 'kidney') {
    // Industry formula: 0.45 × (A + B) × L × depth, where A and B are the two
    // bulge widths and L is the overall length. We map length=L, width=A,
    // and the second width is captured separately in inputs.diameter.
    const A = toFeet(num(inputs.width || ''), unit);
    const B = toFeet(num(inputs.diameter || ''), unit);
    const L = toFeet(num(inputs.length || ''), unit);
    return 0.45 * (A + B) * L * d * GAL_PER_CUFT;
  } else if (shape === 'roman') {
    // Stadium shape: a central rectangle (L − W) × W with a semicircle of
    // radius W/2 on each end — the two ends together make a full circle of
    // diameter W. L is the overall tip-to-tip length, W the width.
    const L = toFeet(num(inputs.length || ''), unit);
    const W = toFeet(num(inputs.width || ''), unit);
    const straight = Math.max(0, L - W);
    area = straight * W + Math.PI * (W / 2) * (W / 2);
  } else if (shape === 'grecian') {
    // Rectangle with the four corners cut at 45°. Each cut removes a right
    // triangle with legs = c, so total removed area = 4 × (c²/2) = 2c². The
    // corner-cut size c is captured in inputs.diameter.
    const L = toFeet(num(inputs.length || ''), unit);
    const W = toFeet(num(inputs.width || ''), unit);
    const c = toFeet(num(inputs.diameter || ''), unit);
    area = Math.max(0, L * W - 2 * c * c);
  } else if (shape === 'octagon') {
    // Regular octagon measured by its width across the flats (W):
    // area = 2(√2 − 1) × W². W is captured in inputs.diameter.
    const W = toFeet(num(inputs.diameter || ''), unit);
    area = 2 * (Math.SQRT2 - 1) * W * W;
  }
  return area > 0 ? area * d * GAL_PER_CUFT : 0;
};

// Sloped-sections model: a pool modeled along its main axis as a shallow flat
// + slope wedge + deep flat. The wedge averages to the midpoint of its two
// depths, so the LENGTH-WEIGHTED AVERAGE depth over the axis is
//   (Ls·Ds + Lslope·(Ds+Dd)/2 + Ld·Dd) / axisLen.
// Multiplying that average by the shape's real surface area gives volume — the
// same prismatic assumption the rectangle uses, generalized to any shape with a
// single deep-end axis (round/oval/grecian/octagon). All lengths in feet.
const sectionsAvgDepthFt = (
  axisLenFt: number,
  shallowLenFt: number,
  deepLenFt: number,
  shallowDepthFt: number,
  deepDepthFt: number,
) => {
  if (!axisLenFt || !shallowDepthFt || !deepDepthFt) return 0;
  const Ls = Math.max(0, Math.min(shallowLenFt, axisLenFt));
  const Ld = Math.max(0, Math.min(deepLenFt, axisLenFt - Ls));
  const Lslope = Math.max(0, axisLenFt - Ls - Ld);
  const wedgeAvg = (shallowDepthFt + deepDepthFt) / 2;
  return (Ls * shallowDepthFt + Lslope * wedgeAvg + Ld * deepDepthFt) / axisLenFt;
};

// Shapes that support the sloped-sections model: those with a single, clear
// deep-end axis. Kidney/roman (irregular footprints) and freeform (its own
// multi-section model) are excluded — they offer Average depth only.
const SECTIONS_SHAPES: Shape[] = ['rectangle', 'round', 'oval', 'grecian', 'octagon'];
const shapeSupportsSections = (s: Shape) => SECTIONS_SHAPES.includes(s);

const formatGallons = (g: number, unit: VolUnit) =>
  Math.round(unit === 'L' ? g * L_PER_GAL : g).toLocaleString('en-US');

const newSection = (): FreeformSection => ({
  id: Math.random().toString(36).slice(2, 8),
  shape: 'rectangle',
  length: '',
  width: '',
  diameter: '',
  depth: '',
});

// Common pool sizes table (always in feet/gallons; we convert on display).
const REFERENCE_SIZES = [
  { shape: 'Rectangle' as const, size: '10 × 20 × 5 ft', gallons: 7480 },
  { shape: 'Rectangle' as const, size: '12 × 24 × 5 ft', gallons: 10771 },
  { shape: 'Rectangle' as const, size: '14 × 28 × 5 ft', gallons: 14661 },
  { shape: 'Rectangle' as const, size: '16 × 32 × 5 ft', gallons: 19149 },
  { shape: 'Rectangle' as const, size: '16 × 32 × 6 ft', gallons: 22979 },
  { shape: 'Rectangle' as const, size: '20 × 40 × 5 ft', gallons: 29922 },
  { shape: 'Round' as const, size: '15 ft Ø × 4 ft', gallons: 5288 },
  { shape: 'Round' as const, size: '18 ft Ø × 4 ft', gallons: 7615 },
  { shape: 'Round' as const, size: '24 ft Ø × 4 ft', gallons: 13540 },
  { shape: 'Round' as const, size: '27 ft Ø × 4 ft', gallons: 17137 },
  { shape: 'Oval' as const, size: '15 × 30 × 4 ft', gallons: 10579 },
  { shape: 'Oval' as const, size: '18 × 33 × 4 ft', gallons: 13961 },
];

// ── styles ────────────────────────────────────────────────────────
const fieldClass =
  'w-full rounded-xl border border-line bg-card-2 px-4 py-3 text-fg text-[15px] placeholder-subtle focus:outline-none focus:border-brand-blue/60 focus:ring-2 focus:ring-brand-blue/30 transition';
const labelClass = 'block text-sm font-semibold text-muted mb-1.5';

// ── shape diagrams (inline SVGs) ──────────────────────────────────
const DIAGRAMS: Record<Exclude<Shape, 'freeform'>, React.ReactElement> = {
  rectangle: (
    <svg viewBox="0 0 200 110" className="w-full h-auto">
      <rect x="20" y="20" width="160" height="70" rx="6" fill="rgba(255,114,15,0.10)" stroke="#ff720f" strokeWidth="2" />
      <text x="100" y="60" textAnchor="middle" fontSize="11" fill="#9ca3af">Length × Width</text>
      <text x="100" y="105" textAnchor="middle" fontSize="10" fill="#6b7280">L</text>
      <text x="10" y="58" textAnchor="middle" fontSize="10" fill="#6b7280">W</text>
    </svg>
  ),
  round: (
    <svg viewBox="0 0 200 110" className="w-full h-auto">
      <circle cx="100" cy="55" r="44" fill="rgba(255,114,15,0.10)" stroke="#ff720f" strokeWidth="2" />
      <line x1="56" y1="55" x2="144" y2="55" stroke="#6b7280" strokeDasharray="3 3" />
      <text x="100" y="105" textAnchor="middle" fontSize="10" fill="#9ca3af">Diameter (Ø)</text>
    </svg>
  ),
  oval: (
    <svg viewBox="0 0 200 110" className="w-full h-auto">
      <ellipse cx="100" cy="55" rx="76" ry="34" fill="rgba(255,114,15,0.10)" stroke="#ff720f" strokeWidth="2" />
      <text x="100" y="59" textAnchor="middle" fontSize="11" fill="#9ca3af">Length × Width</text>
    </svg>
  ),
  kidney: (
    <svg viewBox="0 0 200 110" className="w-full h-auto">
      <path
        d="M 30 55 Q 30 15, 80 20 Q 110 25, 120 50 Q 130 30, 170 35 Q 195 55, 170 80 Q 130 95, 105 80 Q 80 95, 55 90 Q 30 85, 30 55 Z"
        fill="rgba(255,114,15,0.10)"
        stroke="#ff720f"
        strokeWidth="2"
      />
      <text x="60" y="58" textAnchor="middle" fontSize="9" fill="#9ca3af">A</text>
      <text x="160" y="58" textAnchor="middle" fontSize="9" fill="#9ca3af">B</text>
      <text x="100" y="105" textAnchor="middle" fontSize="10" fill="#9ca3af">Length (L)</text>
    </svg>
  ),
  roman: (
    <svg viewBox="0 0 200 110" className="w-full h-auto">
      {/* Stadium: rectangle body with semicircular ends. */}
      <rect x="20" y="25" width="160" height="60" rx="30" fill="rgba(255,114,15,0.10)" stroke="#ff720f" strokeWidth="2" />
      <text x="100" y="58" textAnchor="middle" fontSize="11" fill="#9ca3af">Length × Width</text>
      <text x="100" y="105" textAnchor="middle" fontSize="10" fill="#6b7280">Rounded ends</text>
    </svg>
  ),
  grecian: (
    <svg viewBox="0 0 200 110" className="w-full h-auto">
      {/* Rectangle with the four corners cut at 45°. */}
      <polygon
        points="40,20 160,20 180,40 180,70 160,90 40,90 20,70 20,40"
        fill="rgba(255,114,15,0.10)"
        stroke="#ff720f"
        strokeWidth="2"
      />
      <text x="100" y="58" textAnchor="middle" fontSize="11" fill="#9ca3af">Length × Width</text>
      <text x="100" y="105" textAnchor="middle" fontSize="10" fill="#6b7280">Cut corners (c)</text>
    </svg>
  ),
  octagon: (
    <svg viewBox="0 0 200 110" className="w-full h-auto">
      <polygon
        points="58,20 142,20 170,40 170,70 142,90 58,90 30,70 30,40"
        fill="rgba(255,114,15,0.10)"
        stroke="#ff720f"
        strokeWidth="2"
      />
      <line x1="30" y1="55" x2="170" y2="55" stroke="#6b7280" strokeDasharray="3 3" />
      <text x="100" y="105" textAnchor="middle" fontSize="10" fill="#9ca3af">Width across flats</text>
    </svg>
  ),
};

// ── Sloped-section side-profile diagram with draggable handles ────
// Renders a side view of the pool (waterline + bottom contour). Two handles
// mark where the shallow flat ends and where the deep flat begins. Drag uses
// pointer events so it works on mouse + touch. All values are in feet.
type SlopeProfileProps = {
  totalLenFt: number;
  shallowLenFt: number;
  deepLenFt: number;
  shallowDepthFt: number;
  deepDepthFt: number;
  unitLabel: string;
  onChange: (shallowLenFt: number, deepLenFt: number) => void;
  /** When true, overlay an animated cursor hint sweeping between the two
      handles to signal that they're draggable. The parent dismisses it on
      first interaction or after a timeout. */
  showHint?: boolean;
  /** Called when the user starts dragging a handle — parent dismisses hint. */
  onInteract?: () => void;
};

const SlopeProfile: React.FC<SlopeProfileProps> = ({
  totalLenFt,
  shallowLenFt,
  deepLenFt,
  shallowDepthFt,
  deepDepthFt,
  unitLabel,
  onChange,
  showHint = false,
  onInteract,
}) => {
  const svgRef = React.useRef<SVGSVGElement | null>(null);
  const VB_W = 600;
  const VB_H = 260;
  const PAD_X = 40;
  const POOL_TOP = 60;
  const POOL_BOTTOM_MAX = 230;
  const innerW = VB_W - PAD_X * 2;
  const maxDepth = Math.max(shallowDepthFt, deepDepthFt, 1);
  const depthToY = (d: number) => POOL_TOP + (d / maxDepth) * (POOL_BOTTOM_MAX - POOL_TOP);

  // Map ft → SVG x.
  const ftToX = (ft: number) => PAD_X + (totalLenFt > 0 ? (ft / totalLenFt) * innerW : 0);
  const xToFt = (x: number) => (totalLenFt > 0 ? ((x - PAD_X) / innerW) * totalLenFt : 0);

  const shallowEndX = ftToX(shallowLenFt);
  const deepStartX = ftToX(totalLenFt - deepLenFt);
  const yShallow = depthToY(shallowDepthFt);
  const yDeep = depthToY(deepDepthFt);

  // Active-drag state. Captured on pointer-down and held in a ref so the
  // window-level listeners below read it without re-binding each render.
  // `total` and `other` (the non-dragged handle) don't change during a single
  // drag, so capturing them once avoids any stale-closure math.
  const draggingRef = React.useRef<{
    which: 'shallow' | 'deep';
    /** ft between where the finger grabbed and the handle's actual position —
        applied during the drag so the handle tracks the finger relatively (no
        jump when you grab the strip a little off-center from the dot). */
    grabOffsetFt: number;
    total: number;
    other: number;
  } | null>(null);

  // `onChange` can change identity between renders; keep the latest in a ref so
  // the once-bound window listeners never call a stale closure.
  const onChangeRef = React.useRef(onChange);
  onChangeRef.current = onChange;

  const clientXToFt = (clientX: number, total: number) => {
    const rect = svgRef.current!.getBoundingClientRect();
    const svgX = ((clientX - rect.left) / rect.width) * VB_W;
    return total > 0 ? ((svgX - PAD_X) / innerW) * total : 0;
  };

  // Bound to `window` for the duration of a drag (see onPointerDown) rather than
  // relying on the SVG's own pointer handlers + setPointerCapture, which is
  // unreliable on iOS Safari: capture on SVG elements can drop mid-gesture, so
  // the handle "stuck" until you lifted and re-tapped. window listeners always
  // fire, so the drag is continuous.
  const handleWindowMove = React.useCallback((e: PointerEvent) => {
    const d = draggingRef.current;
    if (!d || !svgRef.current) return;
    const ft = Math.max(0, Math.min(d.total, clientXToFt(e.clientX, d.total) + d.grabOffsetFt));
    if (d.which === 'shallow') {
      const maxLs = Math.max(0, d.total - d.other);
      onChangeRef.current(Math.min(ft, maxLs), d.other);
    } else {
      const ld = Math.max(0, Math.min(d.total - ft, d.total - d.other));
      onChangeRef.current(d.other, ld);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Only attached during an active drag, so it can unconditionally
  // preventDefault to stop iOS treating the drag as a page scroll/rubber-band.
  // (touch-action:none is unreliable on SVG in WebKit, and React's onTouchMove
  // is passive so it can't preventDefault — we attach this natively.)
  const blockScroll = React.useCallback((e: TouchEvent) => {
    e.preventDefault();
  }, []);

  const endDrag = React.useCallback(() => {
    draggingRef.current = null;
    window.removeEventListener('pointermove', handleWindowMove);
    window.removeEventListener('pointerup', endDrag);
    window.removeEventListener('pointercancel', endDrag);
    document.removeEventListener('touchmove', blockScroll);
  }, [handleWindowMove, blockScroll]);

  const onPointerDown = (which: 'shallow' | 'deep') => (e: React.PointerEvent) => {
    if (!svgRef.current) return;
    e.preventDefault();
    const handleFt = which === 'shallow' ? shallowLenFt : totalLenFt - deepLenFt;
    draggingRef.current = {
      which,
      grabOffsetFt: handleFt - clientXToFt(e.clientX, totalLenFt),
      total: totalLenFt,
      other: which === 'shallow' ? deepLenFt : shallowLenFt,
    };
    onInteract?.();
    window.addEventListener('pointermove', handleWindowMove);
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);
    document.addEventListener('touchmove', blockScroll, { passive: false });
  };

  // Clean up listeners if the component unmounts mid-drag.
  React.useEffect(() => endDrag, [endDrag]);

  // Pool outline path — reused for the water fill AND as a clip so the ripple
  // texture never spills outside the water.
  const poolPath = `M ${PAD_X} ${POOL_TOP} L ${VB_W - PAD_X} ${POOL_TOP} L ${VB_W - PAD_X} ${yDeep} L ${deepStartX} ${yDeep} L ${shallowEndX} ${yShallow} L ${PAD_X} ${yShallow} Z`;
  // A wavy horizontal line at depth `y` with its own amplitude, wavelength
  // (seg) and phase offset, so stacked lines read as organic ripples rather
  // than identical sine waves. Drawn full-width; the poolClip trims it.
  const wave = (y: number, amp: number, seg: number, phase: number) => {
    let x = PAD_X - seg + (phase % seg);
    let d = `M ${x.toFixed(1)} ${y.toFixed(1)} q ${(seg / 2).toFixed(1)} ${(-amp).toFixed(1)} ${seg.toFixed(1)} 0`;
    for (x += seg; x < VB_W - PAD_X + seg; x += seg) d += ` t ${seg.toFixed(1)} 0`;
    return d;
  };
  // Deterministic pseudo-random ripple set (stable across renders + SSR): many
  // lines with varied amplitude / wavelength / phase / opacity for a natural,
  // non-repeating water texture.
  const ripples = useMemo(() => {
    let s = 9;
    const rnd = () => ((s = (s * 9301 + 49297) % 233280), s / 233280);
    return Array.from({ length: 11 }, (_, i) => ({
      d: wave(POOL_TOP + 20 + i * 14 + rnd() * 7, 2.5 + rnd() * 6, 40 + rnd() * 48, rnd() * 96),
      opacity: Math.max(0.05, 0.26 - i * 0.018),
      w: 1 + rnd() * 0.8,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      role="img"
      aria-label="Pool side profile — drag the handles to set the shallow and deep sections"
      className="w-full h-auto touch-none select-none"
      style={{ touchAction: 'none' }}
    >
      <defs>
        {/* Water body: a deep blue, darkening toward the floor for depth. */}
        <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2a7ab4" stopOpacity="0.62" />
          <stop offset="45%" stopColor="#124f82" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#06294c" stopOpacity="0.85" />
        </linearGradient>
        {/* Surface sheen fading down from the waterline. */}
        <linearGradient id="surfaceSheen" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#cdeeff" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#cdeeff" stopOpacity="0" />
        </linearGradient>
        <clipPath id="poolClip">
          <path d={poolPath} />
        </clipPath>
      </defs>

      {/* Water body */}
      <path d={poolPath} fill="url(#waterGrad)" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" />

      {/* Water texture (clipped to the pool): a surface sheen + shimmering
          caustic ripples so it reads as water. The shimmer is a slow opacity
          pulse (no transform), so it's cheap and survives the mobile motion
          safety net; disabled under prefers-reduced-motion. */}
      <g clipPath="url(#poolClip)">
        <rect x={PAD_X} y={POOL_TOP} width={innerW} height="16" fill="url(#surfaceSheen)" />
        <g className="water-ripple" stroke="#cfeeff" fill="none" strokeLinecap="round">
          {ripples.map((r, i) => (
            <path key={i} d={r.d} opacity={r.opacity} strokeWidth={r.w} />
          ))}
        </g>
      </g>

      {/* Waterline */}
      <line x1={PAD_X} y1={POOL_TOP} x2={VB_W - PAD_X} y2={POOL_TOP} stroke="#7fc4ee" strokeWidth="2" />

      {/* Section dividers — drawn ON TOP of the water so the shallow/slope/deep
          boundaries stay clearly visible. */}
      <line x1={shallowEndX} y1={POOL_TOP} x2={shallowEndX} y2={yShallow} stroke="rgba(255,255,255,0.6)" strokeWidth="2.5" strokeDasharray="5 4" />
      <line x1={deepStartX} y1={POOL_TOP} x2={deepStartX} y2={yDeep} stroke="rgba(255,255,255,0.6)" strokeWidth="2.5" strokeDasharray="5 4" />

      {/* Depth labels */}
      <g fontFamily="ui-sans-serif, system-ui" fontSize="13" fill="#e5e7eb">
        <rect x={PAD_X + 12} y={POOL_TOP + (yShallow - POOL_TOP) / 2 - 12} width="46" height="22" rx="4" fill="#1669AE" />
        <text x={PAD_X + 35} y={POOL_TOP + (yShallow - POOL_TOP) / 2 + 4} textAnchor="middle" fontWeight="600">
          {shallowDepthFt.toFixed(1)}'
        </text>
        <rect x={VB_W - PAD_X - 58} y={POOL_TOP + (yDeep - POOL_TOP) / 2 - 12} width="46" height="22" rx="4" fill="#1669AE" />
        <text x={VB_W - PAD_X - 35} y={POOL_TOP + (yDeep - POOL_TOP) / 2 + 4} textAnchor="middle" fontWeight="600">
          {deepDepthFt.toFixed(1)}'
        </text>
      </g>

      {/* (Section length readouts now live in HTML ABOVE the diagram — they were
          unreadable down here and got covered by the finger while dragging.) */}

      {/* Draggable handles. The hit target is a TALL invisible strip spanning the
          full pool height at each handle's x — so on touch you can grab the
          divider line anywhere down its length, not just the small dot (which
          shrinks to ~20px once the SVG scales down on a phone). The visible knob
          (halo + dot + grip) is pointer-transparent so it never blocks the strip. */}
      {(() => {
        const HIT_W = 72; // ~34px wide on a phone — a comfortable touch target
        const stripY = POOL_TOP - 28;
        const stripH = POOL_BOTTOM_MAX - POOL_TOP + 46;
        const knob = (x: number) => (
          <g pointerEvents="none">
            <circle cx={x} cy={POOL_TOP} r="17" fill="#ff720f" opacity="0.16" />
            <circle cx={x} cy={POOL_TOP} r="10" fill="#ff720f" stroke="white" strokeWidth="2.5" />
            {/* tiny vertical grip to read as draggable */}
            <line x1={x} y1={POOL_TOP - 3.5} x2={x} y2={POOL_TOP + 3.5} stroke="white" strokeWidth="1.6" strokeLinecap="round" opacity="0.9" />
          </g>
        );
        return (
          <g style={{ cursor: 'ew-resize' }}>
            <rect
              x={shallowEndX - HIT_W / 2}
              y={stripY}
              width={HIT_W}
              height={stripH}
              fill="transparent"
              onPointerDown={onPointerDown('shallow')}
            />
            <rect
              x={deepStartX - HIT_W / 2}
              y={stripY}
              width={HIT_W}
              height={stripH}
              fill="transparent"
              onPointerDown={onPointerDown('deep')}
            />
            {knob(shallowEndX)}
            {knob(deepStartX)}
          </g>
        );
      })()}

      {/* Drag-hint cursor — animates ABOVE the handles on a dedicated white
          guide line so it visually says "drag along this axis" without
          competing with the actual handles on the waterline. Parent controls
          visibility via showHint, dismisses on first interaction or timeout. */}
      <AnimatePresence>
        {showHint && (
          <m.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            pointerEvents="none"
            aria-hidden="true"
          >
            {(() => {
              // Hint track sits 28px ABOVE the waterline so it's clearly its
              // own layer, separate from the orange handles below. The cursor
              // sweeps a SHORT range centered on the deep (right) handle —
              // enough motion to suggest "you can drag this" without
              // wandering across the whole pool.
              const HINT_Y = POOL_TOP - 28;
              const HINT_RANGE = 40; // pixels left/right of the handle center
              const HINT_LEFT = deepStartX - HINT_RANGE;
              const HINT_RIGHT = deepStartX + HINT_RANGE;
              return (
                <>
                  {/* Short white guide line, centered on the deep handle's x. */}
                  <line
                    x1={HINT_LEFT}
                    y1={HINT_Y}
                    x2={HINT_RIGHT}
                    y2={HINT_Y}
                    stroke="rgba(255,255,255,0.55)"
                    strokeWidth="1.5"
                  />
                  {/* The cursor + pulse group sweeps left↔right along the
                      short track. Runs 2 full back-and-forth cycles (initial
                      + 1 repeat) then stops — the parent auto-dismiss
                      timeout is sized to match so the flag persists. */}
                  <m.g
                    animate={{
                      x: [HINT_LEFT, HINT_RIGHT, HINT_LEFT],
                    }}
                    transition={{
                      duration: 2.6,
                      repeat: 1,
                      ease: 'easeInOut',
                      times: [0, 0.5, 1],
                    }}
                  >
                    {/* Soft pulse ring under the cursor — breathing effect. */}
                    <m.circle
                      cx={0}
                      cy={HINT_Y}
                      r={12}
                      fill="white"
                      opacity={0.18}
                      animate={{ scale: [1, 1.6, 1], opacity: [0.25, 0, 0.25] }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: 'easeOut' }}
                      style={{ transformOrigin: `0px ${HINT_Y}px` }}
                    />
                    {/* Cursor pointer icon — classic arrow. Tip anchored on
                        the guide line, body angles down-right. */}
                    <path
                      d="M0 0 L0 16 L4 12 L7 18 L9 17 L6 11 L11 11 Z"
                      transform={`translate(-2 ${HINT_Y - 2})`}
                      fill="white"
                      stroke="rgba(0,0,0,0.4)"
                      strokeWidth="0.8"
                    />
                  </m.g>
                </>
              );
            })()}
          </m.g>
        )}
      </AnimatePresence>
    </svg>
  );
};

// ── Spa cross-section diagram (round or rect spa with a seat/step bench) ─
type SpaCrossSectionProps = {
  topW: number;        // top width or diameter (user unit)
  botW: number;        // bottom width or diameter (user unit)
  aboveD: number;      // above-seat depth (user unit)
  belowD: number;      // below-seat depth (user unit)
  seatW: number;       // seat bench depth (each side) — visual only
  unitLabel: string;
};
const SpaCrossSection: React.FC<SpaCrossSectionProps> = ({ topW, botW, aboveD, belowD, seatW, unitLabel }) => {
  const VB_W = 320;
  const VB_H = 240;
  const PAD_X = 30;
  const TOP_Y = 30;
  const innerW = VB_W - PAD_X * 2;
  const totalD = (aboveD || 0) + (belowD || 0) || 1;
  // Available vertical space for the spa body.
  const BODY_H = 170;
  const aboveH = (aboveD / totalD) * BODY_H;
  const belowH = (belowD / totalD) * BODY_H;

  const maxW = Math.max(topW, botW, 1);
  const topPx = (topW / maxW) * innerW;
  const botPx = (botW / maxW) * innerW;
  const topX = PAD_X + (innerW - topPx) / 2;
  const botX = PAD_X + (innerW - botPx) / 2;
  const seatY = TOP_Y + aboveH;
  const bottomY = TOP_Y + aboveH + belowH;

  return (
    <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="w-full h-auto" role="img" aria-label="Spa side profile with seat bench">
      <defs>
        <linearGradient id="spaWaterGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1669AE" stopOpacity="0.40" />
          <stop offset="100%" stopColor="#1669AE" stopOpacity="0.18" />
        </linearGradient>
      </defs>

      {/* Spa shell (T-shape: wider top above seat, narrower bottom below) */}
      <path
        d={`M ${topX} ${TOP_Y}
            L ${topX + topPx} ${TOP_Y}
            L ${topX + topPx} ${seatY}
            L ${botX + botPx} ${seatY}
            L ${botX + botPx} ${bottomY}
            L ${botX} ${bottomY}
            L ${botX} ${seatY}
            L ${topX} ${seatY} Z`}
        fill="url(#spaWaterGrad)"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth="1.5"
      />

      {/* Waterline */}
      <line x1={topX} y1={TOP_Y} x2={topX + topPx} y2={TOP_Y} stroke="#4a93d1" strokeWidth="2" />

      {/* Seat shelves — small dashed rectangles on either side at the seat
          line, labeled with the seat width if provided. Purely visual. */}
      {aboveD > 0 && belowD > 0 && seatW > 0 && (
        <>
          {/* Left shelf */}
          <rect
            x={topX}
            y={seatY - 4}
            width={Math.max(0, botX - topX)}
            height="8"
            fill="rgba(255,255,255,0.06)"
            stroke="rgba(255,255,255,0.20)"
            strokeDasharray="2 2"
          />
          {/* Right shelf */}
          <rect
            x={botX + botPx}
            y={seatY - 4}
            width={Math.max(0, (topX + topPx) - (botX + botPx))}
            height="8"
            fill="rgba(255,255,255,0.06)"
            stroke="rgba(255,255,255,0.20)"
            strokeDasharray="2 2"
          />
          {/* Seat width callout on the left shelf */}
          <text
            x={topX + Math.max(0, (botX - topX)) / 2}
            y={seatY - 8}
            textAnchor="middle"
            fontSize="9"
            fill="#9ca3af"
            fontFamily="ui-sans-serif"
          >
            {seatW.toFixed(1)} {unitLabel}
          </text>
        </>
      )}
      {/* Seat label (only meaningful if there's an above section) */}
      {aboveD > 0 && belowD > 0 && (
        <text x={VB_W / 2} y={seatY + 14} textAnchor="middle" fontSize="11" fill="#9ca3af" fontFamily="ui-sans-serif">
          SEAT
        </text>
      )}

      {/* Top width label */}
      <line x1={topX} y1={TOP_Y - 12} x2={topX + topPx} y2={TOP_Y - 12} stroke="rgba(74,147,209,0.6)" strokeDasharray="3 3" />
      <text x={topX + topPx / 2} y={TOP_Y - 16} textAnchor="middle" fontSize="11" fill="#4a93d1" fontWeight="600">
        {topW > 0 ? topW.toFixed(1) : '—'} {unitLabel}
      </text>

      {/* Bottom width label */}
      {botW > 0 && (
        <>
          <line x1={botX} y1={bottomY + 14} x2={botX + botPx} y2={bottomY + 14} stroke="rgba(74,147,209,0.6)" strokeDasharray="3 3" />
          <text x={botX + botPx / 2} y={bottomY + 30} textAnchor="middle" fontSize="11" fill="#4a93d1" fontWeight="600">
            {botW.toFixed(1)} {unitLabel}
          </text>
        </>
      )}

      <text x={VB_W / 2} y={VB_H - 6} textAnchor="middle" fontSize="10" fill="#6b7280">
        Cross-section view
      </text>
    </svg>
  );
};

// ── Simple spa side-view diagram (no seat — uniform width). ─────
type SimpleSpaDiagramProps = {
  topW: number;
  depth: number;
  unitLabel: string;
};
const SimpleSpaDiagram: React.FC<SimpleSpaDiagramProps> = ({ topW, depth, unitLabel }) => {
  const VB_W = 320;
  const VB_H = 180;
  const PAD_X = 50;
  const PAD_Y_TOP = 30;
  const PAD_Y_BOT = 30;
  const innerW = VB_W - PAD_X * 2;
  const innerH = VB_H - PAD_Y_TOP - PAD_Y_BOT;
  // Scale: keep width<=innerW. We don't strictly visualize depth proportional
  // to width — that gets weird at extreme ratios. Use a fixed depth/width
  // visual ratio so the diagram always reads as a "spa side view".
  const w = topW > 0 ? innerW : innerW * 0.7;
  const h = depth > 0 ? Math.min(innerH, innerH * 0.85) : innerH * 0.5;
  const x = PAD_X + (innerW - w) / 2;
  const y = PAD_Y_TOP;
  return (
    <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="w-full h-auto" role="img" aria-label="Spa side view">
      <defs>
        <linearGradient id="simpleSpaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1669AE" stopOpacity="0.40" />
          <stop offset="100%" stopColor="#1669AE" stopOpacity="0.18" />
        </linearGradient>
      </defs>
      <rect x={x} y={y} width={w} height={h} fill="url(#simpleSpaGrad)" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" />
      {/* Waterline */}
      <line x1={x} y1={y} x2={x + w} y2={y} stroke="#4a93d1" strokeWidth="2" />
      {/* Width callout (top) */}
      <line x1={x} y1={y - 12} x2={x + w} y2={y - 12} stroke="rgba(74,147,209,0.6)" strokeDasharray="3 3" />
      <text x={x + w / 2} y={y - 16} textAnchor="middle" fontSize="11" fill="#4a93d1" fontWeight="600">
        {topW > 0 ? topW.toFixed(1) : '—'} {unitLabel}
      </text>
      {/* Depth callout (right side) */}
      <line x1={x + w + 10} y1={y} x2={x + w + 10} y2={y + h} stroke="rgba(74,147,209,0.6)" strokeDasharray="3 3" />
      <text x={x + w + 22} y={y + h / 2 + 4} fontSize="11" fill="#4a93d1" fontWeight="600">
        {depth > 0 ? depth.toFixed(1) : '—'} {unitLabel}
      </text>
      <text x={VB_W / 2} y={VB_H - 6} textAnchor="middle" fontSize="10" fill="#6b7280">
        Side view
      </text>
    </svg>
  );
};

// ── URL serialization ────────────────────────────────────────────
const SHARE_KEYS = ['shape', 'l', 'w', 'd', 's', 'deep', 'shallow', 'u', 'v', 'mode'] as const;

// The copy-paste embed snippet pool companies add to their site. The iframe
// auto-resizes via the tiny listener (matches the height message the embed
// page posts), so it fits with no scrollbars.
const EMBED_SNIPPET = `<iframe src="${SITE_ORIGIN}/embed/pool-volume-calculator" title="Pool Volume Calculator" loading="lazy" width="100%" height="640" style="border:0;width:100%;max-width:680px" scrolling="no"></iframe>
<script>window.addEventListener("message",function(e){if(e.data&&e.data.type==="fpt-embed-height"){var f=document.querySelectorAll('iframe[src*="/embed/"]');for(var n=0;n<f.length;n++)if(f[n].contentWindow===e.source)f[n].style.height=e.data.height+"px"}});</script>`;

/** "Embed this calculator" panel on the full page — gives pros the snippet. */
const EmbedSnippet = () => {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(EMBED_SNIPPET);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };
  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      <div className="rounded-2xl border border-line bg-card p-5 sm:p-6">
        <h2 className="font-display font-bold text-fg text-xl sm:text-2xl mb-2 flex items-center gap-2">
          <Code2 className="w-5 h-5 text-brand-orange" /> Embed this calculator — free
        </h2>
        <p className="text-muted text-[15px] leading-relaxed mb-4">
          Pool pros: add this calculator to your own website as a free tool for your customers.
          Paste the code where you want it to appear — it auto-resizes to fit, on any device.
        </p>
        <div className="relative">
          <pre className="overflow-x-auto rounded-xl border border-line bg-card-2 p-4 pt-12 sm:pt-4 sm:pr-24 text-xs text-muted leading-relaxed">
            <code>{EMBED_SNIPPET}</code>
          </pre>
          <button
            type="button"
            onClick={copy}
            className="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-lg bg-brand-orange px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-orange-dark transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" /> Copied
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" /> Copy
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  );
};

/** Attribution backlink shown in the embedded widget (dofollow → SEO value). */
const PoweredByEmbed = () => (
  <div className="max-w-5xl mx-auto px-4 pb-5 text-center">
    <a
      href={`${SITE_ORIGIN}/pool-volume-calculator/`}
      target="_blank"
      rel="noopener"
      className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-brand-orange transition-colors"
    >
      <Droplet className="w-3.5 h-3.5 text-brand-orange" /> Powered by Free Pool Tools
    </a>
  </div>
);

const PoolVolumeCalculatorInner = ({ embed }: { embed: boolean }) => {
  // SEO meta via usePageMeta so title/description/canonical/OG land in the
  // PRERENDERED HTML (runs synchronously during renderToString). Previously
  // these were set in a client effect, which shipped the homepage's defaults
  // (wrong title + canonical → "/") in the static HTML Google indexes.
  // See CLAUDE.md #9. JSON-LD stays in the effect below (the documented
  // exception — usePageMeta doesn't emit JSON-LD).
  usePageMeta(
    embed
      ? {
          // The embedded copy points its canonical at the real page and is
          // noindex,follow — so it never competes for rankings, but the
          // "Powered by" backlink it carries is still followed.
          title: 'Pool Volume Calculator | Free Pool Tools',
          description: 'How many gallons is your pool? Instant volume for any shape — free.',
          canonicalPath: '/pool-volume-calculator/',
          noindex: true,
        }
      : {
          title: 'Pool Volume Calculator: How Many Gallons Is My Pool?',
          description:
            'How many gallons is your pool? Get an instant volume in gallons or liters for any shape — rectangle, round, oval, kidney, freeform, or spa. Free, no sign-up.',
          canonicalPath: '/pool-volume-calculator/',
          jsonLd: [howToSchema, faqPageSchema, breadcrumbSchema],
        },
  );

  // Embed: report content height to the host page so its <iframe> auto-fits
  // (no scrollbars). Only runs inside a frame; the listener is in the snippet.
  useEffect(() => {
    if (!embed || typeof window === 'undefined' || window.parent === window) return;
    const post = () =>
      window.parent.postMessage(
        { type: 'fpt-embed-height', height: Math.ceil(document.documentElement.scrollHeight) },
        '*',
      );
    post();
    const ro = new ResizeObserver(post);
    ro.observe(document.documentElement);
    return () => ro.disconnect();
  }, [embed]);

  const [shape, setShape] = useState<Shape>('rectangle');
  const [lengthUnit, setLengthUnit] = useState<LenUnit>('ft');
  const [volumeUnit, setVolumeUnit] = useState<VolUnit>('gal');
  // Default to sloped sections — most real residential pools have a slope, and
  // it gives a more accurate volume than a flat average. (Only valid for
  // rectangle; the URL-hydration effect below downgrades it for other shapes.)
  const [depthMode, setDepthMode] = useState<DepthMode>('sections');

  // Shared single-shape inputs. Prefilled with a typical 16×32 residential
  // pool so the calculator never looks empty on first load. Any URL params
  // override these in the hydration effect below.
  const [length, setLength] = useState('32');
  const [width, setWidth] = useState('16');
  const [diameter, setDiameter] = useState('');
  const [avgDepth, setAvgDepth] = useState('');
  const [shallowDepth, setShallowDepth] = useState('3.5');
  const [deepDepth, setDeepDepth] = useState('5.5');
  // Sloped-section lengths in FEET (internal), set by dragging the diagram
  // handles. Default split = 30% shallow / 40% slope / 30% deep of the pool's
  // length, re-derived on the fly from the current length input.
  const [shallowLenFt, setShallowLenFt] = useState<number | null>(null);
  const [deepLenFt, setDeepLenFt] = useState<number | null>(null);
  // Which section-length field is being typed into. While focused the input
  // shows the user's raw keystrokes (so decimals type cleanly); otherwise it
  // mirrors the live value from the drag handles.
  const [editingSection, setEditingSection] = useState<null | 'shallow' | 'deep'>(null);
  const [sectionDraft, setSectionDraft] = useState('');

  // Top-level mode (Pool / Pool + Spa / Spa). Drives which fields render.
  const [calcMode, setCalcMode] = useState<CalcMode>('pool');

  // Spa (most FL spillover spas share water with the pool — for dosing we
  // want a single combined total; the breakdown is shown below the result).
  // Derived from calcMode: spa fields are active in 'pool+spa' and 'spa'.
  const spaEnabled = calcMode !== 'pool';
  const [spaShape, setSpaShape] = useState<'round' | 'rectangle'>('round');
  const [spaDiameter, setSpaDiameter] = useState('');
  const [spaLength, setSpaLength] = useState('');
  const [spaWidth, setSpaWidth] = useState('');
  const [spaDepth, setSpaDepth] = useState('');
  // Spa with a seat/step bench (two stacked sections, top wider than bottom).
  const [spaHasSeat, setSpaHasSeat] = useState(false);
  const [spaTopDiameter, setSpaTopDiameter] = useState('');
  const [spaBottomDiameter, setSpaBottomDiameter] = useState('');
  const [spaTopLength, setSpaTopLength] = useState('');
  const [spaTopWidth, setSpaTopWidth] = useState('');
  const [spaBottomLength, setSpaBottomLength] = useState('');
  const [spaBottomWidth, setSpaBottomWidth] = useState('');
  const [spaAboveSeatDepth, setSpaAboveSeatDepth] = useState('');
  const [spaBelowSeatDepth, setSpaBelowSeatDepth] = useState('');
  // How wide the seat bench is on each side. Doesn't affect volume (water
  // doesn't fill the bench itself) — used to render the cross-section more
  // accurately and to derive a sensible footwell width if the user enters
  // only this and the top diameter.
  const [spaSeatWidth, setSpaSeatWidth] = useState('');

  // Freeform sections.
  const [sections, setSections] = useState<FreeformSection[]>([newSection()]);

  // "Save to My Pool" feedback (opt-in only — nothing is stored unless tapped).
  const [savedPool, setSavedPool] = useState(false);

  // First-visit drag hint for the sloped-sections diagram. Suppressed if the
  // user has seen it before (localStorage flag) or has reduced-motion enabled.
  const SLOPE_HINT_KEY = 'spp-slope-hint-seen';
  const [showSlopeHint, setShowSlopeHint] = useState(false);
  useEffect(() => {
    try {
      if (localStorage.getItem(SLOPE_HINT_KEY) === '1') return;
      if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
      setShowSlopeHint(true);
    } catch {
      /* localStorage may be unavailable (e.g. SSR or private mode) — fail open
         and just don't show the hint rather than crashing. */
    }
  }, []);
  // Auto-dismiss the hint after the cursor has run its 2 back-and-forth
  // cycles (2 × 2.6s = 5.2s, plus a 400ms buffer). The cursor stops
  // animating on its own; this timeout fades the group out and persists the
  // localStorage flag so the hint doesn't replay on the next visit.
  useEffect(() => {
    if (!showSlopeHint) return;
    const t = window.setTimeout(() => {
      setShowSlopeHint(false);
      try { localStorage.setItem(SLOPE_HINT_KEY, '1'); } catch {}
    }, 5600);
    return () => window.clearTimeout(t);
  }, [showSlopeHint]);
  const dismissSlopeHint = () => {
    if (!showSlopeHint) return;
    setShowSlopeHint(false);
    try { localStorage.setItem(SLOPE_HINT_KEY, '1'); } catch {}
  };

  // Hydrate from share URL (parse once).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const s = params.get('shape') as Shape | null;
    if (s && SHAPES.some((sh) => sh.id === s)) setShape(s);
    const u = params.get('u');
    if (u === 'm' || u === 'ft') setLengthUnit(u);
    const v = params.get('v');
    if (v === 'L' || v === 'gal') setVolumeUnit(v);
    const mode = params.get('mode');
    // 'slope' (Shallow + Deep) was removed; legacy links fall back to Average.
    if (mode === 'slope') setDepthMode('avg');
    else if (mode === 'avg' || mode === 'sections') setDepthMode(mode);
    const ls = parseFloat(params.get('ls') || '');
    const ld = parseFloat(params.get('ld') || '');
    if (Number.isFinite(ls) && ls >= 0) setShallowLenFt(ls);
    if (Number.isFinite(ld) && ld >= 0) setDeepLenFt(ld);
    // Spa params.
    // New explicit mode param takes precedence. Old ?spa=1 maps to 'pool+spa'
    // for backward compatibility with shared links from earlier versions.
    const calc = params.get('calc');
    if (calc === 'pool' || calc === 'pool+spa' || calc === 'spa') {
      setCalcMode(calc);
    } else if (params.get('spa') === '1') {
      setCalcMode('pool+spa');
    }
    const spaSh = params.get('spaShape');
    if (spaSh === 'round' || spaSh === 'rectangle') setSpaShape(spaSh);
    if (params.get('spad')) setSpaDiameter(params.get('spad')!);
    if (params.get('spal')) setSpaLength(params.get('spal')!);
    if (params.get('spaw')) setSpaWidth(params.get('spaw')!);
    if (params.get('spadep')) setSpaDepth(params.get('spadep')!);
    // Spa with seat params.
    if (params.get('spaSeat') === '1') setSpaHasSeat(true);
    if (params.get('spatd')) setSpaTopDiameter(params.get('spatd')!);
    if (params.get('spabd')) setSpaBottomDiameter(params.get('spabd')!);
    if (params.get('spatl')) setSpaTopLength(params.get('spatl')!);
    if (params.get('spatw')) setSpaTopWidth(params.get('spatw')!);
    if (params.get('spabl')) setSpaBottomLength(params.get('spabl')!);
    if (params.get('spabw')) setSpaBottomWidth(params.get('spabw')!);
    if (params.get('spaad')) setSpaAboveSeatDepth(params.get('spaad')!);
    if (params.get('spabld')) setSpaBelowSeatDepth(params.get('spabld')!);
    if (params.get('spasw')) setSpaSeatWidth(params.get('spasw')!);
    if (params.get('l')) setLength(params.get('l')!);
    if (params.get('w')) setWidth(params.get('w')!);
    if (params.get('d')) setDiameter(params.get('d')!);
    if (params.get('s')) setAvgDepth(params.get('s')!);
    if (params.get('shallow')) setShallowDepth(params.get('shallow')!);
    if (params.get('deep')) setDeepDepth(params.get('deep')!);
  }, []);


  // Resolved depth in feet (handles avg vs slope mode).
  const resolvedDepthFt = useMemo(() => {
    if (depthMode === 'avg') return toFeet(num(avgDepth), lengthUnit);
    const s = toFeet(num(shallowDepth), lengthUnit);
    const d = toFeet(num(deepDepth), lengthUnit);
    if (s && d) return (s + d) / 2;
    return 0;
  }, [depthMode, avgDepth, shallowDepth, deepDepth, lengthUnit]);

  // Pack depth back into the inputs object expected by volumeGallons.
  const depthStr = useMemo(() => {
    if (!resolvedDepthFt) return '';
    // Convert resolved ft back to whatever unit volumeGallons expects via `unit`.
    return lengthUnit === 'm' ? String(resolvedDepthFt / FT_PER_M) : String(resolvedDepthFt);
  }, [resolvedDepthFt, lengthUnit]);

  // Gallons for the active shape.
  // Total length in feet (used by the sloped-sections diagram + math).
  const totalLenFt = useMemo(() => toFeet(num(length), lengthUnit), [length, lengthUnit]);
  const shallowDepthFt = useMemo(
    () => toFeet(num(shallowDepth), lengthUnit),
    [shallowDepth, lengthUnit],
  );
  const deepDepthFt = useMemo(
    () => toFeet(num(deepDepth), lengthUnit),
    [deepDepth, lengthUnit],
  );

  // The axis the slope runs along (used by the sloped-sections diagram + math).
  // It's the `length` field for rectangle/oval/grecian, but the `diameter`
  // field for round (its diameter) and octagon (its width across flats) — those
  // shapes have no separate length input.
  const sectionAxisFt = useMemo(
    () =>
      shape === 'round' || shape === 'octagon'
        ? toFeet(num(diameter), lengthUnit)
        : totalLenFt,
    [shape, diameter, lengthUnit, totalLenFt],
  );

  // Effective section lengths. Defaults to a 30/40/30 split of the slope axis;
  // overridden by user-set values from the draggable handles.
  const effShallowLenFt = useMemo(() => {
    if (shallowLenFt !== null) return Math.max(0, Math.min(shallowLenFt, sectionAxisFt));
    return sectionAxisFt * 0.3;
  }, [shallowLenFt, sectionAxisFt]);
  const effDeepLenFt = useMemo(() => {
    if (deepLenFt !== null) {
      return Math.max(0, Math.min(deepLenFt, sectionAxisFt - effShallowLenFt));
    }
    return sectionAxisFt * 0.3;
  }, [deepLenFt, sectionAxisFt, effShallowLenFt]);

  // Safety net: if we ever land on 'sections' for a shape that doesn't support
  // it (e.g. a legacy/shared link with mode=sections + a kidney shape), fall
  // back to Average so the depth UI stays valid.
  React.useEffect(() => {
    if (depthMode === 'sections' && !shapeSupportsSections(shape)) setDepthMode('avg');
  }, [depthMode, shape]);

  const gallons = useMemo(() => {
    // In spa-only mode the pool doesn't contribute to the total.
    if (calcMode === 'spa') return 0;
    if (shape === 'freeform') {
      return sections.reduce(
        (sum, sec) =>
          sum +
          volumeGallons(
            sec.shape,
            {
              length: sec.length,
              width: sec.width,
              diameter: sec.diameter,
              depth: sec.depth,
            },
            lengthUnit,
          ),
        0,
      );
    }
    if (depthMode === 'sections' && shapeSupportsSections(shape)) {
      // Sloped sections: length-weighted average depth × the shape's real
      // surface area. We get the area for free by feeding the average depth
      // through the same per-shape volume formula used for Average mode.
      const avgFt = sectionsAvgDepthFt(
        sectionAxisFt,
        effShallowLenFt,
        effDeepLenFt,
        shallowDepthFt,
        deepDepthFt,
      );
      if (!avgFt) return 0;
      const avgUser = lengthUnit === 'm' ? avgFt / FT_PER_M : avgFt;
      return volumeGallons(shape, { length, width, diameter, depth: String(avgUser) }, lengthUnit);
    }
    return volumeGallons(shape, { length, width, diameter, depth: depthStr }, lengthUnit);
  }, [
    calcMode,
    shape,
    length,
    width,
    diameter,
    depthStr,
    lengthUnit,
    sections,
    depthMode,
    sectionAxisFt,
    effShallowLenFt,
    effDeepLenFt,
    shallowDepthFt,
    deepDepthFt,
  ]);

  // Spa gallons — only counted when the toggle is on. Most spas in Florida
  // are round; we also support a small rectangular spa. When the spa has a
  // seat/step bench, the volume is modeled as two stacked sections (top wider
  // above the seat, bottom narrower below it).
  const spaGallons = useMemo(() => {
    if (!spaEnabled) return 0;
    if (spaHasSeat) {
      // Bottom inputs are OUTER WALL dimensions (what a user can measure from
      // the spa's outside). The actual footwell water cavity is narrower by
      // 2× the seat width — the bench protrudes inward from each side.
      const seat = num(spaSeatWidth);
      if (spaShape === 'round') {
        const footwellD = Math.max(0, num(spaBottomDiameter) - 2 * seat);
        const top = volumeGallons('round', { diameter: spaTopDiameter, depth: spaAboveSeatDepth }, lengthUnit);
        const bot = volumeGallons('round', { diameter: String(footwellD), depth: spaBelowSeatDepth }, lengthUnit);
        return top + bot;
      }
      const footwellL = Math.max(0, num(spaBottomLength) - 2 * seat);
      const footwellW = Math.max(0, num(spaBottomWidth) - 2 * seat);
      const top = volumeGallons('rectangle', { length: spaTopLength, width: spaTopWidth, depth: spaAboveSeatDepth }, lengthUnit);
      const bot = volumeGallons('rectangle', { length: String(footwellL), width: String(footwellW), depth: spaBelowSeatDepth }, lengthUnit);
      return top + bot;
    }
    if (spaShape === 'round') {
      return volumeGallons('round', { diameter: spaDiameter, depth: spaDepth }, lengthUnit);
    }
    return volumeGallons('rectangle', { length: spaLength, width: spaWidth, depth: spaDepth }, lengthUnit);
  }, [
    spaEnabled, spaShape, spaDiameter, spaLength, spaWidth, spaDepth,
    spaHasSeat, spaTopDiameter, spaBottomDiameter, spaSeatWidth,
    spaTopLength, spaTopWidth, spaBottomLength, spaBottomWidth,
    spaAboveSeatDepth, spaBelowSeatDepth, lengthUnit,
  ]);

  const totalGallons = gallons + spaGallons;
  const displayVolume = formatGallons(totalGallons, volumeUnit);
  const volumeUnitLabel = volumeUnit === 'L' ? 'liters' : 'gallons';

  // Build share URL.
  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const params = new URLSearchParams();
    params.set('shape', shape);
    params.set('u', lengthUnit);
    params.set('v', volumeUnit);
    params.set('mode', depthMode);
    if (length) params.set('l', length);
    if (width) params.set('w', width);
    if (diameter) params.set('d', diameter);
    if (depthMode === 'avg' && avgDepth) params.set('s', avgDepth);
    if (depthMode === 'sections') {
      if (shallowDepth) params.set('shallow', shallowDepth);
      if (deepDepth) params.set('deep', deepDepth);
      params.set('ls', effShallowLenFt.toFixed(2));
      params.set('ld', effDeepLenFt.toFixed(2));
    }
    if (calcMode !== 'pool') params.set('calc', calcMode);
    if (spaEnabled) {
      params.set('spaShape', spaShape);
      if (spaHasSeat) {
        params.set('spaSeat', '1');
        if (spaShape === 'round') {
          if (spaTopDiameter) params.set('spatd', spaTopDiameter);
          if (spaBottomDiameter) params.set('spabd', spaBottomDiameter);
        } else {
          if (spaTopLength) params.set('spatl', spaTopLength);
          if (spaTopWidth) params.set('spatw', spaTopWidth);
          if (spaBottomLength) params.set('spabl', spaBottomLength);
          if (spaBottomWidth) params.set('spabw', spaBottomWidth);
        }
        if (spaAboveSeatDepth) params.set('spaad', spaAboveSeatDepth);
        if (spaBelowSeatDepth) params.set('spabld', spaBelowSeatDepth);
        if (spaSeatWidth) params.set('spasw', spaSeatWidth);
      } else {
        if (spaShape === 'round') {
          if (spaDiameter) params.set('spad', spaDiameter);
        } else {
          if (spaLength) params.set('spal', spaLength);
          if (spaWidth) params.set('spaw', spaWidth);
        }
        if (spaDepth) params.set('spadep', spaDepth);
      }
    }
    return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
  }, [calcMode, shape, lengthUnit, volumeUnit, depthMode, length, width, diameter, avgDepth, shallowDepth, deepDepth, effShallowLenFt, effDeepLenFt, spaEnabled, spaShape, spaDiameter, spaLength, spaWidth, spaDepth, spaHasSeat, spaTopDiameter, spaBottomDiameter, spaTopLength, spaTopWidth, spaBottomLength, spaBottomWidth, spaAboveSeatDepth, spaBelowSeatDepth, spaSeatWidth]);

  // ── formula (human-readable, for the trust panel) ───────────────
  const formula = useMemo(() => {
    const u = lengthUnit === 'm' ? 'm' : 'ft';
    const x = (s: string) => num(s).toString();
    // In sloped-sections mode the depth is the length-weighted average over the
    // slope axis; the per-shape lines below then multiply it by the shape's
    // area. So we just build the right depth string `d` for each mode.
    let d: string;
    if (depthMode === 'sections' && shapeSupportsSections(shape)) {
      const toUserLen = (ft: number) =>
        (lengthUnit === 'm' ? ft / FT_PER_M : ft).toFixed(1);
      const Ls = toUserLen(effShallowLenFt);
      const Lslope = toUserLen(Math.max(0, sectionAxisFt - effShallowLenFt - effDeepLenFt));
      const Ld = toUserLen(effDeepLenFt);
      const Ds = x(shallowDepth);
      const Dd = x(deepDepth);
      const axis = toUserLen(sectionAxisFt);
      const avgFt = sectionsAvgDepthFt(sectionAxisFt, effShallowLenFt, effDeepLenFt, shallowDepthFt, deepDepthFt);
      const avgUser = (lengthUnit === 'm' ? avgFt / FT_PER_M : avgFt).toFixed(1);
      d = `[(${Ls}·${Ds} + ${Lslope}·((${Ds}+${Dd})÷2) + ${Ld}·${Dd}) ÷ ${axis}] = ${avgUser} ${u} avg`;
    } else {
      d = `${x(avgDepth)} ${u}`;
    }
    if (shape === 'rectangle') return `L × W × Depth × 7.48 → ${x(length)} × ${x(width)} × ${d}`;
    if (shape === 'round') return `π × (Ø ÷ 2)² × Depth × 7.48 → π × (${x(diameter)} ÷ 2)² × ${d}`;
    if (shape === 'oval') return `π × (L÷2) × (W÷2) × Depth × 7.48 → π × (${x(length)}÷2) × (${x(width)}÷2) × ${d}`;
    if (shape === 'kidney') return `0.45 × (A + B) × L × Depth × 7.48 → 0.45 × (${x(width)} + ${x(diameter)}) × ${x(length)} × ${d}`;
    if (shape === 'roman') return `((L − W) × W + π × (W÷2)²) × Depth × 7.48 → ((${x(length)} − ${x(width)}) × ${x(width)} + π × (${x(width)}÷2)²) × ${d}`;
    if (shape === 'grecian') return `(L × W − 2c²) × Depth × 7.48 → (${x(length)} × ${x(width)} − 2 × ${x(diameter)}²) × ${d}`;
    if (shape === 'octagon') return `2(√2 − 1) × W² × Depth × 7.48 → 0.8284 × ${x(diameter)}² × ${d}`;
    return `Sum of each section's volume (L × W × D or π × r² × D), then × 7.48`;
  }, [shape, length, width, diameter, avgDepth, shallowDepth, deepDepth, depthMode, lengthUnit, sectionAxisFt, effShallowLenFt, effDeepLenFt, shallowDepthFt, deepDepthFt]);

  const addSection = () => setSections((prev) => [...prev, newSection()]);
  const removeSection = (id: string) =>
    setSections((prev) => (prev.length > 1 ? prev.filter((s) => s.id !== id) : prev));
  const updateSection = (id: string, patch: Partial<FreeformSection>) =>
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  const unitL = lengthUnit; // shorthand

  return (
    <div
      className={
        embed
          ? 'bg-canvas text-fg pt-4 selection:bg-[#ff720f] selection:text-white'
          : 'force-static-motion min-h-screen bg-canvas relative overflow-x-hidden selection:bg-[#ff720f] selection:text-white'
      }
    >
      {!embed && <div className="absolute md:fixed inset-0 bg-mesh opacity-50 pointer-events-none" />}
      {!embed && <div className="absolute md:fixed inset-0 page-glow pointer-events-none" />}

      <div className={embed ? '' : 'relative z-10'}>
        {!embed && <Navbar />}

        {/* Hero (hidden in the embedded widget) */}
        {!embed && (
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-10 text-center">
          <div className="inline-flex items-center gap-2 mb-5 rounded-full border border-line bg-card-2 backdrop-blur-[10px] px-3.5 py-1.5">
            <Calculator className="w-3.5 h-3.5 text-brand-orange" />
            <span className="text-muted font-semibold tracking-wide text-xs">Free Pool Tool</span>
          </div>
          <h1 className="font-display font-bold text-fg text-4xl sm:text-5xl leading-[1.05] tracking-tight mb-5">
            Pool Volume Calculator
          </h1>
          <p className="text-lg text-muted leading-relaxed max-w-2xl mx-auto">
            Find out how many gallons (or liters) your swimming pool holds — for any shape, with
            or without a sloped bottom. Free, instant, no email required.
          </p>

          {/* Trust-signal chips — quick at-a-glance summary of what the tool
              handles. Doubles as visual interest and conversion signal. */}
          <ul className="flex flex-wrap justify-center gap-2 mt-6">
            {[
              'Any shape',
              'Sloped depths',
              'Spas & hot tubs',
              'No email required',
            ].map((label) => (
              <li
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card-2 backdrop-blur-[10px] px-3 py-1.5 text-xs font-semibold text-muted"
              >
                <Check className="w-3.5 h-3.5 text-brand-orange shrink-0" />
                {label}
              </li>
            ))}
          </ul>
        </section>
        )}

        {/* Calculator */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
          <div className="rounded-3xl border border-line bg-card p-5 sm:p-8 elevate">

            {/* What are you calculating? — top-level mode picker. */}
            <div className="grid grid-cols-3 gap-2 mb-6 rounded-xl border border-line bg-card p-1">
              {(
                [
                  { id: 'pool', label: 'Pool' },
                  { id: 'pool+spa', label: 'Pool + Spa' },
                  { id: 'spa', label: 'Spa' },
                ] as { id: CalcMode; label: string }[]
              ).map((m) => {
                const active = calcMode === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setCalcMode(m.id)}
                    aria-pressed={active}
                    className={`relative py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                      active
                        ? 'bg-brand-blue text-fg shadow-sm shadow-brand-blue/30'
                        : 'text-muted hover:text-fg hover:bg-card-2'
                    }`}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>

            {/* Unit toggles */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <div className="inline-flex rounded-lg border border-line bg-card p-1">
                {(['ft', 'm'] as LenUnit[]).map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setLengthUnit(u)}
                    aria-pressed={lengthUnit === u}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                      lengthUnit === u ? 'seg-active text-fg' : 'text-muted hover:text-fg'
                    }`}
                  >
                    {u === 'ft' ? 'Feet' : 'Meters'}
                  </button>
                ))}
              </div>
              <div className="inline-flex rounded-lg border border-line bg-card p-1">
                {(['gal', 'L'] as VolUnit[]).map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setVolumeUnit(u)}
                    aria-pressed={volumeUnit === u}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                      volumeUnit === u ? 'seg-active text-fg' : 'text-muted hover:text-fg'
                    }`}
                  >
                    {u === 'gal' ? 'Gallons' : 'Liters'}
                  </button>
                ))}
              </div>
            </div>

            {/* Pool fields (hidden in spa-only mode) */}
            {calcMode !== 'spa' && (
              <>
            <p className={labelClass}>Pool shape</p>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5 mb-6">
              {SHAPES.map(({ id, label, icon: Icon }) => {
                const active = shape === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setShape(id);
                      // Sloped sections only applies to shapes with a clear deep
                      // axis — downgrade to 'avg' for kidney/roman so the picker
                      // stays valid.
                      if (!shapeSupportsSections(id) && depthMode === 'sections') {
                        setDepthMode('avg');
                      }
                    }}
                    aria-pressed={active}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 transition-colors ${
                      active
                        ? 'border-brand-orange/60 bg-brand-orange/10 text-fg'
                        : 'border-line bg-card text-muted hover:text-fg hover:border-line-strong'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${active ? 'text-brand-orange' : ''}`} />
                    <span className="text-xs font-semibold">{label}</span>
                  </button>
                );
              })}
            </div>

            {/* Shape diagram + inputs (single-shape modes) */}
            {shape !== 'freeform' && (
              <div className="grid sm:grid-cols-[1fr_180px] gap-5 mb-5">
                <div className="order-2 sm:order-1 space-y-4">
                  {/* Dimensions per shape */}
                  {shape === 'rectangle' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="length" className={labelClass}>Length ({unitL})</label>
                        <input id="length" type="number" inputMode="decimal" min="0" value={length}
                          onChange={(e) => setLength(e.target.value)} placeholder="e.g. 32" className={fieldClass} />
                      </div>
                      <div>
                        <label htmlFor="width" className={labelClass}>Width ({unitL})</label>
                        <input id="width" type="number" inputMode="decimal" min="0" value={width}
                          onChange={(e) => setWidth(e.target.value)} placeholder="e.g. 16" className={fieldClass} />
                      </div>
                    </div>
                  )}

                  {shape === 'round' && (
                    <div>
                      <label htmlFor="diameter" className={labelClass}>Diameter ({unitL})</label>
                      <input id="diameter" type="number" inputMode="decimal" min="0" value={diameter}
                        onChange={(e) => setDiameter(e.target.value)} placeholder="e.g. 18" className={fieldClass} />
                    </div>
                  )}

                  {shape === 'oval' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="length" className={labelClass}>Length ({unitL})</label>
                        <input id="length" type="number" inputMode="decimal" min="0" value={length}
                          onChange={(e) => setLength(e.target.value)} placeholder="e.g. 30" className={fieldClass} />
                      </div>
                      <div>
                        <label htmlFor="width" className={labelClass}>Width ({unitL})</label>
                        <input id="width" type="number" inputMode="decimal" min="0" value={width}
                          onChange={(e) => setWidth(e.target.value)} placeholder="e.g. 15" className={fieldClass} />
                      </div>
                    </div>
                  )}

                  {shape === 'kidney' && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label htmlFor="length" className={labelClass}>Length L ({unitL})</label>
                        <input id="length" type="number" inputMode="decimal" min="0" value={length}
                          onChange={(e) => setLength(e.target.value)} placeholder="e.g. 28" className={fieldClass} />
                      </div>
                      <div>
                        <label htmlFor="width" className={labelClass}>Width A ({unitL})</label>
                        <input id="width" type="number" inputMode="decimal" min="0" value={width}
                          onChange={(e) => setWidth(e.target.value)} placeholder="e.g. 12" className={fieldClass} />
                      </div>
                      <div>
                        <label htmlFor="diameter" className={labelClass}>Width B ({unitL})</label>
                        <input id="diameter" type="number" inputMode="decimal" min="0" value={diameter}
                          onChange={(e) => setDiameter(e.target.value)} placeholder="e.g. 16" className={fieldClass} />
                      </div>
                    </div>
                  )}

                  {shape === 'roman' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="length" className={labelClass}>Length ({unitL})</label>
                        <input id="length" type="number" inputMode="decimal" min="0" value={length}
                          onChange={(e) => setLength(e.target.value)} placeholder="e.g. 32" className={fieldClass} />
                      </div>
                      <div>
                        <label htmlFor="width" className={labelClass}>Width ({unitL})</label>
                        <input id="width" type="number" inputMode="decimal" min="0" value={width}
                          onChange={(e) => setWidth(e.target.value)} placeholder="e.g. 16" className={fieldClass} />
                      </div>
                      <p className="sm:col-span-2 text-[11px] text-subtle -mt-1">
                        Length is measured tip-to-tip across the rounded ends.
                      </p>
                    </div>
                  )}

                  {shape === 'grecian' && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label htmlFor="length" className={labelClass}>Length ({unitL})</label>
                        <input id="length" type="number" inputMode="decimal" min="0" value={length}
                          onChange={(e) => setLength(e.target.value)} placeholder="e.g. 32" className={fieldClass} />
                      </div>
                      <div>
                        <label htmlFor="width" className={labelClass}>Width ({unitL})</label>
                        <input id="width" type="number" inputMode="decimal" min="0" value={width}
                          onChange={(e) => setWidth(e.target.value)} placeholder="e.g. 16" className={fieldClass} />
                      </div>
                      <div>
                        <label htmlFor="diameter" className={labelClass}>Corner cut c ({unitL})</label>
                        <input id="diameter" type="number" inputMode="decimal" min="0" value={diameter}
                          onChange={(e) => setDiameter(e.target.value)} placeholder="e.g. 3" className={fieldClass} />
                      </div>
                      <p className="sm:col-span-3 text-[11px] text-subtle -mt-1">
                        Corner cut = how far each 45° corner is trimmed back. Leave at 0 for a plain
                        rectangle.
                      </p>
                    </div>
                  )}

                  {shape === 'octagon' && (
                    <div>
                      <label htmlFor="diameter" className={labelClass}>Width across flats ({unitL})</label>
                      <input id="diameter" type="number" inputMode="decimal" min="0" value={diameter}
                        onChange={(e) => setDiameter(e.target.value)} placeholder="e.g. 16" className={fieldClass} />
                      <p className="text-[11px] text-subtle mt-1">
                        Distance straight across between two opposite flat sides (not corner-to-corner).
                      </p>
                    </div>
                  )}
                </div>

                {/* Diagram */}
                <div className="order-1 sm:order-2 rounded-xl border border-line bg-card p-3 flex items-center justify-center">
                  {DIAGRAMS[shape as Exclude<Shape, 'freeform'>]}
                </div>
              </div>
            )}

            {/* Depth (single shape only) */}
            {shape !== 'freeform' && (
              <div className="mb-2">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <p className={`${labelClass} !mb-0`}>Depth</p>
                  <div className="inline-flex rounded-lg border border-line bg-card p-1 flex-wrap">
                    {(
                      shapeSupportsSections(shape)
                        ? (['avg', 'sections'] as DepthMode[])
                        : (['avg'] as DepthMode[])
                    ).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setDepthMode(mode)}
                        aria-pressed={depthMode === mode}
                        className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                          depthMode === mode ? 'seg-active text-fg' : 'text-muted hover:text-fg'
                        }`}
                      >
                        {mode === 'avg' && 'Average'}
                        {mode === 'sections' && 'Sloped sections'}
                      </button>
                    ))}
                  </div>
                </div>

                {depthMode === 'avg' && (
                  <input id="avgDepth" type="number" inputMode="decimal" min="0" value={avgDepth}
                    aria-label={`Average depth (${unitL})`}
                    onChange={(e) => setAvgDepth(e.target.value)} placeholder={`Average depth in ${unitL} — e.g. 5`} className={fieldClass} />
                )}

                {/* Sloped sections: the section model with a draggable
                    side-profile diagram (rectangle/round/oval/grecian/octagon). */}
                {depthMode === 'sections' && shapeSupportsSections(shape) && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="shallow" className="text-xs text-muted block mb-1">Shallow depth ({unitL})</label>
                        <input id="shallow" type="number" inputMode="decimal" min="0" value={shallowDepth}
                          onChange={(e) => setShallowDepth(e.target.value)} placeholder="e.g. 3.5" className={fieldClass} />
                      </div>
                      <div>
                        <label htmlFor="deep" className="text-xs text-muted block mb-1">Deep depth ({unitL})</label>
                        <input id="deep" type="number" inputMode="decimal" min="0" value={deepDepth}
                          onChange={(e) => setDeepDepth(e.target.value)} placeholder="e.g. 8" className={fieldClass} />
                      </div>
                    </div>

                    <div className="rounded-xl border border-line bg-card p-3 sm:p-4">
                      {sectionAxisFt > 0 && shallowDepthFt > 0 && deepDepthFt > 0 ? (
                        <>
                          {/* Section lengths — ABOVE the diagram so they're
                              readable and never hidden under your finger while
                              dragging. Shallow + Deep are editable (type exact
                              values as an alternative to dragging); Slope is
                              derived. All update live as the handles move. */}
                          {(() => {
                            const ftToUser = (ft: number) => (unitL === 'm' ? ft / FT_PER_M : ft);
                            const userToFt = (v: number) => (unitL === 'm' ? v * FT_PER_M : v);
                            const round1 = (n: number) => Math.round(n * 10) / 10;
                            const slopeFt = Math.max(0, sectionAxisFt - effShallowLenFt - effDeepLenFt);
                            const cellCls =
                              'rounded-lg border border-line bg-card-2 px-2 py-2 text-center';
                            const labelCls =
                              'text-[10px] font-semibold uppercase tracking-wide text-subtle';
                            const inputCls =
                              'w-full bg-transparent text-center text-sm sm:text-base font-bold text-fg ' +
                              'tabular-nums leading-tight mt-0.5 outline-none rounded ' +
                              'focus:ring-2 focus:ring-brand-orange/60';
                            const onEdit =
                              (which: 'shallow' | 'deep') =>
                              (e: React.ChangeEvent<HTMLInputElement>) => {
                                const v = e.target.value;
                                setSectionDraft(v);
                                const n = parseFloat(v);
                                if (!Number.isFinite(n) || n < 0) return;
                                const ft = userToFt(n);
                                if (which === 'shallow') {
                                  setShallowLenFt(Math.min(ft, Math.max(0, sectionAxisFt - effDeepLenFt)));
                                } else {
                                  setDeepLenFt(Math.min(ft, Math.max(0, sectionAxisFt - effShallowLenFt)));
                                }
                              };
                            const fieldValue = (which: 'shallow' | 'deep', ft: number) =>
                              editingSection === which ? sectionDraft : String(round1(ftToUser(ft)));
                            return (
                              <div className="grid grid-cols-3 gap-2 mb-3">
                                <div className={cellCls}>
                                  <label htmlFor="shallowLen" className={labelCls}>Shallow</label>
                                  <div className="flex items-baseline justify-center">
                                    <input
                                      id="shallowLen"
                                      type="number"
                                      inputMode="decimal"
                                      min="0"
                                      value={fieldValue('shallow', effShallowLenFt)}
                                      onFocus={() => {
                                        setEditingSection('shallow');
                                        setSectionDraft(String(round1(ftToUser(effShallowLenFt))));
                                      }}
                                      onChange={onEdit('shallow')}
                                      onBlur={() => setEditingSection(null)}
                                      className={inputCls}
                                      aria-label={`Shallow section length in ${unitL}`}
                                    />
                                    <span className="text-subtle font-medium text-xs ml-0.5">{unitL}</span>
                                  </div>
                                </div>
                                <div className={cellCls}>
                                  <div className={labelCls}>Slope</div>
                                  <div className="text-sm sm:text-base font-bold text-fg tabular-nums leading-tight mt-0.5">
                                    {round1(ftToUser(slopeFt))}
                                    <span className="text-subtle font-medium text-xs ml-0.5">{unitL}</span>
                                  </div>
                                </div>
                                <div className={cellCls}>
                                  <label htmlFor="deepLen" className={labelCls}>Deep</label>
                                  <div className="flex items-baseline justify-center">
                                    <input
                                      id="deepLen"
                                      type="number"
                                      inputMode="decimal"
                                      min="0"
                                      value={fieldValue('deep', effDeepLenFt)}
                                      onFocus={() => {
                                        setEditingSection('deep');
                                        setSectionDraft(String(round1(ftToUser(effDeepLenFt))));
                                      }}
                                      onChange={onEdit('deep')}
                                      onBlur={() => setEditingSection(null)}
                                      className={inputCls}
                                      aria-label={`Deep section length in ${unitL}`}
                                    />
                                    <span className="text-subtle font-medium text-xs ml-0.5">{unitL}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                          <SlopeProfile
                            totalLenFt={sectionAxisFt}
                            shallowLenFt={effShallowLenFt}
                            deepLenFt={effDeepLenFt}
                            shallowDepthFt={shallowDepthFt}
                            deepDepthFt={deepDepthFt}
                            unitLabel={unitL === 'ft' ? 'ft' : 'm'}
                            showHint={showSlopeHint}
                            onInteract={dismissSlopeHint}
                            onChange={(newLs, newLd) => {
                              // Convert internal ft back to user's chosen unit
                              // for storage if needed. We keep internal in ft.
                              setShallowLenFt(newLs);
                              setDeepLenFt(newLd);
                            }}
                          />
                          <p className="text-xs text-subtle mt-2 text-center">
                            Drag the orange handles to set where the slope starts and ends — or type the Shallow and Deep lengths above.
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-subtle text-center py-8">
                          Enter the pool size and both depths to see the side profile.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Freeform sections */}
            {shape === 'freeform' && (
              <div className="space-y-3 mb-2">
                <p className="text-sm text-muted leading-relaxed">
                  Break your pool into simple rectangle or round sections, enter each, and we'll add
                  them up.
                </p>
                {sections.map((sec, i) => (
                  <div key={sec.id} className="rounded-xl border border-line bg-card p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-fg font-semibold text-sm">Section {i + 1}</span>
                      <div className="flex items-center gap-2">
                        <div className="inline-flex rounded-lg border border-line bg-card-2 p-0.5">
                          {(['rectangle', 'round'] as FreeformSectionShape[]).map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => updateSection(sec.id, { shape: s })}
                              aria-pressed={sec.shape === s}
                              className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors ${
                                sec.shape === s ? 'seg-active text-fg' : 'text-muted hover:text-fg'
                              }`}
                            >
                              {s === 'rectangle' ? 'Rect' : 'Round'}
                            </button>
                          ))}
                        </div>
                        {sections.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSection(sec.id)}
                            aria-label="Remove section"
                            className="text-subtle hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {sec.shape === 'rectangle' ? (
                        <>
                          <input type="number" inputMode="decimal" min="0" value={sec.length}
                            aria-label={`Section ${i + 1} length (${unitL})`}
                            onChange={(e) => updateSection(sec.id, { length: e.target.value })}
                            placeholder={`Length (${unitL})`} className={fieldClass} />
                          <input type="number" inputMode="decimal" min="0" value={sec.width}
                            aria-label={`Section ${i + 1} width (${unitL})`}
                            onChange={(e) => updateSection(sec.id, { width: e.target.value })}
                            placeholder={`Width (${unitL})`} className={fieldClass} />
                        </>
                      ) : (
                        <input type="number" inputMode="decimal" min="0" value={sec.diameter}
                          aria-label={`Section ${i + 1} diameter (${unitL})`}
                          onChange={(e) => updateSection(sec.id, { diameter: e.target.value })}
                          placeholder={`Diameter (${unitL})`} className={`${fieldClass} sm:col-span-2`} />
                      )}
                      <input type="number" inputMode="decimal" min="0" value={sec.depth}
                        aria-label={`Section ${i + 1} depth (${unitL})`}
                        onChange={(e) => updateSection(sec.id, { depth: e.target.value })}
                        placeholder={`Depth (${unitL})`} className={fieldClass} />
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addSection}
                  className="inline-flex items-center gap-1.5 text-brand-orange hover:text-brand-orange-dark font-semibold text-sm"
                >
                  <Plus className="w-4 h-4" /> Add another section
                </button>
              </div>
            )}
              </>
            )}

            {/* Spa card — visible whenever calcMode includes spa. */}
            {spaEnabled && (
              <div className={`${calcMode === 'spa' ? 'mt-0' : 'mt-6'} rounded-2xl border border-line bg-gradient-to-br from-brand-blue/[0.05] to-transparent overflow-hidden`}>
                {/* Spa card header */}
                <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-line bg-card">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-9 h-9 rounded-xl bg-brand-blue/15 border border-brand-blue/30 flex items-center justify-center shrink-0">
                      <Droplet className="w-[18px] h-[18px] text-brand-blue-light" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-fg font-semibold text-[15px] leading-tight">
                        {calcMode === 'spa' ? 'Spa / Hot Tub' : 'Spa or Hot Tub'}
                      </p>
                      <p className="text-subtle text-xs leading-tight mt-0.5">
                        {calcMode === 'spa' ? 'Standalone calculation' : 'Adds to the pool total'}
                      </p>
                    </div>
                  </div>
                  {spaGallons > 0 && (
                    <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-brand-orange/15 border border-brand-orange/30 text-brand-orange px-3 py-1 text-sm font-semibold tabular-nums">
                      +{formatGallons(spaGallons, volumeUnit)} {volumeUnit}
                    </span>
                  )}
                </div>

                <div className="p-5 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted">Spa shape</span>
                      <div className="inline-flex rounded-lg border border-line bg-card-2 p-0.5">
                        {(['round', 'rectangle'] as const).map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setSpaShape(s)}
                            aria-pressed={spaShape === s}
                            className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors ${
                              spaShape === s ? 'seg-active text-fg' : 'text-muted hover:text-fg'
                            }`}
                          >
                            {s === 'round' ? 'Round' : 'Rectangle'}
                          </button>
                        ))}
                      </div>
                    </div>
                    <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs text-muted select-none">
                      <input
                        type="checkbox"
                        checked={spaHasSeat}
                        onChange={(e) => setSpaHasSeat(e.target.checked)}
                        className="w-3.5 h-3.5 rounded border-line-strong bg-card-2 text-brand-orange focus:ring-brand-orange/40"
                      />
                      Spa has a seat / step bench
                    </label>
                  </div>

                  {/* Simple spa (no seat) */}
                  {!spaHasSeat && spaShape === 'round' && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label htmlFor="spaDiameter" className="text-xs text-muted block mb-1">Diameter ({unitL})</label>
                          <input id="spaDiameter" type="number" inputMode="decimal" min="0" value={spaDiameter}
                            onChange={(e) => setSpaDiameter(e.target.value)} placeholder="e.g. 7" className={fieldClass} />
                        </div>
                        <div>
                          <label htmlFor="spaDepth" className="text-xs text-muted block mb-1">Avg depth ({unitL})</label>
                          <input id="spaDepth" type="number" inputMode="decimal" min="0" value={spaDepth}
                            onChange={(e) => setSpaDepth(e.target.value)} placeholder="e.g. 3.5" className={fieldClass} />
                        </div>
                      </div>
                      <div className="rounded-lg border border-line bg-card p-3">
                        <SimpleSpaDiagram topW={num(spaDiameter)} depth={num(spaDepth)} unitLabel={unitL} />
                      </div>
                    </div>
                  )}
                  {!spaHasSeat && spaShape === 'rectangle' && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label htmlFor="spaLength" className="text-xs text-muted block mb-1">Length ({unitL})</label>
                          <input id="spaLength" type="number" inputMode="decimal" min="0" value={spaLength}
                            onChange={(e) => setSpaLength(e.target.value)} placeholder="e.g. 7" className={fieldClass} />
                        </div>
                        <div>
                          <label htmlFor="spaWidth" className="text-xs text-muted block mb-1">Width ({unitL})</label>
                          <input id="spaWidth" type="number" inputMode="decimal" min="0" value={spaWidth}
                            onChange={(e) => setSpaWidth(e.target.value)} placeholder="e.g. 7" className={fieldClass} />
                        </div>
                        <div>
                          <label htmlFor="spaDepth" className="text-xs text-muted block mb-1">Avg depth ({unitL})</label>
                          <input id="spaDepth" type="number" inputMode="decimal" min="0" value={spaDepth}
                            onChange={(e) => setSpaDepth(e.target.value)} placeholder="e.g. 3.5" className={fieldClass} />
                        </div>
                      </div>
                      <div className="rounded-lg border border-line bg-card p-3">
                        <SimpleSpaDiagram topW={Math.max(num(spaLength), num(spaWidth))} depth={num(spaDepth)} unitLabel={unitL} />
                      </div>
                    </div>
                  )}

                  {/* Spa with seat — inputs first, then cross-section diagram
                      below (mirrors the pool sloped-sections layout). */}
                  {spaHasSeat && (
                    <div className="space-y-3">
                      {spaShape === 'round' ? (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label htmlFor="spaTopDiameter" className="text-xs text-muted block mb-1">Top diameter ({unitL})</label>
                            <input id="spaTopDiameter" type="number" inputMode="decimal" min="0" value={spaTopDiameter}
                              onChange={(e) => setSpaTopDiameter(e.target.value)} placeholder="e.g. 7" className={fieldClass} />
                          </div>
                          <div>
                            <label htmlFor="spaBottomDiameter" className="text-xs text-muted block mb-1">Bottom diameter — outer wall ({unitL})</label>
                            <input id="spaBottomDiameter" type="number" inputMode="decimal" min="0" value={spaBottomDiameter}
                              onChange={(e) => setSpaBottomDiameter(e.target.value)} placeholder="e.g. 5" className={fieldClass} />
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <p className="text-xs text-muted">Top section (above seat)</p>
                            <input type="number" inputMode="decimal" min="0" value={spaTopLength}
                              aria-label={`Spa top section length (${unitL})`}
                              onChange={(e) => setSpaTopLength(e.target.value)} placeholder={`Length (${unitL})`} className={fieldClass} />
                            <input type="number" inputMode="decimal" min="0" value={spaTopWidth}
                              aria-label={`Spa top section width (${unitL})`}
                              onChange={(e) => setSpaTopWidth(e.target.value)} placeholder={`Width (${unitL})`} className={fieldClass} />
                          </div>
                          <div className="space-y-2">
                            <p className="text-xs text-muted">Bottom — outer wall (below seat)</p>
                            <input type="number" inputMode="decimal" min="0" value={spaBottomLength}
                              aria-label={`Spa bottom section length (${unitL})`}
                              onChange={(e) => setSpaBottomLength(e.target.value)} placeholder={`Length (${unitL})`} className={fieldClass} />
                            <input type="number" inputMode="decimal" min="0" value={spaBottomWidth}
                              aria-label={`Spa bottom section width (${unitL})`}
                              onChange={(e) => setSpaBottomWidth(e.target.value)} placeholder={`Width (${unitL})`} className={fieldClass} />
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label htmlFor="spaAboveSeatDepth" className="text-xs text-muted block mb-1">Above-seat depth ({unitL})</label>
                          <input id="spaAboveSeatDepth" type="number" inputMode="decimal" min="0" value={spaAboveSeatDepth}
                            onChange={(e) => setSpaAboveSeatDepth(e.target.value)} placeholder="e.g. 1.5" className={fieldClass} />
                        </div>
                        <div>
                          <label htmlFor="spaBelowSeatDepth" className="text-xs text-muted block mb-1">Below-seat depth ({unitL})</label>
                          <input id="spaBelowSeatDepth" type="number" inputMode="decimal" min="0" value={spaBelowSeatDepth}
                            onChange={(e) => setSpaBelowSeatDepth(e.target.value)} placeholder="e.g. 2" className={fieldClass} />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="spaSeatWidth" className="text-xs text-muted block mb-1">Seat width per side ({unitL})</label>
                        <input id="spaSeatWidth" type="number" inputMode="decimal" min="0" value={spaSeatWidth}
                          onChange={(e) => setSpaSeatWidth(e.target.value)} placeholder="e.g. 1" className={fieldClass} />
                        <p className="text-[11px] text-subtle mt-1">
                          How far the bench protrudes inward from each side. The footwell water width is calculated as bottom diameter − 2 × seat width.
                        </p>
                      </div>

                      <div className="rounded-lg border border-line bg-card p-3 mt-2">
                        <SpaCrossSection
                          topW={
                            spaShape === 'round'
                              ? num(spaTopDiameter)
                              : Math.max(num(spaTopLength), num(spaTopWidth))
                          }
                          /* The diagram's lower section is the FOOTWELL water
                             cavity = bottom (outer wall) − 2 × seat width. */
                          botW={
                            spaShape === 'round'
                              ? Math.max(0, num(spaBottomDiameter) - 2 * num(spaSeatWidth))
                              : Math.max(
                                  0,
                                  Math.max(num(spaBottomLength), num(spaBottomWidth)) - 2 * num(spaSeatWidth),
                                )
                          }
                          aboveD={num(spaAboveSeatDepth)}
                          belowD={num(spaBelowSeatDepth)}
                          seatW={num(spaSeatWidth)}
                          unitLabel={unitL}
                        />
                      </div>
                    </div>
                  )}

                </div>
              </div>
            )}

            <div className="flex items-start gap-2 mt-4 mb-6">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-subtle" />
              <p className="text-xs text-subtle leading-relaxed">
                {calcMode === 'spa'
                  ? 'Measure the depth of your water, not the height of the spa wall.'
                  : <>Measure the depth of your <em>water</em>, not the height of the wall. For pools with a slope, use Shallow + Deep so we average correctly.</>}
              </p>
            </div>

            {/* Result */}
            <div className="rounded-2xl bg-gradient-to-br from-brand-blue/15 to-brand-orange/10 border border-line p-6 text-center">
              <p className="text-xs uppercase tracking-[0.15em] text-muted mb-1">
                {calcMode === 'spa'
                  ? 'Estimated spa volume'
                  : calcMode === 'pool+spa' && spaGallons > 0 && gallons > 0
                    ? 'Combined volume (pool + spa)'
                    : 'Estimated volume'}
              </p>
              <p className="font-display font-bold text-fg text-4xl sm:text-5xl tabular-nums">
                {totalGallons > 0 ? displayVolume : '—'}
                {totalGallons > 0 && <span className="text-2xl text-muted font-semibold ml-2">{volumeUnitLabel}</span>}
              </p>
              {totalGallons > 0 && volumeUnit === 'gal' && (
                <p className="text-subtle text-sm mt-1 tabular-nums">≈ {formatGallons(totalGallons, 'L')} liters</p>
              )}
              {totalGallons > 0 && volumeUnit === 'L' && (
                <p className="text-subtle text-sm mt-1 tabular-nums">≈ {formatGallons(totalGallons, 'gal')} gallons</p>
              )}
              {totalGallons === 0 && (
                <p className="text-subtle text-sm mt-1">
                  Enter your {calcMode === 'spa' ? "spa's" : "pool's"} dimensions above.
                </p>
              )}

              {/* Pool + Spa breakdown (only when both contribute) */}
              {spaEnabled && spaGallons > 0 && gallons > 0 && (
                <p className="text-muted text-sm mt-3 tabular-nums">
                  Pool {formatGallons(gallons, volumeUnit)}
                  <span className="text-faint mx-1.5">+</span>
                  Spa {formatGallons(spaGallons, volumeUnit)}
                  <span className="text-faint mx-1.5">=</span>
                  <span className="text-fg font-semibold">{displayVolume}</span>
                </p>
              )}

              {totalGallons > 0 && (
                <div className="mt-5 space-y-3">
                  <div className="flex flex-wrap items-center justify-center gap-2.5">
                    <ShareButton url={shareUrl} shareTitle="Pool Volume Calculator — Free Pool Tools" />
                    <button
                      type="button"
                      onClick={() => {
                        saveProfile({ volumeGal: Math.round(totalGallons) });
                        setSavedPool(true);
                        setTimeout(() => setSavedPool(false), 2000);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-card-2 px-3 py-2 text-sm font-semibold text-muted hover:text-fg hover:border-line-strong transition-colors"
                    >
                      {savedPool ? <Check className="w-4 h-4 text-brand-orange" /> : <Save className="w-4 h-4" />}
                      {savedPool ? 'Saved to My Pool' : 'Save to My Pool'}
                    </button>
                    <Link
                      to={`/chlorine-calculator/?v=${Math.round(totalGallons)}&u=gal`}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-brand-blue text-white px-3 py-2 text-sm font-semibold hover:bg-brand-blue-dark transition-colors"
                    >
                      <FlaskConical className="w-4 h-4" />
                      Use in Chlorine Calculator
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                  <p className="text-[11px] text-subtle text-center max-w-md mx-auto">
                    Servicing more than one pool? You don’t have to save — “Use in Chlorine
                    Calculator” carries this volume over without storing anything.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Embedded widget: attribution backlink + report height to the host. */}
        {embed && <PoweredByEmbed />}

        {/* Everything below the calculator is the SEO page — hidden in embeds. */}
        {!embed && (
          <>
        {/* Formula transparency panel — collapsed by default so the formula
            doesn't intimidate; still in the HTML (crawlable) and one tap away. */}
        {gallons > 0 && shape !== 'freeform' && calcMode !== 'spa' && (
          <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
            <details className="group rounded-2xl border border-line bg-card">
              <summary className="list-none cursor-pointer flex items-center justify-between gap-3 px-5 sm:px-6 py-4">
                <span className="text-xs uppercase tracking-[0.15em] text-subtle font-semibold">Show the math</span>
                <span className="text-subtle transition-transform duration-200 group-open:rotate-45 group-open:text-brand-orange">
                  <Plus className="w-4 h-4" />
                </span>
              </summary>
              <div className="px-5 sm:px-6 pb-5">
                <p className="font-mono text-sm text-muted break-words">{formula}</p>
                <p className="text-xs text-subtle mt-2">7.48 = U.S. gallons in 1 cubic foot of water.</p>
              </div>
            </details>
          </section>
        )}

        {/* Measurement tips (pool-specific) — 2×2 icon-card grid matching the
            chemical-care section pattern on the How It Works page. */}
        {calcMode !== 'spa' && (
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
          <div className="mb-6">
            <h2 className="font-display font-bold text-fg text-xl sm:text-2xl mb-2">
              How to measure your pool accurately
            </h2>
            <p className="text-muted text-sm">
              Four quick tips for getting the right numbers into the fields above. The surface
              dimensions are easy — it’s depth that trips most people up, and depth is what moves
              your gallon count the most, so it’s worth measuring carefully rather than guessing.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                icon: Ruler,
                title: 'Measure water depth, not wall height',
                text: 'Use a marked pole or weighted tape from the waterline straight down to the floor.',
              },
              {
                icon: Layers,
                title: 'For sloped pools, use Shallow + Deep',
                text: 'Enter both depths in the Depth section and we average them — or use Sloped sections for a section-accurate result.',
              },
              {
                icon: Maximize2,
                title: 'For ovals and kidneys',
                text: 'Measure the widest points across the long axis and the short axis — that\'s what goes into Length and Width.',
              },
              {
                icon: Shapes,
                title: 'Got a freeform pool?',
                text: 'Mentally break it into rectangles and circles. Use Freeform mode and add each section separately — we sum them.',
              },
            ].map((card) => (
              <div
                key={card.title}
                className="rounded-2xl border border-line bg-card p-5 sm:p-6 hover:bg-card-2 transition-colors"
              >
                <span className="w-10 h-10 rounded-xl bg-brand-orange/15 flex items-center justify-center mb-4">
                  <card.icon className="w-[18px] h-[18px] text-brand-orange" />
                </span>
                <h3 className="text-fg font-display font-bold text-base mb-1.5 leading-snug">
                  {card.title}
                </h3>
                <p className="text-muted text-[14px] leading-relaxed">{card.text}</p>
              </div>
            ))}
          </div>
          <p className="text-muted text-[15px] leading-relaxed mt-6 max-w-3xl">
            Why the fuss about depth? Because volume scales directly with it: in a 16-by-32-foot pool,
            every extra foot of average depth adds nearly 3,800 gallons. Get the length and width a few
            inches off and your total barely moves, but misjudge the average depth by a foot and you can
            be off by 15–20% — enough to throw every chemical dose that depends on this number. If your
            pool slopes, measure the shallow and deep ends and let the calculator average them; if it has
            distinct flat and sloped sections, the sloped-sections mode is more accurate still. When you
            genuinely can’t tell, round the depth down slightly so you don’t overstate your gallons.
          </p>
        </section>
        )}

        {/* Reference chart (pool-specific) */}
        {calcMode !== 'spa' && (
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <h2 className="font-display font-bold text-fg text-xl sm:text-2xl mb-2">
            Common pool sizes
          </h2>
          <p className="text-muted text-sm mb-5">
            Approximate gallons for standard residential pool dimensions.
          </p>
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line">
                  <th className="py-3 px-3 font-semibold text-muted">Shape</th>
                  <th className="py-3 px-3 font-semibold text-muted">Dimensions</th>
                  <th className="py-3 px-3 font-semibold text-muted text-right">
                    {volumeUnit === 'L' ? 'Liters' : 'Gallons'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {REFERENCE_SIZES.map((row, i) => (
                  <tr key={i} className="border-b border-line hover:bg-card">
                    <td className="py-3 px-3 text-muted">{row.shape}</td>
                    <td className="py-3 px-3 text-muted tabular-nums">{row.size}</td>
                    <td className="py-3 px-3 text-fg font-semibold tabular-nums text-right">
                      {formatGallons(row.gallons, volumeUnit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        )}

        {/* Common questions — high-intent search queries. The data is the
            same array that backs the FAQPage JSON-LD in <head>, so the on-page
            content matches the structured data Google reads. */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <h2 className="font-display font-bold text-fg text-xl sm:text-2xl mb-2">
            Common questions
          </h2>
          <p className="text-muted text-sm mb-5">
            Quick answers to the questions homeowners ask about pool volume.
          </p>
          <div className="rounded-2xl border border-line bg-card divide-y divide-line">
            {COMMON_QUESTIONS.map((item) => (
              <details key={item.q} className="group">
                <summary className="list-none cursor-pointer flex items-start justify-between gap-4 px-5 sm:px-6 py-4 text-left">
                  <span className="font-display font-normal text-fg text-[15px] sm:text-base leading-snug">
                    {item.q}
                  </span>
                  <span className="shrink-0 mt-0.5 text-muted transition-transform duration-200 group-open:rotate-45 group-open:text-brand-orange">
                    <Plus className="w-5 h-5" />
                  </span>
                </summary>
                <p className="px-5 sm:px-6 pb-5 -mt-1 text-muted leading-relaxed text-[15px]">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* Embed-this-calculator — the link-earning widget for pool companies. */}
        <EmbedSnippet />

        {/* Cross-links to the other tools — internal linking keeps users on-site
            and spreads crawl equity (the site monetizes pageviews, not leads). */}
        <RelatedTools currentPath="/pool-volume-calculator" />

        <Footer />
          </>
        )}
      </div>

    </div>
  );
};

export const PoolVolumeCalculatorPage = ({ embed = false }: { embed?: boolean } = {}) => (
  <PoolVolumeCalculatorInner embed={embed} />
);
