import { GAME, formatStatementAmount, formatStatementDate } from '../../content/gameData'
import { BankIcon } from '../art/Icons'

const { statement } = GAME
const label = GAME.ui.statement.printed

/**
 * Ananya's printed bank statement (mockup 08), laid out flat at 1000 × 650. Every figure comes from
 * the case data: rows, totals and running balances. The closing balance is left blank unless
 * `showClosing` (after Level 2, Task 1), and only the first `balancesShown` rows show a running balance.
 */
export function PrintedStatement({
  balancesShown,
  highlight = [],
  showClosing = false,
  className = '',
}: {
  balancesShown: number
  /** Rows marked with the highlighter (09: the cheque and its return). */
  highlight?: readonly string[]
  /** Print the closing balance, once Level 2, Task 1 is solved (09). */
  showClosing?: boolean
  className?: string
}) {
  return (
    <div className={`printed-statement ${className}`}>
      <header className="ps-header">
        <BankIcon className="ps-bank-icon" />
        <h2 className="ps-bank">{statement.bankName.toUpperCase()}</h2>
        <p className="ps-subtitle">{label.subtitle}</p>
        <dl className="ps-account">
          <dt>{label.holder}</dt>
          <dd>{statement.accountHolder}</dd>
          <dt>{label.number}</dt>
          <dd>{statement.maskedAccountNumber}</dd>
          <dt>{label.type}</dt>
          <dd>{statement.accountType}</dd>
          <dt>{label.period}</dt>
          <dd>
            {formatStatementDate(statement.period.from)} – {formatStatementDate(statement.period.to)}
          </dd>
        </dl>
      </header>

      <div className="ps-summary">
        <p className="ps-summary-row">
          <span>{label.opening}</span>
          <span className="ps-rupee">₹</span>
          <span className="ps-figure">{formatStatementAmount(statement.openingBalance)}</span>
        </p>
        <p className="ps-summary-row ps-credit">
          <span>{label.credits}</span>
          <span className="ps-rupee">₹</span>
          <span className="ps-figure">{formatStatementAmount(statement.totalCredits)}</span>
        </p>
        <p className="ps-summary-row ps-debit">
          <span>{label.debits}</span>
          <span className="ps-rupee">₹</span>
          <span className="ps-figure">{formatStatementAmount(statement.totalDebits)}</span>
        </p>
        <p className="ps-summary-row ps-closing">
          <span>{label.closing}</span>
          <span className="ps-rupee">₹</span>
          <span className="ps-figure">{showClosing ? formatStatementAmount(statement.closingBalance) : ''}</span>
        </p>
      </div>

      <table className="ps-table">
        <thead>
          <tr>
            <th className="ps-col-date">{label.date}</th>
            <th className="ps-col-desc">{label.description}</th>
            <th className="ps-col-type">{label.type_}</th>
            <th className="ps-col-amount">{label.amount}</th>
            <th className="ps-col-balance">{label.balance}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="ps-col-date">{formatStatementDate(statement.period.from)}</td>
            <td className="ps-col-desc">{label.openingRow}</td>
            <td className="ps-col-type">{label.none}</td>
            <td className="ps-col-amount">{label.none}</td>
            <td className="ps-col-balance">{formatStatementAmount(statement.openingBalance)}</td>
          </tr>
          {statement.rows.map((row, i) => (
            <tr key={row.id} data-row-id={row.id} className={highlight.includes(row.id) ? 'is-highlighted' : undefined}>
              <td className="ps-col-date">{formatStatementDate(row.date)}</td>
              <td className="ps-col-desc">{row.description}</td>
              <td className="ps-col-type">
                <span className={`ps-pill ps-pill--${row.direction}`}>
                  {row.direction === 'credit' ? label.credit : label.debit}
                </span>
              </td>
              <td className={`ps-col-amount ps-amount--${row.direction}`}>
                {row.direction === 'credit' ? '+' : '-'}
                {formatStatementAmount(row.amount)}
              </td>
              <td className="ps-col-balance">{i < balancesShown ? formatStatementAmount(row.balanceAfter) : ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
