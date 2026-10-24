/**
 * Ananya's printed bank statement (2026-10-24 mockups 08, 09 and 10): one aged sheet, laid out
 * flat at 1000 × 690 and projected onto each screen's desk. Measured on the 09 sheet, un-warped.
 */

export const STATEMENT = { width: 1000, height: 690 } as const

/** The opening-balance row's centre; the transactions follow every ROW_PITCH. */
export const ROW_Y0 = 308
export const ROW_PITCH = 32.3

/** The centre of a transaction row (0 = the first after the opening balance). */
export const rowCentre = (index: number) => ROW_Y0 + (index + 1) * ROW_PITCH

/** The highlighter's band across a row, in flat x. */
export const BAND = { x0: 30, x1: 975, height: 26 } as const

/** A CSS matrix3d from the flat sheet's corners on the canvas (TL, TR, BR, BL). */
export function sheetTransform(corners: readonly [number, number][]): { transform: string; project: (x: number, y: number) => { x: number; y: number } } {
  const { width: W, height: H } = STATEMENT
  const src = [
    [0, 0],
    [W, 0],
    [W, H],
    [0, H],
  ]
  const A: number[][] = []
  const b: number[] = []
  for (let i = 0; i < 4; i++) {
    const [x, y] = src[i]
    const [u, v] = corners[i]
    A.push([x, y, 1, 0, 0, 0, -u * x, -u * y])
    b.push(u)
    A.push([0, 0, 0, x, y, 1, -v * x, -v * y])
    b.push(v)
  }
  // Gauss–Jordan elimination with partial pivoting.
  for (let c = 0; c < 8; c++) {
    let pivot = c
    for (let r = c + 1; r < 8; r++) if (Math.abs(A[r][c]) > Math.abs(A[pivot][c])) pivot = r
    ;[A[c], A[pivot]] = [A[pivot], A[c]]
    ;[b[c], b[pivot]] = [b[pivot], b[c]]
    for (let r = 0; r < 8; r++) {
      if (r === c) continue
      const f = A[r][c] / A[c][c]
      for (let k = c; k < 8; k++) A[r][k] -= f * A[c][k]
      b[r] -= f * b[c]
    }
  }
  const [a, bb, c, d, e, f, g, h] = b.map((v, i) => v / A[i][i])
  return {
    transform: `matrix3d(${a}, ${d}, 0, ${g}, ${bb}, ${e}, 0, ${h}, 0, 0, 1, 0, ${c}, ${f}, 0, 1)`,
    project: (x, y) => {
      const w = g * x + h * y + 1
      return { x: (a * x + bb * y + c) / w, y: (d * x + e * y + f) / w }
    },
  }
}

/** Where the sheet lies on each screen: its corners measured in the mockups. */
export const SHEET_ON = {
  /** 08: on the desk beside the mat, a stack of sheets under it. */
  closingBalance: sheetTransform([
    [947, 447],
    [1444, 484],
    [1490, 812],
    [838, 762],
  ]),
  /** 09: held up, almost flat, the highlighter on it. */
  clue: sheetTransform([
    [670, 200],
    [1398, 222],
    [1400, 722],
    [647, 702],
  ]),
  /**
   * 10: flat on the desk, in perspective. 10 prints its table a little off the paper's own corners,
   * so this is halfway between the paper's corners and a fit to the table.
   */
  highlighter: sheetTransform([
    [206, 369.5],
    [951.5, 370.6],
    [1057, 832],
    [83.5, 835.5],
  ]),
} as const
