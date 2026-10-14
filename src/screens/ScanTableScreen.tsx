import type { ReactNode } from 'react'
import { GAME, formatRupees, type GameTasks, type ScanTask, type TaskId } from '../content/gameData'
import { Icon } from '../components/Icon'
import { SimulatedScanPanel } from '../components/SimulatedScanPanel'
import { TaskScreen } from '../components/TaskScreen'
import { isTaskCompleted, useGameStore } from '../state/gameStore'

export type ScanTaskId = { [K in TaskId]: GameTasks[K] extends ScanTask ? K : never }[TaskId]

const NO_ARTEFACTS: readonly string[] = []

/**
 * Placeholder for the table scenes (04, 05, 06, 08, 17): cards on the desk, evidence slots for
 * tasks that collect several cards, and the simulated-scan panel.
 */
export function ScanTableScreen({ taskId, document }: { taskId: ScanTaskId; document?: ReactNode }) {
  const task: ScanTask = GAME.tasks[taskId]
  const accepted = useGameStore((s) => s.accepted[taskId] ?? NO_ARTEFACTS)
  const completed = useGameStore((s) => isTaskCompleted(s, taskId))

  return (
    <TaskScreen taskId={taskId} aside={<SimulatedScanPanel task={task} />}>
      <div className="table-scene">
        {document}
        {task.collect && (
          <ul className="slots">
            {task.collect.slots.map((slot) => {
              const done = completed || accepted.includes(slot.artefactId)
              return (
                <li key={slot.artefactId} className={`slot paper${done ? ' is-done' : ''}`} data-slot={slot.artefactId}>
                  <span className="slot-mark">{done ? <Icon name="check" size={28} /> : null}</span>
                  <span className="slot-label">{slot.label}</span>
                  <span className="slot-status">{done ? GAME.ui.slotDone : GAME.ui.slotWaiting}</span>
                </li>
              )
            })}
          </ul>
        )}
        <div className="desk">
          <ul className="desk-cards">
            {task.options.map((id) => {
              const artefact = GAME.artefacts[id]
              return (
                <li key={id} className="desk-card paper">
                  <span className="desk-card-name">{artefact.name}</span>
                  {artefact.printedAmount !== undefined && (
                    <strong className="desk-card-amount">{formatRupees(artefact.printedAmount)}</strong>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </TaskScreen>
  )
}
