import { type ReactNode } from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

/**
 * Standard page frame: ambient mesh background + glow, fixed Navbar, and the
 * Footer. Wrap any page's content in this. (The reused calculator page renders
 * its own copy of this scaffold inline — that's fine, it predates this shell.)
 */
export const PageShell = ({ children }: { children: ReactNode }) => (
  <div className="force-static-motion min-h-screen bg-canvas relative overflow-x-hidden selection:bg-[#ff720f] selection:text-white">
    <div className="absolute md:fixed inset-0 bg-mesh opacity-50 pointer-events-none" />
    <div className="absolute md:fixed inset-0 page-glow pointer-events-none" />

    <div className="relative z-10">
      <Navbar />
      {children}
      <Footer />
    </div>
  </div>
);
