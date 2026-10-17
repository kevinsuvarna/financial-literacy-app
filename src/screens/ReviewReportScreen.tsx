import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { GAME } from '../content/gameData'
import { playSound } from '../audio/sounds'
import { useActionHandler } from '../components/actionHandler'
import { BankComputer, ScreenButton } from '../components/computer/BankComputer'
import { FeedbackLayer } from '../components/FeedbackLayer'
import { Desk } from '../components/scene/TableScene'
import { TaskScreen } from '../components/TaskScreen'
import { useGameStore, type Feedback } from '../state/gameStore'
import talking from '../assets/art/ananya-talking.png'

const task = GAME.tasks.L3T5

/** 15: the incident report on the bank's computer. SUBMIT REPORT sends it (then the certificate). */
function Report() {
  const handle = useActionHandler()
  const submitReport = useGameStore((s) => s.submitReport)
  return (
    <>
      <Desk variant="computer" />
      <BankComputer zoomed instant>
        <h1 className="pc-title">{task.title}</h1>
        <div className="rp-portrait">
          <img src={talking} alt={GAME.openingCall.portraitAlt} />
        </div>
        <dl className="rp-fields">
          {task.fields.map((field) => (
            <div key={field.label}>
              <dt>{field.label} :</dt>
              <dd>{field.value}</dd>
            </div>
          ))}
        </dl>
        <ScreenButton label={task.cta} onClick={() => handle(submitReport())} />
      </BankComputer>
    </>
  )
}

/** How the send plays out on the monitor (seconds). */
const SEND = { fields: 0.25, fieldStep: 0.22, bar: 1.7, wipe: 0.55 }

/**
 * Sending, as a screen animation: the button becomes a progress bar that fills while each field
 * of the report is ticked off; then a bright scan line wipes down the screen and reveals the
 * confirmation (what was sent, the case reference). VIEW CERTIFICATE moves on.
 */
function Submitted({ onContinue }: { onContinue: () => void }) {
  const { submitted, receipt } = task
  const [sent, setSent] = useState(false)
  useEffect(() => {
    playSound('whoosh')
    const timers = [
      window.setTimeout(() => {
        setSent(true)
        playSound('stamp')
      }, SEND.bar * 1000),
      window.setTimeout(() => playSound('fanfare'), (SEND.bar + SEND.wipe) * 1000),
    ]
    return () => timers.forEach((t) => window.clearTimeout(t))
  }, [])
  return (
    <section className="rp-sent" role="status" aria-label={sent ? submitted.title : task.sending}>
      {/* Each field of the report is ticked as it goes. */}
      {!sent &&
        task.fields.map((field, i) => (
          <motion.span
            key={field.label}
            className="rp-field-tick"
            style={{ top: 449 + i * 44 - 9 }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: SEND.fields + i * SEND.fieldStep, type: 'spring', stiffness: 500, damping: 18 }}
            aria-hidden="true"
          />
        ))}
      {/* Stays (full) under VIEW CERTIFICATE, so the old button never shows through. */}
      <div className="rp-progress">
        <span className="rp-progress-label">{task.sending}</span>
        <motion.span
          className="rp-progress-fill"
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: SEND.bar - 0.1, ease: [0.4, 0, 0.6, 1] }}
        >
          {/* The same label in dark ink, revealed as the bar fills. */}
          <span className="rp-progress-label rp-progress-label--on-fill">{task.sending}</span>
        </motion.span>
      </div>
      {sent && (
        <>
          {/* The confirmation is revealed top to bottom behind a bright scan line. */}
          <motion.div
            className="rp-sent-screen"
            initial={{ clipPath: 'inset(0 0 100% 0)' }}
            animate={{ clipPath: 'inset(0 0 0% 0)' }}
            transition={{ duration: SEND.wipe, ease: 'easeInOut' }}
          >
            <motion.span
              className="rp-sent-tick"
              initial={{ scale: 0, rotate: -40 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 380, damping: 14, delay: SEND.wipe * 0.6 }}
              aria-hidden="true"
            >
              <svg viewBox="0 0 24 24">
                <path d="M5 12.5 L10 17.5 L19 7" />
              </svg>
            </motion.span>
            <h2 className="rp-sent-title">{submitted.title}</h2>
            <p className="rp-sent-message">{submitted.message}</p>
            <p className="rp-sent-reference">{receipt.reference}</p>
            <ul className="rp-sent-list">
              {receipt.checklist.map((item, i) => (
                <motion.li
                  key={item}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: SEND.wipe + 0.2 + i * 0.18 }}
                >
                  {item}
                </motion.li>
              ))}
            </ul>
          </motion.div>
          <motion.span
            className="rp-scanline"
            initial={{ top: 284 }}
            animate={{ top: 676, opacity: [1, 1, 0] }}
            transition={{ duration: SEND.wipe, ease: 'easeInOut', opacity: { duration: SEND.wipe, times: [0, 0.85, 1] } }}
            aria-hidden="true"
          />
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: SEND.wipe + 0.6 }}>
            <ScreenButton label={submitted.cta ?? GAME.ui.viewCertificate} onClick={onContinue} />
          </motion.div>
        </>
      )}
    </section>
  )
}

function feedbackView(feedback: Feedback, onContinue: () => void) {
  if (feedback.tone === 'correct') return <Submitted onContinue={onContinue} />
  return <FeedbackLayer />
}

/** 15: review and submit the incident report. */
export function ReviewReportScreen() {
  return (
    <TaskScreen taskId="L3T5" variant="scene" keepScene feedbackView={feedbackView}>
      <div className="screen--computer">
        <Report />
      </div>
    </TaskScreen>
  )
}
