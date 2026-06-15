import type { ReactNode } from 'react';
import { LazyMotion, MotionConfig, domAnimation } from 'motion/react';

/**
 * Motion runtime, scoped to the only pages that animate (home, guides hub, pool
 * volume diagrams). Deliberately kept OUT of main.tsx / entry-server.tsx: when
 * the provider lived at the app root, the ~80KB motion chunk sat in the critical
 * path of all 13 pages — pure parse/compile/hydrate cost (TBT/INP) on the 10
 * calculator pages that never animate. Importing it here means only the routes
 * that wrap their tree in <MotionProvider> pull motion into their chunk.
 *
 * reducedMotion="user" respects the OS "Reduce motion" setting; `strict` keeps
 * us on the lightweight `m.*` components (using full `motion.*` would throw).
 */
export const MotionProvider = ({ children }: { children: ReactNode }) => (
  <MotionConfig reducedMotion="user">
    <LazyMotion features={domAnimation} strict>
      {children}
    </LazyMotion>
  </MotionConfig>
);
