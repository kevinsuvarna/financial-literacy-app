import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { GAME, formatStatementAmount, formatStatementDate } from '../content/gameData'
import { playSound } from '../audio/sounds'
import { useActionHandler } from '../components/actionHandler'
import { DailyChronicle } from '../components/newspaper/DailyChronicle'
import { PhoneNotification } from '../components/phone/PhoneNotification'
import { SceneCta } from '../components/scene/FeedbackParts'
import { TaskScreen } from '../components/TaskScreen'
import { useGameStore } from '../state/gameStore'

const task = GAME.tasks.L3T2
const { reveal } = task
const { phishingMessage } = GAME
const camsRow = GAME.statement.rows.find((row) => row.suspicious)!

/**
 * The reveal's beats: 0 the two clues side by side and the question (15); 1 the name on its own
 * (15b); 2 the letters shiver, the S lifts out and slams down at the front: SCAM TEL; 3 the word
 * rises, is circled, and the newspaper slides in (12c); 4 the button to move on. Each beat follows
 * by itself; a tap skips ahead.
 */
type Beat = 0 | 1 | 2 | 3 | 4
const LAST: Beat = 4
const BEAT_MS: Record<Exclude<Beat, 4>, number> = { 0: 2600, 1: 1800, 2: 2200, 3: 2400 }

/** Within beat 2 (seconds): the shiver, the S lifting out, and the moment it lands. */
const SHIVER = 0.45
const LIFT = 0.35
const LAND = 1.25

/** 12c's newspaper: laid out flat at 1060 × 720 and projected onto the corners measured in the mockup. */
const NEWSPAPER = 'matrix3d(0.933574396, -0.0550523, 0, -0.000050048, 0.016266566, 0.935146083, 0, -0.000051382, 0, 0, 1, 0, 178, 386, 0, 1)'

/**
 * The name, one letter per span so they can swap places: CAMS TEL → SCAM TEL (the S moves to the
 * front). Keys follow the letters, so motion animates each letter to its new place.
 */
function Name({ unscrambled, animate }: { unscrambled: boolean; animate: boolean }) {
  const from = [...reveal.name].map((ch, i) => ({ ch, key: `${ch}${i}` }))
  // Each letter of the unscrambled name takes the first unused matching letter of the name.
  const used = new Set<string>()
  const to = [...reveal.unscrambled].map((ch) => {
    const letter = from.find((l) => l.ch === ch && !used.has(l.key))!
    used.add(letter.key)
    return letter
  })
  const letters = unscrambled ? to : from
  // The letter that moves to the front (the S).
  const mover = to[0].key !== from[0].key ? to[0].key : undefined
  return (
    <span className="reveal-name-letters" aria-label={unscrambled ? reveal.unscrambled : reveal.name}>
      {letters.map((l, i) => {
        const moving = l.key === mover
        return (
          <motion.span
            key={l.key}
            className={moving && unscrambled ? 'is-mover' : undefined}
            layout
            // The others make room while the S is in the air; it drops in last.
            transition={{
              layout: animate
                ? { delay: SHIVER + (moving ? LIFT : LIFT * 0.6), duration: moving ? 0.5 : 0.45, ease: [0.5, 0, 0.3, 1] }
                : { duration: 0 },
            }}
            animate={
              animate && unscrambled
                ? moving
                  ? // Shiver, lift out glowing red, hang, then slam down at the front.
                    {
                      x: [0, -3, 3, -2, 0, 0, 0, 0],
                      y: [0, 0, 0, 0, -78, -78, 6, 0],
                      scale: [1, 1, 1, 1, 1.35, 1.35, 0.92, 1],
                      rotate: [0, 0, 0, 0, -12, 8, 0, 0],
                      transition: { duration: LAND + 0.15, times: [0, 0.08, 0.16, 0.24, 0.42, 0.78, 0.92, 1] },
                    }
                  : // Everyone shivers, then jolts when the S lands.
                    {
                      x: [0, 2, -2, 1, 0, 0, 0],
                      y: [0, 0, 0, 0, 0, -10, 0],
                      transition: { duration: LAND + 0.2, times: [0, 0.08, 0.16, 0.26, 0.86, 0.92, 1], delay: i * 0.01 },
                    }
                : { x: 0, y: 0, scale: 1, rotate: 0 }
            }
            aria-hidden="true"
          >
            {l.ch === ' ' ? '\u00a0' : l.ch}
          </motion.span>
        )
      })}
    </span>
  )
}

function Newspaper() {
  return (
    <motion.div
      className="reveal-paper-wrap"
      initial={{ y: 640, rotate: 4 }}
      animate={{ y: 0, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 90, damping: 18, delay: 0.25 }}
    >
      <DailyChronicle transform={NEWSPAPER} />
    </motion.div>
  )
}

