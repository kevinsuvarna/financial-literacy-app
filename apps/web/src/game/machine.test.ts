import { createActor, type Actor } from 'xstate';
import { describe, expect, it } from 'vitest';
import { gameMachine } from './machine';
import {
  getAttempts,
  getCurrentHint,
  getLastFeedback,
  getLevelStatus,
  getTaskStatus,
} from './selectors';

type GameActor = Actor<typeof gameMachine>;

function createGame(): GameActor {
  return createActor(gameMachine).start();
}

/** Walks a fresh, started actor through Level 1 and Level 2 with only correct inputs, leaving
 * it with l3-t1-spot-the-phish as the viewed task. Shared by tests that only care about Level 3. */
function fastForwardToLevel3(actor: GameActor): void {
  actor.send({ type: 'START' });

  actor.send({ type: 'ARTEFACT_SCANNED', id: 'account-savings' });
  actor.send({ type: 'GOTO_TASK', taskId: 'l1-t2-verify-identity' });
  actor.send({ type: 'ARTEFACT_SCANNED', id: 'id-pan-card' });
  actor.send({ type: 'ARTEFACT_SCANNED', id: 'id-aadhaar-card' });
  actor.send({ type: 'GOTO_TASK', taskId: 'l1-t3-withdrawal-slip' });
  actor.send({ type: 'ARTEFACT_SCANNED', id: 'slip-withdrawal' });

  actor.send({ type: 'GOTO_TASK', taskId: 'l2-t1-closing-balance' });
  actor.send({ type: 'ARTEFACT_SCANNED', id: 'balance-answer-7501' });
  actor.send({ type: 'GOTO_TASK', taskId: 'l2-t2-returned-cheque' });
  actor.send({ type: 'TAP_ZONE', id: 'amount-figures' });
  actor.send({ type: 'GOTO_TASK', taskId: 'l2-t3-suspicious-transaction' });
  actor.send({ type: 'HIGHLIGHT_ROW', id: 'txn-05' });

  actor.send({ type: 'GOTO_TASK', taskId: 'l3-t1-spot-the-phish' });
}

describe('initial status model', () => {
  it('starts the first task available and everything else locked', () => {
    const actor = createGame();
    const { context } = actor.getSnapshot();

    expect(getTaskStatus(context, 'l1-t1-account-type')).toBe('available');
    expect(getTaskStatus(context, 'l1-t2-verify-identity')).toBe('locked');
    expect(getTaskStatus(context, 'l3-t5-review-submit')).toBe('locked');

    expect(getLevelStatus(context, 'understand-the-account')).toBe('available');
    expect(getLevelStatus(context, 'follow-the-money')).toBe('locked');
    expect(getLevelStatus(context, 'secure-and-report')).toBe('locked');

    expect(actor.getSnapshot().value).toBe('notStarted');
  });
});

describe('START', () => {
  it('enters inGame and puts the first task in progress', () => {
    const actor = createGame();
    actor.send({ type: 'START' });

    const snapshot = actor.getSnapshot();
    expect(snapshot.value).toBe('inGame');
    expect(getTaskStatus(snapshot.context, 'l1-t1-account-type')).toBe('inProgress');
  });
});

describe('scanOne task (l1-t1-account-type)', () => {
  it('records a wrong scan with feedback but keeps the task in progress', () => {
    const actor = createGame();
    actor.send({ type: 'START' });
    actor.send({ type: 'ARTEFACT_SCANNED', id: 'account-current' });

    const { context } = actor.getSnapshot();
    expect(getTaskStatus(context, 'l1-t1-account-type')).toBe('inProgress');
    expect(getAttempts(context, 'l1-t1-account-type')).toBe(1);
    expect(getLastFeedback(context, 'l1-t1-account-type')).toMatch(/current account/i);
  });

  it('completes on the correct scan and unlocks the next task', () => {
    const actor = createGame();
    actor.send({ type: 'START' });
    actor.send({ type: 'ARTEFACT_SCANNED', id: 'account-savings' });

    const { context } = actor.getSnapshot();
    expect(getTaskStatus(context, 'l1-t1-account-type')).toBe('completed');
    expect(getTaskStatus(context, 'l1-t2-verify-identity')).toBe('available');
  });
});

