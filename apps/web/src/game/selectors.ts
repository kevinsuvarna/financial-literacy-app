import { getTask, levels, type LevelId } from '@app/content';
import type { GameContext, TaskStatus } from './types';

export function getTaskStatus(context: GameContext, taskId: string): TaskStatus {
  return context.tasks[taskId]?.status ?? 'locked';
}

export function getLevelStatus(context: GameContext, levelId: LevelId): TaskStatus {
  const level = levels.find((l) => l.id === levelId);
  if (!level) return 'locked';

  const statuses = level.taskIds.map((id) => getTaskStatus(context, id));
  if (statuses.every((s) => s === 'completed')) return 'completed';
  if (statuses.every((s) => s === 'locked')) return 'locked';
  if (statuses.some((s) => s === 'inProgress')) return 'inProgress';
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
