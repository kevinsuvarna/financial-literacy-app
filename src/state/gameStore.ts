/**
 * The single source of game progress (spec 10.1). The tracker, Case Board and every task screen
 * read from this store. All answer checking happens here against the content module, so
 * components only report what the player did (scanned, tapped, typed) and render the result.
 */
import { create } from 'zustand'
import { createJSONStorage, persist, type PersistStorage } from 'zustand/middleware'
import {
  GAME,
  TASK_ORDER,
  artefactIdFromQr,
  isArtefactId,
  type ArtefactId,
  type ChequeAreaId,
  type Copy,
  type FakeFieldId,
  type GameContent,
  type LevelId,
  type PhishingChoice,
  type TaskDef,
  type TaskId,
  type TaskKind,
} from '../content/gameData'

export const STORAGE_KEY = 'save-the-savings-account'
export const STORAGE_VERSION = 1

// ─── Types ───────────────────────────────────────────────────────────────────

/** Progress that survives reloads. Holds no personal information about the player. */
export interface GameProgress {
  /** OPEN CASE FILE pressed. Level 1, Task 1 unlocks after this. */
  introCompleted: boolean
  /** Always a prefix of TASK_ORDER: tasks complete strictly in order. */
  completedTasks: TaskId[]
  /** Artefacts accepted so far on tasks that collect several (KYC, evidence). */
  accepted: Partial<Record<TaskId, ArtefactId[]>>
  /** Wrong answers per task. Drives the escalating hints. */
  wrongAttempts: Partial<Record<TaskId, number>>
  phishingChoice: PhishingChoice | null
}

export type FeedbackTone = 'correct' | 'progress' | 'incorrect' | 'neutral'

export interface Feedback extends Copy {
  /** Increments on every new feedback, so a repeated message still re-animates. */
  id: number
  taskId: TaskId | null
  tone: FeedbackTone
  hint?: string
}

export type Outcome =
  | 'correct' // the right answer (completes the task unless revisiting)
  | 'partial' // one of several required artefacts accepted, or the phishing YES path opened
  | 'incorrect' // a wrong answer, explained
  | 'neutral' // friendly non-error response: "looks correct", "not needed", "not an option"
  | 'already' // re-scanned something already accepted
  | 'unknown' // a QR code that isn't part of the case file
  | 'ignored' // input not accepted here: wrong screen, locked task, or feedback still showing

export interface ActionResult {
  outcome: Outcome
  /** Set only when this action completed a task (never while revisiting). */
  completedTask?: TaskId
  completedLevel?: LevelId
  missionComplete?: boolean
}

export interface GameState extends GameProgress {
  /** The task whose screen is showing. Only unlocked tasks can be shown. */
  activeTaskId: TaskId | null
  /** While set, scans are ignored (spec 10.2: input locked while feedback animates). */
  feedback: Feedback | null
  /** The simulated phishing page (YES path). Not persisted. */
  fakeSite: { open: boolean; filled: FakeFieldId[] }

  completeIntro: () => void
  /** Opens a task screen. Returns false (and changes nothing) for a locked task. Re-opening the same task keeps its state. */
  viewTask: (taskId: TaskId) => boolean
  leaveTask: () => void
  dismissFeedback: () => void
  /** Raw text decoded from a QR code by the camera scanner. */
  scanQr: (text: string) => ActionResult
  /** An artefact chosen from the simulated-scan list (or decoded from a QR code). */
  scanArtefact: (artefactId: string) => ActionResult
  inspectChequeArea: (areaId: ChequeAreaId) => ActionResult
  highlightTransaction: (transactionId: string) => ActionResult
  choosePhishingOption: (choice: PhishingChoice) => ActionResult
  /** Returns the fictional value the tapped field fills with, or null if the fake page isn't open. */
  fillFakeField: (fieldId: FakeFieldId) => string | null
  /** YES path: shows the simulated loss and sends the player back to the choice. Only NO completes the task. */
  submitFakeForm: () => ActionResult
  completeScamReveal: () => ActionResult
  enterPasskey: (code: string) => ActionResult
  submitReport: () => ActionResult
  /** Replay the mission from the start. */
  resetGame: () => void
}

// ─── Progress selectors (pure) ───────────────────────────────────────────────

type ProgressLike = Pick<GameProgress, 'introCompleted' | 'completedTasks'>

export function initialProgress(): GameProgress {
  return { introCompleted: false, completedTasks: [], accepted: {}, wrongAttempts: {}, phishingChoice: null }
}