describe('event-kind and unknown-id guards', () => {
  it('ignores an event meant for a different interaction kind', () => {
    const actor = createGame();
    actor.send({ type: 'START' });
    actor.send({ type: 'TAP_ZONE', id: 'account-savings' });

    const { context } = actor.getSnapshot();
    expect(getTaskStatus(context, 'l1-t1-account-type')).toBe('inProgress');
    expect(getAttempts(context, 'l1-t1-account-type')).toBe(0);
  });

  it('ignores an id that is not one of the task options', () => {
    const actor = createGame();
    actor.send({ type: 'START' });
    actor.send({ type: 'ARTEFACT_SCANNED', id: 'not-a-real-artefact' });

    const { context } = actor.getSnapshot();
    expect(getTaskStatus(context, 'l1-t1-account-type')).toBe('inProgress');
    expect(getAttempts(context, 'l1-t1-account-type')).toBe(0);
  });
});

describe('scanAll task (l1-t2-verify-identity)', () => {
  function toTask2(): GameActor {
    const actor = createGame();
    actor.send({ type: 'START' });
    actor.send({ type: 'ARTEFACT_SCANNED', id: 'account-savings' });
    actor.send({ type: 'GOTO_TASK', taskId: 'l1-t2-verify-identity' });
    return actor;
  }

  it('stays incomplete until both required ids are seen, in either order', () => {
    const actor = toTask2();
    actor.send({ type: 'ARTEFACT_SCANNED', id: 'id-aadhaar-card' });

    let context = actor.getSnapshot().context;
    expect(getTaskStatus(context, 'l1-t2-verify-identity')).toBe('inProgress');
    expect(context.tasks['l1-t2-verify-identity']?.scannedIds).toEqual(['id-aadhaar-card']);

    actor.send({ type: 'ARTEFACT_SCANNED', id: 'id-pan-card' });
    context = actor.getSnapshot().context;
    expect(getTaskStatus(context, 'l1-t2-verify-identity')).toBe('completed');
    expect(getTaskStatus(context, 'l1-t3-withdrawal-slip')).toBe('available');
  });

  it('treats a repeat scan of an already-verified id as a no-op, not a new attempt', () => {
    const actor = toTask2();
    actor.send({ type: 'ARTEFACT_SCANNED', id: 'id-pan-card' });
    actor.send({ type: 'ARTEFACT_SCANNED', id: 'id-pan-card' });

    const { context } = actor.getSnapshot();
    expect(context.tasks['l1-t2-verify-identity']?.scannedIds).toEqual(['id-pan-card']);
    expect(getAttempts(context, 'l1-t2-verify-identity')).toBe(0);
    expect(getLastFeedback(context, 'l1-t2-verify-identity')).toMatch(/already verified/i);
  });

  it('records wrong documents as attempts without affecting scannedIds', () => {
    const actor = toTask2();
    actor.send({ type: 'ARTEFACT_SCANNED', id: 'id-expired-passport' });

    const { context } = actor.getSnapshot();
    expect(getAttempts(context, 'l1-t2-verify-identity')).toBe(1);
    expect(context.tasks['l1-t2-verify-identity']?.scannedIds).toEqual([]);
    expect(getTaskStatus(context, 'l1-t2-verify-identity')).toBe('inProgress');
  });
});

describe('locked tasks are unreachable', () => {
  it('ignores GOTO_TASK to a locked task', () => {
    const actor = createGame();
    actor.send({ type: 'START' });
    actor.send({ type: 'GOTO_TASK', taskId: 'l2-t1-closing-balance' });

    const { context } = actor.getSnapshot();
    expect(context.viewedTaskId).toBe('l1-t1-account-type');
    expect(getTaskStatus(context, 'l2-t1-closing-balance')).toBe('locked');
  });
});

