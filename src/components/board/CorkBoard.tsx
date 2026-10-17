import { motion } from 'motion/react'
import type { ComponentType, CSSProperties } from 'react'
import { GAME, type LevelId, type TaskId } from '../../content/gameData'
import { getCurrentTaskId, getLevelStatus, type GameProgress } from '../../state/gameStore'
import newspaper from '../../assets/art/newspaper.png'
import badge from '../../assets/art/officer-badge.png'
import { BoardBankIcon, BoardLockIcon, BoardShieldIcon, BoardStatementIcon } from './BoardIcons'
import { BOARD_CARDS, THREAD, UNLOCK_TIMING, levelTask, stepStatus, stepTask } from './boardLayout'

const ICONS: Record<LevelId, ComponentType<{ className?: string }>> = {
  1: BoardBankIcon,
  2: BoardStatementIcon,
  3: BoardShieldIcon,
}

/**
 * The Case Board scene (mockup 21): a cork board on the wall above the desk, with the three level
 * cards pinned up and joined by the red thread. Layout in boardLayout.ts.
 *
 * Used by the Case Board screen (tap a card to resume or revisit a level, a step dot to open that
 * step) and by the transition between levels (`unlocking`), which plays the next level opening up.
 */

interface CorkBoardProps {
  progress: GameProgress
  /** Opens a task (tapping a card or a step dot). Leave out for a board that only plays. */
  onOpenTask?: (taskId: TaskId) => void
  /** The level opening up: plays its unlock, and the stamp on the level before. */
  unlocking?: LevelId
}

export function CorkBoard({ progress, onOpenTask, unlocking }: CorkBoardProps) {
  const current = getCurrentTaskId(progress)

  return (
    <div className="cork-scene">
      <div className="cork-desk" aria-hidden="true" />
      <img className="cork-newspaper" src={newspaper} alt="" />
      <img className="cork-badge" src={badge} alt="" />

      <div className="cork-frame" aria-hidden="true">
        <div className="cork-frame-inner">
          <div className="cork-bevel">
            <div className="cork-surface" />
          </div>
        </div>
      </div>

      <ul className="cork-cards">
        {GAME.levels.map((level) => {
          const geometry = BOARD_CARDS[level.id]
          const { box, icon } = geometry
          const Art = ICONS[level.id]
          // During the transition the new level starts out locked and the last one unsolved.
          const status = getLevelStatus(progress, level.id)
          const playsUnlock = unlocking === level.id
          const playsStamp = unlocking !== undefined && unlocking - 1 === level.id
          const isCurrent = !!current && level.tasks.includes(current)
          return (
            <li
              key={level.id}
              className={`cork-card cork-card--${status}${isCurrent ? ' is-current' : ''}${playsUnlock ? ' is-unlocking' : ''}`}
              data-level={level.id}
              style={
                {
                  left: box.x,
                  top: box.y,
                  width: box.w,
                  height: box.h,
                  // Status marks sit on and beside the icon, clear of the step names.
                  '--icon-cx': `${icon.x + icon.w / 2 - box.x}px`,
                  '--icon-cy': `${icon.y + icon.h / 2 - box.y}px`,
                  '--icon-right': `${icon.x + icon.w - box.x}px`,
                } as CSSProperties
              }
            >
              <div className="cork-card-paper" style={{ clipPath: `path('${geometry.outline}')` }} />
              <svg className="cork-card-outline" viewBox={`0 0 ${box.w} ${box.h}`} aria-hidden="true">
                <path d={geometry.outline} />
                {geometry.fold && <path className="cork-card-fold" d={geometry.fold} />}
              </svg>
              <button
                type="button"
                className="cork-card-open"
                aria-label={`${GAME.ui.levelHeading} ${level.id}: ${level.title}`}
                disabled={!onOpenTask || status === 'locked'}
                onClick={() => onOpenTask?.(levelTask(progress, level))}
              />
              <span
                className="cork-card-icon"
                style={{ left: icon.x - box.x, top: icon.y - box.y, width: icon.w, height: icon.h }}
              >
                <Art />
              </span>
              <p className="cork-card-title" aria-hidden="true">
                {level.boardLines.map((line, i) => (
                  <span key={line} style={{ left: geometry.title.cx - box.x, top: geometry.title.y[i] - box.y }}>
                    {line}
                  </span>
                ))}
              </p>
              <span className="visually-hidden" data-testid={`level-${level.id}-status`}>
                {GAME.caseBoard.statusLabels[status]}
              </span>
              <ol className="cork-dots">
                {level.steps.map((step, i) => {
                  const dot = stepStatus(progress, step.tasks)
                  return (
                    <li key={step.label} style={{ left: geometry.dots.x[i] - box.x, top: geometry.dots.y - box.y }}>
                      {i > 0 && <span className="cork-dot-line" aria-hidden="true" />}
                      <button
                        type="button"
                        className={`cork-dot cork-dot--${dot}`}
                        aria-label={`${step.label} (${GAME.ui.taskStatus[dot]})`}
                        disabled={!onOpenTask || dot === 'locked'}
                        onClick={() => onOpenTask?.(stepTask(progress, step.tasks))}
                      />
                      <span className="cork-dot-label" aria-hidden="true">
                        {step.label}
                      </span>
                    </li>
                  )
                })}
              </ol>
              {(status === 'locked' || playsUnlock) && (
                <motion.span
                  className="cork-lock"
                  aria-hidden="true"
                  initial={false}
                  animate={playsUnlock ? { y: [0, -14, 160], rotate: [0, -12, 40], opacity: [1, 1, 0] } : undefined}
                  transition={{ delay: UNLOCK_TIMING.unlock, duration: 0.7, times: [0, 0.25, 1], ease: 'easeIn' }}
                >
                  <BoardLockIcon />
                </motion.span>
              )}
              {status === 'completed' && (
                <motion.span
                  className="cork-stamp"
                  title={GAME.caseBoard.solved}
                  aria-hidden="true"
                  initial={playsStamp ? { scale: 2.6, opacity: 0 } : false}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: UNLOCK_TIMING.stamp, type: 'spring', stiffness: 520, damping: 22 }}
                >
                  <svg viewBox="0 0 24 24">
                    <path d="M5 12.5 L10 17.5 L19.5 7" />
                  </svg>
                </motion.span>
              )}
              {playsUnlock && (
                <motion.span
                  className="cork-unlocked"
                  aria-hidden="true"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: UNLOCK_TIMING.unlock + 0.2, type: 'spring', stiffness: 420, damping: 18 }}
                >
                  {GAME.ui.levelHeading.toUpperCase()} {level.id} {GAME.caseBoard.unlocked}
                </motion.span>
              )}
            </li>
          )
        })}
      </ul>

      <svg className="cork-thread" viewBox="0 0 1512 982" aria-hidden="true">
        {THREAD.map((d) => (
          <g key={d}>
            <path className="cork-thread-shadow" d={d} />
            <path className="cork-thread-line" d={d} />
          </g>
        ))}
        {unlocking && unlocking > 1 && (
          <motion.path
            className="cork-thread-trace"
            d={THREAD[unlocking - 2]}
            initial={{ pathLength: 0, opacity: 1 }}
            animate={{ pathLength: 1, opacity: [1, 1, 0.55] }}
            transition={{ delay: UNLOCK_TIMING.trace, duration: UNLOCK_TIMING.traceLength, ease: 'easeInOut' }}
          />
        )}
        <Pins unlocking={unlocking} />
      </svg>
    </div>
  )
}

