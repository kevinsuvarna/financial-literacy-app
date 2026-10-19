import { BackButton } from '../components/BackButton'
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { GAME } from '../content/gameData'
import { playSound, stopSound } from '../audio/sounds'
import { SCREENS } from '../app/screens'
import { InfoIcon, PhoneIcon } from '../components/art/Icons'
import { CallPortrait } from '../components/call/CallPortrait'
import { useTypewriter } from '../components/call/useTypewriter'
import { useAnanyaVoice } from '../audio/voice'
import { SpeechBubble } from '../components/call/CallParts'
import { formatTimer } from '../components/call/callClock'

const call = GAME.openingCall

/** How long a fully typed line stays before the call moves on. */
const LINE_HOLD_MS = 2200
/** After a spoken line: a short pause, since she's already been heard. */
const VOICED_HOLD_MS = 700
/** How long CONNECTION LOST shows before the case is assigned. */
const LOST_HOLD_MS = 2800

/** Portrait centres (mockups 02–02e). */
const CENTRE = { x: 745, y: 487 }
const LEFT = { x: 365, y: 487 }

type Phase = { kind: 'incoming' } | { kind: 'talking'; step: number } | { kind: 'lost' }

/** 02–02e: Ananya's first call. Plays by itself; a tap finishes a line or moves on. */
export function OpeningCallScreen() {
  const navigate = useNavigate()
  const [phase, setPhase] = useState<Phase>({ kind: 'incoming' })
  const [seconds, setSeconds] = useState(0)

  const step = phase.kind === 'talking' ? call.steps[phase.step] : null
  const lastStep = call.steps.length - 1
  const typing = useTypewriter(step?.text ?? '')
  const typed = step !== null && typing.done
  // Ananya says each line as it types; the call waits for her to finish.
  const voice = useAnanyaVoice(step?.text ?? '', { active: phase.kind === 'talking', worried: step?.mood === 'worried' })

  const advance = useCallback(() => {
    setPhase((p) => {
      if (p.kind !== 'talking') return p
      return p.step < lastStep ? { kind: 'talking', step: p.step + 1 } : { kind: 'lost' }
    })
  }, [lastStep])

  const finishCall = useCallback(() => navigate(SCREENS.caseAssigned.path), [navigate])

  // The phone rings until the call is answered.
  useEffect(() => {
    if (phase.kind !== 'incoming') return
    playSound('ring')
    return () => stopSound('ring')
  }, [phase.kind])

  // Call timer, as on a real phone.
  useEffect(() => {
    if (phase.kind !== 'talking') return
    const timer = window.setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => window.clearInterval(timer)
  }, [phase.kind])

  // Each new line blips; the last one drops the call.
  useEffect(() => {
    if (phase.kind === 'talking') playSound('blip')
    if (phase.kind === 'lost') playSound('disconnect')
  }, [phase])

  // Moves on by itself once a line has been read (spec: auto-advance, tap to skip).
  useEffect(() => {
    if (phase.kind === 'talking' && typed && voice.done) {
      const timer = window.setTimeout(advance, voice.voiced ? VOICED_HOLD_MS : LINE_HOLD_MS)
      return () => window.clearTimeout(timer)
    }
    if (phase.kind === 'lost') {
      const timer = window.setTimeout(finishCall, LOST_HOLD_MS)
      return () => window.clearTimeout(timer)
    }
  }, [phase, typed, voice.done, voice.voiced, advance, finishCall])

  const onTap = () => {
    if (phase.kind === 'talking') {
      // A tap first finishes the line, then moves on.
      if (typing.done) advance()
      else typing.finish()
    } else if (phase.kind === 'lost') {
      finishCall()
    }
  }

  const accept = () => {
    stopSound('ring')
    setPhase({ kind: 'talking', step: 0 })
  }

  const trouble = phase.kind === 'lost' || step?.signal === 'lost'
  const portrait = phase.kind === 'talking' ? LEFT : CENTRE
  const mood = phase.kind === 'incoming' ? 'smiling' : phase.kind === 'lost' ? 'alarmed' : step!.mood

  return (
    <div className="screen screen--call-opening" data-testid="call" data-phase={phase.kind} onClick={onTap}>
      <span onClick={(e) => e.stopPropagation()}>
        <BackButton />
      </span>
      <CallPortrait
        x={portrait.x}
        y={portrait.y}
        mood={mood}
        alt={call.portraitAlt}
        ringing={phase.kind === 'incoming'}
        trouble={trouble}
      />

      {phase.kind === 'incoming' && (
        <>
          <h1 className="call-incoming-title">{call.incomingTitle}</h1>
          <motion.button
            type="button"
            className="call-accept"
            animate={{ rotate: [0, -2, 2, -2, 0] }}
            transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 0.9 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              e.stopPropagation()
              accept()
            }}
          >
            <PhoneIcon className="call-accept-icon" />
            <span>{call.accept}</span>
          </motion.button>
        </>
      )}

      {step && (
        <>
          <div className="call-status" data-signal={step.signal}>
            <span className="call-status-dot" />
            <span className="call-status-time">{formatTimer(seconds)}</span>
            <span className="call-status-label">{step.status}</span>
          </div>
          <AnimatePresence mode="wait">
            <SpeechBubble
              key={phase.kind === 'talking' ? phase.step : 'none'}
              shown={typing.shown}
              rest={typing.rest}
              troubled={step.signal === 'lost'}
            />
          </AnimatePresence>
          {step.hint && (
            <motion.p className="call-hint" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <InfoIcon className="call-hint-icon" />
              {step.hint}
            </motion.p>
          )}
        </>
      )}

      {phase.kind === 'lost' && (
        <motion.p
          className="call-lost"
          role="status"
          initial={{ scale: 1.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 18 }}
        >
          {call.disconnected}
        </motion.p>
      )}
    </div>
  )
}
