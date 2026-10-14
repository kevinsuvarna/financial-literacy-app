/**
 * Where each screen leads, and who may open it. Pure functions over game progress, so the
 * rules that stop players skipping ahead (spec 8) are tested without a browser.
 */
import { GAME, TASK_ORDER, type LevelId, type TaskId } from '../content/gameData'
import {
  getCurrentTaskId,
  getLevelStatus,
  isMissionComplete,
  isTaskUnlocked,
  type ActionResult,
  type GameProgress,
} from '../state/gameStore'
import { SCREENS, type ScreenKey } from './screens'

/** The first screen of each task. Level 3, Task 1 opens with Ananya's second call. */
const TASK_ENTRY: Record<TaskId, ScreenKey> = {
  L1T1: 'accountType',
  L1T2: 'verifyIdentity',
  L1T3: 'withdrawalSlip',
  L2T1: 'closingBalance',
  L2T2: 'cheque',
  L2T3: 'highlighter',
  L3T1: 'callAnanya2',
  L3T2: 'scamReveal',
  L3T3: 'passkey',
  L3T4: 'scanEvidence',
  L3T5: 'reviewReport',
}

const LEVEL_COMPLETE: Record<LevelId, ScreenKey> = {
  1: 'level1Complete',
  2: 'level2Complete',
  3: 'reportSubmitted',
}

export function taskEntryRoute(taskId: TaskId): string {
  return SCREENS[TASK_ENTRY[taskId]].path
}

/** The task after this one, if any. */
export function nextTaskId(taskId: TaskId): TaskId | null {
  return TASK_ORDER[TASK_ORDER.indexOf(taskId) + 1] ?? null
}

/** Where to go once the player closes the feedback for an action; null if the action completed nothing. */
export function routeAfterCompleting(result: ActionResult): string | null {
  if (!result.completedTask) return null
  if (result.completedLevel) return SCREENS[LEVEL_COMPLETE[result.completedLevel]].path
  const next = nextTaskId(result.completedTask)
  return next ? taskEntryRoute(next) : SCREENS.certificate.path
}

/** Continue from a level-complete screen. */
export function routeAfterLevel(levelId: LevelId): string {
  const next = GAME.levels.find((level) => level.id === levelId + 1)
  return next ? taskEntryRoute(next.tasks[0]) : SCREENS.certificate.path
}

/** Where a returning player picks up. */
export function resumeRoute(progress: GameProgress): string {
  if (!progress.introCompleted) return SCREENS.start.path
  const current = getCurrentTaskId(progress)
  return current ? taskEntryRoute(current) : SCREENS.certificate.path
}

export interface ScreenAccessState extends GameProgress {
  fakeSiteOpen: boolean
}

/** Locked screens can't be opened, whatever URL is typed. */
export function canOpenScreen(key: ScreenKey, state: ScreenAccessState): boolean {
  const screen = SCREENS[key]
  switch (key) {
    case 'level1Complete':
      return getLevelStatus(state, 1) === 'completed'
    case 'level2Complete':
      return getLevelStatus(state, 2) === 'completed'
    case 'reportSubmitted':
    case 'certificate':
      return isMissionComplete(state)
    case 'fakeWebsite':
      return isTaskUnlocked(state, 'L3T1') && state.fakeSiteOpen
    default:
      return 'task' in screen ? isTaskUnlocked(state, screen.task) : true
  }
}

/** Where a blocked screen sends the player instead. */
export function redirectFor(key: ScreenKey, state: ScreenAccessState): string {
  if (key === 'fakeWebsite' && isTaskUnlocked(state, 'L3T1')) return SCREENS.phishingChoice.path
  return resumeRoute(state)
}
