import { getTask, passkey, type Task } from '@app/content';
import { getTaskStatus, orderedTaskIds } from './selectors';
import type { GameContext, GameEvent } from './types';

/** The events a player would send to solve `task` correctly, derived from content. */
export function solutionEvents(task: Task): GameEvent[] {
  switch (task.kind) {
    case 'scanOne':
      return task.acceptedIds.slice(0, 1).map((id) => ({ type: 'ARTEFACT_SCANNED', id }));
    case 'scanAll':
      return task.acceptedIds.map((id) => ({ type: 'ARTEFACT_SCANNED', id }));
    case 'tap':
      return task.acceptedIds.slice(0, 1).map((id) => ({ type: 'TAP_ZONE', id }));
    case 'highlight':
      return task.acceptedIds.slice(0, 1).map((id) => ({ type: 'HIGHLIGHT_ROW', id }));
    case 'choice':
      return task.acceptedIds.slice(0, 1).map((id) => ({ type: 'CHOOSE', id }));
    case 'passkey':
      return [{ type: 'SUBMIT_PASSKEY', code: passkey }];
    case 'narrative':
      return [];
    case 'report':
      return [{ type: 'SUBMIT_REPORT' }];
  }
}

/**
 * The events that take the game from its current position to `targetTaskId`, solving every
 * unsolved task before it. Debug tooling replays these through the real machine, so even a
 * "jump" can only change progress the way a player could (CLAUDE.md rule 2).
 */
export function jumpEvents(state: string, context: GameContext, targetTaskId: string): GameEvent[] {
  const targetIndex = orderedTaskIds.indexOf(targetTaskId);
  if (targetIndex === -1) return [];

  const events: GameEvent[] = [];
  if (state === 'notStarted') events.push({ type: 'START' });

  for (const taskId of orderedTaskIds.slice(0, targetIndex)) {
    if (getTaskStatus(context, taskId) === 'completed') continue;
    const task = getTask(taskId);
    if (!task) continue;
    events.push({ type: 'GOTO_TASK', taskId }, ...solutionEvents(task));
  }

  events.push({ type: 'GOTO_TASK', taskId: targetTaskId });
  return events;
}
