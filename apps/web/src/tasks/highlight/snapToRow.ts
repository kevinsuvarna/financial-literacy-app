export interface RowRect {
  id: string;
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface Point {
  x: number;
  y: number;
}

/** How far outside a row the highlighter's tip may be and still snap to it, in pixels. */
export const SNAP_MARGIN = 14;

/**
 * Which row the highlighter's tip is on. A point inside a row picks that row; a point just
 * outside the rows (within `margin`) snaps to the nearest one, so the first and last rows and
 * the edges of the page are as easy to hit as the middle. Anything further away is no row.
 */
export function snapToRow(
  rows: RowRect[],
  point: Point,
  margin: number = SNAP_MARGIN,
): string | null {
  let nearest: { id: string; distance: number } | null = null;

  for (const row of rows) {
    if (point.x < row.left - margin || point.x > row.right + margin) continue;

    // Top edge inclusive, bottom exclusive: a point on the line between two rows is the lower's.
    if (point.y >= row.top && point.y < row.bottom) return row.id;

    const distance = point.y < row.top ? row.top - point.y : point.y - row.bottom;
    if (distance > margin) continue;
    if (nearest === null || distance < nearest.distance) nearest = { id: row.id, distance };
  }

  return nearest?.id ?? null;
}
