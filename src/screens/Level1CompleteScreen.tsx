import { motion } from 'motion/react'
import { useEffect } from 'react'
import magnifier from '../assets/interim/magnifier.png'
import { useNavigate } from 'react-router'
import { playSound } from '../audio/sounds'
import { GAME } from '../content/gameData'
import { routeAfterLevel, taskEntryRoute } from '../app/navigation'
import { AlertBadge } from '../components/art/Icons'
import { ProgressTracker } from '../components/ProgressTracker'
import { Panel, SceneCta } from '../components/scene/FeedbackParts'
import { Desk } from '../components/scene/TableScene'

const level = GAME.levels[0]

/** 07: Level 1 complete, leading into Level 2 (mockup 07-L1-complete.png). */
export function Level1CompleteScreen() {
  const navigate = useNavigate()

  // Level complete: a fanfare as the screen arrives.
  useEffect(() => playSound('fanfare'), [])

  return (
    <div className="screen screen--scene">
      <Desk variant="feedback" />
      <Panel className="panel--story">
        <h1 className="visually-hidden">{level.complete.title}</h1>
        <div className="story-text">
          <p>{level.complete.message}</p>
          {level.complete.detail && <p>{level.complete.detail}</p>}
        </div>
      </Panel>
      {/* Mockup 07 (updated): a magnifying glass resting on the panel's corner. Interim cut from the mockup. */}
      <motion.img
        className="story-magnifier"
        src={magnifier}
        alt=""
        initial={{ x: 140, y: 60, rotate: 25, opacity: 0 }}
        animate={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
        transition={{ delay: 0.5, type: 'spring', stiffness: 120, damping: 16 }}
      />
      <div className="story-alert">
        <AlertBadge />
      </div>
      <SceneCta label={level.complete.cta ?? GAME.ui.continue} className="story-cta" onClick={() => navigate(routeAfterLevel(1), { state: { levelIntro: 2 } })} />
      <ProgressTracker viewing={level.tasks[level.tasks.length - 1]} backTo={taskEntryRoute(level.tasks[level.tasks.length - 1])} />
    </div>
  )
}
