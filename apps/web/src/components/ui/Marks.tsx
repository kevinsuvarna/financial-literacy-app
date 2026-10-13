import type { ComponentProps, ReactNode } from 'react';
import { cx } from './cx';

/**
 * A highlighter stroke across whatever it is laid over (the parent must be `relative`).
 * `fading` is a mark that didn't stick: it draws, then wears off.
 */
export function InkStroke({
  fading = false,
  animate = true,
}: {
  fading?: boolean;
  animate?: boolean;
}) {
  return (
    <svg
      aria-hidden="true"
      data-ink={fading ? 'fading' : 'set'}
      viewBox="0 0 100 10"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-x-0 inset-y-1 h-[calc(100%-0.5rem)] w-full mix-blend-multiply"
    >
      <path
        d="M1 5.4 C 18 3.6, 34 6.6, 52 4.9 S 84 5.8, 99 4.5"
        pathLength={1}
        strokeDasharray={1}
        fill="none"
        strokeWidth={7.5}
        className={cx(
          'stroke-highlighter',
          fading ? 'animate-ink-fade' : animate && 'animate-ink-draw',
        )}
      />
    </svg>
  );
}

/** A tag held on by a red pin, for marking something as a clue. */
export function PinTag({ children, animate = false }: { children: ReactNode; animate?: boolean }) {
  return (
    <span
      className={cx(
        'ml-2 inline-flex rotate-2 items-center gap-1.5 rounded-sm border-2 border-clue bg-surface px-2 py-0.5 align-middle font-display text-xs font-bold tracking-widest text-clue shadow-md',
        animate && 'animate-stamp',
      )}
    >
      <span aria-hidden="true" className="size-2.5 rounded-control bg-clue shadow-sm" />
      {children}
    </span>
  );
}

/** A small sticky note — a short remark stuck onto the page. */
export function StickyNote({ className, ...rest }: ComponentProps<'div'>) {
  return (
    <div
      className={cx(
        'max-w-64 -rotate-1 rounded-sm border border-gold bg-notice-soft px-3 py-2 text-sm text-ink shadow-lg',
        className,
      )}
      {...rest}
    />
  );
}
