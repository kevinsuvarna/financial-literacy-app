import { Fragment } from 'react'
import { useNavigate } from 'react-router'
import { GAME, type ArtefactId } from '../content/gameData'
import { SCREENS } from '../app/screens'
import { Icon } from '../components/Icon'
import { useActionHandler } from '../components/actionHandler'
import { TaskScreen } from '../components/TaskScreen'
import { useGameStore } from '../state/gameStore'

const task = GAME.tasks.L3T5
const NONE: readonly ArtefactId[] = []

function Report() {
  const handle = useActionHandler()
  const navigate = useNavigate()
  const attached = useGameStore((s) => s.accepted[task.evidenceTaskId] ?? NONE)
  const submitReport = useGameStore((s) => s.submitReport)
  const dismissFeedback = useGameStore((s) => s.dismissFeedback)

  const submit = () => {
    const result = handle(submitReport())
    // Success has its own screen (19) rather than a pop-up.
    if (result.completedTask) {
      dismissFeedback()
      navigate(SCREENS.reportSubmitted.path)
    }
  }

  return (
    <div className="report">
      <div className="report-sheet paper">
        <dl className="report-fields">
          {task.fields.map((field) => (
            <Fragment key={field.label}>
              <dt>{field.label}:</dt>
              <dd>{field.value}</dd>
            </Fragment>
          ))}
        </dl>
        <h2 className="report-evidence-title">{task.evidenceTitle}</h2>
        <ul className="report-evidence">
          {task.evidence.map((item) => {
            const isAttached = attached.includes(item.artefactId)
            return (
              <li key={item.artefactId} className={isAttached ? 'is-attached' : undefined}>
                {isAttached && <Icon name="check" />} {item.label}
              </li>
            )
          })}
        </ul>
      </div>
      <button type="button" className="cta" onClick={submit}>
        {task.cta}
      </button>
    </div>
  )
}

/** 18: Review incident report. */
export function ReviewReportScreen() {
  return (
    <TaskScreen taskId="L3T5">
      <Report />
    </TaskScreen>
  )
}
