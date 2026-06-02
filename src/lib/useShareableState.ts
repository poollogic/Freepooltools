import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/**
 * ─────────────────────────────────────────────────────────────────────────
 * Shareable URL state — the site-wide pattern for every calculator/tool.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Every tool's inputs live in ONE state object. You declare, per field, which
 * query param it maps to and how to encode/decode it. The hook then:
 *   1. Hydrates state from the URL on mount (so shared links restore exactly).
 *   2. Builds a `shareUrl` reactively (hand to <ShareButton url={shareUrl} />).
 *   3. Optionally keeps the address bar in sync (so reload/copy-from-bar work).
 *
 * SSR-safe: state starts at `defaults` (matching prerendered HTML); hydration
 * and URL sync run client-side only, after mount.
 *
 * Define `schema` as a MODULE-LEVEL const so its identity is stable.
 *
 * @example
 *   type State = { shape: 'rect' | 'round'; length: number; metric: boolean };
 *   const SCHEMA = {
 *     shape:  { param: 'shape', ...codecs.oneOf(['rect', 'round'] as const) },
 *     length: { param: 'l',     ...codecs.num() },
 *     metric: { param: 'm',     ...codecs.bool() },
 *   } satisfies ShareSchema<State>;
 *
 *   const { state, set, shareUrl } = useShareableState<State>(
 *     { shape: 'rect', length: 0, metric: false }, SCHEMA,
 *   );
 */

/** Converts a single field to/from its URL string form. */
export type ParamCodec<T> = {
  /** Return null to OMIT the param from the URL (e.g. empty/default values). */
  encode: (value: T) => string | null;
  /** Return undefined to keep the default (e.g. malformed input). */
  decode: (raw: string) => T | undefined;
};

export type ShareSchema<S> = {
  [K in keyof S]: { param: string } & ParamCodec<S[K]>;
};

type Options = {
  /** Mirror state into the address bar via history.replaceState (no history
   *  spam) so reloads and "copy URL from the bar" reflect current inputs.
   *  Default true. Runs client-side only, after hydration. */
  syncUrl?: boolean;
};

/** Ready-made codecs for the common field types. */
export const codecs = {
  /** Plain string. Empty string is omitted from the URL. */
  str(): ParamCodec<string> {
    return {
      encode: (v) => (v ? v : null),
      decode: (raw) => raw,
    };
  },
  /** Number. NaN / empty is omitted. Stored as its string form. */
  num(): ParamCodec<number> {
    return {
      encode: (v) => (Number.isFinite(v) && v !== 0 ? String(v) : v === 0 ? '0' : null),
      decode: (raw) => {
        const n = parseFloat(raw);
        return Number.isFinite(n) ? n : undefined;
      },
    };
  },
  /** A numeric value held as a STRING in state (common for controlled inputs,
   *  where "" means empty). Empty strings are omitted from the URL. */
  numStr(): ParamCodec<string> {
    return {
      encode: (v) => {
        const n = parseFloat(v);
        return v !== '' && Number.isFinite(n) ? v : null;
      },
      decode: (raw) => {
        const n = parseFloat(raw);
        return Number.isFinite(n) ? raw : undefined;
      },
    };
  },
  /** Boolean as 1 / absent. `false` is omitted (keeps URLs short). */
  bool(): ParamCodec<boolean> {
    return {
      encode: (v) => (v ? '1' : null),
      decode: (raw) => raw === '1' || raw === 'true',
    };
  },
  /** One of a fixed set of string literals; anything else is rejected. */
  oneOf<const T extends readonly string[]>(allowed: T): ParamCodec<T[number]> {
    return {
      encode: (v) => (v ? v : null),
      decode: (raw) => (allowed.includes(raw as T[number]) ? (raw as T[number]) : undefined),
    };
  },
  /** Arbitrary JSON-serializable value, URL-encoded. Use sparingly (long URLs);
   *  prefer flat scalar fields where possible. */
  json<T>(): ParamCodec<T> {
    return {
      encode: (v) => {
        try {
          return encodeURIComponent(JSON.stringify(v));
        } catch {
          return null;
        }
      },
      decode: (raw) => {
        try {
          return JSON.parse(decodeURIComponent(raw)) as T;
        } catch {
          return undefined;
        }
      },
    };
  },
};

export type ShareableState<S> = {
  /** Current input state. */
  state: S;
  /** Update a single field. */
  set: <K extends keyof S>(key: K, value: S[K]) => void;
  /** Merge a partial update. */
  patch: (partial: Partial<S>) => void;
  /** Restore the original defaults. */
  reset: () => void;
  /** Absolute, shareable URL for the current state (origin + path + query).
   *  During SSR this is just the query string; it resolves fully on the client. */
  shareUrl: string;
  /** True once the URL hydration pass has run (client only). */
  hydrated: boolean;
};

const buildQuery = <S extends Record<string, unknown>>(
  state: S,
  schema: ShareSchema<S>,
): URLSearchParams => {
  const params = new URLSearchParams();
  for (const key in schema) {
    const { param, encode } = schema[key];
    const encoded = encode(state[key]);
    if (encoded !== null && encoded !== undefined && encoded !== '') {
      params.set(param, encoded);
    }
  }
  return params;
};

export function useShareableState<S extends Record<string, unknown>>(
  defaults: S,
  schema: ShareSchema<S>,
  options: Options = {},
): ShareableState<S> {
  const { syncUrl = true } = options;
  // Freeze schema/defaults identity so effects don't re-run if a caller passes
  // them inline. (Defining them module-level is still recommended.)
  const schemaRef = useRef(schema);
  const defaultsRef = useRef(defaults);

  const [state, setState] = useState<S>(defaults);
  const hydratedRef = useRef(false);
  const [hydrated, setHydrated] = useState(false);

  // 1. Hydrate from the URL once, client-side.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if ([...params.keys()].length > 0) {
      setState((prev) => {
        const next = { ...prev };
        for (const key in schemaRef.current) {
          const { param, decode } = schemaRef.current[key];
          const raw = params.get(param);
          if (raw !== null) {
            const val = decode(raw);
            if (val !== undefined) next[key] = val;
          }
        }
        return next;
      });
    }
    hydratedRef.current = true;
    setHydrated(true);
  }, []);

  // Reactive query + absolute share URL.
  const query = useMemo(() => buildQuery(state, schemaRef.current).toString(), [state]);

  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined') return query ? `?${query}` : '';
    const base = `${window.location.origin}${window.location.pathname}`;
    return query ? `${base}?${query}` : base;
  }, [query]);

  // 2. Mirror state into the address bar (after hydration so we never clobber an
  //    incoming shared link before it's been read).
  useEffect(() => {
    if (!syncUrl || !hydratedRef.current || typeof window === 'undefined') return;
    const url = query
      ? `${window.location.pathname}?${query}`
      : window.location.pathname;
    window.history.replaceState(window.history.state, '', url);
  }, [query, syncUrl, hydrated]);

  const set = useCallback<ShareableState<S>['set']>((key, value) => {
    setState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const patch = useCallback((partial: Partial<S>) => {
    setState((prev) => ({ ...prev, ...partial }));
  }, []);

  const reset = useCallback(() => {
    setState(defaultsRef.current);
  }, []);

  return { state, set, patch, reset, shareUrl, hydrated };
}
