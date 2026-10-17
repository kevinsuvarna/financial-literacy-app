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
  L2T2: 'chequeClue',
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
  // The report is submitted on the monitor (15), then straight to the certificate (16).
  3: 'certificate',
}

export function taskEntryRoute(taskId: TaskId): string {
  return SCREENS[TASK_ENTRY[taskId]].path
}

/** The task after this one, if any. */
export function nextTaskId(taskId: TaskId): TaskId | null {
  return TASK_ORDER[TASK_ORDER.indexOf(taskId) + 1] ?? null
}

/**
 * Levels that go straight on to the next level when finished, through the Case Board transition,
 * instead of a level-complete screen (owner request: Level 2 → the board → Ananya's second call).
 */
const STRAIGHT_ON: readonly LevelId[] = [2]

/** The level whose board transition plays after this action, if any. */
export function levelIntroAfter(result: ActionResult): LevelId | undefined {
  const level = result.completedLevel
  return level && STRAIGHT_ON.includes(level) ? ((level + 1) as LevelId) : undefined
}

/** Where to go once the player closes the feedback for an action; null if the action completed nothing. */
export function routeAfterCompleting(result: ActionResult): string | null {
  if (!result.completedTask) return null
  if (result.completedLevel && STRAIGHT_ON.includes(result.completedLevel)) return routeAfterLevel(result.completedLevel)
  if (result.completedLevel) return SCREENS[LEVEL_COMPLETE[result.completedLevel]].path
  const next = nextTaskId(result.completedTask)
  return next ? taskEntryRoute(next) : SCREENS.certificate.path
}

/** The screen before this task's: the previous task, or the level-complete screen between levels. */
export function routeBack(taskId: TaskId): string {
  const index = TASK_ORDER.indexOf(taskId)
  if (index === 0) return SCREENS.caseAssigned.path
  const previous = TASK_ORDER[index - 1]
  const previousLevel = GAME.tasks[previous].level
  if (previousLevel !== GAME.tasks[taskId].level) return SCREENS[LEVEL_COMPLETE[previousLevel]].path
  return taskEntryRoute(previous)
}

/**
 * The screens in the order the game shows them. BACK always goes to the screen before the one on
 * show, in this order, whatever was tapped or opened before (owner request).
 */
const SCREEN_FLOW: ScreenKey[] = [
  'start',
  'callAnanya1',
  'caseAssigned',
  'accountType',
  'verifyIdentity',
  'withdrawalSlip',
  'level1Complete',
  'closingBalance',
  'chequeClue',
  'cheque',
  'highlighter',
  'callAnanya2',
  'phishingChoice',
  'scamReveal',
  'passkey',
  'scanEvidence',
  'reviewReport',
  'certificate',
]

/** Screens off the main line, and the screen BACK takes them to. */
const BACK_TO: Partial<Record<ScreenKey, ScreenKey>> = {
  // The case and the call go back to the start screen, where RESUME CASE carries on (owner request).
  caseAssigned: 'start',
  callAnanya1: 'start',
  fakeWebsite: 'phishingChoice',
  level2Complete: 'highlighter',
  reportSubmitted: 'reviewReport',
}

/** Where BACK goes from a screen: the one before it in the game's order; null if it has none. */
export function previousScreenPath(key: ScreenKey): string | null {
  const back = BACK_TO[key]
  if (back) return SCREENS[back].path
  const index = SCREEN_FLOW.indexOf(key)
  return index > 0 ? SCREENS[SCREEN_FLOW[index - 1]].path : null
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
