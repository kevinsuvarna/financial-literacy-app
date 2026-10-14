import { useNavigate } from 'react-router'
import { GAME } from '../content/gameData'
import { SCREENS } from '../app/screens'
import { useActionHandler } from '../components/actionHandler'
import { TaskScreen } from '../components/TaskScreen'
import { useGameStore } from '../state/gameStore'

const { fakeSite } = GAME.tasks.L3T1

function FakePage() {
  const handle = useActionHandler()
  const navigate = useNavigate()
  const filled = useGameStore((s) => s.fakeSite.filled)
  const fill = useGameStore((s) => s.fillFakeField)
  const submit = useGameStore((s) => s.submitFakeForm)

  return (
    <div className="fake-browser">
      <p className="fake-sim-note">{fakeSite.simulationNote}</p>
      <div className="fake-page">
        <h1 className="fake-title">{fakeSite.title}</h1>
        <p className="fake-urgency">{fakeSite.urgency}</p>
        {fakeSite.fields.map((field) => (
          <div key={field.id} className="fake-field">
            <span id={`fake-${field.id}`} className="fake-label">
              {field.label}
            </span>
            {/* Not an input: nothing can be typed. A tap fills an obviously fictional value. */}
            <button
              type="button"
              className="fake-input"
              aria-labelledby={`fake-${field.id}`}
              data-field={field.id}
              onClick={() => fill(field.id)}
            >
              {filled.includes(field.id) ? field.autofill : ''}
            </button>
          </div>
        ))}
        <button type="button" className="fake-submit" onClick={() => handle(submit())}>
          {fakeSite.submit}
        </button>
      </div>
      <button type="button" className="cta cta--secondary cta--small" onClick={() => navigate(SCREENS.phishingChoice.path)}>
        {GAME.ui.back}
      </button>
    </div>
  )
}

/** 14: Fake bank website (YES path). */
export function FakeWebsiteScreen() {
  return (
    <TaskScreen taskId="L3T1" hideHeader>
      <FakePage />
    </TaskScreen>
  )
}
