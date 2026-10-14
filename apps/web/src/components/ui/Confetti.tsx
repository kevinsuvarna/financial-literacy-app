import { cx } from './cx';

const PIECES = 56;
const COLOURS = [
  'bg-gold',
  'bg-accent',
  'bg-highlighter',
  'bg-clue-soft',
  'bg-success-soft',
  'bg-on-canvas',
];

/**
 * Where piece `index` starts, when, and how fast it falls. Spread by arithmetic rather than
 * `Math.random()` so that rendering stays pure and every shower looks the same.
 */
function scatter(index: number) {
  return {
    left: `${(index * 37) % 100}%`,
    animationDelay: `${((index * 53) % 14) / 10}s`,
    animationDuration: `${2.4 + ((index * 29) % 16) / 10}s`,
  };
}

/**
 * A single shower of confetti over whatever it is laid on (the parent must be `relative` and
 * clip its overflow). It falls once and is gone; it never loops.
 *
 * Pure celebration, so it is hidden from assistive tech, from print, and entirely under
 * `prefers-reduced-motion` (CLAUDE.md rule 6).
 */
export function Confetti() {
  return (
    <div
      aria-hidden="true"
      data-testid="confetti"
      className="pointer-events-none absolute inset-0 overflow-hidden motion-reduce:hidden print:hidden"
    >
      {Array.from({ length: PIECES }, (_, index) => (
        <span
          key={index}
          className={cx(
            'absolute h-3 w-2 animate-confetti rounded-sm',
            COLOURS[index % COLOURS.length],
          )}
          style={scatter(index)}
        />
      ))}
    </div>
  );
}
