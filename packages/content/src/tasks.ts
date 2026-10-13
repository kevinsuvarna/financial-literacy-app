import { z } from 'zod';
import { sceneTypeSchema } from './schema';
import { artefactsOfKind } from './artefacts';
import { chequeHitZoneIds, chequeMismatchZoneIds } from './cheque';
import { transactions, suspiciousTransactionId } from './statement';

export const taskKindSchema = z.enum([
  'scanOne',
  'scanAll',
  'tap',
  'highlight',
  'choice',
  'passkey',
  'narrative',
  'report',
]);
export type TaskKind = z.infer<typeof taskKindSchema>;

/** On-screen copies of documents a task needs the player to read (not interact with). */
export const taskReferenceSchema = z.enum(['statement', 'cheque', 'phishing-message']);
export type TaskReference = z.infer<typeof taskReferenceSchema>;

const taskBaseShape = {
  id: z.string().min(1),
  scene: sceneTypeSchema,
  prompt: z.string().min(1),
  /** A supporting line shown under the prompt. */
  detail: z.string().min(1).optional(),
  /** Ordered instructions shown up front — unlike `hints`, which only appear after mistakes. */
  steps: z.array(z.string().min(1)).default([]),
  references: z.array(taskReferenceSchema).default([]),
  successText: z.string().min(1),
  hints: z.array(z.string().min(1)).default([]),
};

/**
 * Shared shape for every task whose interaction is "pick one or more of a set of option ids" —
 * scanning a card, tapping a cheque zone, dragging a highlighter, or choosing an answer.
 * `acceptedIds` are the option ids that count as correct; every other id in `optionIds` must
 * have a `feedback` entry (CLAUDE.md rule 3: no generic Continue past a required interaction).
 */
const interactiveShape = {
  optionIds: z.array(z.string().min(1)).min(1),
  acceptedIds: z.array(z.string().min(1)).min(1),
  feedback: z.record(z.string(), z.string().min(1)),
};

export const taskSchema = z.discriminatedUnion('kind', [
  z.object({ ...taskBaseShape, ...interactiveShape, kind: z.literal('scanOne') }),
  z.object({ ...taskBaseShape, ...interactiveShape, kind: z.literal('scanAll') }),
  z.object({ ...taskBaseShape, ...interactiveShape, kind: z.literal('tap') }),
  z.object({ ...taskBaseShape, ...interactiveShape, kind: z.literal('highlight') }),
  z.object({
    ...taskBaseShape,
    ...interactiveShape,
    kind: z.literal('choice'),
    /** Choice options aren't physical artefacts, so they carry their own display labels. */
    optionLabels: z.record(z.string(), z.string().min(1)),
  }),
  z.object({ ...taskBaseShape, kind: z.literal('passkey') }),
  z.object({ ...taskBaseShape, kind: z.literal('narrative') }),
  z.object({
    ...taskBaseShape,
    kind: z.literal('report'),
    requiredEvidenceIds: z.array(z.string().min(1)).min(1),
  }),
]);
export type Task = z.infer<typeof taskSchema>;

const accountTypeIds = artefactsOfKind('account-type').map((a) => a.id);
const identityDocumentIds = artefactsOfKind('identity-document').map((a) => a.id);
const bankSlipIds = artefactsOfKind('bank-slip').map((a) => a.id);
const balanceAnswerIds = artefactsOfKind('balance-answer').map((a) => a.id);
const transactionIds = transactions.map((t) => t.id);

