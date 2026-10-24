import type { CSSProperties } from 'react'
import { BAND, SHEET_ON, rowCentre } from './statementLayout'

/**
 * Level 2, Task 3 (mockups 10–10j): the statement lies flat on the desk in perspective
 * (see statementLayout.ts); the pen rests beside it.
 */

/** The pen: its tip is at the left end of the art; it lies turned 9.5° (10, 10b–10j). */
export const HL_PEN = { width: 315, height: 74, tipX: 2, tipY: 37, angle: 9.5 } as const

/** Where the pen rests before it's picked up (10): its tip on the canvas. */
export const HL_PEN_HOME = { x: 1161, y: 797 } as const

/** Where the pen's tip rests on a highlighted row: the band's right end, near its top. */
export function penTipOnRow(rowIndex: number): { x: number; y: number } {
  return SHEET_ON.highlighter.project(BAND.x1 - 10, rowCentre(rowIndex) - BAND.height / 2 + 6)
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
