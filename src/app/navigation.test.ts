import { describe, expect, it } from 'vitest'
import { TASK_ORDER, type TaskId } from '../content/gameData'
import { initialProgress, type GameProgress } from '../state/gameStore'
import {
  canOpenScreen,
  redirectFor,
  resumeRoute,
  routeAfterCompleting,
  routeAfterLevel,
  taskEntryRoute,
  type ScreenAccessState,
} from './navigation'
import { SCREENS, screenForPath, type ScreenKey } from './screens'

/** Progress with every task before `current` completed (null = mission complete). */
function progressAt(current: TaskId | null, extra: Partial<GameProgress> = {}): ScreenAccessState {
  const done = current ? TASK_ORDER.slice(0, TASK_ORDER.indexOf(current)) : [...TASK_ORDER]
  return { ...initialProgress(), introCompleted: true, completedTasks: done, fakeSiteOpen: false, ...extra }
}

const fresh: ScreenAccessState = { ...initialProgress(), fakeSiteOpen: false }

describe('screen map', () => {
  it('gives every screen its own route', () => {
    const paths = Object.values(SCREENS).map((s) => s.path)
    expect(new Set(paths).size).toBe(paths.length)
  })

  it('opens every task on a screen that belongs to it', () => {
    for (const id of TASK_ORDER) expect(screenForPath(taskEntryRoute(id))?.task).toBe(id)
  })

  it('ignores a trailing slash', () => {
    expect(screenForPath('/case-board/')).toBe(SCREENS.caseBoard)
    expect(screenForPath('/')).toBe(SCREENS.start)
  })
})

describe('moving on', () => {
  it('does nothing until a task is completed', () => {
    expect(routeAfterCompleting({ outcome: 'incorrect' })).toBeNull()
    expect(routeAfterCompleting({ outcome: 'correct' })).toBeNull()
  })

  it('goes to the next task, or the level-complete screen at the end of a level', () => {
    expect(routeAfterCompleting({ outcome: 'correct', completedTask: 'L1T1' })).toBe(SCREENS.verifyIdentity.path)
    expect(routeAfterCompleting({ outcome: 'correct', completedTask: 'L1T3', completedLevel: 1 })).toBe(
      SCREENS.level1Complete.path,
    )
    expect(routeAfterCompleting({ outcome: 'correct', completedTask: 'L2T3', completedLevel: 2 })).toBe(
      SCREENS.level2Complete.path,
    )
    expect(
      routeAfterCompleting({ outcome: 'correct', completedTask: 'L3T5', completedLevel: 3, missionComplete: true }),
    ).toBe(SCREENS.reportSubmitted.path)
  })

  it('continues from a level-complete screen into the next level', () => {
    expect(routeAfterLevel(1)).toBe(SCREENS.closingBalance.path)
    expect(routeAfterLevel(2)).toBe(SCREENS.callAnanya2.path)
    expect(routeAfterLevel(3)).toBe(SCREENS.certificate.path)
  })

  it('resumes at the start, the current task, or the certificate', () => {
    expect(resumeRoute(fresh)).toBe(SCREENS.start.path)
    expect(resumeRoute(progressAt('L2T2'))).toBe(SCREENS.cheque.path)
    expect(resumeRoute(progressAt(null))).toBe(SCREENS.certificate.path)
  })
})

describe('screen guards', () => {
  const open = (key: ScreenKey, state: ScreenAccessState) => canOpenScreen(key, state)

  it('always opens the start, intro and Case Board', () => {
    for (const key of ['start', 'callAnanya1', 'caseAssigned', 'caseBoard'] as const) expect(open(key, fresh)).toBe(true)
  })

  it('opens only unlocked task screens', () => {
    const state = progressAt('L2T1')
    expect(open('accountType', state)).toBe(true)
    expect(open('closingBalance', state)).toBe(true)
    expect(open('cheque', state)).toBe(false)
    expect(open('passkey', state)).toBe(false)
    expect(open('accountType', fresh)).toBe(false)
    expect(redirectFor('cheque', state)).toBe(SCREENS.closingBalance.path)
  })

  it('opens level-complete screens only for completed levels', () => {
    expect(open('level1Complete', progressAt('L1T3'))).toBe(false)
    expect(open('level1Complete', progressAt('L2T1'))).toBe(true)
    expect(open('level2Complete', progressAt('L2T3'))).toBe(false)
    expect(open('level2Complete', progressAt('L3T1'))).toBe(true)
  })

  it('opens the report-submitted screen and certificate only after the mission', () => {
    expect(open('reportSubmitted', progressAt('L3T5'))).toBe(false)
    expect(open('certificate', progressAt('L3T5'))).toBe(false)
    expect(open('reportSubmitted', progressAt(null))).toBe(true)
    expect(open('certificate', progressAt(null))).toBe(true)
  })

  it('opens the fake website only while the YES path has it open', () => {
    expect(open('fakeWebsite', progressAt('L3T1'))).toBe(false)
    expect(redirectFor('fakeWebsite', progressAt('L3T1'))).toBe(SCREENS.phishingChoice.path)
    expect(open('fakeWebsite', { ...progressAt('L3T1'), fakeSiteOpen: true })).toBe(true)
    expect(open('fakeWebsite', { ...progressAt('L2T3'), fakeSiteOpen: true })).toBe(false)
  })
})
