import type { ReactNode } from 'react';
import { cx } from './cx';

export type StampTone = 'success' | 'clue' | 'gold';

const tones: Record<StampTone, string> = {
  success: 'border-success text-success',
  clue: 'border-clue text-clue',
  gold: 'border-gold text-gold',
};

interface StampProps {
  children: ReactNode;
  tone?: StampTone;
  size?: 'md' | 'lg';
  /**
   * Slams the stamp down on mount; `'late'` waits for a line to finish drawing first. Leave
   * off for something that was already stamped.
   */
  animate?: boolean | 'late';
  className?: string;
}

/**
 * A rubber-stamp mark. Decorative: whatever it says must also be said in real text nearby, so
 * it is hidden from assistive tech.
 */
export function Stamp({
  children,
  tone = 'success',
  size = 'md',
  animate = false,
  className,
}: StampProps) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        'inline-block shrink-0 -rotate-6 rounded-sm border-4 border-double font-display font-bold tracking-widest whitespace-nowrap uppercase select-none',
        size === 'lg' ? 'px-5 py-2 text-2xl' : 'px-3 py-1 text-sm',
        tones[tone],
        animate === true && 'animate-stamp',
        animate === 'late' && 'animate-stamp-late',
        className,
      )}
    >
      {children}
    </span>
  );
}