describe('review mode', () => {
  it('lets you view a completed task without mutating its progress', () => {
    const actor = createGame();
    actor.send({ type: 'START' });
    actor.send({ type: 'ARTEFACT_SCANNED', id: 'account-savings' });
    actor.send({ type: 'GOTO_TASK', taskId: 'l1-t2-verify-identity' });

    actor.send({ type: 'GOTO_TASK', taskId: 'l1-t1-account-type' });
    expect(actor.getSnapshot().context.viewedTaskId).toBe('l1-t1-account-type');

    // Any interaction while reviewing a completed task must be a no-op.
    actor.send({ type: 'ARTEFACT_SCANNED', id: 'account-current' });

    const { context } = actor.getSnapshot();
    expect(getTaskStatus(context, 'l1-t1-account-type')).toBe('completed');
    expect(getAttempts(context, 'l1-t1-account-type')).toBe(0);
    expect(getLastFeedback(context, 'l1-t1-account-type')).toMatch(/savings account/i);
  });
});

describe('tap task (l2-t2-returned-cheque)', () => {
  function toCheque(): GameActor {
    const actor = createGame();
    actor.send({ type: 'START' });
    actor.send({ type: 'ARTEFACT_SCANNED', id: 'account-savings' });
    actor.send({ type: 'GOTO_TASK', taskId: 'l1-t2-verify-identity' });
    actor.send({ type: 'ARTEFACT_SCANNED', id: 'id-pan-card' });
    actor.send({ type: 'ARTEFACT_SCANNED', id: 'id-aadhaar-card' });
    actor.send({ type: 'GOTO_TASK', taskId: 'l1-t3-withdrawal-slip' });
    actor.send({ type: 'ARTEFACT_SCANNED', id: 'slip-withdrawal' });
    actor.send({ type: 'GOTO_TASK', taskId: 'l2-t1-closing-balance' });
    actor.send({ type: 'ARTEFACT_SCANNED', id: 'balance-answer-7501' });
    actor.send({ type: 'GOTO_TASK', taskId: 'l2-t2-returned-cheque' });
    return actor;
  }

  it('gives generic feedback for a correct-looking but irrelevant zone', () => {
    const actor = toCheque();
    actor.send({ type: 'TAP_ZONE', id: 'signature' });

    const { context } = actor.getSnapshot();
    expect(getTaskStatus(context, 'l2-t2-returned-cheque')).toBe('inProgress');
    expect(getAttempts(context, 'l2-t2-returned-cheque')).toBe(1);
    expect(getLastFeedback(context, 'l2-t2-returned-cheque')).toMatch(/looks correct/i);
  });

  it('completes when either half of the mismatched amount is tapped', () => {
    const actor = toCheque();
    actor.send({ type: 'TAP_ZONE', id: 'amount-words' });

    const { context } = actor.getSnapshot();
    expect(getTaskStatus(context, 'l2-t2-returned-cheque')).toBe('completed');
    expect(getTaskStatus(context, 'l2-t3-suspicious-transaction')).toBe('available');
  });
});

