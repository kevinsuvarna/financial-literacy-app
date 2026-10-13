import { useSelector } from '@xstate/react';
import { useCallback } from 'react';
import { getTask, levels, tasks, type LevelId } from '@app/content';
import { gameActor } from './actor';
import {
  getAttempts,
  getCurrentHint,
  getLastFeedback,
  getLevelStatus,
  getScannedIds,
  getTaskStatus,
  isReviewing,
  isTaskReachable,
} from './selectors';

/**
 * The single source of game progress (CLAUDE.md rule 2) — components read from this hook and
 * send events back through it; they never touch progress state directly.
 */
export function useGame() {
  const snapshot = useSelector(gameActor, (s) => s);
  const context = snapshot.context;
  const send = gameActor.send;

  return {
    state: snapshot.value,
    context,
    levels,
    tasks,
    viewedTaskId: context.viewedTaskId,
    viewedTask: getTask(context.viewedTaskId),
    isReviewing: isReviewing(context, context.viewedTaskId),

    getTaskStatus: (taskId: string) => getTaskStatus(context, taskId),
    getLevelStatus: (levelId: LevelId) => getLevelStatus(context, levelId),
    getAttempts: (taskId: string) => getAttempts(context, taskId),
    getScannedIds: (taskId: string) => getScannedIds(context, taskId),
    getLastFeedback: (taskId: string) => getLastFeedback(context, taskId),
    getCurrentHint: (taskId: string) => getCurrentHint(context, taskId),
    isTaskReachable: (taskId: string) => isTaskReachable(context, taskId),

    start: useCallback(() => send({ type: 'START' }), [send]),
    scanArtefact: useCallback((id: string) => send({ type: 'ARTEFACT_SCANNED', id }), [send]),
    tapZone: useCallback((id: string) => send({ type: 'TAP_ZONE', id }), [send]),
    highlightRow: useCallback((id: string) => send({ type: 'HIGHLIGHT_ROW', id }), [send]),
    choose: useCallback((id: string) => send({ type: 'CHOOSE', id }), [send]),
    submitPasskey: useCallback((code: string) => send({ type: 'SUBMIT_PASSKEY', code }), [send]),
    submitReport: useCallback(() => send({ type: 'SUBMIT_REPORT' }), [send]),
    gotoTask: useCallback((taskId: string) => send({ type: 'GOTO_TASK', taskId }), [send]),
    reset: useCallback(() => send({ type: 'RESET' }), [send]),
  };
}
