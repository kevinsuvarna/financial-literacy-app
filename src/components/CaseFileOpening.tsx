import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef } from 'react'
import { GAME } from '../content/gameData'
import { playSound } from '../audio/sounds'
import { CASE_FILE_ART } from './caseFileArt'
import cardSavings from '../assets/interim/card-savings.png'
import cardCurrent from '../assets/interim/card-current.png'
import cardFixed from '../assets/interim/card-fixed-deposit.png'
import cardRecurring from '../assets/interim/card-recurring-deposit.png'

const { caseAssigned } = GAME
const { cover, profile, brief } = CASE_FILE_ART

/** The open file, centred: two A-size pages (1695 × 2400) side by side with a spine between. */
const PAGE = { width: 537, height: 760 }
const SPINE = 10
const TOP = 104
const LEFT = (1512 - (PAGE.width * 2 + SPINE)) / 2
/** The closed file lies over the right-hand page; it starts small, where it sat on the desk (03). */
const CLOSED = { left: LEFT + PAGE.width + SPINE, top: TOP }
const FROM_DESK = { x: 990 + 178 - (CLOSED.left + PAGE.width / 2), y: 524 + 210 - (TOP + PAGE.height / 2), scale: 0.6 }
/**
 * How the opening plays out (s): lift, cover swings open, time to read, the envelope's hint, then
 * the view dives into the envelope and Level 1 begins.
 */
const T = { lift: 0.4, open: 0.45, cover: 0.55, hint: 1.9, flap: 2.8, cards: 3.15, dive: 4.2, done: 4.8 }
/** The envelope on the case brief ("OPEN & SCAN THE ACCOUNT TYPE"), and its flap's tip: fractions of the page. */
const ENVELOPE = { x0: 0.091, y0: 0.606, x1: 0.914, y1: 0.933, tipX: 0.499, tipY: 0.769 }
const ENVELOPE_BOX = {
  left: CLOSED.left + ENVELOPE.x0 * PAGE.width,
  top: TOP + ENVELOPE.y0 * PAGE.height,
  width: (ENVELOPE.x1 - ENVELOPE.x0) * PAGE.width,
  height: (ENVELOPE.y1 - ENVELOPE.y0) * PAGE.height,
}
/** The flap's tip, as percentages of the envelope box (for clip paths). */
const TIP = {
  x: ((ENVELOPE.tipX - ENVELOPE.x0) / (ENVELOPE.x1 - ENVELOPE.x0)) * 100,
  y: ((ENVELOPE.tipY - ENVELOPE.y0) / (ENVELOPE.y1 - ENVELOPE.y0)) * 100,
}
const FLAP = `polygon(0 0, 100% 0, ${TIP.x}% ${TIP.y}%)`
const POCKET = `polygon(0 0, ${TIP.x}% ${TIP.y}%, 100% 0, 100% 100%, 0 100%)`
/** The brief's own envelope, cut from the page image (so the flap and pocket match the art). */
const ENVELOPE_ART = {
  backgroundImage: `url(${brief})`,
  backgroundSize: `${PAGE.width}px ${PAGE.height}px`,
  backgroundPosition: `${-(ENVELOPE_BOX.left - CLOSED.left)}px ${-(ENVELOPE_BOX.top - TOP)}px`,
}
/** The account-type cards that slide out of the envelope: art, where they end up (from its centre), tilt. */
const CARDS = [
  { src: cardSavings, x: -160, rotate: -12 },
  { src: cardCurrent, x: -55, rotate: -4 },
  { src: cardFixed, x: 55, rotate: 4 },
  { src: cardRecurring, x: 160, rotate: 12 },
] as const
const CARD_WIDTH = 104
/** Where the view dives: the cards, just above the open envelope. */
const ENVELOPE_CENTRE = { x: ENVELOPE_BOX.left + ENVELOPE_BOX.width / 2, y: ENVELOPE_BOX.top - 40 }

/**
 * OPEN CASE FILE (03, owner art 2026-11-10): Ananya's case file lifts off the desk and its cover
 * swings open like a book: her account holder profile inside the cover, the case brief on the
 * right. After time to read, the brief's envelope glows, hinting the player to open the real one;
 * then it opens, its flap lifting and the four account-type cards sliding out, and the view dives
 * into them as Level 1 begins. A tap skips ahead.
 */
