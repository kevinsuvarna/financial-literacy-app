import { createActor } from 'xstate';
import { describe, expect, it } from 'vitest';
import { tasks } from '@app/content';
import { gameMachine } from './machine';
import { getTaskStatus, orderedTaskIds } from './selectors';
import { jumpEvents, solutionEvents } from './solve';

function jumpFromFresh(targetTaskId: string) {
  const actor = createActor(gameMachine).start();
  const { value, context } = actor.getSnapshot();
  for (const event of jumpEvents(String(value), context, targetTaskId)) actor.send(event);
  return actor.getSnapshot();
}

describe('jumpEvents', () => {
  it.each(orderedTaskIds)('reaches %s from a fresh game with everything before it solved', (id) => {
    const snapshot = jumpFromFresh(id);

    expect(snapshot.context.viewedTaskId).toBe(id);
    expect(getTaskStatus(snapshot.context, id)).not.toBe('locked');
    for (const earlierId of orderedTaskIds.slice(0, orderedTaskIds.indexOf(id))) {
      expect(getTaskStatus(snapshot.context, earlierId)).toBe('completed');
    }
  });

  it('skips tasks that are already solved', () => {
    const actor = createActor(gameMachine).start();
    actor.send({ type: 'START' });
    actor.send({ type: 'ARTEFACT_SCANNED', id: 'account-savings' });

    const { value, context } = actor.getSnapshot();
    const events = jumpEvents(String(value), context, 'l1-t3-withdrawal-slip');

    expect(events).not.toContainEqual({ type: 'START' });
    expect(events).not.toContainEqual({ type: 'GOTO_TASK', taskId: 'l1-t1-account-type' });
  });

  it('returns nothing for an unknown task', () => {
    const actor = createActor(gameMachine).start();
    const { value, context } = actor.getSnapshot();

    expect(jumpEvents(String(value), context, 'no-such-task')).toEqual([]);
  });
});

describe('solutionEvents', () => {
  it('solves the whole game when replayed task by task', () => {
    const actor = createActor(gameMachine).start();
    actor.send({ type: 'START' });
    for (const task of tasks) {
      actor.send({ type: 'GOTO_TASK', taskId: task.id });
      for (const event of solutionEvents(task)) actor.send(event);
    }

    expect(actor.getSnapshot().value).toBe('missionComplete');
  });
});
