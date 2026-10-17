import { motion } from 'motion/react'
import { useNavigate } from 'react-router'
import { GAME } from '../content/gameData'
import { resumeRoute } from '../app/navigation'
import { SCREENS } from '../app/screens'
import { AlertBadge, ArrowRight, BankIcon, LaurelSprig } from '../components/art/Icons'
import { cameraScanner } from '../scanner/cameraScanner'
import { useGameStore } from '../state/gameStore'
import { useProgress } from '../state/hooks'
import badge from '../assets/art/officer-badge.png'
import newspaper from '../assets/art/newspaper.png'

/** 01: Start screen (mockup 01-start.png). */
export function StartScreen() {
  const navigate = useNavigate()
  const progress = useProgress()
  const resetGame = useGameStore((s) => s.resetGame)
  const { start } = GAME

  return (
    <div className="screen screen--start">
      <div className="start-desk" aria-hidden="true" />
      <img className="start-newspaper" src={newspaper} alt="" />
      <img className="start-badge" src={badge} alt="" />

      <motion.div
        className="start-panel"
        initial={{ y: -40, opacity: 0, rotate: -3 }}
        animate={{ y: 0, opacity: 1, rotate: -1.1 }}
        transition={{ type: 'spring', stiffness: 160, damping: 18 }}
      >
        <div className="paper-outline" aria-hidden="true" />
        <LaurelSprig className="start-laurel start-laurel--left" />
        <LaurelSprig className="start-laurel start-laurel--right" flip />
        <BankIcon className="start-bank" />
        <h1 className="start-title" aria-label={start.title}>
          {start.titleLines.map((line, i) => (
            <span key={line} className={`start-title-line start-title-line--${i + 1}`} aria-hidden="true">
              {line}
            </span>
          ))}
        </h1>
        <p className="visually-hidden">{start.intro}</p>
        <motion.button
          type="button"
          className="glow-cta start-cta"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => {
            // The game's first tap: ask for the camera now, so card screens can scan straight away.
            cameraScanner.requestAccess()
            // A new game, from the first task (account, KYC, slips…); RESUME CASE keeps progress.
            resetGame()
            navigate(SCREENS.callAnanya1.path)
          }}
        >
          <span className="cta-label">{start.cta}<ArrowRight className="glow-cta-arrow cta-label-after" /></span>
        </motion.button>
        {progress.introCompleted && (
          <button
            type="button"
            className="start-resume"
            onClick={() => {
              cameraScanner.requestAccess()
              navigate(resumeRoute(progress))
            }}
          >
            {start.resumeCta}
          </button>
        )}
      </motion.div>

      <motion.div
        className="start-alert"
        initial={{ scale: 0 }}
        animate={{ scale: 1, rotate: [0, -8, 8, -4, 0] }}
        transition={{ delay: 0.35, duration: 0.6 }}
      >
        <AlertBadge />
      </motion.div>
    </div>
  )
}