export function CaseFileOpening({ onDone }: { onDone: () => void }) {
  const reduce = useReducedMotion()
  // A tap skips ahead, but only once the file is open: the tap that opened it mustn't skip it.
  const openedAt = useRef(0)
  useEffect(() => {
    openedAt.current = performance.now() + (reduce ? 0 : (T.open + T.cover) * 1000)
  }, [reduce])
  const skip = () => {
    if (performance.now() >= openedAt.current) onDone()
  }
  useEffect(() => {
    const timers = reduce
      ? [window.setTimeout(onDone, (T.done - T.open - T.cover) * 1000)]
      : [
          window.setTimeout(() => playSound('whoosh'), 0),
          window.setTimeout(() => playSound('tap'), T.open * 1000),
          window.setTimeout(() => playSound('chime'), T.hint * 1000),
          window.setTimeout(() => playSound('tap'), T.flap * 1000),
          window.setTimeout(() => playSound('whoosh'), T.dive * 1000),
          window.setTimeout(onDone, T.done * 1000),
        ]
    return () => timers.forEach((t) => window.clearTimeout(t))
  }, [reduce, onDone])

  const lift = { duration: T.lift, ease: [0.3, 0.7, 0.4, 1] } as const
  return (
    <motion.div
      className="cfo"
      onClick={skip}
      initial={{ backgroundColor: 'rgba(6, 18, 34, 0)' }}
      animate={{ backgroundColor: 'rgba(6, 18, 34, 0.82)' }}
      transition={{ duration: T.lift }}
      role="dialog"
      aria-label={caseAssigned.cta}
    >
      {/* Everything that dives into the envelope at the end. */}
      <motion.div
        className="cfo-stage"
        style={{ originX: `${ENVELOPE_CENTRE.x}px`, originY: `${ENVELOPE_CENTRE.y}px` }}
        initial={{ scale: 1, opacity: 1 }}
        animate={reduce ? {} : { scale: 2.6, opacity: 0 }}
        transition={{ delay: T.dive, duration: T.done - T.dive, ease: [0.55, 0, 0.8, 0.4] }}
      >
        {/* The case brief, on the right; the closed file starts over it. */}
        <motion.img
          className="cfo-page cfo-page--brief"
          src={brief}
          alt={caseAssigned.briefAlt}
          style={{ left: CLOSED.left, top: TOP, width: PAGE.width, height: PAGE.height }}
          initial={reduce ? false : { ...FROM_DESK, opacity: 0 }}
          animate={{ x: 0, y: 0, scale: 1, opacity: 1 }}
          transition={lift}
        />
        {/* The hint: the envelope glows, as if to say "open me". */}
        {!reduce && (
          <motion.span
            className="cfo-envelope-glow"
            style={ENVELOPE_BOX}
            initial={{ opacity: 0, scale: 1 }}
            animate={{ opacity: [0, 1, 0.35, 1, 0.35, 1], scale: [1, 1.04, 1, 1.04, 1, 1.03] }}
            transition={{ delay: T.hint, duration: T.flap - T.hint }}
          />
        )}
        {/* The envelope opens: the flap lifts, the inside shows, the cards slide up out of the pocket. */}
        {!reduce && (
          <div className="cfo-envelope" style={ENVELOPE_BOX}>
            <motion.span
              className="cfo-envelope-inside"
              style={{ clipPath: FLAP }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: T.flap, duration: 0.1 }}
            />
            {/* The flap folds up over the envelope's top edge (a 2D flip), showing its plain inside. */}
            <motion.div
              className="cfo-envelope-flap"
              style={{ ...ENVELOPE_ART, clipPath: FLAP }}
              initial={{ scaleY: 1 }}
              animate={{ scaleY: -1 }}
              transition={{ delay: T.flap, duration: 0.35, ease: [0.4, 0, 0.3, 1] }}
            >
              <motion.span
                className="cfo-envelope-flap-back"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: T.flap + 0.17, duration: 0.01 }}
              />
            </motion.div>
            {/* The cards rise out of the pocket, in front of the folded-up flap. */}
            {CARDS.map((card, i) => (
              <motion.img
                key={card.src}
                className="cfo-envelope-card"
                src={card.src}
                alt=""
                style={{ width: CARD_WIDTH, left: ENVELOPE_BOX.width / 2 - CARD_WIDTH / 2 }}
                initial={{ x: 0, y: 0, rotate: 0, opacity: 0 }}
                animate={{ x: card.x, y: -210, rotate: card.rotate, opacity: 1 }}
                transition={{ delay: T.cards + i * 0.06, type: 'spring', stiffness: 150, damping: 16 }}
              />
            ))}
            <span className="cfo-envelope-pocket" style={{ ...ENVELOPE_ART, clipPath: POCKET }} />
          </div>
        )}
        {/* The cover, hinged on the spine: the case file in front, her profile on its inside. */}
        <motion.div
          className="cfo-cover"
          style={{ left: CLOSED.left, top: TOP, width: PAGE.width, height: PAGE.height }}
          initial={reduce ? { rotateY: -180 } : { ...FROM_DESK, rotateY: 0 }}
          animate={{ x: 0, y: 0, scale: 1, rotateY: -180 }}
          transition={{ x: lift, y: lift, scale: lift, rotateY: { delay: T.open, duration: T.cover, ease: [0.45, 0, 0.25, 1] } }}
        >
          <img className="cfo-face cfo-face--front" src={cover} alt={caseAssigned.caseFileAlt} />
          <img className="cfo-face cfo-face--inside" src={profile} alt={caseAssigned.profileAlt} />
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
