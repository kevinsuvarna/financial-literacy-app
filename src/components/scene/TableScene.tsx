import type { ReactNode } from 'react'
import { MATS, type MatName } from './matProjection'

/** Desk outlines measured from the mockups: table scenes (04, 05), feedback cards (04a–07), the folder (06). */
const DESKS = {
  table: '0,619 138,363 1383,363 1512,640',
  feedback: '0,787.5 59,565.5 1430,565.5 1512,770',
  folder: '0,723.7 61.4,493.5 1427,493.5 1512,706',
  /** Mockup 08: higher, no outline, with a darker front edge. */
  statement: '0,643 55,425 1460,425 1512,636',
  /** Mockups 10–10j: the highlighter desk, higher still, with the same front edge. */
  highlighter: '0,882 117,349 1360,349 1512,958',
  /** Mockups 13–15: the desk under the bank's computer. */
  computer: '0,778 58,565 1436,565 1512,762',
  /** Mockup 16: the certificate on the desk. */
  certificate: '0,581 1466,581 1512,684',
} as const

/** The desk, seen from above at an angle. */
export function Desk({ variant = 'table' }: { variant?: keyof typeof DESKS }) {
  const points = DESKS[variant]
  const polygon = `polygon(${points
    .split(' ')
    .map((p) => p.replace(',', 'px ') + 'px')
    .join(', ')}, 1512px 982px, 0 982px)`
  return (
    <div className={`desk-scene desk-scene--${variant}`} aria-hidden="true">
      <div className="desk-scene-top" style={{ clipPath: polygon }} />
      {(variant === 'statement' || variant === 'highlighter') && <div className="desk-scene-front" />}
      <svg className="desk-scene-edge" viewBox="0 0 1512 982">
        <polyline points={points} />
      </svg>
    </div>
  )
}

/**
 * The desk lamp. While `scanning`, its light pulses: the game's in-world sign that the hidden
 * camera is reading cards (spec 10.2: scanning feedback in the game's style, never the feed).
 */
export function DeskLamp({ scanning = false, blocked = false, placement }: { scanning?: boolean; blocked?: boolean; placement?: string }) {
  return (
    <svg className={`desk-lamp${scanning ? ' is-scanning' : ''}${blocked ? ' is-blocked' : ''}`} viewBox="0 0 1512 982" aria-hidden="true">
      <g transform={placement}>
      <defs>
        <filter id="lamp-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3.5" />
        </filter>
      </defs>
      <ellipse className="desk-lamp-base" cx="184" cy="470" rx="55" ry="12" />
      <path className="desk-lamp-arm" d="M180 466 L213 318 L171 218" />
      {/* Head and light: quadrilaterals fitted to mockup 04. */}
      <polygon className="desk-lamp-head" points="219,119 261,167 220,206 146,197" />
      <polygon className="desk-lamp-light desk-lamp-light--glow" points="168,187 218,136 242,167 200,206" filter="url(#lamp-glow)" />
      <polygon className="desk-lamp-light" points="172,186 218,141 237,167 200,201" />
      <circle className="desk-lamp-joint" cx="171" cy="217" r="13" />
      </g>
    </svg>
  )
}

/** The paper mat on the desk. Children are positioned in flat mat coordinates (see MATS). */
export function Mat({ name = 'accountType', children }: { name?: MatName; children: ReactNode }) {
  const mat = MATS[name]
  return (
    <div className={`mat mat--${name}`} style={{ width: mat.width, height: mat.height, transform: mat.transform }}>
      <div className="mat-paper" />
      {children}
    </div>
  )
}
