import type { CSSProperties } from 'react';
import type { ChequeHitZone } from '@app/content';

/** Positions a field on the cheque from its percent hit-zone in packages/content. */
export function zoneStyle(zone: ChequeHitZone): CSSProperties {
  return {
    left: `${zone.x}%`,
    top: `${zone.y}%`,
    width: `${zone.width}%`,
    height: `${zone.height}%`,
  };
}
