import { GAME } from '../../content/gameData'

/**
 * The MICR line along the bottom of the cheque, in simplified E-13B shapes (no free MICR font is
 * available). Glyphs are drawn on an 8 × 10 grid: thick strokes on the lower and side parts, the
 * way E-13B digits look. `onus` is the ⑈ symbol around the cheque number, `transit` the ⑆.
 */
const GLYPHS: Record<string, string> = {
  '0': 'M0 0h8v10h-8z M1.7 1.5h4.6v7h-4.6z',
  '1': 'M0.6 0h4.4v1.5h-2.6v1.6h-1.8z M3.4 0h1.8v8.4h2.4v1.6h-6v-1.6h1.8z',
  '2': 'M0 0h8v5.2h-5.4v3h5.4v1.8h-8v-6.4h5.4v-1.8h-5.4z',
  '3': 'M0 0h6.4v4h1.6v6h-8v-1.8h5.2v-2.4h-4v-1.6h2.8v-2.4h-3.6z',
  '4': 'M0 0h2v5h3v-3h2.8v8h-2.8v-3.2h-5z',
  '5': 'M0 0h8v1.8h-5.6v2.2h5.6v6h-8v-1.8h5.2v-2.4h-5.2z',
  '6': 'M0 0h5v1.8h-2.4v2.2h5.4v6h-8z M2.6 5.8h2.8v2.4h-2.8z',
  '7': 'M0 0h8v4.6l-2.2 1.6v3.8h-2.8v-4.6l2.2-1.6v-2h-5.2z',
  '8': 'M1 0h6v4h1v6h-8v-6h1z M2.8 1.6h2.4v2.2h-2.4z M2.6 5.6h2.8v2.8h-2.8z',
  '9': 'M0 0h8v10h-2.8v-4h-5.2z M2.4 1.6h3.2v2.8h-3.2z',
  onus: 'M0.5 0h1.6v4.4h-1.6z M3.2 0h1.6v4.4h-1.6z M6 0h1.6v4.4h-1.6z M6 5.6h1.6v1.6h-1.6z',
  transit: 'M0 0h2.2v4.4h-2.2z M0 5.6h2.2v4.4h-2.2z M4.4 2.4h2.2v1.8h-2.2z M4.4 5.8h2.2v1.8h-2.2z',
}

/** Character pitch, glyph scale (px per grid unit) and where each group starts, measured on 09f. */
const PITCH = 15.8
const SCALE_X = 1.4
const SCALE_Y = 1.6
const GROUP_X = [242, 421, 613, 746]

export function MicrLine({ chequeNumber, className }: { chequeNumber: string; className?: string }) {
  const [cityCode, accountId, transactionCode] = GAME.cheque.micr
  const groups: string[][] = [
    ['onus', ...chequeNumber, 'onus'],
    [...cityCode, 'transit'],
    [...accountId, 'onus'],
    [...transactionCode],
  ]
  const text = `${chequeNumber} ${cityCode} ${accountId} ${transactionCode}`
  return (
    <svg className={className} viewBox="0 0 1195 431" aria-label={text} role="img">
      {groups.map((chars, g) =>
        chars.map((c, i) => (
          <path
            key={`${g}-${i}`}
            d={GLYPHS[c]}
            transform={`translate(${GROUP_X[g] + i * PITCH} 398) scale(${SCALE_X} ${SCALE_Y})`}
          />
        )),
      )}
    </svg>
  )
}
