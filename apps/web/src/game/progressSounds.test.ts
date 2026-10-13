import { createActor } from 'xstate';
import { describe, expect, it } from 'vitest';
import { gameMachine } from './machine';
import { progressSounds } from './progressSounds';
import type { GameEvent } from './types';

/** Plays `setup`, then reports the sounds caused by `event` alone. */
function soundsFor(setup: GameEvent[], event: GameEvent) {
  const actor = createActor(gameMachine).start();
  for (const step of setup) actor.send(step);
  const before = actor.getSnapshot().context;
  actor.send(event);
  return progressSounds(before, actor.getSnapshot().context);
}

const start: GameEvent = { type: 'START' };
const scan = (id: string): GameEvent => ({ type: 'ARTEFACT_SCANNED', id });
const goto = (taskId: string): GameEvent => ({ type: 'GOTO_TASK', taskId });

describe('progressSounds', () => {
  it('plays "correct" when a scan solves a task', () => {
    expect(soundsFor([start], scan('account-savings'))).toEqual(['correct']);
  });

  it('plays "wrong" for a wrong scan', () => {
    expect(soundsFor([start], scan('account-current'))).toEqual(['wrong']);
  });

  it('stays silent for the first of two required documents', () => {
    const setup = [start, scan('account-savings'), goto('l1-t2-verify-identity')];

    expect(soundsFor(setup, scan('id-pan-card'))).toEqual([]);
  });

  it('plays "correct" when the second required document completes the task', () => {
    const setup = [
      start,
      scan('account-savings'),
      goto('l1-t2-verify-identity'),
      scan('id-aadhaar-card'),
    ];

    expect(soundsFor(setup, scan('id-pan-card'))).toEqual(['correct']);
  });

  it('stays silent for a repeat scan of an already-verified document', () => {
    const setup = [
      start,
      scan('account-savings'),
      goto('l1-t2-verify-identity'),
      scan('id-pan-card'),
    ];

    expect(soundsFor(setup, scan('id-pan-card'))).toEqual([]);
  });

  it('stays silent for navigation, a card that is not an option, and a reset', () => {
    expect(soundsFor([], start)).toEqual([]);
    expect(soundsFor([start], scan('slip-deposit'))).toEqual([]);
    expect(soundsFor([start, scan('account-savings')], goto('l1-t2-verify-identity'))).toEqual([]);
    expect(soundsFor([start, scan('account-savings')], { type: 'RESET' })).toEqual([]);
  });

  it('stays silent when a narrative beat completes itself on view', () => {
    const actor = createActor(gameMachine).start();
    const setup: GameEvent[] = [
      start,
      scan('account-savings'),
      goto('l1-t2-verify-identity'),
      scan('id-pan-card'),
      scan('id-aadhaar-card'),
      goto('l1-t3-withdrawal-slip'),
      scan('slip-withdrawal'),
      goto('l2-t1-closing-balance'),
      scan('balance-answer-7501'),
      goto('l2-t2-returned-cheque'),
      { type: 'TAP_ZONE', id: 'amount-figures' },
      goto('l2-t3-suspicious-transaction'),
      { type: 'HIGHLIGHT_ROW', id: 'txn-05' },
      goto('l3-t1-spot-the-phish'),
      { type: 'CHOOSE', id: 'no-dont-click' },
    ];
    for (const step of setup) actor.send(step);
    const before = actor.getSnapshot().context;

    actor.send(goto('l3-t2-uncover-the-scam'));
    const after = actor.getSnapshot().context;

    expect(after.tasks['l3-t2-uncover-the-scam']?.status).toBe('completed');
    expect(progressSounds(before, after)).toEqual([]);
  });
});