describe('highlight task (l2-t3-suspicious-transaction)', () => {
  function toSuspiciousTransaction(): GameActor {
    const actor = createGame();
    actor.send({ type: 'START' });
    actor.send({ type: 'ARTEFACT_SCANNED', id: 'account-savings' });
    actor.send({ type: 'GOTO_TASK', taskId: 'l1-t2-verify-identity' });
    actor.send({ type: 'ARTEFACT_SCANNED', id: 'id-pan-card' });
    actor.send({ type: 'ARTEFACT_SCANNED', id: 'id-aadhaar-card' });
    actor.send({ type: 'GOTO_TASK', taskId: 'l1-t3-withdrawal-slip' });
    actor.send({ type: 'ARTEFACT_SCANNED', id: 'slip-withdrawal' });
    actor.send({ type: 'GOTO_TASK', taskId: 'l2-t1-closing-balance' });
    actor.send({ type: 'ARTEFACT_SCANNED', id: 'balance-answer-7501' });
    actor.send({ type: 'GOTO_TASK', taskId: 'l2-t2-returned-cheque' });
    actor.send({ type: 'TAP_ZONE', id: 'amount-figures' });
    actor.send({ type: 'GOTO_TASK', taskId: 'l2-t3-suspicious-transaction' });
    return actor;
  }

  it('gives feedback for an ordinary transaction without completing the task', () => {
    const actor = toSuspiciousTransaction();
    actor.send({ type: 'HIGHLIGHT_ROW', id: 'txn-01' });

    const { context } = actor.getSnapshot();
    expect(getTaskStatus(context, 'l2-t3-suspicious-transaction')).toBe('inProgress');
    expect(getAttempts(context, 'l2-t3-suspicious-transaction')).toBe(1);
    expect(getLastFeedback(context, 'l2-t3-suspicious-transaction')).toMatch(/pocket money/i);
  });

  it('only completes on the ₹5,999 CAMS TEL transaction', () => {
    const actor = toSuspiciousTransaction();
    actor.send({ type: 'HIGHLIGHT_ROW', id: 'txn-05' });

    const { context } = actor.getSnapshot();
    expect(getTaskStatus(context, 'l2-t3-suspicious-transaction')).toBe('completed');
    expect(getTaskStatus(context, 'l3-t1-spot-the-phish')).toBe('available');
  });
});

describe('choice task with two ways forward (l3-t1-spot-the-phish)', () => {
  it('completes on NO with the praise and official-channels advice', () => {
    const actor = createGame();
    fastForwardToLevel3(actor);
    actor.send({ type: 'CHOOSE', id: 'no-dont-click' });

    const { context } = actor.getSnapshot();
    expect(getTaskStatus(context, 'l3-t1-spot-the-phish')).toBe('completed');
    expect(context.tasks['l3-t1-spot-the-phish']?.scannedIds).toEqual(['no-dont-click']);
    expect(getLastFeedback(context, 'l3-t1-spot-the-phish')).toMatch(/Good instinct/);
    expect(getLastFeedback(context, 'l3-t1-spot-the-phish')).toMatch(/official channels/);
    expect(getTaskStatus(context, 'l3-t2-uncover-the-scam')).toBe('available');
  });

  it('also completes on YES — with the debrief, and not counted as a wrong attempt', () => {
    const actor = createGame();
    fastForwardToLevel3(actor);
    actor.send({ type: 'CHOOSE', id: 'yes-click' });

    const { context } = actor.getSnapshot();
    expect(getTaskStatus(context, 'l3-t1-spot-the-phish')).toBe('completed');
    expect(getAttempts(context, 'l3-t1-spot-the-phish')).toBe(0);
    expect(context.tasks['l3-t1-spot-the-phish']?.scannedIds).toEqual(['yes-click']);
    // SPEC §6: the loss comes from entering details, not from the click itself.
    expect(getLastFeedback(context, 'l3-t1-spot-the-phish')).toMatch(
      /Tapping the link did not take any money/,
    );
    expect(getLastFeedback(context, 'l3-t1-spot-the-phish')).not.toMatch(/Good instinct/);
    expect(getTaskStatus(context, 'l3-t2-uncover-the-scam')).toBe('available');
  });

  it('keeps the first answer: a solved choice cannot be changed', () => {
    const actor = createGame();
    fastForwardToLevel3(actor);
    actor.send({ type: 'CHOOSE', id: 'yes-click' });
    actor.send({ type: 'CHOOSE', id: 'no-dont-click' });

    const { context } = actor.getSnapshot();
    expect(context.tasks['l3-t1-spot-the-phish']?.scannedIds).toEqual(['yes-click']);
  });
});

