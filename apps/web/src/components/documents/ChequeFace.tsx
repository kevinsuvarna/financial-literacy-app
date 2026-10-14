import { chequeFieldValues, chequeHitZones, copy } from '@app/content';
import { cx } from '../ui';
import { zoneStyle } from './chequeLayout';

export interface ChequeFaceProps {
  /** Fields shown as the discrepancy. */
  mismatchZoneIds?: readonly string[];
  /** Fields glowing as a nudge. */
  glowingZoneIds?: readonly string[];
  /** Fields the player has already looked at and ruled out. */
  checkedZoneIds?: readonly string[];
}

/**
 * The printed face of the cheque: bank name and each field in its place. It fills its nearest
 * positioned ancestor, so the same component draws both the cheque and the magnified copy of
 * it inside the loupe. It has no behaviour of its own.
 */
export function ChequeFace({
  mismatchZoneIds = [],
  glowingZoneIds = [],
  checkedZoneIds = [],
}: ChequeFaceProps) {
  return (
    <div className="@container absolute inset-0 rounded-card border-2 border-line bg-surface-sunken text-ink">
      <span className="absolute top-[3%] left-[8%] font-display text-cheque font-bold tracking-widest">
        {copy.cheque.bank}
      </span>
      {chequeHitZones.map((zone) => {
        const mismatch = mismatchZoneIds.includes(zone.id);
        const checked = !mismatch && checkedZoneIds.includes(zone.id);
        return (
          <div
            key={zone.id}
            data-zone={zone.id}
            style={zoneStyle(zone)}
            className={cx(
              'absolute flex items-center gap-1.5 overflow-hidden rounded-sm border px-2 text-cheque',
              mismatch && 'border-2 border-clue bg-clue-soft font-bold',
              checked && 'border-dashed border-line bg-surface text-ink-muted',
              !mismatch && !checked && 'border-dashed border-ink-muted bg-surface',
              glowingZoneIds.includes(zone.id) && 'animate-glow ring-2 ring-gold/70',
            )}
          >
            <span className="shrink-0 text-cheque-caption tracking-wide text-ink-muted uppercase">
              {zone.caption}
            </span>
            <span className="truncate">{chequeFieldValues[zone.id]}</span>
          </div>
        );
      })}
    </div>
  );
}
