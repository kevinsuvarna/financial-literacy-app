import type { CSSProperties } from 'react'
import type { ChequeAreaId } from '../../content/gameData'

/** The cheque, laid out flat at 1195 × 431 (mockups 09b–09f). */
export const CHEQUE_SIZE = { width: 1195, height: 431 } as const

export interface Box {
  x: number
  y: number
  w: number
  h: number
}

/**
 * Each tappable area: where it sits on the flat cheque, and where its zoomed copy goes on the
 * canvas when it's tapped (09c payee, 09d date, 09e the whole amount row, 09f signature; the rest
 * follow the same two sizes).
 */
export const CHEQUE_AREAS: Record<ChequeAreaId, { area: Box; zoom: Box }> = {
  bank: { area: { x: 70, y: 8, w: 520, h: 104 }, zoom: { x: 108, y: 168, w: 734, h: 147 } },
  date: { area: { x: 766, y: 35, w: 404, h: 79 }, zoom: { x: 848, y: 205, w: 569, h: 111 } },
  payee: { area: { x: 67.5, y: 113, w: 1094, h: 75 }, zoom: { x: 47, y: 290, w: 1400, h: 95 } },
  'amount-words': { area: { x: 67.5, y: 181, w: 1094, h: 75 }, zoom: { x: 47, y: 377, w: 1400, h: 95 } },
  'amount-figures': { area: { x: 67.5, y: 181, w: 1094, h: 75 }, zoom: { x: 47, y: 377, w: 1400, h: 95 } },
  'account-number': { area: { x: 66, y: 288, w: 370, h: 80 }, zoom: { x: 102, y: 471, w: 522, h: 113 } },
  signature: { area: { x: 792, y: 281, w: 403, h: 79 }, zoom: { x: 851, y: 476, w: 569, h: 112 } },
  'cheque-number': { area: { x: 215, y: 384, w: 590, h: 44 }, zoom: { x: 160, y: 565, w: 832, h: 62 } },
}

export function boxStyle(box: Box): CSSProperties {
  return { left: box.x, top: box.y, width: box.w, height: box.h }
}
