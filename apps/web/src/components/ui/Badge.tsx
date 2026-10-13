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

interface BadgeProps extends ComponentPropsWithoutRef<'span'> {
  tone?: BadgeTone;
  /** Adds a pulsing "live" dot — for something that is on right now, like the scanner. */
  pulse?: boolean;
}

export function Badge({
  tone = 'neutral',
  pulse = false,
  className,
  children,
  ...rest
}: BadgeProps) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-control border px-2.5 py-0.5 text-xs font-semibold',
        tones[tone],
        className,
      )}
      {...rest}
    >
      {pulse && (
        <span aria-hidden="true" className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-control bg-current opacity-75 motion-reduce:animate-none" />
          <span className="relative inline-flex size-2 rounded-control bg-current" />
        </span>
      )}
      {children}
    </span>
  );
}