export function isTaskCompleted(progress: Pick<GameProgress, 'completedTasks'>, taskId: TaskId): boolean {
  return progress.completedTasks.includes(taskId)
}

/** The furthest unlocked task still to do; null before the intro and after the mission. */
export function getCurrentTaskId(progress: ProgressLike): TaskId | null {
  if (!progress.introCompleted) return null
  return TASK_ORDER.find((id) => !isTaskCompleted(progress, id)) ?? null
}

export function isMissionComplete(progress: Pick<GameProgress, 'completedTasks'>): boolean {
  return TASK_ORDER.every((id) => isTaskCompleted(progress, id))
}

export function isTaskUnlocked(progress: ProgressLike, taskId: TaskId): boolean {
  return isTaskCompleted(progress, taskId) || getCurrentTaskId(progress) === taskId
}

export type TaskStatus = 'completed' | 'current' | 'locked'

export function getTaskStatus(progress: ProgressLike, taskId: TaskId): TaskStatus {
  if (isTaskCompleted(progress, taskId)) return 'completed'
  return getCurrentTaskId(progress) === taskId ? 'current' : 'locked'
}

export type LevelStatus = 'locked' | 'available' | 'in-progress' | 'completed'

export function getLevelStatus(progress: GameProgress, levelId: LevelId, content: GameContent = GAME): LevelStatus {
  const { tasks } = levelOf(levelId, content)
  if (tasks.every((id) => isTaskCompleted(progress, id))) return 'completed'
  if (!isTaskUnlocked(progress, tasks[0])) return 'locked'
  const started = tasks.some(
    (id) =>
      isTaskCompleted(progress, id) ||
      (progress.accepted[id]?.length ?? 0) > 0 ||
      (progress.wrongAttempts[id] ?? 0) > 0 ||
      (content.tasks[id].kind === 'phishing' && progress.phishingChoice !== null),
  )
  return started ? 'in-progress' : 'available'
}

/** The level of the current task (Level 3 once the mission is complete); null before the intro. */
export function getCurrentLevelId(progress: ProgressLike, content: GameContent = GAME): LevelId | null {
  if (!progress.introCompleted) return null
  const current = getCurrentTaskId(progress)
  return current ? content.tasks[current].level : content.levels[content.levels.length - 1].id
}

function levelOf(levelId: LevelId, content: GameContent) {
  const level = content.levels.find((l) => l.id === levelId)
  if (!level) throw new Error(`Unknown level ${levelId}`)
  return level
}

// ─── Persistence ─────────────────────────────────────────────────────────────

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Turns whatever was in storage into valid progress. Completed tasks are cut back to an in-order
 * prefix and partial progress on locked tasks is dropped, so edited or stale storage can never
 * skip locked content.
 */
export function sanitizeProgress(raw: unknown, content: GameContent = GAME): GameProgress {
  const stored = isRecord(raw) ? raw : {}
  const introCompleted = stored.introCompleted === true
  const listed = new Set(Array.isArray(stored.completedTasks) ? stored.completedTasks : [])
  const completedTasks: TaskId[] = []
  if (introCompleted) {
    for (const id of TASK_ORDER) {
      if (!listed.has(id)) break
      completedTasks.push(id)
    }
  }
  const progress = { introCompleted, completedTasks }

  const storedAccepted = isRecord(stored.accepted) ? stored.accepted : {}
  const storedWrong = isRecord(stored.wrongAttempts) ? stored.wrongAttempts : {}
  const accepted: GameProgress['accepted'] = {}
  const wrongAttempts: GameProgress['wrongAttempts'] = {}
  for (const id of TASK_ORDER) {
    if (!isTaskUnlocked(progress, id)) continue
    const task = content.tasks[id]
    if (task.kind === 'scan' && task.collect) {
      const list = storedAccepted[id]
      const kept = isTaskCompleted(progress, id)
        ? task.required
        : task.required.filter((artefact) => Array.isArray(list) && list.includes(artefact))
      if (kept.length > 0) accepted[id] = [...kept]
    }
    const wrong = storedWrong[id]
    if (typeof wrong === 'number' && Number.isInteger(wrong) && wrong > 0) wrongAttempts[id] = wrong
  }

  const phishingTask = TASK_ORDER.find((id) => content.tasks[id].kind === 'phishing')
  const choice = stored.phishingChoice
  const phishingChoice =
    phishingTask && isTaskUnlocked(progress, phishingTask) && (choice === 'yes' || choice === 'no') ? choice : null

  return { introCompleted, completedTasks, accepted, wrongAttempts, phishingChoice }
}

