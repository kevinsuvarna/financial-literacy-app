import { describe, expect, it } from 'vitest';
import { lensPositionFor, magnifiedOffset, zoneAtPoint, type ZoneRect } from './geometry';

const zones: ZoneRect[] = [
  { id: 'date', top: 10, bottom: 30, left: 300, right: 400 },
  { id: 'amount', top: 60, bottom: 90, left: 300, right: 400 },
];

describe('zoneAtPoint', () => {
  it('finds the zone containing the point', () => {
    expect(zoneAtPoint(zones, { x: 350, y: 20 })).toBe('date');
    expect(zoneAtPoint(zones, { x: 301, y: 89 })).toBe('amount');
  });

  it('is null between zones and outside them', () => {
    expect(zoneAtPoint(zones, { x: 350, y: 45 })).toBeNull();
    expect(zoneAtPoint(zones, { x: 100, y: 20 })).toBeNull();
    expect(zoneAtPoint([], { x: 0, y: 0 })).toBeNull();
  });

  it('includes the top-left edge and excludes the bottom-right edge', () => {
    expect(zoneAtPoint(zones, { x: 300, y: 10 })).toBe('date');
    expect(zoneAtPoint(zones, { x: 400, y: 20 })).toBeNull();
    expect(zoneAtPoint(zones, { x: 350, y: 30 })).toBeNull();
  });
});

describe('magnifiedOffset', () => {
  // A 160px loupe with an 8px rim (so 144px of glass), magnifying 2×.
  const offset = (lensPosition: number) => magnifiedOffset(lensPosition, 160, 144, 2);

  /** Where a point of the cheque ends up inside the glass, given the copy's offset. */
  const seenAt = (pointOnCheque: number, copyOffset: number) => copyOffset + pointOnCheque * 2;

  it('puts the point under the loupe’s centre at the centre of the glass', () => {
    const lensPosition = 200;
    const pointUnderCentre = lensPosition + 80;
    expect(seenAt(pointUnderCentre, offset(lensPosition))).toBe(72);
  });

  it('holds wherever the loupe is, including hanging off the cheque’s edge', () => {
    for (const lensPosition of [-80, 0, 37.5, 640]) {
      expect(seenAt(lensPosition + 80, offset(lensPosition))).toBe(72);
    }
  });

  it('moves the copy twice as far as the loupe, in the opposite direction', () => {
    expect(offset(110) - offset(100)).toBe(-20);
  });

  it('shows points beside the centre at twice their real distance from it', () => {
    const lensPosition = 200;
    const tenPixelsRightOfCentre = lensPosition + 80 + 10;
    expect(seenAt(tenPixelsRightOfCentre, offset(lensPosition))).toBe(72 + 20);
  });
});

describe('lensPositionFor', () => {
  it('centres the loupe on a point, and agrees with magnifiedOffset about it', () => {
    const lensPosition = lensPositionFor(350, 160);
    expect(lensPosition).toBe(270);
    expect(magnifiedOffset(lensPosition, 160, 144, 2) + 350 * 2).toBe(72);
  });
});
