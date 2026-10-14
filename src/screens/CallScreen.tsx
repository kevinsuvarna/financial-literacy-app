import { useNavigate } from 'react-router'
import { GAME } from '../content/gameData'
import { SCREENS } from '../app/screens'
import { ProgressTracker } from '../components/ProgressTracker'

const CALLS = {
  /** 02: Ananya's first call, cut off before she can explain. */
  opening: { ...GAME.openingCall, next: SCREENS.caseAssigned.path, task: null },
  /** 12: Ananya's second call, which opens Level 3, Task 1. */
  second: { ...GAME.tasks.L3T1.call, disconnected: null, next: SCREENS.phishingChoice.path, task: 'L3T1' as const },
}

export function CallScreen({ variant }: { variant: keyof typeof CALLS }) {
  const navigate = useNavigate()
  const call = CALLS[variant]

  return (
    <div className="screen screen--call">
      {call.task && <ProgressTracker viewing={call.task} />}
      <div className="call paper">
        <p className="call-caller">{call.caller}</p>
        <ul className="call-lines">
          {call.lines.map((line) => (
            <li key={line.text} className="call-line">
              <strong>{line.speaker}:</strong> {line.text}
            </li>
          ))}
        </ul>
        {call.disconnected && <p className="call-disconnected">{call.disconnected}</p>}
        <button type="button" className="cta" onClick={() => navigate(call.next)}>
          {GAME.ui.continue}
        </button>
      </div>
    </div>
  )
}