export const tasks: Task[] = z.array(taskSchema).parse([
  // ---------------------------------------------------------------- Level 1: Understand the Account
  {
    id: 'l1-t1-account-type',
    scene: 'table',
    kind: 'scanOne',
    prompt: 'WHAT TYPE OF BANK ACCOUNT DOES ANANYA HAVE?',
    optionIds: accountTypeIds,
    acceptedIds: ['account-savings'],
    feedback: {
      'account-current':
        'A current account is for frequent business transactions, not for saving pocket money.',
      'account-fixed-deposit':
        'A fixed deposit locks money away for a set time — Ananya can access her money any time.',
      'account-recurring-deposit':
        'A recurring deposit needs regular fixed payments in — that is not what Ananya has.',
    },
    successText:
      'Correct! A savings account lets Ananya keep her money in the bank while still being able to withdraw it or make payments.',
    hints: [],
  },
  {
    id: 'l1-t2-verify-identity',
    scene: 'table',
    kind: 'scanAll',
    prompt: 'WHICH DOCUMENTS CAN ANANYA USE TO VERIFY HER IDENTITY?',
    optionIds: identityDocumentIds,
    acceptedIds: ['id-pan-card', 'id-aadhaar-card'],
    feedback: {
      'id-expired-passport': 'An expired passport is no longer a valid proof of identity.',
      'id-library-card':
        'A library card isn’t issued by the government, so it can’t verify identity.',
    },
    successText: 'Identity verified! Ananya’s PAN card and Aadhaar card both check out.',
    hints: [],
  },
  {
    id: 'l1-t3-withdrawal-slip',
    scene: 'table',
    kind: 'scanOne',
    prompt: 'WHICH SLIP WOULD ANANYA NEED TO TAKE MONEY OUT OF HER ACCOUNT?',
    optionIds: bankSlipIds,
    acceptedIds: ['slip-withdrawal'],
    feedback: {
      'slip-deposit': 'A deposit slip is used to put money into an account, not take it out.',
    },
    successText: 'Right — a withdrawal slip is used to request money out of an account.',
    hints: [],
  },

  // -------------------------------------------------------------------- Level 2: Follow the Money
  {
    id: 'l2-t1-closing-balance',
    scene: 'table',
    kind: 'scanOne',
    prompt: 'HOW MUCH MONEY IS LEFT IN ANANYA’S ACCOUNT?',
    detail: 'Read the statement, work out the closing balance, then scan the matching card.',
    references: ['statement'],
    optionIds: balanceAnswerIds,
    acceptedIds: ['balance-answer-7501'],
    feedback: {
      'balance-answer-13500':
        'Close — but did you remember to subtract the Mobile Recharge payment to CAMS TEL?',
      'balance-answer-4001':
        'Not quite — remember the returned cheque put that money back into the account.',
    },
    successText:
      'That’s right. Money coming in increases the balance, and money going out decreases it.',
    hints: [
      'Add up every credit, then subtract every debit, in order, starting from the opening balance.',
    ],
  },
  {
    id: 'l2-t2-returned-cheque',
    scene: 'screen',
    kind: 'tap',
    prompt: 'WAIT — THE CHEQUE WAS RETURNED. CAN YOU FIND OUT WHY?',
    detail: 'Tap the part of the cheque that looks wrong.',
    optionIds: chequeHitZoneIds,
    acceptedIds: [...chequeMismatchZoneIds],
    feedback: {
      'payee-name': 'This detail looks correct. Keep investigating.',
      date: 'This detail looks correct. Keep investigating.',
      signature: 'This detail looks correct. Keep investigating.',
      'cheque-number': 'This detail looks correct. Keep investigating.',
    },
    successText:
      'Found it! The amount in numbers and the amount in words don’t match — that mismatch is exactly why a cheque gets returned.',
    hints: [],
  },
  {
    id: 'l2-t3-suspicious-transaction',
    scene: 'screen',
    kind: 'highlight',
    prompt: 'ONE TRANSACTION TELLS A DIFFERENT STORY. CAN YOU FIND IT?',
    detail: 'Use the highlighter on the transaction that doesn’t fit.',
    optionIds: transactionIds,
    acceptedIds: [suspiciousTransactionId],
    feedback: {
      'txn-01': 'This looks like Ananya’s regular pocket money coming in. Keep investigating.',
      'txn-02': 'A normal ATM withdrawal. Keep investigating.',
      'txn-03': 'This is the cheque Ananya issued — already explained. Keep investigating.',
      'txn-04': 'This is the cheque being returned — already explained. Keep investigating.',
      'txn-06': 'A birthday gift credit. Keep investigating.',
      'txn-07': 'A routine grocery payment. Keep investigating.',
    },
    successText:
      'That’s the one. Ananya doesn’t remember making this Mobile Recharge payment — worth investigating further, not proof of fraud yet.',
    hints: [],
  },

  // ------------------------------------------------------------------- Level 3: Secure and Report
  {
    id: 'l3-t1-spot-the-phish',
    scene: 'screen',
    kind: 'choice',
    prompt: 'SHOULD ANANYA CLICK THE LINK?',
    detail:
      'Ananya calls again. Her debit card has been blocked, and she has received a message offering to unblock it immediately through a link.',
    references: ['phishing-message'],
    optionIds: ['no-dont-click', 'yes-click'],
    optionLabels: {
      'no-dont-click': 'NO — DON’T CLICK THE LINK',
      'yes-click': 'YES — CLICK THE LINK',
    },
    acceptedIds: ['no-dont-click'],
    feedback: {
      'yes-click':
        'That link leads to a fake page asking for banking details — scammers use pages like this to steal information. Nothing is lost just from clicking; the risk is in entering information there.',
    },
    successText:
      'Good instinct — checking before acting is exactly right. Unexpected, urgent messages like this are a common phishing trick. Check card status through official bank channels instead.',
    hints: [],
  },
  {
    id: 'l3-t2-uncover-the-scam',
    scene: 'cinematic',
    kind: 'narrative',
    prompt: 'CAMS TEL keeps coming up — in the statement, and in the phishing message.',
    successText:
      'The Mobile Recharge transaction and the phishing message both point to the same name: CAMS TEL. That’s the thread tying this case together.',
    hints: [],
  },
  {
    id: 'l3-t3-evidence-passkey',
    scene: 'screen',
    kind: 'passkey',
    prompt: 'THREE CLUES HOLD THE PASSKEY',
    detail: 'Enter the last digit of each value, in this order:',
    steps: ['The closing balance.', 'The amount on the cheque.', 'The suspicious transaction.'],
    references: ['statement', 'cheque'],
    successText: 'Unlocked! You’ve connected the key clues in this case.',
    hints: [
      'Start with the closing balance you worked out in Level 2 — use only its last digit.',
      'The second digit is the last digit of the amount on the cheque.',
      'The third digit is the last digit of the suspicious transaction — the Mobile Recharge to CAMS TEL.',
    ],
  },
  {
    id: 'l3-t4-scan-evidence',
    scene: 'table',
    kind: 'scanAll',
    prompt: 'SCAN EVIDENCE',
    detail: 'Scan the two artefacts that support this incident report.',
    optionIds: ['bank-statement', 'phishing-message', 'cheque'],
    acceptedIds: ['bank-statement', 'phishing-message'],
    feedback: {
      cheque:
        'The cheque’s returned-payment issue has already been explained — it isn’t evidence for this report.',
    },
    successText: 'Both pieces of evidence are attached.',
    hints: [],
  },
  {
    id: 'l3-t5-review-submit',
    scene: 'screen',
    kind: 'report',
    prompt: 'REVIEW INCIDENT REPORT',
    detail: 'Check that both pieces of evidence are attached before submitting.',
    requiredEvidenceIds: ['bank-statement', 'phishing-message'],
    successText:
      'Report submitted for investigation. Ananya has been notified — well done, Officer.',
    hints: [],
  },
]);

