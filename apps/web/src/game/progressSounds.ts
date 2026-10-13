import { getTask } from '@app/content';
import type { GameContext } from './types';

export type ProgressSound = 'correct' | 'wrong';

/**
 * Which result sounds a change in progress should make, from comparing the context before and
 * after an event. Driving sound from progress — rather than from each button and scanner —
 * means every input path (camera, picker, tap, keyboard) sounds the same without knowing about
 * audio.
 *
 * - a task becoming solved is `correct` (narrative beats complete on view, with no fanfare)
 * - an attempt count going up is `wrong`
 * - anything else — navigation, a repeat scan, a reset — is silent
 */
export function progressSounds(previous: GameContext, next: GameContext): ProgressSound[] {
  const sounds = new Set<ProgressSound>();

  for (const [taskId, progress] of Object.entries(next.tasks)) {
    const before = previous.tasks[taskId];
    if (!before) continue;

    const justSolved = progress.status === 'completed' && before.status !== 'completed';
    if (justSolved && getTask(taskId)?.kind !== 'narrative') sounds.add('correct');
    if (progress.attempts > before.attempts) sounds.add('wrong');
  }

  return [...sounds];
}
