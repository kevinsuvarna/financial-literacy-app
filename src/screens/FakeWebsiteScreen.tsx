import { useNavigate } from 'react-router'
import { GAME } from '../content/gameData'
import { SCREENS } from '../app/screens'
import { useActionHandler } from '../components/actionHandler'
import { CallPortrait } from '../components/call/CallPortrait'
import { CallStatus } from '../components/call/CallParts'
import { TaskScreen } from '../components/TaskScreen'
import { useGameStore } from '../state/gameStore'

const { fakeSite } = GAME.tasks.L3T1

/** The fake site's logo: a teal cube (mockup 14). */
function CubeLogo() {
  return (
    <svg className="fake-logo" viewBox="0 0 40 44" aria-hidden="true">
      <path className="fake-logo-top" d="M20 2 L38 11 L20 20 L2 11 Z" />
      <path className="fake-logo-left" d="M2 11 L20 20 L20 42 L2 33 Z" />
      <path className="fake-logo-right" d="M20 20 L38 11 L38 33 L20 42 Z" />
      <path className="fake-logo-cut" d="M26 25 L33 21 L33 30 L26 34 Z" />
    </svg>
  )
}

const Arrow = ({ back = false }: { back?: boolean }) => (
  <svg className={`fake-arrow ${back ? 'cta-label-before' : 'cta-label-after'}`} viewBox="0 0 24 24" aria-hidden="true">
    <path d={back ? 'M20 12 H5 M11 5 L4 12 L11 19' : 'M4 12 H19 M13 5 L20 12 L13 19'} />
  </svg>
)

/**
 * 14: the fake "unblock your card" page (YES path), with Ananya still on the call. Nothing can be
 * typed: a tap fills each box with an obviously fictional value. UNBLOCK CARD shows the loss (11d)
 * back on the choice screen; GO BACK returns to the choice.
 */
function FakePage() {
  const handle = useActionHandler()
  const navigate = useNavigate()
  const filled = useGameStore((s) => s.fakeSite.filled)
  const fill = useGameStore((s) => s.fillFakeField)
  const submit = useGameStore((s) => s.submitFakeForm)

  return (
    <>
      <CallPortrait x={365} y={487} mood="worried" alt={GAME.openingCall.portraitAlt} />
      <CallStatus />
      <section className="fake-page" aria-label={fakeSite.title}>
        <CubeLogo />
        <h1 className="fake-title">{fakeSite.title}</h1>
        <p className="fake-subtitle">{fakeSite.subtitle}</p>
        <p className="fake-urgency">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 3 L22.5 21 H1.5 Z" />
            <path className="fake-urgency-mark" d="M12 9.5 V14.5 M12 17 V17.6" />
          </svg>
          {fakeSite.urgency}
        </p>
        <span className="fake-rule" aria-hidden="true" />
        <p className="fake-message">{fakeSite.message}</p>
        <div className="fake-fields">
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
        </div>
        <button type="button" className="fake-button fake-button--back" onClick={() => navigate(SCREENS.phishingChoice.path)}>
          <span className="cta-label">
            <Arrow back />
            {fakeSite.back}
          </span>
        </button>
        <button
          type="button"
          className="fake-button fake-button--submit"
          onClick={() => {
            // The loss (11d) is shown back on the choice screen, with TRY AGAIN.
            if (handle(submit()).outcome === 'incorrect') navigate(SCREENS.phishingChoice.path)
          }}
        >
          <span className="cta-label">
            {fakeSite.submit}
            <Arrow />
          </span>
        </button>
        <p className="fake-sim-note">{fakeSite.simulationNote}</p>
      </section>
    </>
  )
}

/** 14: Fake bank website (YES path). */
export function FakeWebsiteScreen() {
  return (
    <TaskScreen taskId="L3T1" variant="scene">
      <div className="screen--fake">
        <FakePage />
      </div>
    </TaskScreen>
  )
}
