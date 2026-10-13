import { createActor } from 'xstate';
import { describe, expect, it } from 'vitest';
import { gameMachine } from './machine';
import {
  getLevelEntryTaskId,
  getLevelStatus,
  getNextTaskId,
  getTaskPosition,
  orderedTaskIds,
} from './selectors';

function playing() {
  const actor = createActor(gameMachine).start();
  actor.send({ type: 'START' });
  return actor;
}

describe('getLevelStatus', () => {
  it('stays in progress between tasks, when one is solved and the next is not yet opened', () => {
    const actor = playing();
    actor.send({ type: 'ARTEFACT_SCANNED', id: 'account-savings' });

    const { context } = actor.getSnapshot();
    expect(context.tasks['l1-t2-verify-identity']?.status).toBe('available');
    expect(getLevelStatus(context, 'understand-the-account')).toBe('inProgress');
  });

  it('is available for a level that has been unlocked but not opened', () => {
    const actor = playing();
    actor.send({ type: 'ARTEFACT_SCANNED', id: 'account-savings' });
    actor.send({ type: 'GOTO_TASK', taskId: 'l1-t2-verify-identity' });
    actor.send({ type: 'ARTEFACT_SCANNED', id: 'id-pan-card' });
    actor.send({ type: 'ARTEFACT_SCANNED', id: 'id-aadhaar-card' });
    actor.send({ type: 'GOTO_TASK', taskId: 'l1-t3-withdrawal-slip' });
    actor.send({ type: 'ARTEFACT_SCANNED', id: 'slip-withdrawal' });

    const { context } = actor.getSnapshot();
    expect(getLevelStatus(context, 'understand-the-account')).toBe('completed');
    expect(getLevelStatus(context, 'follow-the-money')).toBe('available');
    expect(getLevelStatus(context, 'secure-and-report')).toBe('locked');
  });
});

describe('getLevelEntryTaskId', () => {
  it('points at the first unsolved task of a level in progress', () => {
    const actor = playing();
    actor.send({ type: 'ARTEFACT_SCANNED', id: 'account-savings' });

    expect(getLevelEntryTaskId(actor.getSnapshot().context, 'understand-the-account')).toBe(
      'l1-t2-verify-identity',
    );
  });

  it('points at the first task of a level with nothing left to solve', () => {
    const actor = playing();
    actor.send({ type: 'ARTEFACT_SCANNED', id: 'account-savings' });
    actor.send({ type: 'GOTO_TASK', taskId: 'l1-t2-verify-identity' });
    actor.send({ type: 'ARTEFACT_SCANNED', id: 'id-pan-card' });
    actor.send({ type: 'ARTEFACT_SCANNED', id: 'id-aadhaar-card' });
    actor.send({ type: 'GOTO_TASK', taskId: 'l1-t3-withdrawal-slip' });
    actor.send({ type: 'ARTEFACT_SCANNED', id: 'slip-withdrawal' });

    expect(getLevelEntryTaskId(actor.getSnapshot().context, 'understand-the-account')).toBe(
      'l1-t1-account-type',
    );
  });
});

describe('task ordering', () => {
  it('walks every task in play order and stops after the last', () => {
    expect(getNextTaskId('l1-t3-withdrawal-slip')).toBe('l2-t1-closing-balance');
    expect(getNextTaskId(orderedTaskIds.at(-1) ?? '')).toBeUndefined();
    expect(getNextTaskId('no-such-task')).toBeUndefined();
  });

  it('reports a task’s position within its level', () => {
    expect(getTaskPosition('l3-t4-scan-evidence')).toMatchObject({
      levelNumber: 3,
      taskNumber: 4,
      taskCount: 5,
    });
    expect(getTaskPosition('no-such-task')).toBeUndefined();
  });
});