describe('corkboard choice (l3-t2-uncover-the-scam)', () => {
  function toCorkboard(): GameActor {
    const actor = createGame();
    fastForwardToLevel3(actor);
    actor.send({ type: 'CHOOSE', id: 'no-dont-click' });
    actor.send({ type: 'GOTO_TASK', taskId: 'l3-t2-uncover-the-scam' });
    return actor;
  }

  it('is not solved just by being opened', () => {
    const { context } = toCorkboard().getSnapshot();

    expect(getTaskStatus(context, 'l3-t2-uncover-the-scam')).toBe('inProgress');
    expect(getTaskStatus(context, 'l3-t3-evidence-passkey')).toBe('locked');
  });

  it('explains a wrong connection and stays open', () => {
    const actor = toCorkboard();
    actor.send({ type: 'CHOOSE', id: 'cheque-payee' });

    const { context } = actor.getSnapshot();
    expect(getTaskStatus(context, 'l3-t2-uncover-the-scam')).toBe('inProgress');
    expect(getAttempts(context, 'l3-t2-uncover-the-scam')).toBe(1);
    expect(getLastFeedback(context, 'l3-t2-uncover-the-scam')).toMatch(/different name/);
  });

  it('completes when the string is tied to the message’s sender', () => {
    const actor = toCorkboard();
    actor.send({ type: 'CHOOSE', id: 'message-sender' });

    const { context } = actor.getSnapshot();
    expect(getTaskStatus(context, 'l3-t2-uncover-the-scam')).toBe('completed');
    expect(getLastFeedback(context, 'l3-t2-uncover-the-scam')).toMatch(/suspected scam operation/);
    expect(getTaskStatus(context, 'l3-t3-evidence-passkey')).toBe('available');
  });
});

describe('passkey task (l3-t3-evidence-passkey)', () => {
  function toPasskey(): GameActor {
    const actor = createGame();
    fastForwardToLevel3(actor);
    actor.send({ type: 'CHOOSE', id: 'no-dont-click' });
    actor.send({ type: 'GOTO_TASK', taskId: 'l3-t2-uncover-the-scam' });
    actor.send({ type: 'CHOOSE', id: 'message-sender' });
    actor.send({ type: 'GOTO_TASK', taskId: 'l3-t3-evidence-passkey' });
    return actor;
  }

  it('escalates through hints on repeated wrong attempts, clamped to the last hint', () => {
    const actor = toPasskey();

    actor.send({ type: 'SUBMIT_PASSKEY', code: '000' });
    expect(getAttempts(actor.getSnapshot().context, 'l3-t3-evidence-passkey')).toBe(1);
    expect(getCurrentHint(actor.getSnapshot().context, 'l3-t3-evidence-passkey')).toMatch(
      /closing balance/i,
    );

    actor.send({ type: 'SUBMIT_PASSKEY', code: '111' });
    expect(getCurrentHint(actor.getSnapshot().context, 'l3-t3-evidence-passkey')).toMatch(
      /cheque/i,
    );

    actor.send({ type: 'SUBMIT_PASSKEY', code: '222' });
    expect(getCurrentHint(actor.getSnapshot().context, 'l3-t3-evidence-passkey')).toMatch(
      /suspicious transaction/i,
    );

    const thirdHint = getCurrentHint(actor.getSnapshot().context, 'l3-t3-evidence-passkey');
    actor.send({ type: 'SUBMIT_PASSKEY', code: '333' });
    expect(getAttempts(actor.getSnapshot().context, 'l3-t3-evidence-passkey')).toBe(4);
    expect(getCurrentHint(actor.getSnapshot().context, 'l3-t3-evidence-passkey')).toBe(thirdHint);
  });

  it('completes on the derived passkey', () => {
    const actor = toPasskey();
    actor.send({ type: 'SUBMIT_PASSKEY', code: '109' });

    const { context } = actor.getSnapshot();
    expect(getTaskStatus(context, 'l3-t3-evidence-passkey')).toBe('completed');
    expect(getTaskStatus(context, 'l3-t4-scan-evidence')).toBe('available');
  });
});

