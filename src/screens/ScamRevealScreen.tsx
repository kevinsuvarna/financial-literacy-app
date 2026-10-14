import { GAME } from '../content/gameData'
import { useActionHandler } from '../components/actionHandler'
import { TaskScreen } from '../components/TaskScreen'
import { useGameStore } from '../state/gameStore'

const task = GAME.tasks.L3T2

function ScamStory() {
  const handle = useActionHandler()
  const complete = useGameStore((s) => s.completeScamReveal)

  return (
    <div className="story">
      <div className="story-beats paper">
        {task.beats.map((beat) => (
          <p key={beat}>{beat}</p>
        ))}
      </div>
      <button type="button" className="cta" onClick={() => handle(complete())}>
        {task.cta}
      </button>
    </div>
  )
}

/** 15: CAMS TEL scam reveal. */
export function ScamRevealScreen() {
  return (
    <TaskScreen taskId="L3T2">
      <ScamStory />
    </TaskScreen>
  )
}
