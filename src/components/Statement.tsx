import { GAME, formatRupees, formatStatementDate } from '../content/gameData'
import { isTaskCompleted, useGameStore } from '../state/gameStore'

interface StatementProps {
  /**
   * `all`: running balances and closing balance.
   * `closing-after-solved`: opening balance only. Running balances are blank and the closing
   * balance stays hidden until Level 2, Task 1 is solved, so the statement never gives it away.
   */
  balances: 'all' | 'closing-after-solved'
  /** Row to mark as a clue. */
  clueRowId?: string
}

/** Ananya's bank statement. Rows carry `data-row-id` so the highlighter can find them. */
export function Statement({ balances, clueRowId }: StatementProps) {
  const { statement } = GAME
  const copy = GAME.ui.statement
  const closingSolved = useGameStore((s) => isTaskCompleted(s, 'L2T1'))
  const showRunning = balances === 'all'
  const showClosing = showRunning || closingSolved

  return (
    <section className="statement paper" aria-label={copy.title}>
      <header className="statement-header">
        <div>
          <h2 className="statement-title">{copy.title}</h2>
          <p>
            {statement.bankName} · {statement.branch}
          </p>
        </div>
        <div className="statement-account">
          <p>
            {statement.accountHolder} · {statement.accountType}
          </p>
          <p>
            {statement.maskedAccountNumber} · {copy.period}: {formatStatementDate(statement.period.from)} –{' '}
            {formatStatementDate(statement.period.to)}
          </p>
        </div>
      </header>
      <table className="statement-table">
        <thead>
          <tr>
            <th>{copy.date}</th>
            <th>{copy.description}</th>
            <th className="num">{copy.credit}</th>
            <th className="num">{copy.debit}</th>
            <th className="num">{copy.balance}</th>
          </tr>
        </thead>
        <tbody>
          <tr className="statement-opening">
            <td>{formatStatementDate(statement.period.from)}</td>
            <td>{copy.openingBalance}</td>
            <td />
            <td />
            <td className="num">{formatRupees(statement.openingBalance)}</td>
          </tr>
          {statement.rows.map((row) => (
            <tr key={row.id} data-row-id={row.id} className={row.id === clueRowId ? 'is-clue' : undefined}>
              <td>{formatStatementDate(row.date)}</td>
              <td>
                {row.description}
                {row.id === clueRowId && <span className="clue-tag">{GAME.ui.clue}</span>}
              </td>
              <td className="num">{row.direction === 'credit' ? formatRupees(row.amount) : ''}</td>
              <td className="num">{row.direction === 'debit' ? formatRupees(row.amount) : ''}</td>
              <td className="num">{showRunning ? formatRupees(row.balanceAfter) : ''}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td>{formatStatementDate(statement.period.to)}</td>
            <td>{copy.closingBalance}</td>
            <td className="num" colSpan={3} data-testid="closing-balance">
              {showClosing ? formatRupees(statement.closingBalance) : copy.unknown}
            </td>
          </tr>
        </tfoot>
      </table>
    </section>
  )
}
