import { AnimatePresence, motion } from 'motion/react'
import { useEffect } from 'react'
import { GAME } from '../content/gameData'
import { useGameStore } from '../state/gameStore'

/** How long a friendly, non-blocking note stays up. */
const TOAST_MS = 2800

/**
 * Correct / incorrect / progress feedback as a pop-up (screen 22), neutral notes as a toast.
 * Scans stay locked in the store until the feedback is closed.
 */
export function FeedbackLayer({ onClose, toastsOnly = false }: { onClose?: () => void; toastsOnly?: boolean }) {
  const feedback = useGameStore((s) => s.feedback)
  const dismiss = useGameStore((s) => s.dismissFeedback)
  const isToast = feedback?.tone === 'neutral'

  useEffect(() => {
    if (!isToast) return
    const timer = window.setTimeout(dismiss, TOAST_MS)
    return () => window.clearTimeout(timer)
  }, [feedback?.id, isToast, dismiss])

  const close = () => {
    dismiss()
    onClose?.()
  }

  const label = onClose ? GAME.ui.continue : feedback?.tone === 'incorrect' ? GAME.ui.tryAgain : GAME.ui.ok

  return (
    <AnimatePresence>
      {feedback && isToast && (
        <motion.div
          key={feedback.id}
          className="toast"
          role="status"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.18 }}
        >
          {feedback.title && <strong className="toast-title">{feedback.title}</strong>}
          <span>{feedback.message}</span>
          <button type="button" className="toast-close" onClick={dismiss}>
            {GAME.ui.ok}
          </button>
        </motion.div>
      )}
      {feedback && !isToast && !toastsOnly && (
        <motion.div
          key={feedback.id}
          className="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <motion.div
            className={`modal paper modal--${feedback.tone}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="feedback-title"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 24 }}
          >
            <h2 id="feedback-title" className="modal-title">
              {feedback.title ?? GAME.ui.ok}
            </h2>
            {feedback.alert && (
              <div className="feedback-alert" role="note">
                <strong>{feedback.alert.sender}</strong>
                <p>{feedback.alert.text}</p>
              </div>
            )}
            <p className="modal-message">{feedback.message}</p>
            {feedback.detail && <p className="modal-detail">{feedback.detail}</p>}
            {feedback.hint && (
              <p className="modal-hint">
                <strong>{GAME.ui.hint}:</strong> {feedback.hint}
              </p>
            )}
            <button type="button" className="cta" onClick={close} autoFocus>
              {label}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
