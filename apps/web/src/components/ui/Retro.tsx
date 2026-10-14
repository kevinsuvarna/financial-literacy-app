import type { ComponentProps, ReactNode } from 'react';
import { cx } from './cx';

// The parts of an old desktop computer: its plastic casing, its CRT, its keys and its lamps.

/** The beige plastic box everything else is set into. */
export function Casing({ className, ...rest }: ComponentProps<'div'>) {
  return (
    <div
      className={cx(
        'rounded-card border-4 border-casing-shade bg-casing p-4 text-ink shadow-xl',
        className,
      )}
      {...rest}
    />
  );
}

interface CrtScreenProps extends ComponentProps<'div'> {
  /** Plays the tube warming up, once, as the screen mounts. */
  poweringOn?: boolean;
  /**
   * Jolts the picture. Zero is still; any other number shakes, and a *different* number shakes
   * again — pass a count of whatever causes the jolt.
   */
  shake?: number;
  children: ReactNode;
}

/**
 * A CRT: green phosphor on dark glass, with scanlines and a slight flicker.
 *
 * The scanlines and the flicker are texture, not information, and both go away under
 * `prefers-reduced-motion` — as do the warm-up and the shake (CLAUDE.md rule 6).
 */
export function CrtScreen({
  poweringOn = false,
  shake = 0,
  className,
  children,
  ...rest
}: CrtScreenProps) {
  return (
    <div
      className={cx(
        'relative overflow-hidden rounded-card border-4 border-ink bg-crt bg-crt-glass font-display text-phosphor shadow-inner',
        className,
      )}
      {...rest}
    >
      <div
        data-crt="picture"
        className={cx(
          'motion-reduce:animate-none',
          shake > 0 && (shake % 2 === 1 ? 'animate-shake' : 'animate-shake-again'),
        )}
      >
        <div className={cx(poweringOn && 'animate-crt-on motion-reduce:animate-none')}>
          <div
            data-crt="flicker"
            className="flex animate-crt-flicker flex-col gap-3 p-4 text-glow motion-reduce:animate-none"
          >
            {children}
          </div>
        </div>
      </div>
      <div
        aria-hidden="true"
        data-crt="scanlines"
        className="pointer-events-none absolute inset-0 bg-scanlines motion-reduce:hidden"
      />
    </div>
  );
}

/** A blinking block cursor. Steady under reduced motion. */
export function CrtCursor() {
  return (
    <span
      aria-hidden="true"
      className="inline-block h-1 w-5 animate-blink bg-current motion-reduce:animate-none"
    />
  );
}

interface DisplayCellProps {
  children?: ReactNode;
  /** The cell the next digit will land in. */
  active?: boolean;
  /** A smaller cell, for showing a code that isn't the one being entered. */
  small?: boolean;
  tone?: 'bright' | 'dim';
}

/** One digit of a readout. Decorative: say what the readout holds in text beside it. */
export function DisplayCell({
  children,
  active = false,
  small = false,
  tone = 'bright',
}: DisplayCellProps) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        'flex items-end justify-center rounded-sm border-2 bg-crt font-bold',
        small ? 'h-9 w-8 pb-1 text-lg' : 'h-16 w-12 pb-2 text-4xl',
        tone === 'dim' ? 'border-phosphor-dim text-phosphor-dim' : 'text-phosphor',
        tone === 'bright' && (active ? 'border-phosphor' : 'border-phosphor-dim'),
      )}
    >
      {children}
    </span>
  );
}

export type SignalLightState = 'on' | 'half' | 'off';

const lightTones: Record<SignalLightState, string> = {
  on: 'border-phosphor bg-phosphor text-crt',
  half: 'border-phosphor-amber bg-phosphor-amber text-crt',
  off: 'border-phosphor-dim text-phosphor-dim',
};

/**
 * A small lamp. It carries a symbol as well as a colour, so its state never depends on telling
 * green from amber. Decorative: say what it means in text beside it.
 */
export function SignalLight({ state, symbol }: { state: SignalLightState; symbol: string }) {
  return (
    <span
      aria-hidden="true"
      data-light={state}
      className={cx(
        'flex size-7 shrink-0 items-center justify-center rounded-control border-2 font-body text-sm leading-none font-bold text-shadow-none',
        lightTones[state],
      )}
    >
      {symbol}
    </span>
  );
}

interface KeyCapProps extends Omit<ComponentProps<'button'>, 'disabled'> {
  tone?: 'plain' | 'action';
  /** Shows the key held down — for a press that came from the real keyboard. */
  pressed?: boolean;
  /**
   * The key does nothing right now. It is marked `aria-disabled` rather than `disabled`, so
   * that a key going dead under a keyboard user's finger doesn't throw their focus away.
   */
  inactive?: boolean;
}

const keyTones = {
  plain: 'bg-surface text-ink',
  action: 'bg-accent text-on-accent',
};

const keyHovers = {
  plain: 'hover:bg-notice-soft',
  action: 'hover:bg-accent-strong hover:text-surface',
};

/** A chunky key that sinks when pressed. */
export function KeyCap({
  tone = 'plain',
  pressed = false,
  inactive = false,
  className,
  type = 'button',
  onClick,
  ...rest
}: KeyCapProps) {
  return (
    <button
      type={type}
      aria-disabled={inactive || undefined}
      data-pressed={pressed || undefined}
      onClick={inactive ? undefined : onClick}
      className={cx(
        'flex h-12 min-w-12 items-center justify-center rounded-md border border-casing-shade font-display text-lg font-bold shadow-sm transition-transform select-none motion-reduce:transition-none',
        pressed ? 'translate-y-0.5 border-b' : 'border-b-4',
        keyTones[tone],
        inactive
          ? 'cursor-not-allowed opacity-50'
          : cx('cursor-pointer active:translate-y-0.5 active:border-b', keyHovers[tone]),
        className,
      )}
      {...rest}
    />
  );
}
