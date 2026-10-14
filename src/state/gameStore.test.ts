import { beforeEach, describe, expect, it } from 'vitest'
import { createJSONStorage, type StateStorage } from 'zustand/middleware'
import { GAME, TASK_ORDER, type TaskId } from '../content/gameData'
import {
  STORAGE_KEY,
  createGameStore,
  getCurrentTaskId,
  getLevelStatus,
  getTaskStatus,
  isMissionComplete,
  type GameProgress,
  type GameStore,
} from './gameStore'

function memoryStorage(): StateStorage & { data: Map<string, string> } {
  const data = new Map<string, string>()
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
  }
}

function makeStore(backing = memoryStorage()): GameStore {
  return createGameStore({ storage: createJSONStorage<GameProgress>(() => backing) })
}

const progressOf = (store: GameStore): GameProgress => {
  const { introCompleted, completedTasks, accepted, wrongAttempts, phishingChoice } = store.getState()
  return structuredClone({ introCompleted, completedTasks, accepted, wrongAttempts, phishingChoice })
}

/** Scans and then closes the feedback pop-up, as the UI does once its animation ends. */
function scan(store: GameStore, artefactId: string) {
  const result = store.getState().scanArtefact(artefactId)
  const feedback = store.getState().feedback
  store.getState().dismissFeedback()
  return { ...result, feedback }
}

/** Plays every task before `stop` with the right answers, straight from the content module. */
function playUntil(store: GameStore, stop: TaskId | null) {
  const s = () => store.getState()
  s().completeIntro()
  for (const id of TASK_ORDER) {
    if (id === stop) break
    expect(s().viewTask(id)).toBe(true)
    const task = GAME.tasks[id]
    switch (task.kind) {
      case 'scan':
        for (const artefact of task.required) scan(store, artefact)
        break
      case 'cheque':
        s().inspectChequeArea('amount-figures')
        break
      case 'highlight':
        s().highlightTransaction(GAME.statement.rows.find((r) => r.suspicious)!.id)
        break
      case 'phishing':
        s().choosePhishingOption('no')
        break
      case 'story':
        s().completeScamReveal()
        break
      case 'passkey':
        s().enterPasskey(GAME.passkey)
        break
      case 'report':
        s().submitReport()
        break
    }
    s().dismissFeedback()
    expect(getTaskStatus(s(), id)).toBe('completed')
  }
  s().leaveTask()
}

let store: GameStore
const state = () => store.getState()

beforeEach(() => {
  store = makeStore()
})

describe('progression guards', () => {
  it('keeps every task locked until the case file is opened', () => {
    expect(state().viewTask('L1T1')).toBe(false)
    expect(getCurrentTaskId(state())).toBeNull()
    state().completeIntro()
    expect(getCurrentTaskId(state())).toBe('L1T1')
    expect(state().viewTask('L1T1')).toBe(true)
  })

  it('refuses to open any task past the current one', () => {
    state().completeIntro()
    for (const id of TASK_ORDER.slice(1)) {
      expect(state().viewTask(id)).toBe(false)
      expect(getTaskStatus(state(), id)).toBe('locked')
    }
    expect(state().activeTaskId).toBeNull()
    expect(getLevelStatus(state(), 2)).toBe('locked')
    expect(getLevelStatus(state(), 3)).toBe('locked')
  })

  it('ignores answers that belong to other tasks', () => {
    playUntil(store, 'L1T1')
    state().viewTask('L1T1')
    expect(state().inspectChequeArea('amount-figures').outcome).toBe('ignored')
    expect(state().highlightTransaction('cams-tel').outcome).toBe('ignored')
    expect(state().enterPasskey(GAME.passkey).outcome).toBe('ignored')
    expect(state().choosePhishingOption('no').outcome).toBe('ignored')
    expect(state().submitReport().outcome).toBe('ignored')
    expect(scan(store, 'withdrawal-slip').outcome).toBe('neutral')
    expect(state().completedTasks).toEqual([])
  })

  it('ignores scans when no task screen is open', () => {
    state().completeIntro()
    expect(scan(store, 'savings-account').outcome).toBe('ignored')
    expect(state().completedTasks).toEqual([])
  })

  it('unlocks tasks one at a time', () => {
    playUntil(store, 'L1T2')
    expect(state().completedTasks).toEqual(['L1T1'])
    expect(getCurrentTaskId(state())).toBe('L1T2')
    expect(state().viewTask('L1T3')).toBe(false)
  })
})

