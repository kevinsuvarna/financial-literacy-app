import type { CSSProperties } from 'react'

/**
 * Level 2, Task 3 (mockups 10–10j): the statement lies on the desk in perspective. It's laid out
 * flat at 900 × 720 and projected onto the sheet's corners measured in 10:
 * (183, 376), (886, 376), (990, 834), (79, 834).
 */

export const HL_SHEET = { width: 900, height: 720 } as const

/** Flat → canvas homography (rows of the 3 × 3 matrix). */
const H = [
  [0.7811111111, -0.16949628, 183],
  [0, 0.3716398341, 376],
  [0, -0.0003171118429, 1],
] as const

export const HL_SHEET_TRANSFORM = `matrix3d(${H[0][0]}, ${H[1][0]}, 0, ${H[2][0]}, ${H[0][1]}, ${H[1][1]}, 0, ${H[2][1]}, 0, 0, 1, 0, ${H[0][2]}, ${H[1][2]}, 0, 1)`

/** A flat sheet point on the canvas. */
export function projectSheet(x: number, y: number): { x: number; y: number } {
  const w = H[2][0] * x + H[2][1] * y + H[2][2]
  return { x: (H[0][0] * x + H[0][1] * y + H[0][2]) / w, y: (H[1][0] * x + H[1][1] * y + H[1][2]) / w }
}

/** Row centres: the first at 208, then every 47.85 (measured on 10, un-warped). */
export const HL_ROW_Y0 = 208
export const HL_ROW_PITCH = 47.85

/** The highlighter's band across a row, in flat x (10b–10j). */
export const HL_BAND = { x0: 20, x1: 885, height: 30 } as const

/** The pen: its tip is at the left end of the art; it lies turned 9.5° (10, 10b–10j). */
export const HL_PEN = { width: 315, height: 74, tipX: 2, tipY: 37, angle: 9.5 } as const

/** Where the pen rests before it's picked up (10): its tip on the canvas. */
export const HL_PEN_HOME = { x: 1161, y: 797 } as const

/** Where the pen's tip rests on a highlighted row: the band's right end, near its top. */
export function penTipOnRow(rowIndex: number): { x: number; y: number } {
  const y = HL_ROW_Y0 + rowIndex * HL_ROW_PITCH - HL_BAND.height / 2 + 6
  return projectSheet(HL_BAND.x1 + 8, y)
}

/** Places the pen so its tip sits on a canvas point. */
export function penStyle(tip: { x: number; y: number }): CSSProperties {
  return {
    left: tip.x - HL_PEN.tipX,
    top: tip.y - HL_PEN.tipY,
    width: HL_PEN.width,
    height: HL_PEN.height,
    transformOrigin: `${HL_PEN.tipX}px ${HL_PEN.tipY}px`,
    rotate: `${HL_PEN.angle}deg`,
  }
}
