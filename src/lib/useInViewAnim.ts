import { useEffect, useRef, useState, type CSSProperties } from 'react';

/**
 * Scroll trigger for the animated SVG diagrams on guide pages. Returns a ref
 * for the <figure> plus the class string that arms the CSS in index.css:
 * `.diagram-anim` is only added after hydration (so prerendered / no-JS HTML
 * stays fully visible) and `.in-view` fires the draw/fade animations once the
 * figure enters the viewport. Animations are reduced-motion-gated in CSS.
 */
export function useInViewAnim<T extends HTMLElement = HTMLElement>(threshold = 0.4) {
  const ref = useRef<T | null>(null);
  const [phase, setPhase] = useState<'static' | 'armed' | 'in-view'>('static');

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    setPhase('armed');
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setPhase('in-view');
          io.disconnect();
        }
      },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);

  return {
    ref,
    cls: phase === 'static' ? '' : phase === 'armed' ? 'diagram-anim' : 'diagram-anim in-view',
  } as const;
}

/** Stagger helper: `style={animDelay(0.3)}` sets the `--d` delay read by the dgm-* classes. */
export const animDelay = (seconds: number) => ({ '--d': `${seconds}s` }) as CSSProperties;
