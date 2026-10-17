import { useCallback, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { GAME, type TaskId } from '../content/gameData'
import { levelIntroAfter, nextTaskId, routeAfterCompleting, taskEntryRoute } from '../app/navigation'
import { SCREENS } from '../app/screens'
import { isTaskCompleted, useGameStore, type Feedback } from '../state/gameStore'
import { ActionHandlerContext, type ActionHandler } from './actionHandler'
import { FeedbackLayer } from './FeedbackLayer'
import { FeedbackScene } from './scene/FeedbackScene'
import { ProgressTracker } from './ProgressTracker'

interface TaskScreenProps {
  taskId: TaskId
  children: ReactNode
  /** Shown beside the main area, e.g. the scanner panel. */
  aside?: ReactNode
  /** Hide the task question, e.g. on the fake website. */
  hideHeader?: boolean
  /**
   * `scene`: a mockup-matched screen that lays out its own content on the canvas; only the
   * level header, feedback and the revisit bar come from here.
   */
  variant?: 'placeholder' | 'scene'
  /**
   * Scene screens that draw every feedback themselves, neutral notes included (the cheque, 09c–09f).
   * Called with the feedback and the action for its button; it replaces the scene while showing.
   */
  feedbackView?: (feedback: Feedback, onContinue: () => void) => ReactNode
  /** Where BACK goes when nothing was visited before this page load (default: the previous task). */
  backTo?: string
  /** Keep the scene showing under `feedbackView` (the computer screens: their feedback happens on the monitor). */
  keepScene?: boolean
}

/** Layout for every task screen: progress tracker, question, content, feedback. */
export function TaskScreen({ taskId, children, aside, hideHeader = false, variant = 'placeholder', feedbackView, backTo, keepScene = false }: TaskScreenProps) {
  const task = GAME.tasks[taskId]
  const navigate = useNavigate()
  const completed = useGameStore((s) => isTaskCompleted(s, taskId))
  const feedback = useGameStore((s) => s.feedback)
  const dismissFeedback = useGameStore((s) => s.dismissFeedback)
  const [nextRoute, setNextRoute] = useState<string | null>(null)
  // Moving on to a new level plays the Case Board transition (LevelIntro).
  const [nextState, setNextState] = useState<{ levelIntro: number } | undefined>(undefined)
  const goNext = (route: string) => navigate(route, nextState ? { state: nextState } : undefined)

  const handle = useCallback<ActionHandler>((result) => {
    const route = routeAfterCompleting(result)
    if (route) setNextRoute(route)
    const intro = levelIntroAfter(result)
    if (intro) setNextState({ levelIntro: intro })
    return result
  }, [])

  const next = nextTaskId(taskId)

  const revisitBar = completed && !nextRoute && (
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
  )

  if (variant === 'scene') {
    // Mockups 04a–06c: a scan's feedback is a full card that replaces the table until its button is pressed.
    const card = feedback && (feedbackView || feedback.tone !== 'neutral') ? feedback : null
    const closeCard = () => {
      const solvedAgain = card?.tone === 'correct' && completed
      dismissFeedback()
      if (nextRoute) goNext(nextRoute)
      // Revisiting a solved task: its right answer's button (SECURE, NEXT CLUE…) still moves on.
      else if (solvedAgain) navigate(next ? taskEntryRoute(next) : SCREENS.certificate.path)
    }
    return (
      <ActionHandlerContext value={handle}>
        <div className="screen screen--scene" data-task={taskId}>
          {/* Kept mounted under the card, so the scanner stays attached. */}
          <div className="scene-content" hidden={card !== null && !keepScene}>
            {children}
          </div>
          {card && (feedbackView ? feedbackView(card, closeCard) : <FeedbackScene key={card.id} feedback={card} onContinue={closeCard} />)}
          <ProgressTracker viewing={taskId} backTo={backTo} />
          {!card && revisitBar}
          {!feedbackView && <FeedbackLayer toastsOnly />}
        </div>
      </ActionHandlerContext>
    )
  }

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
        {revisitBar}
        <FeedbackLayer onClose={nextRoute ? () => goNext(nextRoute) : undefined} />
      </div>
    </ActionHandlerContext>
  )
}
