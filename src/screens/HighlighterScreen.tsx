import { GAME } from '../content/gameData'
import { InfoIcon } from '../components/art/Icons'
import { HighlighterPen } from '../components/art/HighlighterPen'
import { Highlighter } from '../components/Highlighter'
import { useActionHandler } from '../components/actionHandler'
import { SceneCta } from '../components/scene/FeedbackParts'
import { Desk } from '../components/scene/TableScene'
import { HighlighterStatement } from '../components/statement/HighlighterStatement'
import { HL_PEN_HOME, penStyle, penTipOnRow } from '../components/statement/highlighterLayout'
import { TaskScreen } from '../components/TaskScreen'
import { isTaskCompleted, useGameStore, type Feedback } from '../state/gameStore'

const task = GAME.tasks.L2T3
const ui = GAME.ui.highlighter
const { rows } = GAME.statement

/** "₹ 1,500", as the mockups' feedback headings write amounts. */
const rupees = (amount: number) => `₹ ${amount.toLocaleString('en-IN')}`

/** 10: the statement on the desk, the question above it, the pen beside it. Drag the pen over a row. */
function HighlightDesk() {
  const handle = useActionHandler()
  const highlight = useGameStore((s) => s.highlightTransaction)
  const solved = useGameStore((s) => isTaskCompleted(s, 'L2T3'))
  // Once solved (revisiting), the clue stays highlighted.
  const clue = solved ? rows.find((row) => row.suspicious)?.id : undefined

  return (
    <>
      <Desk variant="highlighter" />
      <h1 className="hl-title">{task.prompt}</h1>
      <HighlighterStatement highlight={clue} />
      <p className="hl-hint">
        <InfoIcon className="mat-hint-icon" />
        <span>{task.instruction}</span>
      </p>
      <p className="hl-drag-me">{ui.dragMe}</p>
      <Highlighter home={HL_PEN_HOME} onDrop={(rowId) => handle(highlight(rowId))} />
    </>
  )
}

/**
 * 10b–10j: the pen rests on the row it was dragged to, the row is highlighted, the heading says
 * whether it's suspicious, and a note beside the statement says why. TRY AGAIN puts the pen back;
 * INVESTIGATE (the CAMS TEL row) moves on.
 */
function HighlightFeedback({ feedback, onContinue }: { feedback: Feedback; onContinue: () => void }) {
  const index = rows.findIndex((row) => row.id === feedback.rowId)
  const row = rows[index]
  const found = feedback.tone === 'correct'
  if (!row) return null
  return (
    <div className="hl-feedback" role="dialog" aria-label={found ? ui.suspicious : ui.notSuspicious}>
      <Desk variant="highlighter" />
      <h1 className="hl-title">
        <span className={found ? 'hl-verdict hl-verdict--suspicious' : 'hl-verdict'}>
          {found ? ui.suspicious : ui.notSuspicious}
        </span>{' '}
        {rupees(row.amount)}
        <br />
        {row.highlightLabel}
      </h1>
      <HighlighterStatement highlight={row.id} />
      <div className="hl-pen-rest" style={penStyle(penTipOnRow(index))} aria-hidden="true">
        <HighlighterPen />
      </div>
      {/* 10h has no note beside the statement: the explanation is read out to screen readers only. */}
      <p className={found ? 'visually-hidden' : 'hl-note'}>{feedback.message}</p>
      <SceneCta
        label={feedback.cta ?? GAME.ui.tryAgain}
        back={!found}
        className={found ? 'hl-cta hl-cta--next' : 'hl-cta hl-cta--back'}
        onClick={onContinue}
      />
    </div>
  )
}

/** 10–10j: highlight the transaction Ananya doesn't remember making. */
export function HighlighterScreen() {
  return (
    <TaskScreen
      taskId="L2T3"
      variant="scene"
      feedbackView={(feedback, onContinue) => <HighlightFeedback key={feedback.id} feedback={feedback} onContinue={onContinue} />}
    >
      <div className="screen--highlighter">
        <HighlightDesk />
      </div>
    </TaskScreen>
  )
}
