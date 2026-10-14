import { useNavigate } from 'react-router'
import { GAME } from '../content/gameData'
import { resumeRoute, taskEntryRoute } from '../app/navigation'
import { SCREENS } from '../app/screens'
import { Icon } from '../components/Icon'
import { getLevelStatus, getTaskStatus, isMissionComplete } from '../state/gameStore'
import { useProgress } from '../state/hooks'

/** 21: Case Board. Revisit solved tasks, resume the current one; locked levels stay shut. */
export function CaseBoardScreen() {
  const navigate = useNavigate()
  const progress = useProgress()
  const statusLabels = GAME.caseBoard.statusLabels

  return (
    <div className="screen screen--board">
      <header className="board-header">
        <h1 className="display-title display-title--medium">{GAME.caseBoard.title}</h1>
        <div className="button-row">
          <button type="button" className="cta" onClick={() => navigate(resumeRoute(progress))}>
            {isMissionComplete(progress) ? GAME.ui.viewCertificate : GAME.ui.resume}
          </button>
        </div>
      </header>
      <ul className="board-levels">
        {GAME.levels.map((level) => {
          const status = getLevelStatus(progress, level.id)
          return (
            <li key={level.id} className={`board-card paper board-card--${status}`} data-level={level.id}>
              <span className="board-pin" aria-hidden="true" />
              <h2 className="board-card-title">
                {level.number} — {level.title}
              </h2>
              <p className="board-card-status" data-testid={`level-${level.id}-status`}>
                {status === 'locked' && <Icon name="lock" />} {statusLabels[status]}
              </p>
              <ol className="board-tasks">
                {level.tasks.map((id) => {
                  const taskStatus = getTaskStatus(progress, id)
                  return (
                    <li key={id}>
                      <button
                        type="button"
                        className={`board-task board-task--${taskStatus}`}
                        disabled={taskStatus === 'locked'}
                        onClick={() => navigate(taskEntryRoute(id))}
                      >
                        {taskStatus === 'completed' ? <Icon name="check" size={16} /> : null}
                        {GAME.tasks[id].label}
                        <span className="visually-hidden"> ({GAME.ui.taskStatus[taskStatus]})</span>
                      </button>
                    </li>
                  )
                })}
              </ol>
            </li>
          )
        })}
      </ul>
      <button type="button" className="board-home" onClick={() => navigate(SCREENS.start.path)}>
        {GAME.start.title}
      </button>
    </div>
  )
}