describe('scanAll evidence task (l3-t4-scan-evidence)', () => {
  function toEvidence(): GameActor {
    const actor = createGame();
    fastForwardToLevel3(actor);
    actor.send({ type: 'CHOOSE', id: 'no-dont-click' });
    actor.send({ type: 'GOTO_TASK', taskId: 'l3-t2-uncover-the-scam' });
    actor.send({ type: 'CHOOSE', id: 'message-sender' });
    actor.send({ type: 'GOTO_TASK', taskId: 'l3-t3-evidence-passkey' });
    actor.send({ type: 'SUBMIT_PASSKEY', code: '109' });
    actor.send({ type: 'GOTO_TASK', taskId: 'l3-t4-scan-evidence' });
    return actor;
  }

  it('offers the cheque as a present-but-wrong option with explanatory feedback', () => {
    const actor = toEvidence();
    actor.send({ type: 'ARTEFACT_SCANNED', id: 'cheque' });

    const { context } = actor.getSnapshot();
    expect(getAttempts(context, 'l3-t4-scan-evidence')).toBe(1);
    expect(getLastFeedback(context, 'l3-t4-scan-evidence')).toMatch(/already been explained/i);
    expect(getTaskStatus(context, 'l3-t4-scan-evidence')).toBe('inProgress');
  });

  it('only completes once both pieces of evidence are scanned', () => {
    const actor = toEvidence();
    actor.send({ type: 'ARTEFACT_SCANNED', id: 'bank-statement' });
    expect(getTaskStatus(actor.getSnapshot().context, 'l3-t4-scan-evidence')).toBe('inProgress');

    actor.send({ type: 'ARTEFACT_SCANNED', id: 'phishing-message' });
    const { context } = actor.getSnapshot();
    expect(getTaskStatus(context, 'l3-t4-scan-evidence')).toBe('completed');
    expect(getTaskStatus(context, 'l3-t5-review-submit')).toBe('available');
  });
});

describe('report submission and mission complete', () => {
  function toReport(): GameActor {
    const actor = createGame();
    fastForwardToLevel3(actor);
    actor.send({ type: 'CHOOSE', id: 'no-dont-click' });
    actor.send({ type: 'GOTO_TASK', taskId: 'l3-t2-uncover-the-scam' });
    actor.send({ type: 'CHOOSE', id: 'message-sender' });
    actor.send({ type: 'GOTO_TASK', taskId: 'l3-t3-evidence-passkey' });
    actor.send({ type: 'SUBMIT_PASSKEY', code: '109' });
    actor.send({ type: 'GOTO_TASK', taskId: 'l3-t4-scan-evidence' });
    actor.send({ type: 'ARTEFACT_SCANNED', id: 'bank-statement' });
    actor.send({ type: 'ARTEFACT_SCANNED', id: 'phishing-message' });
    actor.send({ type: 'GOTO_TASK', taskId: 'l3-t5-review-submit' });
    return actor;
  }

  it('submits the report and reaches missionComplete', () => {
    const actor = toReport();
    actor.send({ type: 'SUBMIT_REPORT' });

    const snapshot = actor.getSnapshot();
    expect(snapshot.value).toBe('missionComplete');
    expect(snapshot.context.reportSubmitted).toBe(true);
    expect(getTaskStatus(snapshot.context, 'l3-t5-review-submit')).toBe('completed');
  });

  it('still allows review navigation after mission complete', () => {
    const actor = toReport();
    actor.send({ type: 'SUBMIT_REPORT' });
    actor.send({ type: 'GOTO_TASK', taskId: 'l1-t1-account-type' });

    const snapshot = actor.getSnapshot();
    expect(snapshot.value).toBe('missionComplete');
    expect(snapshot.context.viewedTaskId).toBe('l1-t1-account-type');
    expect(getTaskStatus(snapshot.context, 'l1-t1-account-type')).toBe('completed');
  });
});

