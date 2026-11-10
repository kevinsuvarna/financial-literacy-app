import { motion } from 'motion/react'
import { GAME } from '../content/gameData'
import { InfoIcon } from '../components/art/Icons'
import { useActionHandler } from '../components/actionHandler'
import { Cheque } from '../components/cheque/Cheque'
import { CHEQUE_AREAS, boxStyle } from '../components/cheque/chequeLayout'
import { Panel, SceneCta } from '../components/scene/FeedbackParts'
import { TaskScreen } from '../components/TaskScreen'
import { SCREENS } from '../app/screens'
import { useGameStore, type Feedback } from '../state/gameStore'

const task = GAME.tasks.L2T2

/** 09b's tilt: the flat cheque mapped onto the corners measured in the mockup. */
const TILT = 'matrix3d(0.992769172, -0.09043824, 0, -0.000001489, 0.083755881, 0.990726097, 0, -0.000005704, 0, 0, 1, 0, 126.7, 261.6, 0, 1)'

/** 09b: the cheque, tilted over the question. Tap the part that's wrong. */
function ChequeTable() {
  const handle = useActionHandler()
  const inspect = useGameStore((s) => s.inspectChequeArea)
  return (
    <>
      <Panel className="panel--cheque">
        <h1 className="cheque-prompt">{task.prompt}</h1>
        <p className="cheque-hint">
          <InfoIcon className="mat-hint-icon" />
          {task.instruction}
        </p>
      </Panel>
      <Cheque className="cheque--tilted" style={{ transform: TILT }} loupe onArea={(id) => handle(inspect(id))} />
    </>
  )
}

/** Where the red pen rings the mismatch on 09e (canvas px): "Fifty" in the words, then the figures. */
const MISMATCH_RINGS = [
  { x: 712, y: 384, w: 128, h: 78 },
  { x: 1196, y: 382, w: 214, h: 84 },
]

/**
 * 09c–09f: the cheque lies flat, the tapped part lifts out enlarged (red if it's fine, green for the
 * mismatch), and the panel below says why. TRY AGAIN goes back to the cheque; BANK STATEMENT moves on.
 */
function ChequeFeedback({ feedback, onContinue }: { feedback: Feedback; onContinue: () => void }) {
  const zoom = feedback.areaId ? CHEQUE_AREAS[feedback.areaId] : null
  const right = feedback.tone === 'correct'
  const scale = zoom ? zoom.zoom.w / zoom.area.w : 1
  return (
    <div className="cheque-feedback" role="dialog" aria-label={feedback.title ?? task.label}>
      <Panel className="panel--cheque">
        <p className="cheque-message">
          {feedback.title ? `${feedback.title}\u00a0 ${feedback.message}` : feedback.message}
        </p>
        {feedback.detail && <p className="cheque-detail">{feedback.detail}</p>}
      </Panel>
      <Cheque className="cheque--flat" />
      {zoom && (
        <div className={`cheque-zoom${right ? ' cheque-zoom--right' : ''}`} style={boxStyle(zoom.zoom)}>
          <Cheque
            style={{ left: 0, top: 0, transform: `scale(${scale}) translate(${-zoom.area.x}px, ${-zoom.area.y}px)` }}
          />
        </div>
      )}
      {/* The mismatch, found: a red pen rings the words' "Fifty" and the figures, one after the other. */}
      {zoom && right &&
        MISMATCH_RINGS.map((ring, i) => (
          <svg key={i} className="cheque-ring" style={boxStyle(ring)} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <motion.path
              d="M10 56 C6 24 36 6 60 8 C86 10 98 32 94 56 C90 84 58 96 36 92 C14 88 4 70 12 42 C16 28 28 16 44 12"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.5 + i * 0.55, duration: 0.5, ease: 'easeInOut' }}
            />
          </svg>
        ))}
      <SceneCta
        label={feedback.cta ?? GAME.ui.tryAgain}
        back={!right}
        className={right ? 'cheque-cta--next' : 'cheque-cta--back'}
        onClick={onContinue}
      />
    </div>
  )
}

/** 09b–09f: the returned cheque (touch, not QR). */
export function ChequeScreen() {
  return (
    <TaskScreen
      taskId="L2T2"
      variant="scene"
      backTo={SCREENS.chequeClue.path}
      feedbackView={(feedback, onContinue) => <ChequeFeedback key={feedback.id} feedback={feedback} onContinue={onContinue} />}
    >
      <div className="screen--cheque">
        <ChequeTable />
      </div>
    </TaskScreen>
  )
}
