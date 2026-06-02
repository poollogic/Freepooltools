import { useId } from 'react';
import { cn } from '@/lib/utils';

/**
 * Free Pool Tools wordmark — a crafted gradient water-drop mark + the site name
 * with a blue-sheened "Pool". No external image, so it renders identically in
 * prerendered HTML. Idle bob + hover glow come from `.logo-mark` / `.logo-link`
 * in index.css (CSS-only, so they survive SSR and the mobile motion safety net).
 *
 * Wrap in an element with the `logo-link` class (e.g. the nav <Link>) to enable
 * the hover-glow interaction.
 */
export const Logo = ({ className }: { className?: string }) => {
  // Unique gradient ids so multiple logos on one page (nav + footer) don't clash.
  const id = useId();
  const dropGrad = `drop-${id}`;
  const ringGrad = `ring-${id}`;

  return (
    <span className={cn('inline-flex items-center gap-2.5 font-display font-bold', className)}>
      <span className="logo-mark relative inline-flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-brand-blue/25 via-brand-blue-dark/20 to-transparent ring-1 ring-brand-blue-light/30 shadow-[0_0_18px_-6px_rgba(74,147,209,0.6)]">
        <svg viewBox="0 0 24 24" className="w-[22px] h-[22px]" aria-hidden="true">
          <defs>
            <linearGradient id={dropGrad} x1="0" y1="0" x2="0.4" y2="1">
              <stop offset="0%" stopColor="#9fd6f7" />
              <stop offset="55%" stopColor="#4a93d1" />
              <stop offset="100%" stopColor="#1669AE" />
            </linearGradient>
            <linearGradient id={ringGrad} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#9fd6f7" />
              <stop offset="100%" stopColor="#1669AE" />
            </linearGradient>
          </defs>
          {/* Droplet body */}
          <path
            d="M12 2.5C12 2.5 4.5 11 4.5 16a7.5 7.5 0 0 0 15 0C19.5 11 12 2.5 12 2.5Z"
            fill={`url(#${dropGrad})`}
            stroke={`url(#${ringGrad})`}
            strokeWidth="0.9"
          />
          {/* Specular highlight */}
          <ellipse cx="9.4" cy="13" rx="1.5" ry="2.3" fill="#ffffff" opacity="0.45" />
          {/* Inner ripple curve */}
          <path
            d="M8.2 16.6a3.8 3.8 0 0 0 3.8 3.4"
            fill="none"
            stroke="#ffffff"
            strokeWidth="1.1"
            strokeLinecap="round"
            opacity="0.75"
          />
        </svg>
      </span>
      <span className="text-fg tracking-tight leading-none">
        Free<span className="wm-pool">Pool</span>Tools
      </span>
    </span>
  );
};
