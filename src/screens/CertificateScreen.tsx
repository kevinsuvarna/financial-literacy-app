import { useNavigate } from 'react-router'
import { GAME } from '../content/gameData'
import { SCREENS } from '../app/screens'
import { useGameStore } from '../state/gameStore'

const { certificate } = GAME

/** 20: Mission complete certificate. */
export function CertificateScreen() {
  const navigate = useNavigate()
  const resetGame = useGameStore((s) => s.resetGame)

  const replay = () => {
    resetGame()
    navigate(SCREENS.start.path)
  }

  return (
    <div className="screen screen--centered">
      <div className="certificate paper">
        <p className="certificate-kicker">{certificate.title}</p>
        <h1 className="display-title display-title--medium">{certificate.headline}</h1>
        <p>{certificate.notified}</p>
        <p>{certificate.message}</p>
        <div className="badge" data-testid="badge">
          <span className="badge-label">{GAME.ui.certificateAwarded}</span>
          <strong className="badge-rank">{certificate.award}</strong>
        </div>
        <div className="button-row">
          <button type="button" className="cta" onClick={() => navigate(SCREENS.caseBoard.path)}>
            {certificate.caseBoardCta}
          </button>
          <button type="button" className="cta cta--secondary" onClick={replay}>
            {certificate.replayCta}
          </button>
        </div>
      </div>
    </div>
  )
}
