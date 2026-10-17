import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router'
import { GAME, type LevelId } from '../content/gameData'
import { playSound } from '../audio/sounds'
import { useProgress } from '../state/hooks'
import { CorkBoard } from './board/CorkBoard'
import { BOARD_CARDS, UNLOCK_TIMING } from './board/boardLayout'
import { CANVAS } from '../app/stageScale'

/** The camera zooms into the new level's card, then the board fades to show the first task. */
const ZOOM_AT = 2.75
const ZOOM_LENGTH = 0.85
const ZOOM_SCALE = 3.2

/** Navigation state that asks for the transition: `navigate(path, { state: { levelIntro: 2 } })`. */
export interface LevelIntroState {
  levelIntro?: LevelId
}

/**
 * The transition into a new level, played on the Case Board (mockup 21): the level just finished is
 * stamped SOLVED, the red thread runs on to the next card, its padlock drops off and its pin goes
 * in, then the view zooms into that card and opens its first task. A tap skips it.
 */
export function LevelIntro() {
  const location = useLocation()
  const progress = useProgress()
  const levelId = (location.state as LevelIntroState | null)?.levelIntro
  const [doneFor, setDoneFor] = useState<string | null>(null)
  const showing = levelId !== undefined && doneFor !== location.key
  const level = GAME.levels.find((l) => l.id === levelId)

  useEffect(() => {
    if (!showing) return
    const timers = [
      window.setTimeout(() => playSound('stamp'), UNLOCK_TIMING.stamp * 1000),
      window.setTimeout(() => playSound('levelUp'), UNLOCK_TIMING.unlock * 1000),
      window.setTimeout(() => playSound('whoosh'), ZOOM_AT * 1000),
      window.setTimeout(() => setDoneFor(location.key), (ZOOM_AT + ZOOM_LENGTH) * 1000),
    ]
    return () => timers.forEach((t) => window.clearTimeout(t))
  }, [showing, location.key])

  if (!level) return null
  const { box } = BOARD_CARDS[level.id]
  const cx = box.x + box.w / 2
  const cy = box.y + box.h / 2

  return (
    <AnimatePresence>
      {showing && (
        <motion.div
          key={location.key}
          className="level-intro"
          role="status"
          aria-label={`${GAME.ui.levelHeading} ${level.id}: ${level.title}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.3 } }}
          onClick={() => setDoneFor(location.key)}
        >
          <motion.div
            className="level-intro-zoom"
            style={{ transformOrigin: `${cx}px ${cy}px` }}
            initial={{ scale: 1.06, x: 0, y: 0 }}
            animate={{ scale: [1.06, 1, 1, ZOOM_SCALE], x: [0, 0, 0, CANVAS.width / 2 - cx], y: [0, 0, 0, CANVAS.height / 2 - cy] }}
            transition={{
              duration: ZOOM_AT + ZOOM_LENGTH,
              times: [0, 0.4 / (ZOOM_AT + ZOOM_LENGTH), ZOOM_AT / (ZOOM_AT + ZOOM_LENGTH), 1],
              ease: ['easeOut', 'linear', [0.6, 0, 0.4, 1]],
            }}
          >
            <CorkBoard progress={progress} unlocking={level.id} />
          </motion.div>
          <p className="visually-hidden">
            {GAME.ui.levelHeading} {level.id} {GAME.caseBoard.unlocked}: {level.title}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