describe('scan tasks', () => {
  beforeEach(() => {
    playUntil(store, 'L1T1')
    state().viewTask('L1T1')
  })

  it('explains a wrong card, counts it and lets the player retry', () => {
    const wrong = scan(store, 'current-account')
    expect(wrong.outcome).toBe('incorrect')
    expect(wrong.feedback).toMatchObject({ tone: 'incorrect', message: GAME.tasks.L1T1.incorrect['current-account']!.message })
    expect(wrong.feedback?.hint).toBe(GAME.tasks.L1T1.hints[0])
    expect(state().wrongAttempts.L1T1).toBe(1)
    expect(state().completedTasks).toEqual([])

    const right = scan(store, 'savings-account')
    expect(right).toMatchObject({ outcome: 'correct', completedTask: 'L1T1' })
    expect(right.feedback?.message).toBe(GAME.tasks.L1T1.correct.message)
  })

  it('locks scanning while feedback is showing', () => {
    expect(state().scanArtefact('current-account').outcome).toBe('incorrect')
    expect(state().scanArtefact('savings-account').outcome).toBe('ignored')
    expect(state().completedTasks).toEqual([])
    state().dismissFeedback()
    expect(state().scanArtefact('savings-account').outcome).toBe('correct')
  })

  it('answers an unrelated QR code with friendly feedback', () => {
    const result = state().scanQr('https://example.com/some-other-qr')
    expect(result.outcome).toBe('unknown')
    expect(state().feedback).toMatchObject({ tone: 'neutral', message: "That's not part of the case file, Officer." })
  })

  it('reads a printed QR code', () => {
    expect(state().scanQr(GAME.artefacts['savings-account'].qrUrl)).toMatchObject({ outcome: 'correct', completedTask: 'L1T1' })
  })
})

describe('KYC: both documents, either order (Level 1, Task 2)', () => {
  beforeEach(() => {
    playUntil(store, 'L1T2')
    state().viewTask('L1T2')
  })

  it.each([
    ['pan-card', 'aadhaar-card'],
    ['aadhaar-card', 'pan-card'],
  ])('accepts %s then %s', (first, second) => {
    const one = scan(store, first)
    expect(one.outcome).toBe('partial')
    expect(one.feedback?.tone).toBe('progress')
    expect(getTaskStatus(state(), 'L1T2')).toBe('current')
    expect(state().viewTask('L1T3')).toBe(false)

    const two = scan(store, second)
    expect(two).toMatchObject({ outcome: 'correct', completedTask: 'L1T2' })
    expect(two.feedback?.title).toBe('IDENTITY VERIFIED')
    expect(getCurrentTaskId(state())).toBe('L1T3')
  })

  it('shows "Already verified" for a re-scanned card, not an error', () => {
    scan(store, 'pan-card')
    const again = scan(store, 'pan-card')
    expect(again.outcome).toBe('already')
    expect(again.feedback).toMatchObject({ tone: 'neutral', message: 'Already verified' })
    expect(state().wrongAttempts.L1T2).toBeUndefined()
    expect(getTaskStatus(state(), 'L1T2')).toBe('current')
  })

  it('explains rejected documents without losing an accepted one', () => {
    scan(store, 'aadhaar-card')
    expect(scan(store, 'expired-passport').outcome).toBe('incorrect')
    expect(scan(store, 'library-card').outcome).toBe('incorrect')
    expect(state().accepted.L1T2).toEqual(['aadhaar-card'])
    expect(getTaskStatus(state(), 'L1T2')).toBe('current')
    expect(scan(store, 'pan-card').completedTask).toBe('L1T2')
  })

  it('reports Level 1 complete after the withdrawal slip', () => {
    scan(store, 'pan-card')
    scan(store, 'aadhaar-card')
    state().viewTask('L1T3')
    expect(scan(store, 'deposit-slip').outcome).toBe('incorrect')
    expect(scan(store, 'withdrawal-slip')).toMatchObject({ completedTask: 'L1T3', completedLevel: 1 })
    expect(getLevelStatus(state(), 1)).toBe('completed')
    expect(getLevelStatus(state(), 2)).toBe('available')
  })
})

describe('revisiting completed tasks never changes progress', () => {
  it('replays feedback only', () => {
    playUntil(store, 'L2T1')
    const before = progressOf(store)

    state().viewTask('L1T2')
    expect(scan(store, 'pan-card').feedback?.message).toBe('Already verified')
    expect(scan(store, 'library-card').outcome).toBe('incorrect')

    state().viewTask('L1T1')
    expect(scan(store, 'current-account').outcome).toBe('incorrect')
    expect(scan(store, 'savings-account').completedTask).toBeUndefined()

    expect(progressOf(store)).toEqual(before)
    expect(getCurrentTaskId(state())).toBe('L2T1')
  })
})

