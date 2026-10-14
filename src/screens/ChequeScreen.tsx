import type { ReactNode } from 'react'
import { GAME, formatChequeDate, formatRupees, type ChequeAreaId } from '../content/gameData'
import { useActionHandler } from '../components/actionHandler'
import { TaskScreen } from '../components/TaskScreen'
import { isTaskCompleted, useGameStore } from '../state/gameStore'

const { cheque } = GAME

/** What each tappable area of the cheque shows. */
const AREA_CONTENT: Record<ChequeAreaId, ReactNode> = {
  bank: (
    <>
      <strong>{cheque.bankName}</strong> {cheque.branch}
    </>
  ),
  date: formatChequeDate(cheque.date),
  payee: cheque.payee,
  'amount-words': cheque.amountInWords,
  'amount-figures': `${formatRupees(cheque.amountInFigures)}/-`,
  'account-number': `${GAME.ui.cheque.accountNumber} ${cheque.accountNumber}`,
  signature: cheque.drawer,
  'cheque-number': `${GAME.ui.cheque.chequeNumber} ${cheque.number}`,
}

function ChequeAreas() {
  const handle = useActionHandler()
  const inspect = useGameStore((s) => s.inspectChequeArea)
  const solved = useGameStore((s) => isTaskCompleted(s, 'L2T2'))

  return (
    <div className="cheque paper" data-testid="cheque">
      {GAME.tasks.L2T2.areas.map((area) => (
        <button
          key={area.id}
          type="button"
          data-area={area.id}
          className={`cheque-area cheque-area--${area.id}${solved && area.isDiscrepancy ? ' is-mismatch' : ''}`}
          onClick={() => handle(inspect(area.id))}
        >
          <span className="cheque-area-label">{area.label}</span>
          <span className="cheque-area-value">{AREA_CONTENT[area.id]}</span>
        </button>
      ))}
    </div>
  )
}

/** 09: Cheque investigation (touch, not QR). */
export function ChequeScreen() {
  return (
    <TaskScreen taskId="L2T2">
      <ChequeAreas />
    </TaskScreen>
  )
}
