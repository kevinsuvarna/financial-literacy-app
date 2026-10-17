import { motion } from 'motion/react'
import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { GAME, formatRupees, type ArtefactId } from '../content/gameData'
import { SCREENS } from '../app/screens'
import { BankComputer, ScreenButton, ScreenHint } from '../components/computer/BankComputer'
import { FeedbackLayer } from '../components/FeedbackLayer'
import { SceneScanner } from '../components/scene/SceneScanner'
import { useTapArtefact } from '../components/scene/useTapArtefact'
import { Desk } from '../components/scene/TableScene'
import { TaskScreen } from '../components/TaskScreen'
import { isTaskCompleted, useGameStore, type Feedback } from '../state/gameStore'

const task = GAME.tasks.L3T4
const report = GAME.tasks.L3T5
const NONE: readonly ArtefactId[] = []
const camsRow = GAME.statement.rows.find((row) => row.suspicious)!
const { phishingMessage } = GAME

/** "30 Aug 26", as the statement thumbnail prints it (14). */
const shortDate = (iso: string) => {
  const d = new Date(`${iso}T00:00:00`)
  return `${d.getDate()} ${d.toLocaleString('en-GB', { month: 'short' })} ${String(d.getFullYear()).slice(2)}`
}

function StatementThumb() {
  return (
    <div className="ev-doc ev-doc--statement">
      <p className="ev-doc-title">Bank Statement</p>
      <span className="ev-doc-rule" />
      <span className="ev-bars ev-bars--top" />
      <p className="ev-doc-row">
        <span>{shortDate(camsRow.date)}</span>
        <strong>{phishingMessage.sender}</strong>
        <span>{formatRupees(camsRow.amount)}</span>
      </p>
      <span className="ev-bars ev-bars--bottom" />
    </div>
  )
}

function MessageThumb() {
  return (
    <div className="ev-doc ev-doc--message">
      <p className="ev-msg-from">
        <span className="ev-msg-icon">c</span>
        {phishingMessage.sender}
      </p>
      <p className="ev-msg-text">
        Your debit card
        <br />
        has been blocked.
        <br />
        Click here to unblock:
      </p>
      {/* Text only: never a working link. */}
      <p className="ev-msg-link">{phishingMessage.link.replace('/unblock', '/\nunblock')}</p>
    </div>
  )
}

const SLOTS: Record<string, () => React.JSX.Element> = {
  'bank-statement': StatementThumb,
  'phishing-message-card': MessageThumb,
}

/** 14 → 14c: scan (or tap) the two pieces of evidence onto the bank's report. */
function EvidenceDesk() {
  const tap = useTapArtefact()
  const navigate = useNavigate()
  const accepted = useGameStore((s) => s.accepted.L3T4 ?? NONE)
  const complete = useGameStore((s) => isTaskCompleted(s, 'L3T4'))
  const isIn = (id: ArtefactId) => complete || accepted.includes(id)

  return (
    <>
      <Desk variant="computer" />
      <BankComputer zoomed instant>
        <h1 className="pc-title">{complete ? report.evidenceTitle : task.prompt}</h1>
        {report.evidence.map((item, i) => {
          const Thumb = SLOTS[item.artefactId]
          const attached = isIn(item.artefactId)
          return (
            <button
              key={item.artefactId}
              type="button"
              className={`ev-slot ev-slot--${i + 1}${attached ? ' is-attached' : ''}`}
              data-artefact={item.artefactId}
              data-slot={item.artefactId}
              disabled={attached}
              aria-label={`${item.label}${attached ? ` (${GAME.ui.slotDone})` : ''}`}
              onClick={() => tap(item.artefactId)}
            >
              <Thumb />
              {attached && (
                <motion.span className="ev-tick" initial={{ scale: 0 }} animate={{ scale: 1 }} aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <path d="M5 12.5 L10 17.5 L19 7" />
                  </svg>
                </motion.span>
              )}
            </button>
          )
        })}
        {complete && (
          <dl className="ev-notes">
            {report.evidence.map((item) => (
              <div key={item.artefactId}>
                <dt>{item.label}</dt>
                <dd>{item.detail}</dd>
              </div>
            ))}
          </dl>
        )}
        {accepted.length === 0 && !complete && <ScreenHint text={task.instruction} />}
        {complete && <ScreenButton label={report.reviewCta} onClick={() => navigate(SCREENS.reviewReport.path)} />}
      </BankComputer>
      <SceneScanner />
    </>
  )
}

/** Attaching shows on the screen itself (a tick on the slot): the store's feedback just closes. */
function Attached() {
  const dismiss = useGameStore((s) => s.dismissFeedback)
  // Its sound comes from the SoundDirector.
  useEffect(() => dismiss(), [dismiss])
  return null
}

function feedbackView(feedback: Feedback) {
  // "Not needed" (the cheque) and "already attached" stay as small notes.
  if (feedback.tone === 'neutral') return <FeedbackLayer toastsOnly />
  return <Attached key={feedback.id} />
}

/** 14, 14c: scan evidence. */
export function EvidenceScreen() {
  return (
    <TaskScreen taskId="L3T4" variant="scene" keepScene feedbackView={feedbackView}>
      <div className="screen--computer">
        <EvidenceDesk />
      </div>
    </TaskScreen>
  )
}
