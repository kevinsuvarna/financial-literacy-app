import { useNavigate } from 'react-router'
import { GAME, type PhishingChoice } from '../content/gameData'
import { SCREENS } from '../app/screens'
import { useActionHandler } from '../components/actionHandler'
import { TaskScreen } from '../components/TaskScreen'
import { useGameStore } from '../state/gameStore'

const { phishingMessage } = GAME

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
    <div className="phishing">
      <article className="phish-message paper" aria-label={phishingMessage.sender}>
        <p className="phish-from">
          <strong>{phishingMessage.sender}</strong> <span className="phish-time">{phishingMessage.time}</span>
        </p>
        <p>{phishingMessage.text}</p>
        <p>{phishingMessage.detail}</p>
        {/* Shown as text only: never a working link. */}
        <p className="phish-link">{phishingMessage.link}</p>
      </article>
      <div className="button-row">
        {GAME.tasks.L3T1.choices.map((choice) => (
          <button key={choice.id} type="button" className="cta" onClick={() => onChoose(choice.id)}>
            {choice.label}
          </button>
        ))}
      </div>
    </div>
  )
}

/** 13: Should Ananya click the link? */
export function PhishingChoiceScreen() {
  return (
    <TaskScreen taskId="L3T1">
      <PhishingChoices />
    </TaskScreen>
  )
}
