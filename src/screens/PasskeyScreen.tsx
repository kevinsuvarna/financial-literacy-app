import { useCallback, useEffect, useState } from 'react'
import { GAME } from '../content/gameData'
import { Icon } from '../components/Icon'
import { useActionHandler } from '../components/actionHandler'
import { TaskScreen } from '../components/TaskScreen'
import { isTaskCompleted, useGameStore } from '../state/gameStore'

const task = GAME.tasks.L3T3
/** One digit per clue. */
const LENGTH = task.clues.length
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']

function Computer() {
  const handle = useActionHandler()
  const enterPasskey = useGameStore((s) => s.enterPasskey)
  const unlocked = useGameStore((s) => isTaskCompleted(s, 'L3T3'))
  const [digits, setDigits] = useState('')

  const press = useCallback((key: string) => setDigits((d) => (d.length < LENGTH ? d + key : d)), [])
  const clear = useCallback(() => setDigits(''), [])
  const enter = useCallback(() => {
    const result = handle(enterPasskey(digits))
    if (result.outcome !== 'correct') setDigits('')
  }, [digits, enterPasskey, handle])

  // Physical keyboards work too (laptops).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (useGameStore.getState().feedback) return
      // Enter on a focused button already clicks it.
      if (e.key === 'Enter' && e.target instanceof HTMLButtonElement) return
      if (/^\d$/.test(e.key)) press(e.key)
      else if (e.key === 'Backspace') setDigits((d) => d.slice(0, -1))
      else if (e.key === 'Enter') enter()
      else return
      // Otherwise this same keypress would also activate the feedback button that just took focus.
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [press, enter])

  return (
    <div className="passkey">
      <div className="computer">
        <div className="computer-screen">
          <p className={`computer-status${unlocked ? ' is-unlocked' : ''}`}>
            <Icon name={unlocked ? 'check' : 'lock'} /> {unlocked ? GAME.ui.passkey.unlocked : task.lockedLabel}
          </p>
          <div className="passkey-display" data-testid="passkey-display">
            {Array.from({ length: LENGTH }, (_, i) => (
              <span key={i} className="passkey-digit">
                {digits[i] ?? ''}
              </span>
            ))}
          </div>
        </div>
        <div className="keypad">
          {KEYS.map((key) => (
            <button key={key} type="button" className="key" onClick={() => press(key)}>
              {key}
            </button>
          ))}
          <button type="button" className="key key--wide" onClick={clear}>
            {GAME.ui.passkey.clear}
          </button>
          <button type="button" className="key key--wide key--enter" onClick={enter}>
            {GAME.ui.passkey.enter}
          </button>
        </div>
      </div>
      <aside className="clue-card paper">
        <h2 className="clue-title">{task.clueTitle}</h2>
        <p>{task.clueInstruction}</p>
        <ol>
          {task.clues.map((clue) => (
            <li key={clue}>{clue}</li>
          ))}
        </ol>
      </aside>
    </div>
  )
}

/** 16: Passkey on the on-screen computer. */
export function PasskeyScreen() {
  return (
    <TaskScreen taskId="L3T3">
      <Computer />
    </TaskScreen>
  )
}
