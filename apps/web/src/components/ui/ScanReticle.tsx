import { cx } from './cx';

const corner = 'absolute size-8 border-gold';

/**
 * The scanner's "viewfinder". There is deliberately no camera preview behind it — the player
 * holds a card up to the device, they don't frame a shot. `active` runs the sweep line.
 */
export function ScanReticle({ active }: { active: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={cx(
        'relative aspect-square w-44 overflow-hidden rounded-card bg-canvas transition-opacity',
        !active && 'opacity-50',
      )}
    >
      <span className={cx(corner, 'top-3 left-3 rounded-tl-lg border-t-4 border-l-4')} />
      <span className={cx(corner, 'top-3 right-3 rounded-tr-lg border-t-4 border-r-4')} />
      <span className={cx(corner, 'bottom-3 left-3 rounded-bl-lg border-b-4 border-l-4')} />
      <span className={cx(corner, 'right-3 bottom-3 rounded-br-lg border-r-4 border-b-4')} />
      {active && (
        <span className="absolute inset-x-5 top-1/2 h-0.5 animate-scan-sweep bg-accent motion-reduce:animate-none" />
      )}
    </div>
  );
}
