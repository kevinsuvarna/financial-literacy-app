import { useNavigate } from 'react-router'
import { GAME } from '../content/gameData'
import { resumeRoute } from '../app/navigation'
import { useGameStore } from '../state/gameStore'

/** 03: Case assigned. Opening the case file unlocks Level 1. */
export function CaseAssignedScreen() {
  const navigate = useNavigate()
  const completeIntro = useGameStore((s) => s.completeIntro)

  const openCaseFile = () => {
    completeIntro()
    navigate(resumeRoute(useGameStore.getState()))
  }

  return (
    <div className="screen screen--centered">
      <div className="hero paper">
        <h1 className="display-title display-title--medium">{GAME.caseAssigned.title}</h1>
        <p className="hero-intro">{GAME.caseAssigned.message}</p>
        <button type="button" className="cta" onClick={openCaseFile}>
          {GAME.caseAssigned.cta}
        </button>
      </div>
    </div>
  )
}
