import type { ComponentProps, ReactNode } from 'react';
import { cx } from './cx';

// Things made to be printed and cut out. Their sizes are real ones — millimetres, from the
// theme's `--spacing-sheet-*` / `--spacing-card-*` tokens — so that what comes out of the
// printer at 100% is the size it says it is.

interface PrintSheetProps extends ComponentProps<'section'> {
  /** Small print in the bottom margin. */
  footer?: ReactNode;
}

/**
 * One A4 page. On screen it is shown as a sheet of paper; printed, it *is* the page: every
 * sheet starts a new one, and the page's own margin is zero because the sheet brings its own.
 */
export function PrintSheet({ footer, className, children, ...rest }: PrintSheetProps) {
  return (
    <section
      className={cx(
        'flex h-sheet-h w-sheet-w shrink-0 page-sheets break-after-page flex-col last:break-after-auto justify-between overflow-hidden bg-white p-sheet-margin text-ink shadow-xl print:shadow-none',
        className,
      )}
      {...rest}
    >
      {children}
      {footer && <footer className="text-center text-xs text-ink-muted">{footer}</footer>}
    </section>
  );
}

// Each corner gets two hairlines that point at it from outside the card: cut from line to line
// and the card comes out the right size, with no printed border left on its edge.
const cropMarks = [
  'top-0 right-full mr-crop-gap w-crop border-t',
  'left-0 bottom-full mb-crop-gap h-crop border-l',
  'top-0 left-full ml-crop-gap w-crop border-t',
  'right-0 bottom-full mb-crop-gap h-crop border-r',
  'bottom-0 right-full mr-crop-gap w-crop border-b',
  'left-0 top-full mt-crop-gap h-crop border-l',
  'bottom-0 left-full ml-crop-gap w-crop border-b',
  'right-0 top-full mt-crop-gap h-crop border-r',
];

/**
 * A card to cut out, with crop marks at its corners. The faint outline is a guide for laying
 * the card out; the crop marks are what to cut to. It is an outline rather than a border so
 * that it takes up no room: the card's box is exactly the card, and the marks are measured
 * from its true edge.
 */
export function CutCard({ className, children, ...rest }: ComponentProps<'article'>) {
  return (
    <article
      className={cx(
        'relative h-card-h w-card-w bg-white text-ink outline outline-line -outline-offset-1',
        className,
      )}
      {...rest}
    >
      {cropMarks.map((position) => (
        <span
          key={position}
          aria-hidden="true"
          data-crop-mark=""
          className={cx('absolute border-ink', position)}
        />
      ))}
      {children}
    </article>
  );
}
