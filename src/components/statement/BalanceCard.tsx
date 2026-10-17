import { GAME, formatRupees } from '../../content/gameData'

/**
 * A closing-balance answer card (mockups 08b–08e). `neutral` on the table, so the colour never gives
 * the answer away; red or green on its feedback card.
 */
export function BalanceCard({
  amount,
  tone = 'neutral',
  className = '',
}: {
  amount: number
  tone?: 'neutral' | 'wrong' | 'right'
  className?: string
}) {
  return (
    <div className={`balance-card balance-card--${tone} ${className}`}>
      <span className="balance-card-label">{GAME.ui.balanceCard}</span>
      <span className="balance-card-window">
        <span className="balance-card-amount">{formatRupees(amount)}</span>
        <span className="balance-card-watermark" aria-hidden="true">
          ₹
        </span>
      </span>
    </div>
  )
}
