import {
  derivePasskey,
  getArtefact,
  getPasskeyHint,
  getTask,
  isInteractiveTask,
  isPasskeyAttempt,
  levels,
  tasks,
  type TaskKind,
} from '@app/content';
import type { GameContext, TaskProgress } from './types';

const allTaskIds = levels.flatMap((level) => level.taskIds);

const firstTaskId: string =
  allTaskIds[0] ??
  (() => {
    throw new Error('packages/content defines no tasks');
  })();

export function createInitialContext(): GameContext {
  const taskProgress: Record<string, TaskProgress> = {};
  allTaskIds.forEach((id, index) => {
    taskProgress[id] = {
      status: index === 0 ? 'available' : 'locked',
      attempts: 0,
      scannedIds: [],
      lastFeedback: null,
      lastSubmission: null,
    };
  });
  return {
    viewedTaskId: firstTaskId,
    tasks: taskProgress,
    reportSubmitted: false,
  };
}

function nextTaskId(taskId: string): string | undefined {
  const index = allTaskIds.indexOf(taskId);
  if (index === -1) return undefined;
  return allTaskIds[index + 1];
}

function updateTaskProgress(
  context: GameContext,
  taskId: string,
  patch: Partial<TaskProgress>,
): GameContext {
  const progress = context.tasks[taskId];
  if (!progress) return context;
  return {
    ...context,
    tasks: {
      ...context.tasks,
      [taskId]: { ...progress, ...patch },
    },
  };
}

function unlockNext(context: GameContext, taskId: string): GameContext {
  const next = nextTaskId(taskId);
  if (!next) return context;
  const nextProgress = context.tasks[next];
  if (!nextProgress || nextProgress.status !== 'locked') return context;
  return updateTaskProgress(context, next, { status: 'available' });
}

function completeTask(context: GameContext, taskId: string, successText: string): GameContext {
  const completed = updateTaskProgress(context, taskId, {
    status: 'completed',
    lastFeedback: successText,
  });
  return unlockNext(completed, taskId);
}

/** Flips an `available` task to `inProgress` the moment it's viewed; narrative beats have
 * nothing to interact with, so they complete immediately instead of waiting for an event. */
function ensureInProgress(context: GameContext, taskId: string): GameContext {
  const progress = context.tasks[taskId];
  if (!progress || progress.status !== 'available') return context;
  const inProgress = updateTaskProgress(context, taskId, { status: 'inProgress' });
  const task = getTask(taskId);
  if (task?.kind === 'narrative') {
    return completeTask(inProgress, taskId, task.successText);
  }
  return inProgress;
}

/**
 * Handles both START (viewing the first task) and GOTO_TASK (navigating anywhere unlocked).
 * Locked tasks are unreachable — the view simply doesn't move. Viewing an already-completed
 * task only updates `viewedTaskId`; it never mutates that task's progress (review mode).
 */
export function markViewed(context: GameContext, taskId: string): GameContext {
  const progress = context.tasks[taskId];
  if (!progress || progress.status === 'locked') return context;

  const viewed: GameContext = { ...context, viewedTaskId: taskId };
  if (progress.status !== 'available') return viewed;
  return ensureInProgress(viewed, taskId);
}

function alreadyVerifiedMessage(id: string): string {
  const label = getArtefact(id)?.label ?? 'This item';
  return `${label} is already verified.`;
}

function recordWrongAttempt(
  context: GameContext,
  taskId: string,
  feedback: string | null,
): GameContext {
  const progress = context.tasks[taskId];
  if (!progress) return context;
  return updateTaskProgress(context, taskId, {
    attempts: progress.attempts + 1,
    lastFeedback: feedback,
  });
}

function applyScanAll(context: GameContext, taskId: string, submittedId: string): GameContext {
  const task = getTask(taskId);
  const progress = context.tasks[taskId];
  if (!task || !isInteractiveTask(task) || !progress) return context;

  if (!task.acceptedIds.includes(submittedId)) {
    return recordWrongAttempt(context, taskId, task.feedback[submittedId] ?? null);
  }

  if (progress.scannedIds.includes(submittedId)) {
    return updateTaskProgress(context, taskId, {
      lastFeedback: alreadyVerifiedMessage(submittedId),
    });
  }

  const scannedIds = [...progress.scannedIds, submittedId];
  const allRequiredSeen = task.acceptedIds.every((id) => scannedIds.includes(id));
  const withScan = updateTaskProgress(context, taskId, { scannedIds, lastFeedback: null });

  return allRequiredSeen ? completeTask(withScan, taskId, task.successText) : withScan;
}

