import { GAME, type ArtefactId, type TaskId } from '../../content/gameData'
import { isTaskCompleted, useGameStore } from '../../state/gameStore'

/** How an artefact on a scan table has been scanned: accepted (right), tried (wrong), or not yet. */
export type ScanMark = 'accepted' | 'tried' | null

const NONE: readonly ArtefactId[] = []

/**
 * Which artefacts on this task's table are already scanned. Accepted ones are the right answers
 * (KYC IDs and evidence as they're collected; every right answer once the task is solved); tried
 * ones are wrong answers already scanned in this session.
 */
export function useScanMarks(taskId: TaskId): (id: ArtefactId) => ScanMark {
  const accepted = useGameStore((s) => s.accepted[taskId] ?? NONE)
  const tried = useGameStore((s) => s.tried[taskId] ?? NONE)
  const completed = useGameStore((s) => isTaskCompleted(s, taskId))
  const task = GAME.tasks[taskId]
  const required: readonly ArtefactId[] = task.kind === 'scan' ? task.required : NONE
  return (id) => {
    if (completed ? required.includes(id) : accepted.includes(id)) return 'accepted'
    return tried.includes(id) ? 'tried' : null
  }
}
