import { Fragment } from 'react'
import { useNavigate } from 'react-router'
import { GAME } from '../content/gameData'
import { SCREENS } from '../app/screens'
import { HighlighterPen } from '../components/art/HighlighterPen'
import { Panel, SceneCta } from '../components/scene/FeedbackParts'
import { PrintedStatement } from '../components/statement/PrintedStatement'
import { SHEET_ON } from '../components/statement/statementLayout'
import { TaskScreen } from '../components/TaskScreen'

const task = GAME.tasks.L2T2

/** The statement's two cheque rows (the payment and its return), highlighted on 09. */
const CHEQUE_ROWS = GAME.statement.rows.filter((row) => row.isCheque).map((row) => row.id)

/** `**bold**` spans and line breaks in the clue copy. */
function Rich({ text }: { text: string }) {
  return text.split('\n').map((line, i) => (
    <Fragment key={i}>
      {i > 0 && <br />}
      {line.split('**').map((part, j) => (j % 2 ? <strong key={j}>{part}</strong> : part))}
    </Fragment>
  ))
}

/**
 * 09: "Wait… look at this." The statement with the cheque payment and its return highlighted;
 * CHECK CHEQUE opens the cheque (09b).
 */
export function ChequeClueScreen() {
  const navigate = useNavigate()
  const { clue } = task
  return (
    <TaskScreen taskId="L2T2" variant="scene">
      <div className="screen--clue">
        <Panel className="panel--clue">
          <h1 className="clue-heading">{clue.heading}</h1>
          <div className="clue-text">
            {clue.paragraphs.map((p) => (
              <p key={p}>
                <Rich text={p} />
              </p>
            ))}
            <p>{clue.question}</p>
          </div>
        </Panel>
        <div className="st-stack" style={{ transform: SHEET_ON.clue.transform }}>
          <div className="st-under st-under--clue-2" aria-hidden="true" />
          <div className="st-under st-under--clue-1" aria-hidden="true" />
          <PrintedStatement highlight={CHEQUE_ROWS} showClosing />
        </div>
        <HighlighterPen className="clue-pen" />
        <SceneCta label={clue.cta} className="clue-cta" onClick={() => navigate(SCREENS.cheque.path)} />
      </div>
    </TaskScreen>
  )
}
