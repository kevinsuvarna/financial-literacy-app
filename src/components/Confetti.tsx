import { motion, useReducedMotion } from 'motion/react'
import { useState } from 'react'

/** Confetti colours: the game's gold, teal, red, navy and cream. */
const COLOURS = ['#f2b636', '#3cc7c0', '#e0533f', '#1d4f8f', '#f6ead0', '#7bd389']

interface Piece {
  x: number
  /** Starts above the canvas, at staggered heights so it rains rather than falls as one band. */
  startY: number
  drift: number
  size: number
  round: boolean
  colour: string
  delay: number
  duration: number
  spin: number
}

function makePieces(count: number): Piece[] {
  return Array.from({ length: count }, (_, i) => ({
    x: Math.random() * 1512,
    startY: -40 - Math.random() * 320,
    drift: (Math.random() - 0.5) * 260,
    size: 8 + Math.random() * 8,
    round: i % 5 === 0,
    colour: COLOURS[i % COLOURS.length],
    delay: Math.random() * 0.7,
    duration: 2.4 + Math.random() * 1.6,
    spin: (Math.random() - 0.5) * 1080,
  }))
}

/**
 * A burst of confetti falling over the whole canvas, once (the certificate, 16). Nothing with
 * Reduce Motion.
 */
export function Confetti({ count = 110, delay = 0 }: { count?: number; delay?: number }) {
  const reduce = useReducedMotion()
  const [pieces] = useState(() => makePieces(count))
  if (reduce) return null
  return (
    <div className="confetti" aria-hidden="true">
      {pieces.map((p, i) => (
        <motion.span
          key={i}
          className="confetti-piece"
          style={{
            left: p.x,
            width: p.size,
            height: p.round ? p.size : p.size * 1.6,
            borderRadius: p.round ? '50%' : 2,
            background: p.colour,
          }}
          initial={{ y: p.startY, x: 0, rotate: 0, opacity: 1 }}
          animate={{ y: 1060, x: p.drift, rotate: p.spin, opacity: [1, 1, 0.9, 0] }}
          transition={{ delay: delay + p.delay, duration: p.duration, ease: [0.25, 0.4, 0.5, 1], opacity: { delay: delay + p.delay, duration: p.duration, times: [0, 0.6, 0.85, 1] } }}
        />
      ))}
    </div>
  )
}