function Reveal({ startAt = 0, onDone }: { startAt?: Beat; onDone?: () => void }) {
  const [beat, setBeat] = useState<Beat>(startAt)
  const next = () => setBeat((b) => (b < LAST ? ((b + 1) as Beat) : b))

  useEffect(() => {
    if (beat === 4) return
    const timer = window.setTimeout(() => setBeat((b) => (b < LAST ? ((b + 1) as Beat) : b)), BEAT_MS[beat])
    return () => window.clearTimeout(timer)
  }, [beat])

  // Sounds: the name appears; the S lifts (whoosh) and lands (thud).
  useEffect(() => {
    if (beat === 1) playSound('chime')
    if (beat !== 2 || startAt >= 2) return
    const timers = [
      window.setTimeout(() => playSound('whoosh'), SHIVER * 1000),
      window.setTimeout(() => playSound('stamp'), LAND * 1000),
    ]
    return () => timers.forEach((t) => window.clearTimeout(t))
  }, [beat, startAt])

  const unscrambled = beat >= 2
  const exposed = beat >= 3
  // Played only when the reveal is watched, not when it opens already solved.
  const playing = startAt < 2
  return (
    <motion.div
      className="reveal"
      data-beat={beat}
      onClick={next}
      // The desk jolts as the S lands.
      animate={unscrambled && playing ? { x: [0, 0, -9, 8, -5, 3, 0] } : { x: 0 }}
      transition={{ duration: 0.45, delay: LAND - 0.05, times: [0, 0.01, 0.2, 0.4, 0.6, 0.8, 1] }}
    >
      <p className="visually-hidden">{task.beats.join(' ')}</p>
      <AnimatePresence>
        {!exposed && (
          <motion.div key="clues" className="reveal-clues" exit={{ opacity: 0, y: -40 }} transition={{ duration: 0.25 }}>
            <h1 className="reveal-heading">{reveal.heading}</h1>
            <PhoneNotification sender={phishingMessage.sender} time={phishingMessage.time} className="reveal-note" />
            <div className="reveal-row">
              <div className="reveal-row-band">
                <span className="reveal-row-date">{formatStatementDate(camsRow.date)}</span>
                <span className="reveal-row-desc">{camsRow.description}</span>
                <span className="reveal-row-amount">-{formatStatementAmount(camsRow.amount)}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <LayoutGroup>
        <motion.p
          className={`reveal-question${exposed ? ' is-exposed' : ''}`}
          layout
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ layout: { type: 'spring', stiffness: 110, damping: 20, delay: 0.2 }, opacity: { delay: startAt ? 0 : 0.6 } }}
        >
          <span>{reveal.question[0]}</span> <span>{reveal.question[1]}</span>
        </motion.p>
        {beat >= 1 && (
          <motion.p
            className={`reveal-name${exposed ? ' is-exposed' : ''}`}
            layout
            initial={{ scale: 1.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ layout: { type: 'spring', stiffness: 110, damping: 20, delay: 0.2 }, default: { type: 'spring', stiffness: 300, damping: 18 } }}
          >
            <motion.span
              className="reveal-name-flash"
              initial={false}
              animate={unscrambled && playing ? { opacity: [0, 0, 1, 0] } : { opacity: 0 }}
              transition={{ duration: 0.9, delay: LAND - 0.05, times: [0, 0.01, 0.12, 1] }}
              aria-hidden="true"
            />
            <Name unscrambled={unscrambled} animate={playing} />
            {exposed && (
              <svg className="reveal-circle" viewBox="0 0 290 110" aria-hidden="true">
                <motion.path
                  d="M150 6 C230 4 286 30 282 58 C278 92 210 104 140 102 C60 100 6 86 6 56 C6 26 70 6 160 8"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: startAt >= 2 ? 0 : 0.9, duration: 0.6, ease: 'easeInOut' }}
                />
              </svg>
            )}
          </motion.p>
        )}
      </LayoutGroup>
      {exposed && <Newspaper />}
      {beat === LAST && onDone && <SceneCta label={task.cta} className="reveal-cta" onClick={onDone} />}
    </motion.div>
  )
}

function ScamStory() {
  const handle = useActionHandler()
  const complete = useGameStore((s) => s.completeScamReveal)
  // Always played, revisiting too: the reveal is the point of this screen (taps skip ahead).
  return <Reveal startAt={0} onDone={() => handle(complete())} />
}

/** Moves straight on once the reveal is complete: the reveal itself was the feedback. */
function Proceed({ onContinue }: { onContinue: () => void }) {
  useEffect(() => onContinue(), [onContinue])
  return <Reveal startAt={LAST} />
}

/** 15, 15b, 12c: CAMS TEL, rearranged, is SCAM TEL. */
export function ScamRevealScreen() {
  return (
    <TaskScreen taskId="L3T2" variant="scene" feedbackView={(_, onContinue) => <Proceed onContinue={onContinue} />}>
      <div className="screen--reveal">
        <ScamStory />
      </div>
    </TaskScreen>
  )
}
