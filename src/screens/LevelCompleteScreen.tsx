import { useNavigate } from 'react-router'
import { GAME, type LevelId } from '../content/gameData'
import { routeAfterLevel } from '../app/navigation'
import { SCREENS } from '../app/screens'

/** 07 and 11: Level complete. */
export function LevelCompleteScreen({ levelId }: { levelId: LevelId }) {
  const navigate = useNavigate()
  const level = GAME.levels.find((l) => l.id === levelId)!

  return (
    <div className="screen screen--centered">
      <div className="hero paper">
        <h1 className="display-title display-title--medium">{level.complete.title}</h1>
        <p className="hero-intro">{level.complete.message}</p>
        <div className="button-row">
          <button type="button" className="cta" onClick={() => navigate(routeAfterLevel(levelId))}>
            {GAME.ui.continue}
          </button>
          <button type="button" className="cta cta--secondary" onClick={() => navigate(SCREENS.caseBoard.path)}>
            {GAME.ui.caseBoard}
          </button>
        </div>
      </div>
    </div>
  )
}
