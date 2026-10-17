import { GAME, formatStatementAmount, formatStatementDate } from '../../content/gameData'
import { BankIcon } from '../art/Icons'
import { HL_ROW_PITCH, HL_ROW_Y0, HL_SHEET, HL_SHEET_TRANSFORM } from './highlighterLayout'

const { statement } = GAME
const label = GAME.ui.statement.printed
const ui = GAME.ui.highlighter


/**
 * The statement on the highlighter desk (mockups 10–10j): every transaction, no balances, laid out
 * flat at 900 × 720 and projected onto the desk. Rows carry `data-row-id`, so the highlighter can
 * find the one under its tip; `highlight` paints the yellow band across one row.
 */
export function HighlighterStatement({ highlight }: { highlight?: string }) {
  return (
    <div
      className="hs-sheet"
      style={{ width: HL_SHEET.width, height: HL_SHEET.height, transform: HL_SHEET_TRANSFORM }}
    >
      <BankIcon className="hs-bank-icon" />
      {/* 10 names the bank as the cheque does ("National Bank"). */}
      <p className="hs-bank">{GAME.cheque.bankName.toUpperCase()}</p>
      <p className="hs-account">{ui.account}</p>
      <p className="hs-period-label">{ui.period}</p>
      <p className="hs-period">
        {formatStatementDate(statement.period.from)} – {formatStatementDate(statement.period.to)}
      </p>
      <span className="hs-rule" aria-hidden="true" />
      <div className="hs-head" aria-hidden="true">
        <span className="hs-col-date">{label.date}</span>
        <span className="hs-col-desc">{label.description}</span>
        <span className="hs-col-amount">{label.amount}</span>
      </div>
      <ol className="hs-rows">
        {statement.rows.map((row, i) => (
          <li
            key={row.id}
            data-row-id={row.id}
            className={`hs-row${highlight === row.id ? ' is-highlighted' : ''}`}
            style={{ top: HL_ROW_Y0 + i * HL_ROW_PITCH - HL_ROW_PITCH / 2, height: HL_ROW_PITCH }}
          >
            <span className="hs-col-date">{formatStatementDate(row.date)}</span>
            <span className="hs-col-desc">{row.description}</span>
            <span className={`hs-col-amount hs-amount--${row.direction}`}>
              {row.direction === 'credit' ? '+' : '-'}
              {formatStatementAmount(row.amount)}
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}
