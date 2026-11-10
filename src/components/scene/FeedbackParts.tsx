import { motion, useReducedMotion } from 'motion/react'
import { useRef, type CSSProperties, type ReactNode } from 'react'
import { playSound } from '../../audio/sounds'

/** Where the ink flicks when the stamp lands: angle round its edge (deg), how far out (px), size (px). */
const SPECKS = [
  [-165, 26, 7],
  [-125, 20, 5],
  [-60, 30, 6],
  [-15, 22, 5],
  [25, 28, 8],
  [140, 24, 5],
  [95, 18, 4],
  [200, 22, 6],
] as const
/** The stamp's half-size, roughly: specks start at its edge. */
const EDGE = { x: 150, y: 66 }
const around = (angle: number, out: number) => ({
  x: Math.cos((angle * Math.PI) / 180) * (EDGE.x + out),
  y: Math.sin((angle * Math.PI) / 180) * (EDGE.y + out),
})

/** Gives the card under a stamp a short jolt, as if it was hit. */
function jolt(stamp: HTMLElement | null) {
  const card = stamp?.parentElement?.querySelector<HTMLElement>('.panel')
  card?.animate(
    [{ translate: '0 0' }, { translate: '-5px 4px' }, { translate: '4px -3px' }, { translate: '-2px 2px' }, { translate: '0 0' }],
    { duration: 280, easing: 'ease-out' },
  )
}

/**
 * The rubber stamp on a feedback card (NOT QUITE, VALID…), rotated like the mockups. It slams down:
 * a quick drop, a thud, a jolt through the card and a few flecks of ink (none with Reduce Motion).
 */
export function Stamp({ text, good, width, className = '' }: { text: string; good: boolean; width?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  return (
    <motion.div
      ref={ref}
      className={`stamp stamp--${good ? 'good' : 'bad'} ${className}`}
      style={width ? ({ width } as CSSProperties) : undefined}
      initial={reduce ? { opacity: 0 } : { scale: 2.6, opacity: 0, rotate: -9 }}
      animate={{ scale: 1, opacity: 1, rotate: 0 }}
      transition={reduce ? { duration: 0.2 } : { duration: 0.2, delay: 0.12, ease: [0.55, 0, 0.9, 0.5] }}
      onAnimationComplete={() => {
        if (reduce) return
        playSound('stamp')
        jolt(ref.current)
      }}
    >
      {!reduce &&
        SPECKS.map(([angle, distance, size], i) => (
          <motion.span
            key={i}
            className="stamp-speck"
            style={{ width: size, height: size }}
            initial={{ ...around(angle, -6), opacity: 0 }}
            animate={{ ...around(angle, distance), opacity: [0, 0.9, 0.9, 0] }}
            transition={{ delay: 0.3, duration: 0.55, ease: 'easeOut', opacity: { delay: 0.3, duration: 0.9, times: [0, 0.05, 0.6, 1] } }}
            aria-hidden="true"
          />
        ))}
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
