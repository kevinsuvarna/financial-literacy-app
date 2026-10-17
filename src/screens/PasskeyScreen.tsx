import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useState } from 'react'
import { GAME } from '../content/gameData'
import { playSound } from '../audio/sounds'
import { useActionHandler } from '../components/actionHandler'
import { BankComputer, ScreenHint } from '../components/computer/BankComputer'
import { DailyChronicle } from '../components/newspaper/DailyChronicle'
import { Desk } from '../components/scene/TableScene'
import { TaskScreen } from '../components/TaskScreen'
import { isTaskCompleted, useGameStore, type Feedback } from '../state/gameStore'

const task = GAME.tasks.L3T3
/** 13's newspaper on the desk: the 12c layout projected onto the corners measured in 13. */
const DESK_PAPER =
  'matrix3d(0.50162609, 0.037218294, 0, 0.0000484, -0.507954601, -0.085122413, 0, -0.000449382, 0, 0, 1, 0, 938, 687, 0, 1)'

/** One digit per clue. */
const LENGTH = task.clues.length

/** The keyboard's keys (13): the top row carries the digits, its last key deletes. */
const TOP_ROW = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '', '', '⌫']
const SECOND_ROW = 10

/** The passkey boxes on the monitor: typed digits, or a dash while empty. */
function PasskeyBoxes({ digits, wrong }: { digits: string; wrong: boolean }) {
  return (
    <motion.div
      className={`pc-passkey${wrong ? ' is-wrong' : ''}`}
      data-testid="passkey-display"
      animate={wrong ? { x: [0, -14, 12, -8, 5, 0] } : { x: 0 }}
      transition={{ duration: 0.45 }}
    >
      {Array.from({ length: LENGTH }, (_, i) => (
        <span key={i} className="pc-passkey-box">
          {digits[i] ? <span className="pc-passkey-digit">{digits[i]}</span> : <span className="pc-passkey-dash" />}
        </span>
      ))}
    </motion.div>
  )
}

/** The keyboard on the desk (13). Its top row types the passkey; without `onKey` it's a picture. */
function Keyboard({ onKey }: { onKey?: (key: string) => void }) {
  return (
    <div className="pk-keyboard" role="group" aria-label={task.instruction}>
      <svg className="pk-keyboard-body" viewBox="0 0 552 85" aria-hidden="true">
        <path d="M33 1 H519 Q527 1 530 8 L550 74 Q552 84 541 84 H11 Q0 84 2 74 L22 8 Q25 1 33 1 Z" />
      </svg>
      <div className="pk-row pk-row--1">
        {TOP_ROW.map((key, i) => (
          <button
            key={i}
            type="button"
            className="pk-key"
            disabled={!key}
            aria-label={key === '⌫' ? 'Delete' : key || undefined}
            tabIndex={key ? 0 : -1}
            onClick={() => key && onKey?.(key)}
          >
            {key}
          </button>
        ))}
      </div>
      <div className="pk-row pk-row--2" aria-hidden="true">
        {Array.from({ length: SECOND_ROW }, (_, i) => (
          <span key={i} className="pk-key" />
        ))}
      </div>
      <span className="pk-space" aria-hidden="true" />
    </div>
  )
}

/** 13, 13b: the computer on the desk, the newspaper beside it. Type the passkey on the keyboard. */
function PasskeyDesk() {
  const handle = useActionHandler()
  const enterPasskey = useGameStore((s) => s.enterPasskey)
  const feedback = useGameStore((s) => s.feedback)
  const unlocked = useGameStore((s) => isTaskCompleted(s, 'L3T3'))
  const [digits, setDigits] = useState(unlocked ? GAME.passkey : '')
  const wrong = feedback?.tone === 'incorrect'

  // Submitting the third digit happens once the digits have rendered (never inside a state update).
  useEffect(() => {
    if (digits.length < LENGTH || unlocked) return
    const timer = window.setTimeout(() => {
      const result = handle(enterPasskey(digits))
      if (result.outcome !== 'correct') window.setTimeout(() => setDigits(''), 900)
    }, 250)
    return () => window.clearTimeout(timer)
  }, [digits, unlocked, enterPasskey, handle])

  const press = useCallback((key: string) => {
    if (useGameStore.getState().feedback) return
    setDigits((d) => (d.length < LENGTH ? d + key : d))
  }, [])
  const erase = useCallback(() => setDigits((d) => d.slice(0, -1)), [])

  // Physical keyboards work too (laptops).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (/^\d$/.test(e.key)) press(e.key)
      else if (e.key === 'Backspace') erase()
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [press, erase])

  return (
    <>
      <Desk variant="computer" />
      <DailyChronicle transform={DESK_PAPER} className="pk-newspaper" />
      <BankComputer zoomed={false}>
        <h1 className="pc-title pc-title--passkey">{task.screenTitle}</h1>
        <PasskeyBoxes digits={digits} wrong={wrong} />
        <AnimatePresence>
          {wrong && feedback && (
            <motion.p
              key={feedback.id}
              className="pc-denied"
              role="alert"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <strong>{feedback.title}</strong> {feedback.hint ?? feedback.message}
            </motion.p>
          )}
        </AnimatePresence>
        {!wrong && <ScreenHint text={task.screenHint} />}
      </BankComputer>
      <Keyboard onKey={(key) => (key === '⌫' ? erase() : press(key))} />
    </>
  )
}

/** 16e: unlocked. The view zooms into the monitor, showing the passkey, then on to the evidence (14). */
function Unlocked({ onContinue }: { onContinue: () => void }) {
  useEffect(() => {
    playSound('levelUp')
    const timer = window.setTimeout(onContinue, 2600)
    return () => window.clearTimeout(timer)
  }, [onContinue])
  return (
    <div className="pk-unlocked" role="status" aria-label={task.correct.title} onClick={onContinue}>
      <Desk variant="computer" />
      {/* The keyboard and the newspaper slide off the desk as the view moves in. */}
      <motion.div className="pk-slide" animate={{ y: 260, opacity: 0 }} transition={{ duration: 0.7, ease: 'easeIn' }}>
        <DailyChronicle transform={DESK_PAPER} className="pk-newspaper" />
        <Keyboard />
      </motion.div>
      <BankComputer zoomed>
        <h1 className="pc-title pc-title--passkey">{task.screenTitle}</h1>
        <PasskeyBoxes digits={GAME.passkey} wrong={false} />
        <ScreenHint text={task.screenHint} />
      </BankComputer>
    </div>
  )
}

/** A wrong passkey: shown on the monitor, then cleared for another go. */
function Denied() {
  const dismiss = useGameStore((s) => s.dismissFeedback)
  useEffect(() => {
    const timer = window.setTimeout(dismiss, 2800)
    return () => window.clearTimeout(timer)
  }, [dismiss])
  return null
}

function feedbackView(feedback: Feedback, onContinue: () => void) {
  return feedback.tone === 'correct' ? <Unlocked onContinue={onContinue} /> : <Denied key={feedback.id} />
}

/** 13, 13b, 16e: the passkey on the bank's computer. */
export function PasskeyScreen() {
  return (
    <TaskScreen taskId="L3T3" variant="scene" keepScene feedbackView={feedbackView}>
      <div className="screen--computer">
        <PasskeyDesk />
      </div>
    </TaskScreen>
  )
}
