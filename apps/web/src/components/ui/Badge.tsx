import type { ComponentPropsWithoutRef } from 'react';
import { cx } from './cx';

export type BadgeTone = 'neutral' | 'accent' | 'success' | 'clue' | 'gold';

const tones: Record<BadgeTone, string> = {
  neutral: 'border-current',
  accent: 'border-accent-strong bg-accent text-on-accent',
  success: 'border-success bg-success-soft text-success',
  clue: 'border-clue bg-clue-soft text-clue',
  gold: 'border-gold bg-gold text-ink',
};

export function Badge({
  tone = 'neutral',
  className,
  ...rest
}: ComponentPropsWithoutRef<'span'> & { tone?: BadgeTone }) {
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-control border px-2.5 py-0.5 text-xs font-semibold',
        tones[tone],
        className,
      )}
      {...rest}
    />
  );
}
