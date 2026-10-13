/** Geometry for the cheque investigation, kept free of React and the DOM so it can be tested. */

export interface ZoneRect {
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

/** The zone containing a point, or null. Used when a tap lands on the loupe instead of a zone. */
export function zoneAtPoint(zones: ZoneRect[], point: Point): string | null {
  const hit = zones.find(
    (zone) =>
      point.x >= zone.left && point.x < zone.right && point.y >= zone.top && point.y < zone.bottom,
  );
  return hit?.id ?? null;
}

/**
 * Where to put the magnified copy of the cheque inside the loupe, along one axis.
 *
 * The copy is the cheque scaled by `zoom` about its top-left corner. For the point of the
 * cheque under the loupe's centre to appear at the centre of the glass, the copy has to be
 * shifted so that point — now `zoom` times further from the corner — lands on the glass's
 * centre.
 *
 * @param lensPosition the loupe's top/left offset from the cheque's top/left corner
 * @param lensSize     the loupe's outer width/height
 * @param glassSize    the width/height of the glass itself, inside the loupe's rim
 */
export function magnifiedOffset(
  lensPosition: number,
  lensSize: number,
  glassSize: number,
  zoom: number,
): number {
  const pointUnderCentre = lensPosition + lensSize / 2;
  return glassSize / 2 - pointUnderCentre * zoom;
}

/** The loupe offset that centres it on a point of the cheque, along one axis. */
export function lensPositionFor(pointOnCheque: number, lensSize: number): number {
  return pointOnCheque - lensSize / 2;
}
