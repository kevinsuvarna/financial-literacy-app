import type { ComponentPropsWithoutRef } from 'react';
import { cx } from './cx';

export type StepDotState = 'completed' | 'open' | 'locked';

const states: Record<StepDotState, string> = {
  completed: 'border-accent bg-accent',
  open: 'border-on-canvas bg-transparent',
  locked: 'border-on-canvas-muted/50 bg-transparent',
};

interface StepDotProps extends Omit<ComponentPropsWithoutRef<'button'>, 'children'> {
  state: StepDotState;
  current?: boolean;
  /** Dots carry no visible text, so the accessible name is required. */
  'aria-label': string;
}

/** A 24px hit target wrapping a smaller visual dot. */
export function StepDot({ state, current = false, className, ...rest }: StepDotProps) {
  return (
    <button
      type="button"
      aria-current={current ? 'step' : undefined}
      className={cx(
        'inline-flex size-6 items-center justify-center rounded-control disabled:cursor-not-allowed',
        className,
      )}
      {...rest}
    >
      <span
        aria-hidden="true"
        className={cx(
          'block size-3 rounded-control border-2',
          states[state],
          current && 'ring-2 ring-gold ring-offset-2 ring-offset-canvas',
        )}
      />
    </button>
  );
}
