import { getTask, isRecommendedChoice } from '@app/content';
import type { GameContext, TaskProgress } from './types';

export type ProgressSound = 'correct' | 'wrong';

/** Whether solving `taskId` the way `progress` records deserves the "correct" fanfare. */
function earnsFanfare(taskId: string, progress: TaskProgress): boolean {
  const task = getTask(taskId);
  if (!task || task.kind === 'narrative') return false;
  // A choice that moves the story on as a lesson (clicking the phishing link) is not a win.
  if (task.kind === 'choice') return isRecommendedChoice(task, progress.scannedIds[0]);
  return true;
}

/**
 * Which result sounds a change in progress should make, from comparing the context before and
 * after an event. Driving sound from progress — rather than from each button and scanner —
 * means every input path (camera, picker, tap, keyboard) sounds the same without knowing about
 * audio.
 *
 * - a task becoming solved is `correct` — unless nothing was solved (a narrative beat) or the
 *   player took the option that is a lesson rather than the right call
 * - an attempt count going up is `wrong`
 * - anything else — navigation, a repeat scan, a reset — is silent
 */
export function progressSounds(previous: GameContext, next: GameContext): ProgressSound[] {
  const sounds = new Set<ProgressSound>();

  for (const [taskId, progress] of Object.entries(next.tasks)) {
    const before = previous.tasks[taskId];
    if (!before) continue;

    const justSolved = progress.status === 'completed' && before.status !== 'completed';
    if (justSolved && earnsFanfare(taskId, progress)) sounds.add('correct');
    if (progress.attempts > before.attempts) sounds.add('wrong');
  }

  return [...sounds];
}
