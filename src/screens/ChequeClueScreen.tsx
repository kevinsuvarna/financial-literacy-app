import { Fragment } from 'react'
import { useNavigate } from 'react-router'
import { GAME } from '../content/gameData'
import { SCREENS } from '../app/screens'
import { HighlighterPen } from '../components/art/HighlighterPen'
import { Panel, SceneCta } from '../components/scene/FeedbackParts'
import { PrintedStatement } from '../components/statement/PrintedStatement'
import { TaskScreen } from '../components/TaskScreen'

const task = GAME.tasks.L2T2

/** The statement's two cheque rows (the payment and its return), highlighted on 09. */
const CHEQUE_ROWS = GAME.statement.rows.filter((row) => row.isCheque).map((row) => row.id)

/** 09's statement: the flat 1000 × 650 sheet mapped onto the corners measured in the mockup. */
const SHEET = 'matrix3d(0.775337095, 0.041669867, 0, 0.000012542, -0.033281209, 0.763483918, 0, 0.000003474, 0, 0, 1, 0, 672.8, 198.1, 0, 1)'

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
        <div className="clue-statement" style={{ transform: SHEET }}>
          <div className="statement-sheet clue-sheet--under-2" aria-hidden="true" />
          <div className="statement-sheet clue-sheet--under-1" aria-hidden="true" />
          <PrintedStatement balancesShown={GAME.tasks.L2T1.statementBalancesShown ?? 0} highlight={CHEQUE_ROWS} showClosing className="printed-statement--clue" />
        </div>
        <HighlighterPen className="clue-pen" />
        <SceneCta label={clue.cta} className="clue-cta" onClick={() => navigate(SCREENS.cheque.path)} />
      </div>
    </TaskScreen>
  )
}