export const levelIdSchema = z.enum([
  'understand-the-account',
  'follow-the-money',
  'secure-and-report',
]);
export type LevelId = z.infer<typeof levelIdSchema>;

export const levelSchema = z.object({
  id: levelIdSchema,
  label: z.string().min(1),
  taskIds: z.array(z.string().min(1)).min(1),
});
export type Level = z.infer<typeof levelSchema>;

export const levels: Level[] = z.array(levelSchema).parse([
  {
    id: 'understand-the-account',
    label: 'Understand the Account',
    taskIds: ['l1-t1-account-type', 'l1-t2-verify-identity', 'l1-t3-withdrawal-slip'],
  },
  {
    id: 'follow-the-money',
    label: 'Follow the Money',
    taskIds: ['l2-t1-closing-balance', 'l2-t2-returned-cheque', 'l2-t3-suspicious-transaction'],
  },
  {
    id: 'secure-and-report',
    label: 'Secure & Report',
    taskIds: [
      'l3-t1-spot-the-phish',
      'l3-t2-uncover-the-scam',
      'l3-t3-evidence-passkey',
      'l3-t4-scan-evidence',
      'l3-t5-review-submit',
    ],
  },
]);

const tasksById = new Map(tasks.map((t) => [t.id, t]));

export function getTask(id: string): Task | undefined {
  return tasksById.get(id);
}

export function getTasksForLevel(levelId: LevelId): Task[] {
  const level = levels.find((l) => l.id === levelId);
  if (!level) throw new Error(`Unknown level id: ${levelId}`);
  return level.taskIds.map((id) => {
    const task = getTask(id);
    if (!task) throw new Error(`Level ${levelId} references unknown task id: ${id}`);
    return task;
  });
}

/** Tasks that accept/reject a set of option ids (as opposed to passkey/narrative/report). */
export function isInteractiveTask(
  task: Task,
): task is Task & { optionIds: string[]; acceptedIds: string[]; feedback: Record<string, string> } {
  return (
    task.kind === 'scanOne' ||
    task.kind === 'scanAll' ||
    task.kind === 'tap' ||
    task.kind === 'highlight' ||
    task.kind === 'choice'
  );
}
