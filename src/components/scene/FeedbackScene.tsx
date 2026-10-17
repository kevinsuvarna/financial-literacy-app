import { GAME, type ArtefactId } from '../../content/gameData'
import type { Feedback } from '../../state/gameStore'
import { Panel, SceneCta, Stamp } from './FeedbackParts'
import { Desk } from './TableScene'
import { BalanceCard } from '../statement/BalanceCard'
import artCurrent from '../../assets/interim/art-current.png'
import artFixed from '../../assets/interim/art-fixed-deposit.png'
import artRecurring from '../../assets/interim/art-recurring-deposit.png'
import artSavings from '../../assets/interim/art-savings.png'
import idAadhaar from '../../assets/interim/id-aadhaar-card.png'
import idLibrary from '../../assets/interim/id-library-card.png'
import idPan from '../../assets/interim/id-pan-card.png'
import idPassport from '../../assets/interim/id-passport.png'
import pin from '../../assets/interim/pin.png'
import slipDeposit from '../../assets/interim/slip-deposit.png'
import slipWithdrawal from '../../assets/interim/slip-withdrawal.png'

/**
 * Mockup sizes are measured on the stamp's and button's coloured fill; the drawn outline and
 * rough edge add this much on top.
 */
const STAMP_EDGE = 5
const CTA_EDGE = 17

/** Interim art lifted from the feedback mockups (04a–06c). */
const ART: Partial<Record<ArtefactId, string>> = {
  'savings-account': artSavings,
  'current-account': artCurrent,
  'fixed-deposit-account': artFixed,
  'recurring-deposit-account': artRecurring,
  'expired-passport': idPassport,
  'library-card': idLibrary,
  'pan-card': idPan,
  'aadhaar-card': idAadhaar,
  'deposit-slip': slipDeposit,
  'withdrawal-slip': slipWithdrawal,
}

/**
 * Full-screen feedback card for a scan (mockups 04a–06c): desk, tilted paper, stamp, the scanned
 * artefact, the explanation and one button. Replaces the table scene until the button is pressed.
 */
export function FeedbackScene({ feedback, onContinue }: { feedback: Feedback; onContinue: () => void }) {
  const artefact = feedback.artefactId ? GAME.artefacts[feedback.artefactId] : null
  const layout = artefact?.kind === 'bank-slip' ? 'slip' : artefact?.kind === 'balance-card' ? 'balance' : 'card'
  const good = feedback.tone !== 'incorrect'
  const art = feedback.artefactId ? ART[feedback.artefactId] : undefined

  return (
    <div
      className={`feedback-scene feedback-scene--${layout} feedback-scene--${feedback.artefactId ?? 'none'}`}
      data-testid="feedback-scene"
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-heading"
    >
      {layout !== 'balance' && <Desk variant="feedback" />}
      <Panel className={`panel--${layout}`}>
        <div className="fb-text">
          <h2 id="feedback-heading" className="fb-heading">
            {feedback.message}
          </h2>
          <div className="fb-body">
            {feedback.paragraphs?.map((p) => (
              <p key={p}>{p}</p>
            ))}
            {feedback.detail && <p>{feedback.detail}</p>}
            {feedback.bullets && (
              <ul className="fb-bullets">
                {feedback.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Panel>

      {artefact?.kind === 'account-type' && (
        <>
          <div className="fb-card">
            <span className="table-card-label">{artefact.cardLabel}</span>
          </div>
          {art && <img className="fb-art" src={art} alt="" />}
          <img className="fb-pin" src={pin} alt="" />
        </>
      )}
      {artefact?.kind === 'identity-document' && (
        <>
          {art && <img className="fb-art" src={art} alt="" />}
          <p className="fb-art-label">{artefact.detailLabel}</p>
        </>
      )}
      {artefact?.kind === 'bank-slip' && art && <img className="fb-art" src={art} alt={artefact.name} />}
      {artefact?.kind === 'balance-card' && (
        <BalanceCard amount={artefact.printedAmount ?? 0} tone={good ? 'right' : 'wrong'} className="fb-balance-card" />
      )}

      {feedback.title && (
        <Stamp
          text={feedback.title}
          good={good}
          width={feedback.layout?.stampWidth && feedback.layout.stampWidth + STAMP_EDGE}
          className="fb-stamp"
        />
      )}
      <SceneCta
        label={feedback.cta ?? (good ? GAME.ui.next : GAME.ui.tryAgain)}
        back={!good}
        width={feedback.layout?.ctaWidth && feedback.layout.ctaWidth + CTA_EDGE}
        className="fb-cta"
        onClick={onContinue}
      />
    </div>
  )
}