describe('Level 2', () => {
  it('closing balance: hints escalate with each wrong card', () => {
    playUntil(store, 'L2T1')
    state().viewTask('L2T1')
    const [answer] = GAME.tasks.L2T1.required
    const wrongCards = GAME.tasks.L2T1.options.filter((id) => id !== answer)
    const hints = wrongCards.map((id) => scan(store, id).feedback?.hint)
    expect(hints).toEqual(GAME.tasks.L2T1.hints.slice(0, wrongCards.length))
    expect(scan(store, answer).completedTask).toBe('L2T1')
  })

  it('cheque: other areas look correct, the amount reveals the mismatch', () => {
    playUntil(store, 'L2T2')
    state().viewTask('L2T2')
    for (const area of ['date', 'payee', 'signature'] as const) {
      expect(state().inspectChequeArea(area).outcome).toBe('neutral')
      expect(state().feedback?.message).toContain('This detail looks correct. Keep investigating.')
    }
    expect(state().completedTasks).not.toContain('L2T2')
    expect(state().inspectChequeArea('amount-words')).toMatchObject({ outcome: 'correct', completedTask: 'L2T2' })
    expect(state().feedback?.title).toBe('MISMATCH FOUND!')
  })

  it('highlighter: feedback on every row, the CAMS TEL row is the clue', () => {
    playUntil(store, 'L2T3')
    state().viewTask('L2T3')
    for (const row of GAME.statement.rows.filter((r) => !r.suspicious)) {
      expect(state().highlightTransaction(row.id).outcome).toBe('neutral')
      expect(state().feedback?.message).toBe(row.highlightFeedback)
    }
    expect(state().completedTasks).not.toContain('L2T3')
    expect(state().highlightTransaction('cams-tel')).toMatchObject({ completedTask: 'L2T3', completedLevel: 2 })
  })
})

describe('Level 3', () => {
  it('phishing NO: safe choice completes the task', () => {
    playUntil(store, 'L3T1')
    state().viewTask('L3T1')
    expect(state().choosePhishingOption('no')).toMatchObject({ outcome: 'correct', completedTask: 'L3T1' })
    expect(state().phishingChoice).toBe('no')
  })

  it('phishing YES: the loss is shown only after the details are entered', () => {
    playUntil(store, 'L3T1')
    state().viewTask('L3T1')
    expect(state().fillFakeField('otp')).toBeNull()
    expect(state().choosePhishingOption('yes').outcome).toBe('partial')
    expect(state().fakeSite.open).toBe(true)
    expect(state().completedTasks).not.toContain('L3T1')

    expect(state().submitFakeForm().outcome).toBe('neutral')
    expect(state().completedTasks).not.toContain('L3T1')

    for (const field of GAME.tasks.L3T1.fakeSite.fields) {
      expect(state().fillFakeField(field.id)).toBe(field.autofill)
    }
    expect(state().submitFakeForm()).toMatchObject({ outcome: 'correct', completedTask: 'L3T1' })
    expect(state().feedback).toMatchObject({ tone: 'incorrect', title: GAME.tasks.L3T1.consequence.title })
    expect(state().phishingChoice).toBe('yes')
  })

  it('phishing YES: the fake page stays open between screens of the same task, and closes on leaving', () => {
    playUntil(store, 'L3T1')
    state().viewTask('L3T1')
    state().choosePhishingOption('yes')
    state().fillFakeField('cvv')
    expect(state().viewTask('L3T1')).toBe(true)
    expect(state().fakeSite).toEqual({ open: true, filled: ['cvv'] })
    state().leaveTask()
    expect(state().fakeSite.open).toBe(false)
  })

  it('passkey: rejects bad input, gives escalating hints, unlocks on the derived code', () => {
    playUntil(store, 'L3T3')
    state().viewTask('L3T3')
    expect(state().enterPasskey('12').outcome).toBe('neutral')
    expect(state().enterPasskey('abc').outcome).toBe('neutral')
    expect(state().wrongAttempts.L3T3).toBeUndefined()

    const wrong = GAME.passkey === '000' ? '111' : '000'
    const hints = GAME.tasks.L3T3.hints.map(() => {
      expect(state().enterPasskey(wrong).outcome).toBe('incorrect')
      return state().feedback?.hint
    })
    expect(hints).toEqual(GAME.tasks.L3T3.hints)
    state().enterPasskey(wrong)
    expect(state().feedback?.hint).toBe(GAME.tasks.L3T3.hints.at(-1))
    for (const hint of hints) expect(hint).not.toContain(GAME.passkey)

    expect(state().enterPasskey(` ${GAME.passkey} `)).toMatchObject({ outcome: 'correct', completedTask: 'L3T3' })
  })

  it('evidence: the report stays locked until both slots are filled', () => {
    playUntil(store, 'L3T4')
    state().viewTask('L3T4')
    expect(scan(store, 'bank-statement').outcome).toBe('partial')
    expect(state().viewTask('L3T5')).toBe(false)

    const cheque = scan(store, 'cheque')
    expect(cheque.outcome).toBe('neutral')
    expect(cheque.feedback?.title).toBe('NOT NEEDED')
    expect(scan(store, 'bank-statement').feedback?.message).toBe('Already attached')
    expect(scan(store, 'pan-card').outcome).toBe('neutral')
    expect(state().accepted.L3T4).toEqual(['bank-statement'])
    expect(state().viewTask('L3T5')).toBe(false)

    expect(scan(store, 'phishing-message-card').completedTask).toBe('L3T4')
    expect(state().viewTask('L3T5')).toBe(true)
  })

  it('report: submission completes the mission, and resubmitting changes nothing', () => {
    playUntil(store, 'L3T5')
    state().viewTask('L3T5')
    expect(state().submitReport()).toMatchObject({ completedTask: 'L3T5', completedLevel: 3, missionComplete: true })
    expect(isMissionComplete(state())).toBe(true)
    const before = progressOf(store)
    expect(state().submitReport().outcome).toBe('already')
    expect(progressOf(store)).toEqual(before)
  })
})

