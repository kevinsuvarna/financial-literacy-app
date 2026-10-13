import { cx } from '../../components/ui';
import type { Point } from './geometry';

interface RedStringProps {
  /** The size of the surface the string is pinned to, in pixels. */
  width: number;
  height: number;
  from: Point;
  to: Point;
  /** Draws the string from one pin to the other; otherwise it is simply there. */
  animate: boolean;
}

/** How far the string sags between its pins, in pixels. */
const SAG = 6;

/** Investigation-board red string between two pins, laid over its (positioned) parent. */
export function RedString({ width, height, from, to, animate }: RedStringProps) {
  const middle = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 + SAG };

  return (
    <svg
      aria-hidden="true"
      data-testid="red-string"
      viewBox={`0 0 ${width} ${height}`}
      className="pointer-events-none absolute inset-0 size-full overflow-visible"
    >
      <path
        d={`M ${from.x} ${from.y} Q ${middle.x} ${middle.y} ${to.x} ${to.y}`}
        pathLength={1}
        strokeDasharray={1}
        fill="none"
        strokeWidth={3}
        strokeLinecap="round"
        className={cx('stroke-clue', animate && 'animate-string')}
      />
      <circle cx={from.x} cy={from.y} r={6} className="fill-clue" />
      <circle cx={to.x} cy={to.y} r={6} className="fill-clue" />
    </svg>
  );
}
