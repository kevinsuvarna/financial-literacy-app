import { useCallback, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { GAME, type TaskId } from '../content/gameData'
import { nextTaskId, routeAfterCompleting, taskEntryRoute } from '../app/navigation'
import { SCREENS } from '../app/screens'
import { isTaskCompleted, useGameStore } from '../state/gameStore'
import { ActionHandlerContext, type ActionHandler } from './actionHandler'
import { FeedbackLayer } from './FeedbackLayer'
import { ProgressTracker } from './ProgressTracker'

interface TaskScreenProps {
  taskId: TaskId
  children: ReactNode
  /** Shown beside the main area, e.g. the simulated-scan panel. */
  aside?: ReactNode
  /** Hide the task question, e.g. on the fake website. */
  hideHeader?: boolean
}

/** Layout for every task screen: progress tracker, question, content, feedback. */
export function TaskScreen({ taskId, children, aside, hideHeader = false }: TaskScreenProps) {
  const task = GAME.tasks[taskId]
  const navigate = useNavigate()
  const completed = useGameStore((s) => isTaskCompleted(s, taskId))
  const [nextRoute, setNextRoute] = useState<string | null>(null)

  const handle = useCallback<ActionHandler>((result) => {
    const route = routeAfterCompleting(result)
    if (route) setNextRoute(route)
    return result
  }, [])

  const next = nextTaskId(taskId)

  return (
    <ActionHandlerContext value={handle}>
      <div className="screen screen--task" data-task={taskId}>
        <ProgressTracker viewing={taskId} />
        {!hideHeader && (
          <header className="task-header">
            <h1 className="task-prompt">{task.prompt}</h1>
            <p className="task-instruction">{task.instruction}</p>
          </header>
        )}
        <div className="task-body">
          <main className="task-main">{children}</main>
          {aside}
        </div>
        {completed && !nextRoute && (
          <footer className="revisit-bar">
            <p>{GAME.ui.revisiting}</p>
            <button
              type="button"
              className="cta cta--small"
              onClick={() => navigate(next ? taskEntryRoute(next) : SCREENS.certificate.path)}
            >
              {GAME.ui.next}
            </button>
          </footer>
        )}
        <FeedbackLayer onClose={nextRoute ? () => navigate(nextRoute) : undefined} />
      </div>
    </ActionHandlerContext>
  )
}
