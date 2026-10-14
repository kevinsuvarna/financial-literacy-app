import { z } from 'zod';
import { sceneTypeSchema } from './schema';
import { artefactsOfKind } from './artefacts';
import { chequeHitZoneIds, chequeMismatchZoneIds } from './cheque';
import { formatRupees } from './format';
import {
  getTotalCredits,
  getTotalDebits,
  openingBalance,
  suspiciousTransactionId,
  transactions,
} from './statement';

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
export const taskReferenceSchema = z.enum([
  'statement',
  'cheque',
  'phishing-message',
  'balance-working',
]);
export type TaskReference = z.infer<typeof taskReferenceSchema>;

const taskBaseShape = {
  id: z.string().min(1),
  scene: sceneTypeSchema,
  prompt: z.string().min(1),
  /** Lines Ananya says on a call before the task begins, typed out one after another. */
  dialogue: z.array(z.string().min(1)).default([]),
  /** A supporting line shown under the prompt. */
  detail: z.string().min(1).optional(),
  /** Ordered instructions shown up front — unlike `hints`, which only appear after mistakes. */
  steps: z.array(z.string().min(1)).default([]),
  references: z.array(taskReferenceSchema).default([]),
  /** Documents added once the task is solved, e.g. the working behind the answer. */
  solvedReferences: z.array(taskReferenceSchema).default([]),
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
    /** How the options are offered: as buttons, or as pins on a corkboard to tie a string to. */
    presentation: z.enum(['buttons', 'corkboard']).default('buttons'),
    /** A message that arrives on Ananya's phone before the player chooses. */
    notification: z.enum(['phishing-message']).optional(),
    /**
     * The accepted options that are the *right* call. An accepted option outside this list
     * still moves the story on — as a lesson rather than a win, so with no praise, stamp or
     * fanfare. When omitted, every accepted option is recommended.
     */
    recommendedIds: z.array(z.string().min(1)).optional(),
    /** What the player is told after an accepted option, where that differs from successText. */
    outcomes: z.record(z.string(), z.string().min(1)).default({}),
    /** A simulated consequence the player is walked through after choosing an option. */
    simulations: z.record(z.string(), z.enum(['fake-bank-page'])).default({}),
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
    solvedReferences: ['balance-working'],
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
    // Each hint gives a little more away; none of them states the closing balance. The figures
    // are computed from the ledger so they can never disagree with the statement on screen.
    hints: [
      'Start from the opening balance. Money in is added to it; money out is taken away.',
      'Work down the statement one row at a time, keeping a running total. Don’t skip the two cheque rows — one takes money out and the other puts it back.',
      `Add up the two columns first: money in comes to ${formatRupees(getTotalCredits())} and money out comes to ${formatRupees(getTotalDebits())}. Now start from ${formatRupees(openingBalance)}.`,
    ],
  },
  {
    id: 'l2-t2-returned-cheque',
    scene: 'screen',
    kind: 'tap',
    prompt: 'WAIT — THE CHEQUE WAS RETURNED. CAN YOU FIND OUT WHY?',
    detail: 'Look the cheque over, then tap the detail that explains why it was returned.',
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
    detail: 'Mark the transaction that doesn’t fit with the highlighter.',
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
      'Marked as a clue. Ananya doesn’t recognise this ₹5,999 Mobile Recharge to CAMS TEL — she doesn’t remember making it. That makes it worth investigating further. It is not proof of fraud yet.',
    hints: [],
  },

  // ------------------------------------------------------------------- Level 3: Secure and Report
  {
    id: 'l3-t1-spot-the-phish',
    scene: 'call',
    kind: 'choice',
    prompt: 'SHOULD ANANYA CLICK THE LINK?',
    dialogue: [
      'It’s Ananya again — my debit card has just been blocked!',
      'And I’ve got a message saying I can unblock it straight away if I tap a link. Should I tap it?',
    ],
    notification: 'phishing-message',
    optionIds: ['no-dont-click', 'yes-click'],
    optionLabels: {
      'no-dont-click': 'NO — DON’T CLICK THE LINK',
      'yes-click': 'YES — CLICK THE LINK',
    },
    // Both answers carry the investigation forward (SPEC §6): NO is the right call; YES is
    // walked through what would have happened, then debriefed.
    acceptedIds: ['no-dont-click', 'yes-click'],
    recommendedIds: ['no-dont-click'],
    feedback: {},
    simulations: { 'yes-click': 'fake-bank-page' },
    outcomes: {
      'yes-click':
        'That page was a fake, made to look like a bank. Tapping the link did not take any money — the money went only after card details were typed into the page. Messages that are unexpected and urgent are a common trick called phishing. Next time, don’t tap the link: check the card through the bank’s own app, website or phone number instead. Nothing real was lost here — this was a simulation.',
    },
    successText:
      'Good instinct — checking before acting is exactly right. Unexpected, urgent messages like this are a common trick called phishing. Ananya should check her card through the bank’s official channels instead: its own app, its website, or the phone number printed on her card.',
    hints: [],
  },
  {
    id: 'l3-t2-uncover-the-scam',
    scene: 'cinematic',
    kind: 'choice',
    presentation: 'corkboard',
    prompt: 'SOMETHING LINKS THESE CLUES. CAN YOU CONNECT THEM?',
    detail:
      'A name on the statement clue turns up somewhere else on the board. Tie the red string between the two.',
    optionIds: ['message-sender', 'cheque-payee'],
    optionLabels: {
      'message-sender': 'the sender of the message',
      'cheque-payee': 'the name on the returned cheque',
    },
    acceptedIds: ['message-sender'],
    feedback: {
      'cheque-payee':
        'The cheque was made out to a different name, and it was returned because its amounts didn’t match. It isn’t linked to this payment.',
    },
    successText:
      'It’s the same name. The payment Ananya doesn’t recognise went to CAMS TEL — and the message telling her to “unblock” her card came from CAMS TEL too. That points to one suspected scam operation: take a payment, then send a fake message to get her card details as well. It is a strong lead for the bank to investigate, not proof yet.',
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
  /** What the player achieved, shown on the level-complete screen. */
  completion: z.string().min(1),
});
export type Level = z.infer<typeof levelSchema>;

export const levels: Level[] = z.array(levelSchema).parse([
  {
    id: 'understand-the-account',
    label: 'Understand the Account',
    taskIds: ['l1-t1-account-type', 'l1-t2-verify-identity', 'l1-t3-withdrawal-slip'],
    completion:
      'You worked out that Ananya has a savings account, verified her identity with her PAN card and Aadhaar card, and found the slip she needs to take money out.',
  },
  {
    id: 'follow-the-money',
    label: 'Follow the Money',
    taskIds: ['l2-t1-closing-balance', 'l2-t2-returned-cheque', 'l2-t3-suspicious-transaction'],
    completion:
      'You calculated Ananya’s closing balance, found out why her cheque was returned, and spotted a transaction she does not remember making.',
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
    completion:
      'You spotted the phishing message, connected the clues, and submitted an incident report with the evidence attached.',
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

export type ChoiceTask = Extract<Task, { kind: 'choice' }>;

/** Whether choosing `optionId` in a choice task is the right call, rather than a lesson. */
export function isRecommendedChoice(task: ChoiceTask, optionId: string | undefined): boolean {
  return optionId !== undefined && (task.recommendedIds ?? task.acceptedIds).includes(optionId);
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
