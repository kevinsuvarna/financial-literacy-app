import { describe, expect, it } from 'vitest';
import { snapToRow, type RowRect } from './snapToRow';

// Three 40px rows stacked with no gaps, 100px in from the left and 400px wide.
const rows: RowRect[] = [
  { id: 'a', top: 100, bottom: 140, left: 100, right: 500 },
  { id: 'b', top: 140, bottom: 180, left: 100, right: 500 },
  { id: 'c', top: 180, bottom: 220, left: 100, right: 500 },
];

describe('snapToRow', () => {
  it('picks the row the point is inside', () => {
    expect(snapToRow(rows, { x: 300, y: 120 })).toBe('a');
    expect(snapToRow(rows, { x: 300, y: 160 })).toBe('b');
    expect(snapToRow(rows, { x: 300, y: 219 })).toBe('c');
  });

  it('gives a shared edge to the lower row, never to both or neither', () => {
    expect(snapToRow(rows, { x: 300, y: 140 })).toBe('b');
    expect(snapToRow(rows, { x: 300, y: 180 })).toBe('c');
  });

  it('snaps to the first or last row from just above or below the list', () => {
    expect(snapToRow(rows, { x: 300, y: 90 })).toBe('a');
    expect(snapToRow(rows, { x: 300, y: 230 })).toBe('c');
  });

  it('snaps from just beyond the left or right edge', () => {
    expect(snapToRow(rows, { x: 90, y: 160 })).toBe('b');
    expect(snapToRow(rows, { x: 510, y: 160 })).toBe('b');
  });

  it('is no row at all once the point is further away than the margin', () => {
    expect(snapToRow(rows, { x: 300, y: 80 })).toBeNull();
    expect(snapToRow(rows, { x: 300, y: 240 })).toBeNull();
    expect(snapToRow(rows, { x: 80, y: 160 })).toBeNull();
    expect(snapToRow(rows, { x: 520, y: 160 })).toBeNull();
  });

  it('honours a custom margin', () => {
    expect(snapToRow(rows, { x: 300, y: 60 }, 50)).toBe('a');
    expect(snapToRow(rows, { x: 300, y: 99 }, 0)).toBeNull();
  });

  it('picks the nearer row when rows have a gap between them', () => {
    const gapped: RowRect[] = [
      { id: 'top', top: 0, bottom: 40, left: 0, right: 100 },
      { id: 'bottom', top: 60, bottom: 100, left: 0, right: 100 },
    ];
    expect(snapToRow(gapped, { x: 50, y: 46 })).toBe('top');
    expect(snapToRow(gapped, { x: 50, y: 55 })).toBe('bottom');
  });

  it('is no row when there are no rows', () => {
    expect(snapToRow([], { x: 0, y: 0 })).toBeNull();
  });
});
