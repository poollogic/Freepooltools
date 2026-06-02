import { useCallback, useState } from 'react';
import { Link2, Check, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Drop-in "copy shareable link" button — the standard share UX for every tool.
 * Pair it with the `shareUrl` from useShareableState:
 *
 *   const { shareUrl } = useShareableState(defaults, SCHEMA);
 *   <ShareButton url={shareUrl} />
 *
 * On devices with the Web Share API (most phones) it opens the native share
 * sheet so users can text/email the link directly; otherwise it copies to the
 * clipboard and shows a "Link copied" confirmation.
 */
type ShareButtonProps = {
  url: string;
  /** Idle label. Default "Copy shareable link". */
  label?: string;
  /** Confirmation label after copy. Default "Link copied". */
  copiedLabel?: string;
  /** Title used by the native share sheet. */
  shareTitle?: string;
  /** Visual style. `link` = inline text button (default), `button` = solid pill. */
  variant?: 'link' | 'button';
  className?: string;
};

export const ShareButton = ({
  url,
  label = 'Copy shareable link',
  copiedLabel = 'Link copied',
  shareTitle = 'Free Pool Tools',
  variant = 'link',
  className,
}: ShareButtonProps) => {
  const [copied, setCopied] = useState(false);

  const handleClick = useCallback(async () => {
    // Prefer the native share sheet on mobile (lets users send straight to a
    // contact). Fall back to clipboard everywhere else, or if share is canceled.
    const canShare =
      typeof navigator !== 'undefined' &&
      typeof navigator.share === 'function' &&
      // matchMedia guards against desktop Chrome's no-op share dialog.
      typeof window !== 'undefined' &&
      window.matchMedia?.('(pointer: coarse)').matches;

    if (canShare) {
      try {
        await navigator.share({ title: shareTitle, url });
        return;
      } catch {
        /* user canceled or share failed — fall through to copy */
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable (insecure context) — nothing else we can do */
    }
  }, [url, shareTitle]);

  const icon = copied ? (
    <Check className="w-4 h-4" />
  ) : variant === 'button' ? (
    <Share2 className="w-4 h-4" />
  ) : (
    <Link2 className="w-4 h-4" />
  );

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-live="polite"
      className={cn(
        variant === 'button'
          ? 'btn btn-glass'
          : 'inline-flex items-center gap-1.5 text-sm font-semibold text-brand-orange hover:text-brand-orange-dark transition-colors',
        className,
      )}
    >
      {icon}
      {copied ? copiedLabel : label}
    </button>
  );
};