/** The three push pins: green (Level 1), blue (Level 2), red (Level 3). */
function Pins({ unlocking }: { unlocking?: LevelId }) {
  const drop = (level: LevelId) =>
    unlocking === level
      ? {
          initial: { y: -60, opacity: 0 },
          animate: { y: 0, opacity: 1 },
          transition: { delay: UNLOCK_TIMING.unlock - 0.15, type: 'spring' as const, stiffness: 600, damping: 16 },
        }
      : { initial: false as const }
  return (
    <>
      <motion.g className="cork-pin cork-pin--green" {...drop(1)}>
        <path className="cork-pin-needle" d="M262 236 L276 247" />
        <ellipse className="cork-pin-collar" cx="264" cy="237" rx="10" ry="8" transform="rotate(40 264 237)" />
        <ellipse className="cork-pin-head" cx="251" cy="227" rx="15" ry="14" transform="rotate(40 251 227)" />
        <ellipse className="cork-pin-shine" cx="246" cy="222" rx="5" ry="3.5" transform="rotate(-30 246 222)" />
      </motion.g>
      <motion.g className="cork-pin cork-pin--blue" {...drop(2)}>
        <path className="cork-pin-needle" d="M820 360 L820 372" />
        <path className="cork-pin-collar" d="M812 349 L828 349 L825 362 L815 362 Z" />
        <ellipse className="cork-pin-head" cx="820" cy="344" rx="14" ry="10" />
        <ellipse className="cork-pin-shine" cx="815" cy="340" rx="5" ry="2.6" />
      </motion.g>
      <motion.g className="cork-pin cork-pin--red" {...drop(3)}>
        <path className="cork-pin-needle" d="M1292 278 L1281 271" />
        <ellipse className="cork-pin-collar" cx="1294" cy="279" rx="9" ry="7" transform="rotate(20 1294 279)" />
        <ellipse className="cork-pin-head" cx="1307" cy="283" rx="14" ry="14.5" transform="rotate(20 1307 283)" />
        <ellipse className="cork-pin-shine" cx="1303" cy="277" rx="5" ry="3" transform="rotate(-30 1303 277)" />
      </motion.g>
    </>
  )
}
