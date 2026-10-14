import { getTask, isRecommendedChoice } from '@app/content';
import type { EventKind, GameEvent as ApiGameEvent } from '@app/api-contract';
import type { GameContext, GameEvent } from './types';

/** What gets reported about one thing the player tried. The server adds nothing to it. */
export type Telemetry = Omit<ApiGameEvent, 'id' | 'ts'>;

const kinds: Partial<Record<GameEvent['type'], EventKind>> = {
  ARTEFACT_SCANNED: 'scan',
  TAP_ZONE: 'tap',
  HIGHLIGHT_ROW: 'highlight',
  CHOOSE: 'choice',
  SUBMIT_PASSKEY: 'passkey',
  SUBMIT_REPORT: 'report',
};

/**
 * Turns one game event into what is reported about it: which task, what kind of attempt, the
 * id of the thing tried, and whether the game accepted it — read off how the game's progress
 * changed, so this can never disagree with the rules.
 *
 * Returns null for anything that isn't an attempt (navigation, a reset) and for an attempt
 * that changed nothing (a card scanned twice, a tap on a task that is already solved).
 *
 * Only ids from packages/content can end up in here. In particular a passkey attempt reports
 * that it happened and whether it was right — never the digits that were entered.
 */
export function telemetryFor(
  event: GameEvent,
  before: GameContext,
  after: GameContext,
): Telemetry | null {
  const kind = kinds[event.type];
  if (!kind) return null;

  const taskId = before.viewedTaskId;
  const was = before.tasks[taskId];
  const is = after.tasks[taskId];
  if (!was || !is) return null;

  const refused = is.attempts > was.attempts;
  const solved = is.status === 'completed' && was.status !== 'completed';
  const advanced = solved || is.scannedIds.length > was.scannedIds.length;
  if (!refused && !advanced) return null;

  const artefactId = 'id' in event ? event.id : null;
  let correct = !refused;
  // A choice can move the story on without being the right call (clicking the phishing link).
  const task = getTask(taskId);
  if (correct && task?.kind === 'choice' && artefactId !== null) {
    correct = isRecommendedChoice(task, artefactId);
  }

  return { taskId, kind, artefactId, correct };
}
