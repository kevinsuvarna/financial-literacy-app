import type { CSSProperties } from 'react'
import { GAME, formatStatementAmount, type ChequeAreaId } from '../../content/gameData'
import { CHEQUE_AREAS, boxStyle } from './chequeLayout'
import { MicrLine } from './MicrLine'
import { AnanyaSignature } from '../art/AnanyaSignature'

const { cheque } = GAME
const label = GAME.ui.cheque

/** The date as the eight digits written in the boxes (DDMMYYYY). */
const digits = (iso: string) => {
  const [y, m, d] = iso.split('-')
  return `${d}${m}${y}`.split('')
}
const DATE_KEYS = ['D', 'D', 'M', 'M', 'Y', 'Y', 'Y', 'Y']

function ChequeBankIcon() {
  return (
    <svg className="cq-bank-icon" viewBox="0 0 67 70" aria-hidden="true">
      <path d="M33.5 1 L66 21 L1 21 Z" />
      <rect x="4" y="24" width="59" height="6" />
      <rect x="8" y="33" width="11" height="25" />
      <rect x="28" y="33" width="11" height="25" />
      <rect x="48" y="33" width="11" height="25" />
      <rect x="1" y="61" width="65" height="8" />
    </svg>
  )
}

/** The amount row is one tap target covering words and figures (09e highlights the whole row). */
const AREA_LABELS = Object.fromEntries(
  GAME.tasks.L2T2.areas.map((a) => [a.id, a.id === 'amount-words' ? `${a.label} / ${GAME.tasks.L2T2.areas.find((b) => b.id === 'amount-figures')?.label}` : a.label]),
) as Record<ChequeAreaId, string>

interface ChequeProps {
  /** Tap handler for the areas; without it the cheque is a picture. */
  onArea?: (id: ChequeAreaId) => void
  className?: string
  style?: CSSProperties
}

/**
 * Ananya's returned cheque. Every value comes from the case data; the amount in words is written
 * out from `amountInWordsValue`, so the mismatch with the figures is the data's, not the art's.
 */
export function Cheque({ onArea, className = '', style }: ChequeProps) {
  const areaButton = (id: ChequeAreaId) =>
    onArea ? (
      <button
        key={id}
        type="button"
        className={`cq-area cq-area--${id}`}
        data-area={id}
        aria-label={AREA_LABELS[id]}
        style={boxStyle(CHEQUE_AREAS[id].area)}
        onClick={() => onArea(id)}
      />
    ) : null

  return (
    <div className={`cheque ${className}`} style={style} data-testid="cheque">
      <div className="cq-strip" aria-hidden="true" />
      <div className="cq-micr-band" aria-hidden="true" />

      <ChequeBankIcon />
      <p className="cq-bank">{cheque.bankName.toUpperCase()}</p>
      <p className="cq-branch">{cheque.branch}</p>
      <p className="cq-address">{cheque.branchAddress}</p>
      <p className="cq-ifsc">
        {label.ifsc}
        <span>{cheque.ifsc}</span>
      </p>
      <p className="cq-validity">{label.validity}</p>

      <p className="cq-date-label">{label.date}</p>
      <ol className="cq-date" aria-label={label.date}>
        {digits(cheque.date).map((digit, i) => (
          <li key={i}>
            <span className="cq-hand">{digit}</span>
            <small>{DATE_KEYS[i]}</small>
          </li>
        ))}
      </ol>

      <p className="cq-pay-label">{label.pay}</p>
      <span className="cq-rule cq-rule--pay" aria-hidden="true" />
      <p className="cq-hand cq-payee">{cheque.payee}</p>
      <p className="cq-bearer">
        {label.bearer}
        <svg viewBox="0 0 130 10" aria-hidden="true">
          <path d="M1 6 C40 4 90 3 128 1" />
        </svg>
      </p>

      <p className="cq-rupees-label">{label.rupees}</p>
      <span className="cq-rule cq-rule--rupees" aria-hidden="true" />
      <p className="cq-hand cq-words">{cheque.amountInWords}</p>
      <div className="cq-amount-box">
        <span className="cq-amount-rupee">₹</span>
        <span className="cq-hand cq-amount">{formatStatementAmount(cheque.amountInFigures)}</span>
      </div>
      <span className="cq-rule cq-rule--blank" aria-hidden="true" />

      <div className="cq-account">
        <span>{label.accountNumber}</span>
        <span className="cq-account-number">{cheque.accountNumber}</span>
      </div>

      <AnanyaSignature className="cq-hand cq-signature" label={cheque.drawer} />
      <span className="cq-rule cq-rule--signature" aria-hidden="true" />
      <p className="cq-sign-here">{label.signHere}</p>

      <MicrLine className="cq-micr" chequeNumber={cheque.number} />

      {onArea && GAME.tasks.L2T2.areas.map((a) => (a.id === 'amount-figures' ? null : areaButton(a.id)))}
    </div>
  )
}
