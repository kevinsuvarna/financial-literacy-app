import { useNavigate } from 'react-router'
import { GAME, type TaskId } from '../content/gameData'
import { routeBack } from '../app/navigation'
import { SCREENS } from '../app/screens'
import { BackButton } from './BackButton'
import { isTaskCompleted, isTaskUnlocked } from '../state/gameStore'
import { useProgress } from '../state/hooks'
import caseFolder from '../assets/interim/case-folder.png'

/**
 * The header on every task screen (mockups 04–17): the Case Board folder, the level title,
 * and the level's three-step tracker. Steps the player has reached are filled.
 */
export function ProgressTracker({ viewing, backTo }: { viewing: TaskId; backTo?: string }) {
  const progress = useProgress()
  const navigate = useNavigate()

  const level = GAME.levels.find((l) => l.id === GAME.tasks[viewing].level)!
  const viewingStep = level.steps.findIndex((step) => step.tasks.includes(viewing))
  // As in the mockups: steps are filled up to the one on screen (04b: still step 1 after solving it).
  // A step covering several tasks (Level 3's Report) is reached once its first task is solved, and
  // then shows as a solid dot (13 → 13b, 14, 15).
  const opensStep = (step: { tasks: TaskId[] }) =>
    step.tasks.length > 1 && viewing === step.tasks[0] && !isTaskCompleted(progress, viewing)
  const reached = level.steps.map(
    (step, i) => i <= viewingStep && isTaskUnlocked(progress, step.tasks[0]) && !(i === viewingStep && opensStep(step)),
  )
  const allReached = reached.every(Boolean)

  return (
    <nav className="level-header" aria-label={`${GAME.ui.levelHeading} ${level.id}`}>
      <button
        type="button"
        className="level-header-folder"
        aria-label={GAME.ui.caseBoard}
        onClick={() => navigate(SCREENS.caseBoard.path)}
      >
        <img src={caseFolder} alt="" />
      </button>
      <BackButton fallback={backTo ?? routeBack(viewing)} />
      <h2 className="level-header-title">
        {GAME.ui.levelHeading} {level.id}: {level.title}
      </h2>
      <ol className="stepper">
        {level.steps.map((step, i) => (
          <li
            key={step.label}
            className={`stepper-step${reached[i] ? ' is-reached' : ''}${reached[i] && step.tasks.length > 1 ? ' is-solid' : ''}`}
            aria-current={i === viewingStep ? 'step' : undefined}
          >
            {i > 0 && (
              <span
                className={`stepper-line stepper-line--${allReached ? 'bright' : i === 1 ? 'medium' : 'dim'}`}
                aria-hidden="true"
              />
            )}
            <span className="stepper-dot">{i + 1}</span>
            <span className="stepper-label">{step.label}</span>
            <span className="visually-hidden">
              {step.tasks.every((t) => isTaskCompleted(progress, t))
                ? GAME.ui.taskStatus.completed
                : reached[i]
                  ? GAME.ui.taskStatus.current
                  : GAME.ui.taskStatus.locked}
            </span>
          </li>
        ))}
      </ol>
    </nav>
  )
}
