import { getTask, levels, type Level, type LevelId } from '@app/content';
import { getAttachedEvidence } from './rules';
import type { GameContext, TaskStatus } from './types';

/** Every task id in play order, across all levels. */
export const orderedTaskIds = levels.flatMap((level) => level.taskIds);

export function getNextTaskId(taskId: string): string | undefined {
  const index = orderedTaskIds.indexOf(taskId);
  return index === -1 ? undefined : orderedTaskIds[index + 1];
}

export interface TaskPosition {
  level: Level;
  levelNumber: number;
  taskNumber: number;
  taskCount: number;
}

export function getTaskPosition(taskId: string): TaskPosition | undefined {
  for (const [levelIndex, level] of levels.entries()) {
    const taskIndex = level.taskIds.indexOf(taskId);
    if (taskIndex === -1) continue;
    return {
      level,
      levelNumber: levelIndex + 1,
      taskNumber: taskIndex + 1,
      taskCount: level.taskIds.length,
    };
  }
  return undefined;
}

export function getTaskStatus(context: GameContext, taskId: string): TaskStatus {
  return context.tasks[taskId]?.status ?? 'locked';
}

/** Where a level's Case Board card should take you: its first unsolved task, else its start. */
export function getLevelEntryTaskId(context: GameContext, levelId: LevelId): string | undefined {
  const level = levels.find((l) => l.id === levelId);
  if (!level) return undefined;
  return level.taskIds.find((id) => getTaskStatus(context, id) !== 'completed') ?? level.taskIds[0];
}

export function getAttachedEvidenceIds(context: GameContext): string[] {
  return [...getAttachedEvidence(context)];
}

export function getLevelStatus(context: GameContext, levelId: LevelId): TaskStatus {
  const level = levels.find((l) => l.id === levelId);
  if (!level) return 'locked';

  const statuses = level.taskIds.map((id) => getTaskStatus(context, id));
  if (statuses.every((s) => s === 'completed')) return 'completed';
  if (statuses.every((s) => s === 'locked')) return 'locked';
  // A level with anything solved is under way even if its next task hasn't been opened yet.
  if (statuses.some((s) => s === 'inProgress' || s === 'completed')) return 'inProgress';
  return 'available';
}

export function getAttempts(context: GameContext, taskId: string): number {
  return context.tasks[taskId]?.attempts ?? 0;
}

export function getScannedIds(context: GameContext, taskId: string): string[] {
  return context.tasks[taskId]?.scannedIds ?? [];
}

export function getLastFeedback(context: GameContext, taskId: string): string | null {
  return context.tasks[taskId]?.lastFeedback ?? null;
}

/** The hint to show for the task's current attempt count, escalating through `task.hints`. */
export function getCurrentHint(context: GameContext, taskId: string): string | null {
  const task = getTask(taskId);
  if (!task || task.hints.length === 0) return null;

  const attempts = getAttempts(context, taskId);
  if (attempts === 0) return null;

  const index = Math.min(attempts - 1, task.hints.length - 1);
  return task.hints[index] ?? null;
}

export function isReviewing(context: GameContext, taskId: string): boolean {
  return getTaskStatus(context, taskId) === 'completed';
}

export function isTaskReachable(context: GameContext, taskId: string): boolean {
  return getTaskStatus(context, taskId) !== 'locked';
}
