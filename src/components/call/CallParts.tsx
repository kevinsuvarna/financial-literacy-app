import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { formatTimer, secondCallSeconds } from './callClock'

/** One line of dialogue in its speech bubble: the typed part, then the rest (hidden, so lines don't reflow). */
export function SpeechBubble({ shown, rest, troubled }: { shown: string; rest: string; troubled: boolean }) {
  return (
    <motion.div
      className={`speech-bubble${troubled ? ' speech-bubble--trouble' : ''}`}
      initial={{ opacity: 0, scale: 0.92, x: -20 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      exit={{ opacity: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
    >
      <div className="speech-bubble-shape" aria-hidden="true">
        <svg className="speech-bubble-tail" viewBox="0 0 80 50">
          <path d="M28 2 C26 22 16 38 2 46 C28 44 52 32 70 6" />
        </svg>
      </div>
      <p className="speech-bubble-text" aria-live="polite">
        {shown}
        <span className="speech-bubble-rest" aria-hidden="true">
          {rest}
        </span>
      </p>
    </motion.div>
  )
}

/** The call status pill under the portrait: green dot, running timer, status (02b, 11–11f). */
export function CallStatus({ status = 'Connected', signal = 'ok' }: { status?: string; signal?: 'ok' | 'weak' | 'lost' }) {
  const [seconds, setSeconds] = useState(secondCallSeconds)
  useEffect(() => {
    const timer = window.setInterval(() => setSeconds(secondCallSeconds()), 1000)
    return () => window.clearInterval(timer)
  }, [])
  return (
    <div className="call-status" data-signal={signal}>
      <span className="call-status-dot" />
      <span className="call-status-time">{formatTimer(seconds)}</span>
      <span className="call-status-label">{status}</span>
    </div>
  )
}
