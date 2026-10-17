import { useNavigate } from 'react-router'
import { GAME } from '../content/gameData'
import { resumeRoute, taskEntryRoute } from '../app/navigation'
import { BackButton } from '../components/BackButton'
import { CorkBoard } from '../components/board/CorkBoard'
import { useProgress } from '../state/hooks'

/**
 * 21: Case Board (mockup 21-case-board.png). Tap a level's card to resume it (or revisit a solved
 * one), or a step dot to open that step. Locked levels stay shut; revisiting never changes progress.
 */
export function CaseBoardScreen() {
  const navigate = useNavigate()
  const progress = useProgress()

  return (
    <div className="screen screen--board">
      <h1 className="visually-hidden">{GAME.caseBoard.title}</h1>
      <CorkBoard progress={progress} onOpenTask={(taskId) => navigate(taskEntryRoute(taskId))} />
      <BackButton fallback={resumeRoute(progress)} />
    </div>
  )
}
