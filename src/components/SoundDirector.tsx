import { useEffect, useState } from 'react'
import { GAME } from '../content/gameData'
import { isMuted, playSound, restoreMute, setMuted, startMusic } from '../audio/sounds'
import { unlockVoice } from '../audio/voice'
import { useGameStore } from '../state/gameStore'

/**
 * The game's sound, in one place: the background music starts on the first tap (browsers only
 * allow sound after one), every button clicks, and right / wrong / progress answers each have
 * their own sound. Screens add their own moments (rings, stamps, the reveal) on top.
 */
export function SoundDirector() {
  useEffect(() => {
    restoreMute()
    const start = () => {
      startMusic()
      unlockVoice()
    }
    const click = (e: MouseEvent) => {
      const button = (e.target as Element | null)?.closest('button')
      if (button && !button.disabled) playSound('tap')
    }
    window.addEventListener('pointerdown', start, { once: true })
    window.addEventListener('click', click, true)
    return () => {
      window.removeEventListener('pointerdown', start)
      window.removeEventListener('click', click, true)
    }
  }, [])

  // One sound per new feedback.
  useEffect(
    () =>
      useGameStore.subscribe((state, previous) => {
        const feedback = state.feedback
        if (!feedback || feedback.id === previous.feedback?.id) return
        if (feedback.tone === 'correct') playSound('correct')
        else if (feedback.tone === 'incorrect') playSound('wrong')
        else if (feedback.tone === 'progress') playSound('chime')
      }),
    [],
  )

  return null
}

/** The speaker button in the top-right corner: sound on or off, remembered on this device. */
export function MuteButton() {
  const [muted, setMutedState] = useState(isMuted)
  const toggle = () => {
    setMuted(!muted)
    setMutedState(!muted)
    if (muted) startMusic()
  }
  return (
    <button
      type="button"
      className={`mute-button${muted ? ' is-muted' : ''}`}
      aria-label={muted ? GAME.ui.soundOn : GAME.ui.soundOff}
      aria-pressed={muted}
      onClick={toggle}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path className="mute-speaker" d="M4 9 H8 L13 5 V19 L8 15 H4 Z" />
        {muted ? <path d="M16 9 L21 14 M21 9 L16 14" /> : <path d="M16 8.5 C18 10 18 14 16 15.5 M18.5 6 C22 9 22 15 18.5 18" />}
      </svg>
    </button>
  )
}