describe('Case Board level status', () => {
  it('moves from available to in progress to completed', () => {
    state().completeIntro()
    expect(getLevelStatus(state(), 1)).toBe('available')
    state().viewTask('L1T1')
    scan(store, 'current-account')
    expect(getLevelStatus(state(), 1)).toBe('in-progress')
    playUntil(store, null)
    for (const level of [1, 2, 3] as const) expect(getLevelStatus(state(), level)).toBe('completed')
  })
})

describe('persistence', () => {
  it('round-trips progress, including a half-finished KYC task', () => {
    const backing = memoryStorage()
    store = makeStore(backing)
    playUntil(store, 'L1T2')
    state().viewTask('L1T2')
    scan(store, 'aadhaar-card')
    scan(store, 'library-card')
    const saved = progressOf(store)

    const resumed = makeStore(backing)
    const { introCompleted, completedTasks, accepted, wrongAttempts, phishingChoice } = resumed.getState()
    expect({ introCompleted, completedTasks, accepted, wrongAttempts, phishingChoice }).toEqual(saved)
    // Screen state is not persisted: the player resumes from the Case Board or current task.
    expect(resumed.getState().activeTaskId).toBeNull()
    expect(resumed.getState().feedback).toBeNull()

    store = resumed
    expect(getCurrentTaskId(state())).toBe('L1T2')
    state().viewTask('L1T2')
    expect(scan(store, 'aadhaar-card').outcome).toBe('already')
    expect(scan(store, 'pan-card').completedTask).toBe('L1T2')
  })

  it('stores progress only, under a single key', () => {
    const backing = memoryStorage()
    store = makeStore(backing)
    playUntil(store, 'L3T1')
    expect([...backing.data.keys()]).toEqual([STORAGE_KEY])
    const stored = JSON.parse(backing.data.get(STORAGE_KEY)!)
    expect(Object.keys(stored.state).sort()).toEqual(
      ['accepted', 'completedTasks', 'introCompleted', 'phishingChoice', 'wrongAttempts'].sort(),
    )
  })

  it('cannot be edited to skip locked tasks', () => {
    const backing = memoryStorage()
    backing.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        state: {
          introCompleted: true,
          completedTasks: ['L1T1', 'L2T1', 'L3T5'],
          accepted: { L1T2: ['pan-card', 'bogus'], L3T4: ['bank-statement'] },
          wrongAttempts: { L1T2: 2, L3T3: 5 },
          phishingChoice: 'no',
        },
      }),
    )
    store = makeStore(backing)
    expect(progressOf(store)).toEqual({
      introCompleted: true,
      completedTasks: ['L1T1'],
      accepted: { L1T2: ['pan-card'] },
      wrongAttempts: { L1T2: 2 },
      phishingChoice: null,
    })
    expect(state().viewTask('L2T1')).toBe(false)
  })

  it('starts fresh from unreadable storage', () => {
    const backing = memoryStorage()
    backing.setItem(STORAGE_KEY, '{not json')
    store = makeStore(backing)
    expect(progressOf(store)).toEqual({
      introCompleted: false,
      completedTasks: [],
      accepted: {},
      wrongAttempts: {},
      phishingChoice: null,
    })
  })

  it('replay resets everything', () => {
    const backing = memoryStorage()
    store = makeStore(backing)
    playUntil(store, null)
    state().resetGame()
    expect(getCurrentTaskId(state())).toBeNull()
    expect(makeStore(backing).getState().completedTasks).toEqual([])
  })
})
