import { BackButton } from '../components/BackButton'
import { motion } from 'motion/react'
import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { GAME } from '../content/gameData'
import { SCREENS } from '../app/screens'
import { playSound } from '../audio/sounds'
import { SceneCta } from '../components/scene/FeedbackParts'
import { Desk } from '../components/scene/TableScene'
import { useGameStore } from '../state/gameStore'
import badge from '../assets/art/officer-badge.png'
import newspaper from '../assets/art/newspaper.png'

const { certificate } = GAME

function Star({ className }: { className: string }) {
  return (
    <svg className={`cert-star ${className}`} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 1.5 L15 9 L23 9.3 L16.8 14.3 L19 22.3 L12 17.8 L5 22.3 L7.2 14.3 L1 9.3 L9 9 Z" />
    </svg>
  )
}

function Leaf({ className }: { className: string }) {
  return (
    <svg className={`cert-leaves ${className}`} viewBox="0 0 120 240" aria-hidden="true">
      <path d="M60 236 C58 170 62 110 70 40" />
      <ellipse cx="44" cy="70" rx="22" ry="44" transform="rotate(-25 44 70)" />
      <ellipse cx="88" cy="120" rx="22" ry="44" transform="rotate(30 88 120)" />
      <ellipse cx="38" cy="160" rx="22" ry="44" transform="rotate(-35 38 160)" />
    </svg>
  )
}

function Lines({ text }: { text: string }) {
  return text.split('\n').map((line) => (
    <span key={line} className="cert-line">
      {line}
    </span>
  ))
}

/** 16: Mission complete. The certificate stands on the desk, by the newspaper and the officer's badge. */
export function CertificateScreen() {
  const navigate = useNavigate()
  const resetGame = useGameStore((s) => s.resetGame)

  useEffect(() => playSound('fanfare'), [])

  const replay = () => {
    resetGame()
    navigate(SCREENS.start.path)
  }

  return (
    <div className="screen screen--certificate">
      <BackButton />
      <Desk variant="certificate" />
      <img className="cert-newspaper" src={newspaper} alt="" />
      <motion.img
        className="cert-badge"
        src={badge}
        alt=""
        initial={{ scale: 0.4, opacity: 0, rotate: -30 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ delay: 1.1, type: 'spring', stiffness: 220, damping: 14 }}
      />
      <motion.section
        className="cert"
        aria-label={certificate.title}
        initial={{ y: -700, rotate: -8 }}
        animate={{ y: 0, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 90, damping: 16 }}
      >
        <div className="cert-paper">
          {(['tl', 'tr', 'bl', 'br'] as const).map((corner) => (
            <span key={corner} className={`cert-corner cert-corner--${corner}`} aria-hidden="true">
              <Star className="cert-star--corner" />
            </span>
          ))}
          <Leaf className="cert-leaves--left" />
          <Leaf className="cert-leaves--right" />
          <span className="cert-rule cert-rule--left" aria-hidden="true" />
          <span className="cert-rule cert-rule--right" aria-hidden="true" />
          <svg className="cert-emblem" viewBox="0 0 180 80" aria-hidden="true">
            <g className="cert-laurel">
              <ellipse cx="22" cy="56" rx="10" ry="6" transform="rotate(-35 22 56)" />
              <ellipse cx="30" cy="40" rx="10" ry="6" transform="rotate(-60 30 40)" />
              <ellipse cx="158" cy="56" rx="10" ry="6" transform="rotate(35 158 56)" />
              <ellipse cx="150" cy="40" rx="10" ry="6" transform="rotate(60 150 40)" />
            </g>
            <path className="cert-bank" d="M50 26 L90 4 L130 26 Z M50 26 H130 M58 32 V64 M74 32 V64 M90 32 V64 M106 32 V64 M122 32 V64 M48 70 H132" />
          </svg>
          <div className="cert-banner">
            <svg viewBox="0 0 760 140" preserveAspectRatio="none" aria-hidden="true">
              <defs>
                <radialGradient id="cert-banner-fill" cx="0.5" cy="0.5" r="0.6">
                  <stop offset="0" stopColor="var(--cert-banner)" />
                  <stop offset="1" stopColor="var(--cert-banner-edge)" />
                </radialGradient>
              </defs>
              <path className="cert-banner-gold" d="M0 22 Q380 2 760 14 L746 126 Q380 140 16 136 Z" />
              <path className="cert-banner-navy" d="M8 28 Q380 9 752 20 L740 119 Q380 133 22 129 Z" />
              <path className="cert-banner-line" d="M22 36 Q380 18 740 28 L730 111 Q380 124 34 120 Z" />
            </svg>
            <Star className="cert-star--banner-left" />
            <Star className="cert-star--banner-right" />
            <h1>{certificate.title}</h1>
          </div>
          <p className="cert-headline">{certificate.headline}</p>
          <p className="cert-text cert-text--notified">
            <Lines text={certificate.notified} />
          </p>
          <div className="cert-divider" aria-hidden="true">
            <span />
            <Star className="cert-star--divider" />
            <span />
          </div>
          <p className="cert-text cert-text--learned">
            <Lines text={certificate.message} />
          </p>
          {/* For screen readers and tests: the rank the badge shows. */}
          <p className="visually-hidden" data-testid="badge">
            {GAME.ui.certificateAwarded} {certificate.award}
          </p>
        </div>
      </motion.section>
      {/* Not in 16: spec 7 needs a way back to the Case Board and to replay. */}
      <motion.div className="cert-actions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }}>
        <SceneCta label={certificate.caseBoardCta} arrow={false} className="cert-cta" onClick={() => navigate(SCREENS.caseBoard.path)} />
        <SceneCta label={certificate.replayCta} arrow={false} className="cert-cta" onClick={replay} />
      </motion.div>
    </div>
  )
}
