import { BackButton } from '../components/BackButton'
import { AnimatePresence } from 'motion/react'
import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { GAME } from '../content/gameData'
import { playSound } from '../audio/sounds'
import { SCREENS } from '../app/screens'
import { CallPortrait } from '../components/call/CallPortrait'
import { CallStatus, SpeechBubble } from '../components/call/CallParts'
import { startSecondCall } from '../components/call/callClock'
import { useTypewriter } from '../components/call/useTypewriter'

const call = GAME.tasks.L3T1.call

/** How long a fully typed line stays before the call moves on. */
const LINE_HOLD_MS = 2200
/** Portrait centre (mockups 11, 11b: as in 02b). */
const LEFT = { x: 365, y: 487 }

/**
 * 11, 11b: Ananya's second call, which opens Level 3, Task 1. It's already connected (no ACCEPT),
 * plays by itself, and a tap finishes a line or moves on. Then the choice (11c).
 */
export function CallScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const [step, setStep] = useState(0)
  const line = call.steps[step]
  // Arriving through the Case Board transition: wait for it to lift before talking.
  const [started, setStarted] = useState(!(location.state as { levelIntro?: number } | null)?.levelIntro)
  const typing = useTypewriter(started ? line.text : '')

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
    if (started) playSound('blip')
  }, [step, started])

  useEffect(() => {
    if (!started || !typing.done) return
    const timer = window.setTimeout(advance, LINE_HOLD_MS)
    return () => window.clearTimeout(timer)
  }, [typing.done, started, advance])

  const onTap = () => {
    if (!started) return
    if (typing.done) advance()
    else typing.finish()
  }

  return (
    <div className="screen screen--call-opening screen--call-second" data-testid="call" onClick={onTap}>
      {/* BACK mustn't also count as a tap on the call. */}
      <span onClick={(e) => e.stopPropagation()}>
        <BackButton />
      </span>
      <CallPortrait x={LEFT.x} y={LEFT.y} mood={line.mood} alt={GAME.openingCall.portraitAlt} />
      <CallStatus status={line.status} signal={line.signal} />
      <AnimatePresence mode="wait">
        {started && <SpeechBubble key={step} shown={typing.shown} rest={typing.rest} troubled={false} />}
      </AnimatePresence>
    </div>
  )
}