describe('RESET', () => {
  it('returns to a fresh notStarted game from anywhere', () => {
    const actor = createGame();
    actor.send({ type: 'START' });
    actor.send({ type: 'ARTEFACT_SCANNED', id: 'account-savings' });
    actor.send({ type: 'RESET' });

    const snapshot = actor.getSnapshot();
    expect(snapshot.value).toBe('notStarted');
    expect(snapshot.context.viewedTaskId).toBe('l1-t1-account-type');
    expect(getTaskStatus(snapshot.context, 'l1-t1-account-type')).toBe('available');
    expect(getTaskStatus(snapshot.context, 'l1-t2-verify-identity')).toBe('locked');
  });
});

describe('full happy path', () => {
  it('walks every task to missionComplete using only correct inputs', () => {
    const actor = createGame();

    actor.send({ type: 'START' });
    actor.send({ type: 'ARTEFACT_SCANNED', id: 'account-savings' });

    actor.send({ type: 'GOTO_TASK', taskId: 'l1-t2-verify-identity' });
    actor.send({ type: 'ARTEFACT_SCANNED', id: 'id-aadhaar-card' });
    actor.send({ type: 'ARTEFACT_SCANNED', id: 'id-pan-card' });

    actor.send({ type: 'GOTO_TASK', taskId: 'l1-t3-withdrawal-slip' });
    actor.send({ type: 'ARTEFACT_SCANNED', id: 'slip-withdrawal' });

    actor.send({ type: 'GOTO_TASK', taskId: 'l2-t1-closing-balance' });
    actor.send({ type: 'ARTEFACT_SCANNED', id: 'balance-answer-7501' });

    actor.send({ type: 'GOTO_TASK', taskId: 'l2-t2-returned-cheque' });
    actor.send({ type: 'TAP_ZONE', id: 'amount-figures' });

    actor.send({ type: 'GOTO_TASK', taskId: 'l2-t3-suspicious-transaction' });
    actor.send({ type: 'HIGHLIGHT_ROW', id: 'txn-05' });

    actor.send({ type: 'GOTO_TASK', taskId: 'l3-t1-spot-the-phish' });
    actor.send({ type: 'CHOOSE', id: 'no-dont-click' });

    actor.send({ type: 'GOTO_TASK', taskId: 'l3-t2-uncover-the-scam' });
    actor.send({ type: 'CHOOSE', id: 'message-sender' });

    actor.send({ type: 'GOTO_TASK', taskId: 'l3-t3-evidence-passkey' });
    actor.send({ type: 'SUBMIT_PASSKEY', code: '109' });

    actor.send({ type: 'GOTO_TASK', taskId: 'l3-t4-scan-evidence' });
    actor.send({ type: 'ARTEFACT_SCANNED', id: 'bank-statement' });
    actor.send({ type: 'ARTEFACT_SCANNED', id: 'phishing-message' });

    actor.send({ type: 'GOTO_TASK', taskId: 'l3-t5-review-submit' });
    actor.send({ type: 'SUBMIT_REPORT' });

    const snapshot = actor.getSnapshot();
    expect(snapshot.value).toBe('missionComplete');
    expect(snapshot.context.reportSubmitted).toBe(true);

    const allTaskIds = [
      'l1-t1-account-type',
      'l1-t2-verify-identity',
      'l1-t3-withdrawal-slip',
      'l2-t1-closing-balance',
      'l2-t2-returned-cheque',
      'l2-t3-suspicious-transaction',
      'l3-t1-spot-the-phish',
      'l3-t2-uncover-the-scam',
      'l3-t3-evidence-passkey',
      'l3-t4-scan-evidence',
      'l3-t5-review-submit',
    ];
    for (const id of allTaskIds) {
      expect(getTaskStatus(snapshot.context, id)).toBe('completed');
    }
    expect(getLevelStatus(snapshot.context, 'understand-the-account')).toBe('completed');
    expect(getLevelStatus(snapshot.context, 'follow-the-money')).toBe('completed');
    expect(getLevelStatus(snapshot.context, 'secure-and-report')).toBe('completed');
  });
});
