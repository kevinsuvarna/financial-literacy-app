import { z } from 'zod';
import { getTask, tasks } from '@app/content';
import type { GameSave } from './types';

const taskProgressSchema = z.object({
  status: z.enum(['locked', 'available', 'inProgress', 'completed']),
  attempts: z.number().int().nonnegative(),
  scannedIds: z.array(z.string()),
  lastFeedback: z.string().nullable(),
  // Saves from before this field existed don't have it.
  lastSubmission: z.string().nullable().default(null),
});

const gameSaveSchema = z.object({
  value: z.enum(['notStarted', 'inGame', 'missionComplete']),
  context: z.object({
    viewedTaskId: z.string(),
    tasks: z.record(z.string(), taskProgressSchema),
    reportSubmitted: z.boolean(),
  }),
});

/**
 * Reads a game out of something that claims to be one — a save that has come back from the
 * server — or returns null if it is not a game this build can run.
 *
 * A save is only trusted this far: it must have the machine's shape, be about exactly the
 * tasks this build has (no fewer, and any extras are dropped), and be looking at one of them.
 * Anything else is refused whole, and the game on the device carries on untouched.
 */
export function parseGameSave(value: unknown): GameSave | null {
  const parsed = gameSaveSchema.safeParse(value);
  if (!parsed.success) return null;

  const { context } = parsed.data;
  if (!getTask(context.viewedTaskId)) return null;

  const progress: GameSave['context']['tasks'] = {};
  for (const task of tasks) {
    const saved = context.tasks[task.id];
    if (!saved) return null;
    progress[task.id] = saved;
  }

  return { value: parsed.data.value, context: { ...context, tasks: progress } };
}
