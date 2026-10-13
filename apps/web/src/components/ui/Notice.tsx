import type { ComponentPropsWithoutRef } from 'react';
import { cx } from './cx';

export type NoticeTone = 'success' | 'retry' | 'info';

const tones: Record<NoticeTone, string> = {
  success: 'border-success bg-success-soft text-ink',
  retry: 'border-clue bg-clue-soft text-ink',
  info: 'border-gold bg-notice-soft text-ink',
};

/** A polite live region, so feedback after a scan/tap is announced without stealing focus. */
export function Notice({
  tone = 'info',
  className,
  ...rest
}: ComponentPropsWithoutRef<'div'> & { tone?: NoticeTone }) {
  return (
    <div
      role="status"
      className={cx('rounded-card border-l-4 px-4 py-3 text-sm', tones[tone], className)}
      {...rest}
    />
  );
}
