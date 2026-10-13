import type { Task } from '@app/content';

/**
 * The cards a task is waiting to have scanned, or null when nothing should be scanned right
 * now. This one predicate decides both whether the scan station is shown and whether the
 * scanner runs: an unsolved scan task in a `table` scene, and nothing else (CLAUDE.md rule 4).
 */
export function getScanOptionIds(task: Task, solved: boolean): string[] | null {
  if (solved || task.scene !== 'table') return null;
  return task.kind === 'scanOne' || task.kind === 'scanAll' ? task.optionIds : null;
}
