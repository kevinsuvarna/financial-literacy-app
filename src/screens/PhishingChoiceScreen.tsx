import { useNavigate } from 'react-router'
import { GAME, type PhishingChoice } from '../content/gameData'
import { SCREENS } from '../app/screens'
import { useActionHandler } from '../components/actionHandler'
import { CallPortrait } from '../components/call/CallPortrait'
import { CallStatus } from '../components/call/CallParts'
import { PhoneNotification } from '../components/phone/PhoneNotification'
import { Panel, SceneCta, Stamp } from '../components/scene/FeedbackParts'
import { TaskScreen } from '../components/TaskScreen'
import { useGameStore, type Feedback } from '../state/gameStore'

const task = GAME.tasks.L3T1
const { phishingMessage } = GAME

/** Portrait centre, as on the call (11–11f). */
const PORTRAIT = { x: 365, y: 487 }

/** Line breaks (\n) and blank-line paragraphs in feedback copy. */
function Lines({ text }: { text: string }) {
  return text.split('\n').map((line, i) => (
    <span key={i} className="phish-line">
      {line}
    </span>
  ))
}

/** 11c: Ananya, still on the call, and the message. Should she tap the link? */
function PhishingChoices() {
  const handle = useActionHandler()
  const navigate = useNavigate()
  const choose = useGameStore((s) => s.choosePhishingOption)

  const onChoose = (choice: PhishingChoice) => {
    // The store decides what a choice means; 'partial' is the path that opens the fake page.
    const result = handle(choose(choice))
    if (result.outcome === 'partial') navigate(SCREENS.fakeWebsite.path)
  }

  return (
    <>
      <h1 className="phish-title">{task.prompt}</h1>
      <CallPortrait x={PORTRAIT.x} y={PORTRAIT.y} mood="worried" alt={GAME.openingCall.portraitAlt} />
      <CallStatus />
      <PhoneNotification sender={phishingMessage.sender} time={phishingMessage.time} className="phish-message">
        <p>{phishingMessage.text}</p>
        <p>{phishingMessage.detail}</p>
        <p>
          {/* Tapping the link is the same choice as YES: it opens the pretend page in the game, never a real site. */}
          <button type="button" className="phone-note-link" data-testid="phish-link" onClick={() => onChoose('yes')}>
            {phishingMessage.link}
          </button>
        </p>
      </PhoneNotification>
      {task.choices.map((choice) => (
        <SceneCta
          key={choice.id}
          label={choice.label}
          className={`phish-choice phish-choice--${choice.id}`}
          arrow={false}
          onClick={() => onChoose(choice.id)}
        />
      ))}
    </>
  )
}

/**
 * 11d (YES, after the fake page): "Uh Huh", the bank's money-withdrawn alert, and TRY AGAIN.
 * 11f (NO): "GOOD CALL", Ananya smiling, and SECURE, which moves on.
 */
function PhishingOutcome({ feedback, onContinue }: { feedback: Feedback; onContinue: () => void }) {
  const safe = feedback.tone === 'correct'
  return (
    <div className={`phish-outcome phish-outcome--${safe ? 'safe' : 'loss'}`} role="dialog" aria-label={feedback.title}>
      <CallPortrait x={PORTRAIT.x} y={PORTRAIT.y} mood={safe ? 'smiling' : 'worried'} alt={GAME.openingCall.portraitAlt} />
      <CallStatus />
      {feedback.alert && (
        <PhoneNotification sender={feedback.alert.sender} time={phishingMessage.time} className="phish-alert">
          <p>
            <Lines text={feedback.alert.text} />
          </p>
        </PhoneNotification>
      )}
      <Panel className={`panel--phish panel--phish-${safe ? 'safe' : 'loss'}`}>
        <div className="phish-panel-text">
          <p>
            <Lines text={feedback.message} />
          </p>
          {feedback.detail && (
            <p>
              <Lines text={feedback.detail} />
            </p>
          )}
        </div>
      </Panel>
      <Stamp text={feedback.title ?? ''} good={safe} className={`phish-stamp phish-stamp--${safe ? 'safe' : 'loss'}`} />
      <SceneCta
        label={feedback.cta ?? GAME.ui.tryAgain}
        back={!safe}
        className={`phish-cta phish-cta--${safe ? 'safe' : 'loss'}`}
        onClick={onContinue}
      />
    </div>
  )
}

/** 11c–11f: should Ananya tap the link? */
export function PhishingChoiceScreen() {
  return (
    <TaskScreen
      taskId="L3T1"
      variant="scene"
      feedbackView={(feedback, onContinue) =>
        feedback.tone === 'neutral' ? null : <PhishingOutcome key={feedback.id} feedback={feedback} onContinue={onContinue} />
      }
    >
      <div className="screen--phish">
        <PhishingChoices />
      </div>
    </TaskScreen>
  )
}
