import { useNavigate } from 'react-router'
import { GAME } from '../content/gameData'
import { resumeRoute } from '../app/navigation'
import { SCREENS } from '../app/screens'
import { useProgress } from '../state/hooks'

/** 01: Start screen. */
export function StartScreen() {
  const navigate = useNavigate()
  const progress = useProgress()

  return (
    <div className="screen screen--centered">
      <div className="hero paper">
        <h1 className="display-title">{GAME.start.title}</h1>
        <p className="hero-intro">{GAME.start.intro}</p>
        <div className="button-row">
          <button type="button" className="cta" onClick={() => navigate(SCREENS.callAnanya1.path)}>
            {GAME.start.cta}
          </button>
          {progress.introCompleted && (
            <button type="button" className="cta cta--secondary" onClick={() => navigate(resumeRoute(progress))}>
              {GAME.start.resumeCta}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
