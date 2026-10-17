import { motion } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'

/** The rubber stamp on a feedback card (NOT QUITE, VALID…), rotated like the mockups. */
export function Stamp({ text, good, width, className = '' }: { text: string; good: boolean; width?: number; className?: string }) {
  return (
    <motion.div
      className={`stamp stamp--${good ? 'good' : 'bad'} ${className}`}
      style={width ? ({ width } as CSSProperties) : undefined}
      initial={{ scale: 1.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 18, delay: 0.1 }}
    >
      <span className="stamp-inner">
        <svg className="stamp-icon" viewBox="0 0 32 32" aria-hidden="true">
          {good ? <path d="M5 17 L12 25 L27 7" /> : <path d="M7 7 L25 25 M25 7 L7 25" />}
        </svg>
        <span className="stamp-text">{text}</span>
      </span>
    </motion.div>
  )
}

/** The glowing turquoise button on scene screens. `back` puts the arrow first (TRY AGAIN). */
export function SceneCta({
  label,
  back = false,
  arrow: showArrow = true,
  width,
  className = '',
  onClick,
}: {
  label: string
  back?: boolean
  /** Leave out the arrow (YES / NO). */
  arrow?: boolean
  width?: number
  className?: string
  onClick: () => void
}) {
  const arrow = (
    <svg className={`scene-cta-arrow ${back ? 'cta-label-before' : 'cta-label-after'}`} viewBox="0 0 60 24" aria-hidden="true">
      <path d={back ? 'M57 11 C42 13 26 11 6 12 M16 3 L4 12 L16 21' : 'M3 13 C18 11 34 13 54 12 M44 3 L56 12 L44 21'} />
    </svg>
  )
  return (
    <motion.button
      type="button"
      className={`scene-cta ${back ? 'scene-cta--back' : ''} ${className}`}
      style={width ? { width } : undefined}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
    >
      {/* The label is centred in the button; the arrow hangs off its side, outside the layout. */}
      <span className="cta-label">
        {showArrow && back && arrow}
        {label}
        {showArrow && !back && arrow}
      </span>
    </motion.button>
  )
}

/** The tilted paper panel feedback cards and story screens are printed on. */
export function Panel({ className, children }: { className: string; children?: ReactNode }) {
  return (
    <motion.div
      className={`panel ${className}`}
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 220, damping: 24 }}
    >
      <div className="paper-outline" aria-hidden="true" />
      {children}
    </motion.div>
  )
}
