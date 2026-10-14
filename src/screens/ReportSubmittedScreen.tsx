import { useNavigate } from 'react-router'
import { GAME } from '../content/gameData'
import { SCREENS } from '../app/screens'

const { submitted } = GAME.tasks.L3T5

/** 19: Report submitted (for investigation; nothing proven yet). */
export function ReportSubmittedScreen() {
  const navigate = useNavigate()

  return (
    <div className="screen screen--centered">
      <div className="hero paper">
        <h1 className="display-title display-title--medium">{submitted.title}</h1>
        <p className="hero-intro">{submitted.message}</p>
        {submitted.detail && <p>{submitted.detail}</p>}
        <button type="button" className="cta" onClick={() => navigate(SCREENS.certificate.path)}>
          {GAME.ui.continue}
        </button>
      </div>
    </div>
  )
}
