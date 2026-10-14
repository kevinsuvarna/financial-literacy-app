import { createActor } from 'xstate';
import { describe, expect, it } from 'vitest';
import { contentIdSchema, gameEventSchema } from '@app/api-contract';
import { artefactIds, derivePasskey, isInteractiveTask, tasks } from '@app/content';
import { gameMachine } from './machine';
import { jumpEvents } from './solve';
import { telemetryFor } from './telemetry';
import type { GameEvent } from './types';

/** Opens `taskId` with everything before it solved, then reports what `event` is recorded as. */
function recordedAt(taskId: string, event: GameEvent, before: GameEvent[] = []) {
  const actor = createActor(gameMachine).start();
  const { value, context } = actor.getSnapshot();
  for (const step of jumpEvents(String(value), context, taskId)) actor.send(step);
  for (const step of before) actor.send(step);

  const was = actor.getSnapshot().context;
  actor.send(event);
  return telemetryFor(event, was, actor.getSnapshot().context);
}

const scan = (id: string): GameEvent => ({ type: 'ARTEFACT_SCANNED', id });

describe('telemetryFor', () => {
  it('records a wrong scan and a right one, with the card that was scanned', () => {
    expect(recordedAt('l1-t1-account-type', scan('account-current'))).toEqual({
      taskId: 'l1-t1-account-type',
      kind: 'scan',
      artefactId: 'account-current',
      correct: false,
    });
    expect(recordedAt('l1-t1-account-type', scan('account-savings'))).toEqual({
      taskId: 'l1-t1-account-type',
      kind: 'scan',
      artefactId: 'account-savings',
      correct: true,
    });
  });

  it('records each of several required cards as correct, not only the last', () => {
    const first = recordedAt('l1-t2-verify-identity', scan('id-pan-card'));
    const second = recordedAt('l1-t2-verify-identity', scan('id-aadhaar-card'), [
      scan('id-pan-card'),
    ]);

    expect(first?.correct).toBe(true);
    expect(second?.correct).toBe(true);
  });

  it('records nothing for a scan that changed nothing', () => {
    // The same card twice; a card that isn't one of this task's; a task already solved.
    expect(
      recordedAt('l1-t2-verify-identity', scan('id-pan-card'), [scan('id-pan-card')]),
    ).toBeNull();
    expect(recordedAt('l1-t1-account-type', scan('slip-deposit'))).toBeNull();
    expect(
      recordedAt('l1-t1-account-type', scan('account-current'), [scan('account-savings')]),
    ).toBeNull();
  });

  it('records taps, highlights and choices by what they are', () => {
    expect(recordedAt('l2-t2-returned-cheque', { type: 'TAP_ZONE', id: 'date' })).toMatchObject({
      kind: 'tap',
      artefactId: 'date',
      correct: false,
    });
    expect(
      recordedAt('l2-t3-suspicious-transaction', { type: 'HIGHLIGHT_ROW', id: 'txn-05' }),
    ).toMatchObject({ kind: 'highlight', artefactId: 'txn-05', correct: true });
    expect(
      recordedAt('l3-t2-uncover-the-scam', { type: 'CHOOSE', id: 'cheque-payee' }),
    ).toMatchObject({ kind: 'choice', artefactId: 'cheque-payee', correct: false });
  });

  it('records clicking the phishing link as the wrong call, though the story moves on', () => {
    expect(recordedAt('l3-t1-spot-the-phish', { type: 'CHOOSE', id: 'yes-click' })).toMatchObject({
      kind: 'choice',
      artefactId: 'yes-click',
      correct: false,
    });
    expect(
      recordedAt('l3-t1-spot-the-phish', { type: 'CHOOSE', id: 'no-dont-click' }),
    ).toMatchObject({ kind: 'choice', artefactId: 'no-dont-click', correct: true });
  });

  it('records that a passkey was tried and whether it was right — never the digits', () => {
    const wrong = recordedAt('l3-t3-evidence-passkey', { type: 'SUBMIT_PASSKEY', code: '472' });
    const right = recordedAt('l3-t3-evidence-passkey', {
      type: 'SUBMIT_PASSKEY',
      code: derivePasskey(),
    });

    expect(wrong).toEqual({
      taskId: 'l3-t3-evidence-passkey',
      kind: 'passkey',
      artefactId: null,
      correct: false,
    });
    expect(right?.correct).toBe(true);
    expect(JSON.stringify(wrong)).not.toContain('472');
    expect(JSON.stringify(right)).not.toContain(derivePasskey());
  });

  it('records nothing for something typed that the keypad could not have entered', () => {
    expect(
      recordedAt('l3-t3-evidence-passkey', { type: 'SUBMIT_PASSKEY', code: 'my real password' }),
    ).toBeNull();
  });

  it('records the report going in', () => {
    expect(recordedAt('l3-t5-review-submit', { type: 'SUBMIT_REPORT' })).toEqual({
      taskId: 'l3-t5-review-submit',
      kind: 'report',
      artefactId: null,
      correct: true,
    });
  });

  it('records nothing for moving around, starting or resetting', () => {
    const actor = createActor(gameMachine).start();
    const quiet: GameEvent[] = [
      { type: 'START' },
      { type: 'GOTO_TASK', taskId: 'l1-t1-account-type' },
      { type: 'RESET' },
    ];

    for (const event of quiet) {
      const before = actor.getSnapshot().context;
      actor.send(event);
      expect(telemetryFor(event, before, actor.getSnapshot().context), event.type).toBeNull();
    }
  });

  it('only ever produces events the API will accept', () => {
    const samples = [
      recordedAt('l1-t1-account-type', scan('account-current')),
      recordedAt('l2-t2-returned-cheque', { type: 'TAP_ZONE', id: 'amount-figures' }),
      recordedAt('l3-t3-evidence-passkey', { type: 'SUBMIT_PASSKEY', code: '000' }),
      recordedAt('l3-t5-review-submit', { type: 'SUBMIT_REPORT' }),
    ];

    for (const sample of samples) {
      const event = { ...sample, id: '00000000-0000-4000-8000-000000000001', ts: 1 };
      expect(gameEventSchema.safeParse(event).success, JSON.stringify(sample)).toBe(true);
    }
  });
});

describe('content ids', () => {
  it('are all slugs the API accepts as ids — every task, option and artefact', () => {
    const ids = [
      ...tasks.map((task) => task.id),
      ...tasks.flatMap((task) => (isInteractiveTask(task) ? task.optionIds : [])),
      ...artefactIds,
    ];

    expect(ids.length).toBeGreaterThan(30);
    for (const id of ids) expect(contentIdSchema.safeParse(id).success, id).toBe(true);
  });
});
