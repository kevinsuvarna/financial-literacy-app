import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { GAME } from '../../content/gameData'

/**
 * The bank's computer (mockups 13, 13b, 16e, 14, 14c, 15). It's laid out at the size it has
 * zoomed in (16e–15: bezel 202–1315 × 165–848); on the desk (13, 13b) the same layout is scaled
 * down onto the desk's monitor. Children are placed in canvas pixels of the zoomed layout.
 */

/** 13's monitor is the zoomed one scaled 0.726 × 0.716 with its bezel's corner at (117, 186). */
const ON_DESK = { scaleX: 0.726, scaleY: 0.716, x: 117 - 202 * 0.726, y: 186 - 165 * 0.716 }

function SidebarIcons() {
  return (
    <div className="pc-sidebar" aria-hidden="true">
      <svg viewBox="0 0 28 28">
        <path d="M4 12 L14 4 L24 12 V25 H4 Z" />
      </svg>
      <svg viewBox="0 0 28 28">
        <path d="M5 3 H23 V25 H5 Z M9 9 H19 M9 14 H19 M9 19 H19" />
      </svg>
      <svg viewBox="0 0 28 28">
        <path d="M4 12 L14 4 L24 12 V25 H4 Z M4 15 H24" />
      </svg>
      <svg viewBox="0 0 28 28">
        <circle cx="14" cy="9" r="5" />
        <path d="M4 26 C5 18 9 16 14 16 C19 16 23 18 24 26" />
      </svg>
    </div>
  )
}

function BankMark() {
  return (
    <svg className="pc-bank-icon" viewBox="0 0 44 40" aria-hidden="true">
      <path d="M3 13 L22 3 L41 13 Z M3 13 H41 M7 17 V33 M15 17 V33 M22 17 V33 M29 17 V33 M37 17 V33 M3 36 H41" />
    </svg>
  )
}

interface BankComputerProps {
  /** Shown small on the desk (13), or zoomed in (16e–15). Animates between the two. */
  zoomed: boolean
  children?: ReactNode
  /** Don't animate the first render (a screen that opens already zoomed). */
  instant?: boolean
}

export function BankComputer({ zoomed, children, instant = false }: BankComputerProps) {
  const desk = { scaleX: ON_DESK.scaleX, scaleY: ON_DESK.scaleY, x: ON_DESK.x, y: ON_DESK.y }
  const full = { scaleX: 1, scaleY: 1, x: 0, y: 0 }
  return (
    <motion.div
      className={`pc${zoomed ? '' : ' pc--desk'}`}
      initial={instant ? false : zoomed ? desk : false}
      animate={zoomed ? full : desk}
      transition={{ duration: 0.9, ease: [0.6, 0, 0.3, 1] }}
    >
      <div className="pc-stand" aria-hidden="true">
        <span className="pc-neck" />
        <span className="pc-base" />
      </div>
      <div className="pc-bezel" aria-hidden="true">
        <span className="pc-camera" />
      </div>
      <div className="pc-screen" aria-hidden="true" />
      <BankMark />
      <p className="pc-bank-name">{GAME.cheque.bankName.toUpperCase()}</p>
      <span className="pc-rule" aria-hidden="true" />
      <SidebarIcons />
      {children}
    </motion.div>
  )
}

/** The "i" note at the foot of a screen (13, 14). */
export function ScreenHint({ text }: { text: string }) {
  return (
    <p className="pc-hint">
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <circle cx="16" cy="16" r="14" />
        <path d="M16 13.5 V22 M13.5 22 H18.5 M14 13.5 H16" />
        <circle className="pc-hint-dot" cx="16" cy="9.5" r="1.6" />
      </svg>
      <span>{text}</span>
    </p>
  )
}

/** The wide turquoise button on the screen (14c, 15). */
export function ScreenButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className="pc-button" onClick={onClick}>
      <span className="cta-label">
        {label}
        <svg className="cta-label-after" viewBox="0 0 28 24" aria-hidden="true">
          <path d="M2 12 H25 M17 4 L25 12 L17 20" />
        </svg>
      </span>
    </button>
  )
}
