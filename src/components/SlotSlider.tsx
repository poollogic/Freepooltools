import { useCallback, useEffect, useMemo, useRef, type PointerEvent as ReactPointerEvent, type KeyboardEvent as ReactKeyboardEvent } from 'react';

/**
 * Slot-machine / precision-ruler slider — a web port of the Suncoast field
 * app's SlotScaleStrip (React Native). The center indicator stays fixed while
 * the tick strip slides left/right; the value snaps to the tick under the
 * needle. Built for thumb-scrolling chemical readings on mobile, with mouse
 * drag + keyboard support on desktop.
 *
 * Uses native overflow scrolling + CSS scroll-snap (so touch flings feel
 * right), with edge spacers sized to `calc(50% - IW/2)` so the first and last
 * ticks can center under the needle — that makes the value index a clean
 * `round(scrollLeft / IW)` with no layout measurement needed.
 */

/** Tick slot width in px (must match the `w-6` on each tick = 1.5rem). */
const IW = 24;

const roundToStep = (v: number, step: number) => {
  if (step <= 0) return v;
  const inv = 1 / step;
  return Math.round(v * inv) / inv;
};

const buildValues = (min: number, max: number, step: number): number[] => {
  const out: number[] = [];
  for (let i = 0; i < 20000; i++) {
    const v = roundToStep(min + i * step, step);
    if (v > max + 1e-9) break;
    out.push(v);
  }
  return out;
};

const decimalsForStep = (step: number) => {
  if (step >= 1 - 1e-9) return 0;
  if (step >= 0.1 - 1e-9) return 1;
  return 2;
};

export type SlotSliderProps = {
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
  /** Label a "major" (numbered) tick every N ticks. Default 5. */
  majorEvery?: number;
  /** Accessible name for the slider. */
  ariaLabel: string;
};

export function SlotSlider({
  min,
  max,
  step,
  value,
  onChange,
  majorEvery = 5,
  ariaLabel,
}: SlotSliderProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);
  const commitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastEmitted = useRef(value);

  const values = useMemo(() => buildValues(min, max, step), [min, max, step]);
  const decimals = decimalsForStep(step);

  const indexForValue = useCallback(
    (v: number) => {
      const i = Math.round((v - min) / step);
      return Math.max(0, Math.min(values.length - 1, i));
    },
    [min, step, values.length],
  );

  const ticks = useMemo(
    () =>
      values.map((val, i) => {
        const isMajor = i % majorEvery === 0;
        const isMed = !isMajor && i % 2 === 0;
        return { val, isMajor, h: isMajor ? 28 : isMed ? 17 : 10, op: isMajor ? 0.7 : isMed ? 0.38 : 0.18 };
      }),
    [values, majorEvery],
  );

  // Sync scroll position when the value changes from outside (hydration, reset,
  // a sibling input) — but never while the user is actively dragging/flinging.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || isScrollingRef.current) return;
    if (value === lastEmitted.current) return;
    el.scrollLeft = indexForValue(value) * IW;
    lastEmitted.current = value;
  }, [value, indexForValue]);

  // Initial position on mount.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollLeft = indexForValue(value) * IW;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const commit = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const idx = Math.max(0, Math.min(values.length - 1, Math.round(el.scrollLeft / IW)));
    const next = values[idx];
    isScrollingRef.current = false;
    if (next !== lastEmitted.current) {
      lastEmitted.current = next;
      onChange(next);
      // Light haptic on supported devices.
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate?.(8);
    }
  }, [values, onChange]);

  const handleScroll = useCallback(() => {
    isScrollingRef.current = true;
    if (commitTimer.current) clearTimeout(commitTimer.current);
    commitTimer.current = setTimeout(commit, 120);
  }, [commit]);

  // Mouse drag-to-scroll (touch is handled natively by overflow scrolling).
  const drag = useRef<{ startX: number; startLeft: number } | null>(null);
  const onPointerDown = (e: ReactPointerEvent) => {
    if (e.pointerType === 'touch') return; // native scroll handles touch
    const el = scrollRef.current;
    if (!el) return;
    drag.current = { startX: e.clientX, startLeft: el.scrollLeft };
    el.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: ReactPointerEvent) => {
    const el = scrollRef.current;
    if (!drag.current || !el) return;
    el.scrollLeft = drag.current.startLeft - (e.clientX - drag.current.startX);
  };
  const endDrag = (e: ReactPointerEvent) => {
    if (!drag.current) return;
    drag.current = null;
    scrollRef.current?.releasePointerCapture?.(e.pointerId);
    commit();
  };

  // Keyboard a11y: arrows nudge by one step.
  const nudge = (delta: number) => {
    const idx = Math.max(0, Math.min(values.length - 1, indexForValue(value) + delta));
    const el = scrollRef.current;
    if (el) el.scrollLeft = idx * IW;
    const next = values[idx];
    if (next !== lastEmitted.current) {
      lastEmitted.current = next;
      onChange(next);
    }
  };
  const onKeyDown = (e: ReactKeyboardEvent) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); nudge(-1); }
    else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); nudge(1); }
    else if (e.key === 'Home') { e.preventDefault(); nudge(-values.length); }
    else if (e.key === 'End') { e.preventDefault(); nudge(values.length); }
  };

  return (
    <div className="mt-2">
      <div
        className="relative h-16 rounded-2xl border border-brand-blue/40 bg-card-2 overflow-hidden touch-pan-x"
        role="slider"
        tabIndex={0}
        aria-label={ariaLabel}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={value.toFixed(decimals)}
        onKeyDown={onKeyDown}
      >
        {/* Center selection band */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-1/2 -translate-x-1/2 w-11 bg-brand-blue/10 z-[2]"
        />
        {/* Edge fades */}
        <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-16 z-[3] bg-gradient-to-r from-card-2 to-transparent" />
        <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-16 z-[3] bg-gradient-to-l from-card-2 to-transparent" />
        {/* Top + bottom needles */}
        <div aria-hidden className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 z-[5] border-x-[5px] border-x-transparent border-t-[7px] border-t-brand-orange" />
        <div aria-hidden className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 z-[5] border-x-[5px] border-x-transparent border-b-[7px] border-b-brand-orange" />

        <div
          ref={scrollRef}
          className="flex h-full items-center overflow-x-scroll overflow-y-hidden snap-x snap-mandatory cursor-grab active:cursor-grabbing select-none"
          style={{ scrollbarWidth: 'none' }}
          onScroll={handleScroll}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          {/* Left spacer so tick 0 can center under the needle */}
          <div aria-hidden className="shrink-0" style={{ width: 'calc(50% - 12px)' }} />
          {ticks.map((t, i) => (
            <div key={i} className="w-6 shrink-0 snap-center flex flex-col items-center justify-center h-full">
              <div className="w-px rounded-full bg-fg" style={{ height: t.h, width: t.isMajor ? 2 : 1, opacity: t.op }} />
              {t.isMajor && (
                <span className="mt-1 text-[10px] font-semibold text-muted tabular-nums leading-none">
                  {t.val.toFixed(decimals)}
                </span>
              )}
            </div>
          ))}
          {/* Right spacer so the last tick can center */}
          <div aria-hidden className="shrink-0" style={{ width: 'calc(50% - 12px)' }} />
        </div>
      </div>

      <div className="flex justify-between px-1 mt-1.5 text-[11px] text-subtle tabular-nums">
        <span>{min.toFixed(decimals)}</span>
        <span>{max.toFixed(decimals)}</span>
      </div>
    </div>
  );
}
