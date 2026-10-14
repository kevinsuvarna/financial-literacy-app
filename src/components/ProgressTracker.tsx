import { useNavigate } from 'react-router'
import { GAME, type TaskId } from '../content/gameData'
import { SCREENS } from '../app/screens'
import { getLevelStatus, getTaskStatus } from '../state/gameStore'
import { useProgress } from '../state/hooks'
import { Icon } from './Icon'

/** Top progress tracker (spec 8): three levels, the tasks of the level on screen, and the Case Board. */
export function ProgressTracker({ viewing }: { viewing: TaskId }) {
  const progress = useProgress()
  const navigate = useNavigate()
  const viewingLevel = GAME.levels.find((level) => level.id === GAME.tasks[viewing].level)!

  return (
    <nav className="tracker" aria-label={GAME.ui.level}>
      <ol className="tracker-levels">
        {GAME.levels.map((level) => {
          const status = getLevelStatus(progress, level.id)
          const isViewing = level.id === viewingLevel.id
          return (
            <li
              key={level.id}
              className={`tracker-level tracker-level--${status}${isViewing ? ' is-viewing' : ''}`}
              aria-current={isViewing ? 'step' : undefined}
            >
              <span className="tracker-level-mark">
                {status === 'completed' ? <Icon name="check" /> : status === 'locked' ? <Icon name="lock" /> : level.number}
              </span>
              <span className="tracker-level-title">{level.title}</span>
              <span className="visually-hidden">{GAME.caseBoard.statusLabels[status]}</span>
            </li>
          )
        })}
      </ol>

      <ol className="tracker-tasks">
        {viewingLevel.tasks.map((id, index) => {
          const status = getTaskStatus(progress, id)
          return (
            <li
              key={id}
              className={`tracker-task tracker-task--${status}${id === viewing ? ' is-viewing' : ''}`}
              aria-current={id === viewing ? 'step' : undefined}
            >
              <span className="tracker-task-dot">{status === 'completed' ? <Icon name="check" size={14} /> : index + 1}</span>
              <span className="tracker-task-label">{GAME.tasks[id].label}</span>
              <span className="visually-hidden">{GAME.ui.taskStatus[status]}</span>
            </li>
          )
        })}
      </ol>

      <button type="button" className="tracker-caseboard" onClick={() => navigate(SCREENS.caseBoard.path)}>
        <Icon name="pin" /> {GAME.ui.caseBoard}
      </button>
    </nav>
  )
}
