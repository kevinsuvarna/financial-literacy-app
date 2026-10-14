import type { ReactNode } from 'react';
import { cx } from './cx';
import { PaperclipIcon } from './icons';

interface PaperThumbnailProps {
  /** Printed across the top of the page. */
  title: string;
  /** Shows the page as not there yet: a faint outline of where it will go. */
  ghost?: boolean;
  className?: string;
}

/**
 * A miniature sheet of paper held by a paperclip — a stand-in for a document, not a copy of
 * it. Decorative: name the document in text beside it.
 */
export function PaperThumbnail({ title, ghost = false, className }: PaperThumbnailProps) {
  return (
    <span
      aria-hidden="true"
      data-paper={ghost ? 'ghost' : 'page'}
      className={cx(
        'relative flex h-24 w-20 shrink-0 flex-col gap-1.5 rounded-sm border p-2 text-left',
        ghost
          ? 'border-dashed border-ink-muted opacity-40'
          : 'border-line bg-surface text-ink shadow-md',
        className,
      )}
    >
      {!ghost && (
        <PaperclipIcon className="absolute -top-3 right-2 size-6 rotate-12 text-ink-muted" />
      )}
      <span className="font-display text-[0.5rem] leading-tight font-bold tracking-wider uppercase">
        {title}
      </span>
      <span className="h-0.5 w-full bg-line" />
      <span className="h-0.5 w-4/5 bg-line" />
      <span className="h-0.5 w-full bg-line" />
      <span className="h-0.5 w-3/5 bg-line" />
    </span>
  );
}

interface SealProps {
  children: ReactNode;
  /** Slams the seal down as it mounts. */
  animate?: boolean;
  className?: string;
}

/**
 * A round official seal with its wording inside. Unlike `Stamp` this is content, not
 * decoration: what it says is read out.
 */
export function Seal({ children, animate = false, className }: SealProps) {
  return (
    <div
      className={cx(
        'flex size-44 -rotate-6 flex-col items-center justify-center gap-1 rounded-control border-8 border-double border-gold p-5 text-center font-display font-bold tracking-widest text-gold uppercase print-colors',
        animate && 'animate-stamp',
        className,
      )}
    >
      <span aria-hidden="true" className="text-xl leading-none">
        ★
      </span>
      <span className="text-base leading-tight">{children}</span>
      <span aria-hidden="true" className="text-xs leading-none">
        ★ ★ ★
      </span>
    </div>
  );
}
