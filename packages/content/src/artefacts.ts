import { z } from 'zod';
import { artefactIdSchema } from './schema';

export const artefactKindSchema = z.enum([
  'account-type',
  'identity-document',
  'bank-slip',
  'balance-answer',
  'cheque',
  'statement',
  'evidence',
]);
export type ArtefactKind = z.infer<typeof artefactKindSchema>;

const baseArtefactShape = {
  id: artefactIdSchema,
  label: z.string().min(1),
  qrPayload: z.string().url(),
};

export const artefactSchema = z.discriminatedUnion('kind', [
  z.object({ ...baseArtefactShape, kind: z.literal('account-type') }),
  z.object({ ...baseArtefactShape, kind: z.literal('identity-document') }),
  z.object({ ...baseArtefactShape, kind: z.literal('bank-slip') }),
  z.object({
    ...baseArtefactShape,
    kind: z.literal('balance-answer'),
    /** The amount printed on this answer card — the correct card is whichever one matches the
     * statement's computed closing balance; that equality is asserted in tests, not hardcoded. */
    amount: z.number().int().positive(),
  }),
  z.object({ ...baseArtefactShape, kind: z.literal('cheque') }),
  z.object({ ...baseArtefactShape, kind: z.literal('statement') }),
  z.object({ ...baseArtefactShape, kind: z.literal('evidence') }),
]);
export type Artefact = z.infer<typeof artefactSchema>;

function withQrPayload<T extends { id: string }>(artefact: T): T & { qrPayload: string } {
  return { ...artefact, qrPayload: `https://ssa.game/a/${artefact.id}` };
}

export const artefacts: Artefact[] = z.array(artefactSchema).parse(
  [
    // Level 1, Task 1 — account type cards.
    { id: 'account-savings', label: 'Savings Account', kind: 'account-type' },
    { id: 'account-current', label: 'Current Account', kind: 'account-type' },
    { id: 'account-fixed-deposit', label: 'Fixed Deposit Account', kind: 'account-type' },
    { id: 'account-recurring-deposit', label: 'Recurring Deposit Account', kind: 'account-type' },

    // Level 1, Task 2 — identity document cards.
    { id: 'id-expired-passport', label: 'Expired Passport', kind: 'identity-document' },
    { id: 'id-library-card', label: 'Library Card', kind: 'identity-document' },
    { id: 'id-pan-card', label: 'PAN Card', kind: 'identity-document' },
    { id: 'id-aadhaar-card', label: 'Aadhaar Card', kind: 'identity-document' },

    // Level 1, Task 3 — deposit/withdrawal slips.
    { id: 'slip-deposit', label: 'Deposit Slip', kind: 'bank-slip' },
    { id: 'slip-withdrawal', label: 'Withdrawal Slip', kind: 'bank-slip' },

    // Level 2, Task 1 — closing-balance answer cards (one correct amount, two distractors).
    { id: 'balance-answer-7501', label: '₹7,501', kind: 'balance-answer', amount: 7501 },
    { id: 'balance-answer-13500', label: '₹13,500', kind: 'balance-answer', amount: 13_500 },
    { id: 'balance-answer-4001', label: '₹4,001', kind: 'balance-answer', amount: 4001 },

    // Shown on-screen once scanned at the table.
    { id: 'cheque', label: "Ananya's Cheque", kind: 'cheque' },
    { id: 'bank-statement', label: "Ananya's Bank Statement", kind: 'statement' },

    // Level 3, Task 4 — evidence.
    { id: 'phishing-message', label: 'Suspicious Unblock-Card Message', kind: 'evidence' },
  ].map(withQrPayload),
);

const artefactsById = new Map(artefacts.map((a) => [a.id, a]));

export function getArtefact(id: string): Artefact | undefined {
  return artefactsById.get(id);
}

export const artefactIds = new Set(artefacts.map((a) => a.id));

export function artefactsOfKind<K extends ArtefactKind>(kind: K) {
  return artefacts.filter((a): a is Artefact & { kind: K } => a.kind === kind);
}
