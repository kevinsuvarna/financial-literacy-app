import { useId, type CSSProperties } from 'react'
import { GAME, formatRupees, formatStatementAmount, formatStatementDate } from '../../content/gameData'
import { BankIcon } from '../art/Icons'
import { ROW_PITCH, ROW_Y0, STATEMENT } from './statementLayout'

const { statement } = GAME

/** "₹ 8,200", as the summary box prints it. */
const summary = (amount: number) => formatRupees(amount).replace('₹', '₹ ')
const label = GAME.ui.statement.printed

/** Places a row of the table: its centre on the sheet. */
const rowStyle = (index: number): CSSProperties => ({ top: ROW_Y0 + index * ROW_PITCH - ROW_PITCH / 2, height: ROW_PITCH })

/**
 * The sheet itself: worn, greyed paper with stains, a soft fold down the middle and rough edges
 * (2026-10-24 mockups). Drawn in SVG so it stays sharp when projected.
 */
function AgedPaper() {
  const id = useId().replace(/:/g, '')
  return (
    <svg className="st-paper" viewBox={`0 0 ${STATEMENT.width} ${STATEMENT.height}`} aria-hidden="true">
      <defs>
        {/* Rough, slightly torn edges. */}
        <filter id={`${id}-edge`} x="-2%" y="-2%" width="104%" height="104%">
          <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="3" seed="4" />
          <feDisplacementMap in="SourceGraphic" scale="5" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        {/* Blotchy age stains. */}
        <filter id={`${id}-stain`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.011 0.016" numOctaves="4" seed="11" />
          <feColorMatrix values="0 0 0 0 0.58  0 0 0 0 0.47  0 0 0 0 0.33  0 0 0 -3 1.55" />
          <feComposite in2="SourceGraphic" operator="in" />
        </filter>
        {/* Fine grain. */}
        <filter id={`${id}-grain`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="2" />
          <feColorMatrix values="0 0 0 0 0.35  0 0 0 0 0.31  0 0 0 0 0.25  0 0 0 -1.2 0.62" />
          <feComposite in2="SourceGraphic" operator="in" />
        </filter>
        <radialGradient id={`${id}-edges`} cx="0.5" cy="0.5" r="0.75">
          <stop offset="0.6" stopColor="var(--st-edge)" stopOpacity="0" />
          <stop offset="1" stopColor="var(--st-edge)" stopOpacity="0.75" />
        </radialGradient>
        <linearGradient id={`${id}-fold`} x1="0" x2="1">
          <stop offset="0" stopColor="var(--st-fold-dark)" stopOpacity="0" />
          <stop offset="0.5" stopColor="var(--st-fold-dark)" stopOpacity="0.35" />
          <stop offset="0.56" stopColor="var(--st-fold-light)" stopOpacity="0.55" />
          <stop offset="1" stopColor="var(--st-fold-light)" stopOpacity="0" />
        </linearGradient>
        <clipPath id={`${id}-sheet`}>
          <rect width={STATEMENT.width} height={STATEMENT.height} rx="26" />
        </clipPath>
      </defs>
      <g filter={`url(#${id}-edge)`}>
        <g clipPath={`url(#${id}-sheet)`}>
          <rect className="st-paper-base" width={STATEMENT.width} height={STATEMENT.height} />
          <rect width={STATEMENT.width} height={STATEMENT.height} fill="var(--st-paper)" filter={`url(#${id}-stain)`} opacity="0.5" />
          <rect width={STATEMENT.width} height={STATEMENT.height} fill="var(--st-paper)" filter={`url(#${id}-grain)`} />
          <rect width={STATEMENT.width} height={STATEMENT.height} fill={`url(#${id}-edges)`} />
          <rect x="490" width="50" height={STATEMENT.height} fill={`url(#${id}-fold)`} />
        </g>
      </g>
    </svg>
  )
}

/**
 * Ananya's printed bank statement (2026-10-24 mockups 08, 09, 10), flat at 1000 × 690. Every figure
 * comes from the case data. Only the first `balancesShown` rows show a running balance, and the
 * closing balance reads "????" until `showClosing`. Rows carry `data-row-id`, so the highlighter can
 * find the one under its tip; `highlight` marks rows with the highlighter's band.
 */
export function PrintedStatement({
  balancesShown = statement.rows.length,
  highlight = [],
  showClosing = false,
  className = '',
  style,
}: {
  balancesShown?: number
  highlight?: readonly string[]
  showClosing?: boolean
  className?: string
  style?: CSSProperties
}) {
  return (
    <div className={`st-sheet ${className}`} style={{ width: STATEMENT.width, height: STATEMENT.height, ...style }}>
      <AgedPaper />
      <BankIcon className="st-bank-icon" />
      <h2 className="st-bank">{statement.bankName.toUpperCase()}</h2>
      <p className="st-subtitle">{label.subtitle}</p>
      <dl className="st-account">
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

      <div className="st-summary">
        <p className="st-summary-row">
          <span>{label.opening}</span>
          <span className="st-figure">{summary(statement.openingBalance)}</span>
        </p>
        <p className="st-summary-row st-credit">
          <span>{label.credits}</span>
          <span className="st-figure">{summary(statement.totalCredits)}</span>
        </p>
        <p className="st-summary-row st-debit">
          <span>{label.debits}</span>
          <span className="st-figure">{summary(statement.totalDebits)}</span>
        </p>
        <p className="st-summary-row st-closing">
          <span>{label.closing}</span>
          <span className="st-figure">{showClosing ? summary(statement.closingBalance) : label.unknown}</span>
        </p>
      </div>

      <div className="st-head" aria-hidden="true">
        <span className="st-col-date">{label.date}</span>
        <span className="st-col-desc">{label.description}</span>
        <span className="st-col-type">{label.type_}</span>
        <span className="st-col-amount">{label.amount}</span>
        <span className="st-col-balance">{label.balance}</span>
      </div>
      <ol className="st-rows">
        <li className="st-row" style={rowStyle(0)}>
          <span className="st-col-date">{formatStatementDate(statement.period.from)}</span>
          <span className="st-col-desc">{label.openingRow}</span>
          <span className="st-col-type">{label.none}</span>
          <span className="st-col-amount">{label.none}</span>
          <span className="st-col-balance">{formatStatementAmount(statement.openingBalance)}</span>
        </li>
        {statement.rows.map((row, i) => (
          <li
            key={row.id}
            data-row-id={row.id}
            className={`st-row${highlight.includes(row.id) ? ' is-highlighted' : ''}`}
            style={rowStyle(i + 1)}
          >
            <span className="st-col-date">{formatStatementDate(row.date)}</span>
            <span className="st-col-desc">{row.description}</span>
            <span className="st-col-type">
              <span className={`st-pill st-pill--${row.direction}`}>{row.direction === 'credit' ? label.credit : label.debit}</span>
            </span>
            <span className={`st-col-amount st-amount--${row.direction}`}>
              {row.direction === 'credit' ? '+' : '-'}
              {formatStatementAmount(row.amount)}
            </span>
            <span className="st-col-balance">{i < balancesShown ? formatStatementAmount(row.balanceAfter) : ''}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}
