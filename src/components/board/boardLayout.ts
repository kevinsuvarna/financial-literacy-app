/**
 * Case Board layout (mockup 21): where each level card, its icon, title and step dots sit, the
 * red thread between the pins, and which task a card or dot opens. Canvas pixels measured from 21.
 */
import type { LevelDef, LevelId, TaskId } from '../../content/gameData'
import { getCurrentTaskId, isTaskCompleted, type GameProgress } from '../../state/gameStore'

export interface CardGeometry {
  /** The card's box on the canvas. */
  box: { x: number; y: number; w: number; h: number }
  /** Hand-cut outline, in box coordinates. */
  outline: string
  /** Level 1's folded corner, in box coordinates. */
  fold?: string
  icon: { x: number; y: number; w: number; h: number }
  /** Centre of the title (x) and of its two lines (y). */
  title: { cx: number; y: [number, number] }
  /** The step dots, spaced so each step's name fits underneath (21 has no names: 50 px apart, 7 px lower). */
  dots: { y: number; x: [number, number, number] }
}

export const BOARD_CARDS: Record<LevelId, CardGeometry> = {
  1: {
    box: { x: 230, y: 208, w: 306, h: 282 },
    outline: 'M4 9 Q136 3 267 7 L302 33 Q299 155 302 274 Q226 280 150 272 Q76 266 7 278 Q1 142 4 9 Z',
    fold: 'M267 7 L302 33 L271 36 Z',
    icon: { x: 342, y: 247, w: 74, h: 64 },
    title: { cx: 383, y: [355, 382] },
    dots: { y: 428, x: [302, 384, 466] },
  },
  2: {
    box: { x: 608, y: 356, w: 312, h: 284 },
    outline: 'M6 11 C70 1 200 6 306 20 Q310 148 306 277 Q156 255 7 277 Q-1 144 6 11 Z',
    icon: { x: 722, y: 392, w: 89, h: 69 },
    title: { cx: 765, y: [504, 531] },
    dots: { y: 572, x: [683, 765, 847] },
  },
  3: {
    box: { x: 994, y: 244, w: 312, h: 282 },
    outline: 'M6 8 Q156 3 306 6 Q309 140 306 276 Q156 281 8 274 Q0 140 6 8 Z',
    icon: { x: 1116, y: 286, w: 66, h: 76 },
    title: { cx: 1149, y: [390, 417] },
    dots: { y: 464, x: [1067, 1149, 1231] },
  },
}

/** The red thread, pin to pin: Level 1 → 2, then Level 2 → 3 (bezier fitted to 21). */
export const THREAD: [string, string] = ['M264 232 C470 171 628 350 820 370', 'M820 370 C962 302 1132 170 1290 276']

/** When each beat of the level transition happens (seconds). */
export const UNLOCK_TIMING = { stamp: 0.5, trace: 1.0, traceLength: 0.8, unlock: 1.75 }

export type StepStatus = 'completed' | 'current' | 'locked'

export function stepStatus(progress: GameProgress, tasks: TaskId[]): StepStatus {
  if (tasks.every((id) => isTaskCompleted(progress, id))) return 'completed'
  const current = getCurrentTaskId(progress)
  return current && tasks.includes(current) ? 'current' : 'locked'
}

/** The task a step dot opens: the current task if it's in this step, else the step's first. */
export function stepTask(progress: GameProgress, tasks: TaskId[]): TaskId {
  const current = getCurrentTaskId(progress)
  return current && tasks.includes(current) ? current : tasks[0]
}

/** The task a level card opens: resume the current task, or revisit a solved level from the start. */
export function levelTask(progress: GameProgress, level: LevelDef): TaskId {
  const current = getCurrentTaskId(progress)
  return current && level.tasks.includes(current) ? current : level.tasks[0]
}
