import { BackButton } from '../components/BackButton'
import { motion } from 'motion/react'
import { useNavigate } from 'react-router'
import { GAME } from '../content/gameData'
import { resumeRoute } from '../app/navigation'
import { ArrowRight } from '../components/art/Icons'
import { cameraScanner } from '../scanner/cameraScanner'
import { useGameStore } from '../state/gameStore'
import caseFile from '../assets/interim/case-file.png'

const { caseAssigned } = GAME

/** 03: Case assigned (mockup 03-case-assigned.png). Opening the case file unlocks Level 1. */
export function CaseAssignedScreen() {
  const navigate = useNavigate()
  const completeIntro = useGameStore((s) => s.completeIntro)

  const openCaseFile = () => {
    // Usually already asked on START TRAINING; this covers anyone who arrived here directly.
    cameraScanner.requestAccess()
    completeIntro()
    navigate(resumeRoute(useGameStore.getState()))
  }

  return (
    <div className="screen screen--case-assigned">
      <BackButton />
      <div className="case-desk" aria-hidden="true" />
      <motion.div
        className="case-panel"
        initial={{ y: 60, opacity: 0, rotate: 2 }}
        animate={{ y: 0, opacity: 1, rotate: -1.6 }}
        transition={{ type: 'spring', stiffness: 140, damping: 18 }}
      >
        <div className="paper-outline" aria-hidden="true" />
        <p className="case-message">{caseAssigned.message}</p>
        <p className="case-next-step">{caseAssigned.nextStep}</p>
      </motion.div>
      <motion.h1
        className="case-stamp"
        initial={{ scale: 2.2, opacity: 0, rotate: -14 }}
        animate={{ scale: 1, opacity: 1, rotate: -8 }}
        transition={{ delay: 0.35, type: 'spring', stiffness: 420, damping: 16 }}
      >
        <span className="case-stamp-text">{caseAssigned.title}</span>
      </motion.h1>
      <motion.img
        className="case-file"
        src={caseFile}
        alt={caseAssigned.caseFileAlt}
        initial={{ x: 80, opacity: 0, rotate: 6 }}
        animate={{ x: 0, opacity: 1, rotate: 0 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 120, damping: 16 }}
      />
      <motion.button
        type="button"
        className="glow-cta case-cta"
        initial={{ rotate: -3 }}
        whileHover={{ scale: 1.03, rotate: -3 }}
        whileTap={{ scale: 0.96, rotate: -3 }}
        onClick={openCaseFile}
      >
        <span className="cta-label">{caseAssigned.cta}<ArrowRight className="glow-cta-arrow cta-label-after" /></span>
      </motion.button>
    </div>
  )
}
