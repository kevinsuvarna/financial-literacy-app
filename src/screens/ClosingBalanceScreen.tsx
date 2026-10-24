import { GAME } from '../content/gameData'
import { InfoIcon } from '../components/art/Icons'
import { SceneScanner } from '../components/scene/SceneScanner'
import { ScannedMark } from '../components/scene/Scanned'
import { useScanMarks } from '../components/scene/useScanMarks'
import { useTapArtefact } from '../components/scene/useTapArtefact'
import { Desk, Mat } from '../components/scene/TableScene'
import { BalanceCard } from '../components/statement/BalanceCard'
import { PrintedStatement } from '../components/statement/PrintedStatement'
import { SHEET_ON } from '../components/statement/statementLayout'
import { TaskScreen } from '../components/TaskScreen'

const task = GAME.tasks.L2T1

/** 08: The bank statement on the desk; scan (or tap) the card with the closing balance (mockup 08). */
export function ClosingBalanceScreen() {
  return (
    <TaskScreen taskId="L2T1" variant="scene">
      <StatementDesk />
    </TaskScreen>
  )
}

function StatementDesk() {
  const tap = useTapArtefact()
  const markOf = useScanMarks('L2T1')

  return (
    <>
      <Desk variant="statement" />
      <Mat name="closingBalance">
        <h1 className="mat-title">{task.prompt}</h1>
        {/* The answer cards, for tapping. Physical copies are scanned. */}
        <ul className="answer-cards">
          {task.options.map((id) => {
            const mark = markOf(id)
            return (
              <li key={id}>
                <button
                  type="button"
                  className={`answer-card${mark ? ' is-scanned' : ''}`}
                  data-artefact={id}
                  disabled={!!mark}
                  onClick={() => tap(id)}
                >
                  <BalanceCard amount={GAME.artefacts[id].printedAmount ?? 0} />
                  <ScannedMark mark={mark} />
                </button>
              </li>
            )
          })}
        </ul>
        <p className="mat-hint">
          <InfoIcon className="mat-hint-icon" />
          {task.instruction}
        </p>
      </Mat>
      {/* The statement and the sheets under it, laid out flat and projected onto the desk. */}
      <div className="st-stack" style={{ transform: SHEET_ON.closingBalance.transform }}>
        <div className="st-under st-under--2" aria-hidden="true" />
        <div className="st-under st-under--1" aria-hidden="true" />
        <PrintedStatement balancesShown={task.statementBalancesShown ?? 0} />
      </div>
      <SceneScanner />
    </>
  )
}
