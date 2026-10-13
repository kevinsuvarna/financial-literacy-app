import { chequeFieldValues, chequeHitZones, copy, type ChequeHitZoneId } from '@app/content';
import { Card, Heading, cx } from '../ui';

interface ChequeViewProps {
  /** When given, every field becomes a button (a tap target that is also keyboard-operable). */
  onTapZone?: (zoneId: ChequeHitZoneId) => void;
  disabled?: boolean;
  highlightedZoneIds?: string[];
}

const zoneBase =
  'absolute flex items-center overflow-hidden rounded-sm border px-2 text-left text-xs leading-tight';

/** Lays the cheque's fields out from the percent hit-zones in packages/content. */
export function ChequeView({
  onTapZone,
  disabled = false,
  highlightedZoneIds = [],
}: ChequeViewProps) {
  return (
    <Card as="section" className="flex flex-col gap-3">
      <Heading level={2} size="section">
        {copy.cheque.heading}
      </Heading>
      <div className="overflow-x-auto p-1">
        <div className="relative aspect-11/5 min-w-xl rounded-card border-2 border-line bg-surface-sunken">
          {chequeHitZones.map((zone) => {
            const value = chequeFieldValues[zone.id];
            const name = copy.cheque.zone(zone.label, value);
            const className = cx(
              zoneBase,
              highlightedZoneIds.includes(zone.id)
                ? 'border-2 border-clue bg-clue-soft font-bold'
                : 'border-dashed border-ink-muted bg-surface',
              onTapZone && 'enabled:hover:bg-notice-soft disabled:cursor-not-allowed',
            );
            const style = {
              left: `${zone.x}%`,
              top: `${zone.y}%`,
              width: `${zone.width}%`,
              height: `${zone.height}%`,
            };

            return onTapZone ? (
              <button
                key={zone.id}
                type="button"
                aria-label={name}
                title={zone.label}
                disabled={disabled}
                className={className}
                style={style}
                onClick={() => onTapZone(zone.id)}
              >
                {value}
              </button>
            ) : (
              <div key={zone.id} title={zone.label} className={className} style={style}>
                <span className="sr-only">{zone.label}: </span>
                {value}
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
