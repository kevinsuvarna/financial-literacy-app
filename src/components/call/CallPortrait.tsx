import { motion } from 'motion/react'
import type { CallStep } from '../../content/gameData'
import { AlertBadge } from '../art/Icons'
import smiling from '../../assets/art/ananya-smiling.png'
import talking from '../../assets/art/ananya-talking.png'
import worried from '../../assets/art/ananya-worried.png'
// Interim: cut from mockup 02e until the alarmed portrait is exported.
import alarmed from '../../assets/interim/ananya-alarmed.png'

const ART: Record<CallStep['mood'], string> = { smiling, talking, worried, alarmed }

interface CallPortraitProps {
  /** Centre of the portrait on the canvas. */
  x: number
  y: number
  mood: CallStep['mood']
  alt: string
  /** Pulsing rings while the phone rings. */
  ringing?: boolean
  /** Bad signal: red ring, warning badge, glitch bars. */
  trouble?: boolean
}

/** The caller's round portrait with its rings (mockups 02–02e). */
export function CallPortrait({ x, y, mood, alt, ringing = false, trouble = false }: CallPortraitProps) {
  return (
    <motion.div
      className={`call-portrait${trouble ? ' call-portrait--trouble' : ''}`}
      initial={false}
      animate={{ left: x, top: y }}
      transition={{ type: 'spring', stiffness: 120, damping: 20 }}
    >
      <div className="call-portrait-ring" />
      {ringing &&
        [0, 0.6].map((delay) => (
          <motion.div
            key={delay}
            className="call-portrait-pulse"
            initial={{ scale: 1, opacity: 0.55 }}
            animate={{ scale: 1.3, opacity: 0 }}
            transition={{ duration: 1.4, repeat: Infinity, delay, ease: 'easeOut' }}
          />
        ))}
      <div className="call-portrait-frame">
        <div className="call-portrait-paper" />
        <img className={`call-portrait-art call-portrait-art--${mood}`} src={ART[mood]} alt={alt} />
      </div>
      {trouble && (
        <>
          <motion.span
            className="call-glitch call-glitch--top"
            animate={{ x: [0, 6, -4, 0], opacity: [1, 0.6, 1, 0.8] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          />
          <motion.span
            className="call-glitch call-glitch--bottom"
            animate={{ x: [0, -5, 3, 0], opacity: [0.8, 1, 0.6, 1] }}
            transition={{ duration: 0.45, repeat: Infinity }}
          />
          <motion.div className="call-alert" initial={{ scale: 0 }} animate={{ scale: 1 }}>
            <AlertBadge />
          </motion.div>
        </>
      )}
    </motion.div>
  )
}
