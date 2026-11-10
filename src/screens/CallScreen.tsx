import { BackButton } from '../components/BackButton'
import { AnimatePresence } from 'motion/react'
import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { GAME } from '../content/gameData'
import { playSound, stopSound } from '../audio/sounds'
import { SCREENS } from '../app/screens'
import { CallPortrait } from '../components/call/CallPortrait'
import { CallStatus, SpeechBubble } from '../components/call/CallParts'
import { startSecondCall } from '../components/call/callClock'
import { useTypewriter } from '../components/call/useTypewriter'
import { useAnanyaVoice } from '../audio/voice'

const call = GAME.tasks.L3T1.call

/** How long a fully typed line stays before the call moves on. */
const LINE_HOLD_MS = 2200
/** Portrait centre (mockups 11, 11b: as in 02b), and while the phone rings (as in 02). */
const LEFT = { x: 365, y: 487 }
const CENTRE = { x: 745, y: 487 }
/** How long the phone rings before Ananya's call connects by itself (ms); a tap answers sooner. */
const RING_MS = 2600

/**
 * 11, 11b: Ananya's second call, which opens Level 3, Task 1. The phone rings (as in 02), then
 * connects by itself (no ACCEPT); it plays by itself, and a tap answers, finishes a line or moves
 * on. Then the choice (11c).
 */
export function CallScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const [step, setStep] = useState(0)
  const line = call.steps[step]
  // Arriving through the Case Board transition: wait for it to lift before talking.
  const [started, setStarted] = useState(!(location.state as { levelIntro?: number } | null)?.levelIntro)
  // Then the phone rings, as for her first call (02), and connects by itself.
  const [ringing, setRinging] = useState(true)
  const talking = started && !ringing
  const typing = useTypewriter(talking ? line.text : '')
  // Ananya says each line as it types; the call waits for her to finish.
  const voice = useAnanyaVoice(line.text, { active: talking, worried: line.mood === 'worried' })

  useEffect(() => {
    if (!started || !ringing) return
    playSound('ring')
    const timer = window.setTimeout(() => setRinging(false), RING_MS)
    return () => {
      window.clearTimeout(timer)
      stopSound('ring')
    }
  }, [started, ringing])

  useEffect(() => {
    if (started) return
    const timer = window.setTimeout(() => setStarted(true), 3600)
    return () => window.clearTimeout(timer)
  }, [started])

  useEffect(() => startSecondCall(), [])

  const advance = useCallback(() => {
    if (step < call.steps.length - 1) setStep(step + 1)
    else navigate(SCREENS.phishingChoice.path)
  }, [step, navigate])

  useEffect(() => {
    if (talking) playSound('blip')
  }, [step, talking])

  useEffect(() => {
    if (!talking || !typing.done || !voice.done) return
    const timer = window.setTimeout(advance, voice.voiced ? 700 : LINE_HOLD_MS)
    return () => window.clearTimeout(timer)
  }, [typing.done, voice.done, voice.voiced, talking, advance])

  const onTap = () => {
    if (!started) return
    if (ringing) setRinging(false)
    else if (typing.done) advance()
    else typing.finish()
  }

  return (
    <div className="screen screen--call-opening screen--call-second" data-testid="call" onClick={onTap}>
      {/* BACK mustn't also count as a tap on the call. */}
      <span onClick={(e) => e.stopPropagation()}>
        <BackButton />
      </span>
      <CallPortrait
        x={talking ? LEFT.x : CENTRE.x}
        y={talking ? LEFT.y : CENTRE.y}
        mood={talking ? line.mood : 'smiling'}
        alt={GAME.openingCall.portraitAlt}
        ringing={started && ringing}
      />
      {talking ? (
        <CallStatus status={line.status} signal={line.signal} />
      ) : (
        started && <h1 className="call-incoming-title">{GAME.openingCall.incomingTitle}</h1>
      )}
      <AnimatePresence mode="wait">
        {talking && <SpeechBubble key={step} shown={typing.shown} rest={typing.rest} troubled={false} />}
      </AnimatePresence>
    </div>
  )
}