function applyAnyMatch(context: GameContext, taskId: string, submittedId: string): GameContext {
  const task = getTask(taskId);
  if (!task || !isInteractiveTask(task)) return context;

  if (!task.acceptedIds.includes(submittedId)) {
    return recordWrongAttempt(context, taskId, task.feedback[submittedId] ?? null);
  }
  if (task.kind !== 'choice') return completeTask(context, taskId, task.successText);

  // A choice can have more than one accepted answer, each with its own outcome (clicking the
  // phishing link moves the story on too — as a lesson). Remember which one was taken, so the
  // UI and the sounds can tell the right call from the lesson.
  const chosen = updateTaskProgress(context, taskId, { scannedIds: [submittedId] });
  return completeTask(chosen, taskId, task.outcomes[submittedId] ?? task.successText);
}

/**
 * Shared handler for ARTEFACT_SCANNED / TAP_ZONE / HIGHLIGHT_ROW / CHOOSE. `allowedKinds` keeps
 * an event meant for one interaction type (e.g. a cheque tap) from accidentally resolving a
 * task of a different kind that happens to share an id.
 */
export function handleIdSubmission(
  context: GameContext,
  submittedId: string,
  allowedKinds: TaskKind[],
): GameContext {
  const taskId = context.viewedTaskId;
  const task = getTask(taskId);
  const progress = context.tasks[taskId];
  if (!task || !progress || !isInteractiveTask(task)) return context;
  if (!allowedKinds.includes(task.kind)) return context;
  if (progress.status === 'completed' || progress.status === 'locked') return context;
  if (!task.optionIds.includes(submittedId)) return context;

  const started = ensureInProgress(context, taskId);
  return task.kind === 'scanAll'
    ? applyScanAll(started, taskId, submittedId)
    : applyAnyMatch(started, taskId, submittedId);
}

export function handlePasskeySubmission(context: GameContext, code: string): GameContext {
  const taskId = context.viewedTaskId;
  const task = getTask(taskId);
  const progress = context.tasks[taskId];
  if (!task || !progress || task.kind !== 'passkey') return context;
  if (progress.status === 'completed' || progress.status === 'locked') return context;
  // Only what the keypad can enter counts as an attempt. Anything else is dropped here, so no
  // other text can ever be recorded as a "code" (CLAUDE.md rule 5).
  if (!isPasskeyAttempt(code)) return context;

  const started = ensureInProgress(context, taskId);
  if (code === derivePasskey()) {
    // The winning code itself is never stored.
    const cleared = updateTaskProgress(started, taskId, { lastSubmission: null });
    return completeTask(cleared, taskId, task.successText);
  }

  // Each wrong code earns a stronger hint, worked out from that code — never the passkey.
  const attempts = (started.tasks[taskId]?.attempts ?? progress.attempts) + 1;
  return updateTaskProgress(started, taskId, {
    attempts,
    lastSubmission: code,
    lastFeedback: getPasskeyHint(attempts, code)?.text ?? null,
  });
}

export function getAttachedEvidence(context: GameContext): Set<string> {
  const attached = new Set<string>();
  for (const task of tasks) {
    if (task.kind !== 'scanAll') continue;
    const progress = context.tasks[task.id];
    if (!progress) continue;
    for (const id of progress.scannedIds) attached.add(id);
  }
  return attached;
}

export function handleReportSubmission(context: GameContext): GameContext {
  const taskId = context.viewedTaskId;
  const task = getTask(taskId);
  const progress = context.tasks[taskId];
  if (!task || !progress || task.kind !== 'report') return context;
  if (progress.status === 'completed' || progress.status === 'locked') return context;

  const started = ensureInProgress(context, taskId);
  const attached = getAttachedEvidence(started);
  const missing = task.requiredEvidenceIds.filter((id) => !attached.has(id));

  if (missing.length === 0) {
    return { ...completeTask(started, taskId, task.successText), reportSubmitted: true };
  }

  const attempts = (started.tasks[taskId]?.attempts ?? progress.attempts) + 1;
  return updateTaskProgress(started, taskId, {
    attempts,
    lastFeedback: 'Check that both pieces of evidence are attached before submitting.',
  });
}