function pickProgress(state: GameProgress): GameProgress {
  const { introCompleted, completedTasks, accepted, wrongAttempts, phishingChoice } = state
  return { introCompleted, completedTasks, accepted, wrongAttempts, phishingChoice }
}

// ─── Store ───────────────────────────────────────────────────────────────────

export interface GameStoreOptions {
  content?: GameContent
  /** Defaults to localStorage. Tests pass an in-memory storage. */
  storage?: PersistStorage<GameProgress>
}

const IGNORED: ActionResult = { outcome: 'ignored' }
const CLOSED_FAKE_SITE: GameState['fakeSite'] = { open: false, filled: [] }

export function createGameStore({
  content = GAME,
  storage = createJSONStorage<GameProgress>(() => localStorage),
}: GameStoreOptions = {}) {
  let feedbackSeq = 0

  return create<GameState>()(
    persist<GameState, [], [], GameProgress>(
      (set, get) => {
        /** The task on screen, if it is of the given kind. */
        function activeTask<K extends TaskKind>(kind: K): Extract<TaskDef, { kind: K }> | null {
          const id = get().activeTaskId
          if (!id) return null
          const task = content.tasks[id]
          return task.kind === kind ? (task as Extract<TaskDef, { kind: K }>) : null
        }

        const reviewing = (task: TaskDef) => isTaskCompleted(get(), task.id)

        function respond(task: TaskDef, outcome: Outcome, tone: FeedbackTone, copy: Copy, hint?: string): ActionResult {
          set({ feedback: { id: ++feedbackSeq, taskId: task.id, tone, ...copy, ...(hint ? { hint } : {}) } })
          return { outcome }
        }

        /** The right answer: completes the task, or just replays the explanation when revisiting. */
        function succeed(
          task: TaskDef,
          copy: Copy,
          patch: Partial<GameState> = {},
          tone: FeedbackTone = 'correct',
        ): ActionResult {
          if (reviewing(task)) return respond(task, 'correct', tone, copy)
          const completedTasks = [...get().completedTasks, task.id]
          set({ ...patch, completedTasks })
          respond(task, 'correct', tone, copy)
          const levelDone = levelOf(task.level, content).tasks.every((id) => completedTasks.includes(id))
          return {
            outcome: 'correct',
            completedTask: task.id,
            ...(levelDone ? { completedLevel: task.level } : {}),
            ...(isMissionComplete({ completedTasks }) ? { missionComplete: true } : {}),
          }
        }

        /** A wrong answer: counted towards hints unless revisiting. */
        function fail(task: TaskDef, copy: Copy): ActionResult {
          const previous = get().wrongAttempts[task.id] ?? 0
          const count = reviewing(task) ? Math.max(previous, 1) : previous + 1
          if (!reviewing(task)) set({ wrongAttempts: { ...get().wrongAttempts, [task.id]: count } })
          const hint = task.hints.length > 0 ? task.hints[Math.min(count, task.hints.length) - 1] : undefined
          return respond(task, 'incorrect', 'incorrect', copy, hint)
        }

        function evaluateScan(artefactId: ArtefactId | null): ActionResult {
          if (get().feedback) return IGNORED
          const task = activeTask('scan')
          if (!task) return IGNORED
          if (!artefactId) return respond(task, 'unknown', 'neutral', content.scanner.unknownQr)

          if (task.required.includes(artefactId)) {
            if (!task.collect) return succeed(task, task.correct)
            const accepted = get().accepted[task.id] ?? []
            const next = accepted.includes(artefactId) ? accepted : [...accepted, artefactId]
            if (!reviewing(task) && task.required.every((id) => next.includes(id))) {
              return succeed(task, task.correct, { accepted: { ...get().accepted, [task.id]: next } })
            }
            if (reviewing(task) || accepted.includes(artefactId)) {
              return respond(task, 'already', 'neutral', task.collect.already)
            }
            set({ accepted: { ...get().accepted, [task.id]: next } })
            return respond(task, 'partial', 'progress', task.collect.accepted[artefactId] ?? task.correct)
          }

          const incorrect = task.incorrect[artefactId]
          if (incorrect) return fail(task, incorrect)
          return respond(task, 'neutral', 'neutral', task.neutral[artefactId] ?? task.notAnOption)
        }

        return {
          ...initialProgress(),
          activeTaskId: null,
          feedback: null,
          fakeSite: CLOSED_FAKE_SITE,

          completeIntro: () => set({ introCompleted: true }),

          viewTask: (taskId) => {
            if (!isTaskUnlocked(get(), taskId)) return false
            // Moving between two screens of the same task (phishing choice → fake page) keeps its state.
            if (get().activeTaskId !== taskId) set({ activeTaskId: taskId, feedback: null, fakeSite: CLOSED_FAKE_SITE })
            return true
          },

          leaveTask: () => set({ activeTaskId: null, feedback: null, fakeSite: CLOSED_FAKE_SITE }),

          dismissFeedback: () => set({ feedback: null }),

          scanQr: (text) => evaluateScan(artefactIdFromQr(text, content.domain)),

          scanArtefact: (artefactId) => evaluateScan(isArtefactId(artefactId) ? artefactId : null),

          inspectChequeArea: (areaId) => {
            const task = activeTask('cheque')
            const area = task?.areas.find((a) => a.id === areaId)
            if (!task || !area) return IGNORED
            if (area.isDiscrepancy) return succeed(task, task.correct)
            return respond(task, 'neutral', 'neutral', area.feedback)
          },

          highlightTransaction: (transactionId) => {
            const task = activeTask('highlight')
            const row = content.statement.rows.find((r) => r.id === transactionId)
            if (!task || !row) return IGNORED
            if (row.suspicious) return succeed(task, task.correct)
            return respond(task, 'neutral', 'neutral', { message: row.highlightFeedback })
          },

          choosePhishingOption: (choice) => {
            const task = activeTask('phishing')
            if (!task) return IGNORED
            const record = reviewing(task) ? {} : { phishingChoice: choice }
            if (choice === 'no') return succeed(task, task.safe, record)
            set({ ...record, feedback: null, fakeSite: { open: true, filled: [] } })
            return { outcome: 'partial' }
          },

          fillFakeField: (fieldId) => {
            const task = activeTask('phishing')
            const field = task?.fakeSite.fields.find((f) => f.id === fieldId)
            const { fakeSite } = get()
            if (!field || !fakeSite.open) return null
            if (!fakeSite.filled.includes(fieldId)) set({ fakeSite: { open: true, filled: [...fakeSite.filled, fieldId] } })
            return field.autofill
          },

          submitFakeForm: () => {
            const task = activeTask('phishing')
            const { fakeSite } = get()
            if (!task || !fakeSite.open) return IGNORED
            if (!task.fakeSite.fields.every((f) => fakeSite.filled.includes(f.id))) {
              return respond(task, 'neutral', 'neutral', task.fakeSite.incomplete)
            }
            // The simulated loss happens now, after details were entered, never on the click itself.
            // It doesn't complete the task: the player goes back to the choice and must pick NO.
            set({ fakeSite: CLOSED_FAKE_SITE })
            return fail(task, task.consequence)
          },

          completeScamReveal: () => {
            const task = activeTask('story')
            return task ? succeed(task, task.correct) : IGNORED
          },

          enterPasskey: (code) => {
            const task = activeTask('passkey')
            if (!task) return IGNORED
            const entry = code.trim()
            if (!/^\d+$/.test(entry) || entry.length !== content.passkey.length) {
              return respond(task, 'neutral', 'neutral', task.invalid)
            }
            return entry === content.passkey ? succeed(task, task.correct) : fail(task, task.incorrect)
          },

          submitReport: () => {
            const task = activeTask('report')
            if (!task) return IGNORED
            if (reviewing(task)) return respond(task, 'already', 'neutral', task.alreadySubmitted)
            const attached = get().accepted[task.evidenceTaskId] ?? []
            const complete =
              isTaskCompleted(get(), task.evidenceTaskId) && task.evidence.every((e) => attached.includes(e.artefactId))
            if (!complete) return respond(task, 'incorrect', 'incorrect', task.missingEvidence)
            return succeed(task, task.submitted)
          },

          resetGame: () =>
            set({ ...initialProgress(), activeTaskId: null, feedback: null, fakeSite: CLOSED_FAKE_SITE }),
        }
      },
      {
        name: STORAGE_KEY,
        version: STORAGE_VERSION,
        storage,
        partialize: pickProgress,
        migrate: (persisted) => sanitizeProgress(persisted, content),
        merge: (persisted, current) => ({ ...current, ...sanitizeProgress(persisted, content) }),
      },
    ),
  )
}

export type GameStore = ReturnType<typeof createGameStore>

/** The app's game store, persisted to localStorage. */
export const useGameStore = createGameStore()
