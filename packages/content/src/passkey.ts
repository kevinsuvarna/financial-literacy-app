import { z } from 'zod';
import { chequeAmount } from './cheque';
import { getClosingBalance, getTransactionAmount, suspiciousTransactionId } from './statement';
import { taskReferenceSchema } from './tasks';

function lastDigit(amount: number): number {
  return Math.abs(amount) % 10;
}

/** Text that is shown as a hint. It may describe where a digit comes from, never what it is. */
const digitFreeText = z
  .string()
  .min(1)
  .regex(/^\D+$/, 'hint text must not contain digits, so it can never give part of the code away');

export const passkeyClueSchema = z.object({
  id: z.string().min(1),
  /** Which digit of the passkey this clue gives — in words, like every hint. */
  position: digitFreeText,
  /** The on-screen document the value is read from. */
  reference: taskReferenceSchema,
  /** Where to look again when this digit is wrong. */
  pointer: digitFreeText,
  /** The value in the game's artefacts whose last digit is this clue's digit. */
  value: z.number().int().nonnegative(),
});
export type PasskeyClue = z.infer<typeof passkeyClueSchema>;

/**
 * The three clues, in the order SPEC §6 Task 3 gives them: the closing balance, then the amount
 * on the cheque, then the suspicious transaction.
 */
export const passkeyClues: PasskeyClue[] = z
  .array(passkeyClueSchema)
  .length(3)
  .parse([
    {
      id: 'closing-balance',
      position: 'first',
      reference: 'statement',
      pointer:
        'Work out the closing balance again from the bank statement: start with the opening balance, add the money in and take away the money out. You need the last digit of your answer.',
      value: getClosingBalance(),
    },
    {
      id: 'cheque-amount',
      position: 'second',
      reference: 'cheque',
      pointer:
        'Look at the amount on the cheque again. The amount in figures and the amount in words end in the same digit — that is the digit you need.',
      value: chequeAmount.amountFigures,
    },
    {
      id: 'suspicious-transaction',
      position: 'third',
      reference: 'statement',
      pointer:
        'Find the suspicious transaction on the bank statement — the Mobile Recharge to CAMS TEL. You need the last digit of that amount.',
      value: getTransactionAmount(suspiciousTransactionId),
    },
  ]);

/**
 * Per SPEC §6 Task 3: the passkey is the last digit of the closing balance, then the last digit
 * of the cheque amount, then the last digit of the suspicious transaction — in that order.
 */
export function derivePasskey(): string {
  return passkeyClues.map((clue) => lastDigit(clue.value)).join('');
}

export const passkey = derivePasskey();

/** How many digits the keypad takes — all a screen needs to know to draw the display. */
export const passkeyLength = passkey.length;

/** Whether `code` is something the keypad could have entered: exactly the right number of digits. */
export function isPasskeyAttempt(code: string): boolean {
  return code.length === passkeyLength && /^[0-9]+$/.test(code);
}

/**
 * How one digit of a wrong code compares with the passkey, as in the game Mastermind:
 * `match` — right digit in the right place; `misplaced` — that digit is in the passkey, but
 * somewhere else; `miss` — that digit is not in the passkey (or is already accounted for).
 */
export type DigitGrade = 'match' | 'misplaced' | 'miss';

export function gradePasskey(guess: string, code: string = passkey): DigitGrade[] {
  const grades: DigitGrade[] = [];
  // Digits of the code that no exact match has claimed, and so can still be "misplaced".
  const unclaimed = new Map<string, number>();

  for (let index = 0; index < code.length; index += 1) {
    const expected = code.charAt(index);
    if (guess.charAt(index) === expected) {
      grades[index] = 'match';
    } else {
      grades[index] = 'miss';
      unclaimed.set(expected, (unclaimed.get(expected) ?? 0) + 1);
    }
  }

  for (let index = 0; index < code.length; index += 1) {
    if (grades[index] === 'match') continue;
    const digit = guess.charAt(index);
    const left = unclaimed.get(digit) ?? 0;
    if (left > 0) {
      grades[index] = 'misplaced';
      unclaimed.set(digit, left - 1);
    }
  }

  return grades;
}

/**
 * Hints escalate with each wrong code: first a reminder of the order, then a light per digit,
 * then the document behind a digit that is still wrong. None of them states a digit.
 */
export const passkeyHintStages = ['order', 'lights', 'source'] as const;
export type PasskeyHintStage = (typeof passkeyHintStages)[number];

const passkeyHintText = {
  ...z.object({ order: digitFreeText, lights: digitFreeText }).parse({
    order:
      'Check the order: the closing balance first, then the amount on the cheque, then the suspicious transaction. Use only the last digit of each.',
    lights:
      'The lights under your last code show how close it was. Green: right digit, right place. Amber: that digit is in the passkey, but in a different place. Dark: that digit is not in the passkey.',
  }),
  /** Leads into a clue's `pointer` at the last stage. */
  source: (position: string) => `The ${position} digit is not right yet.`,
};

export interface PasskeyHint {
  stage: PasskeyHintStage;
  /** Which hint this is, counting from one — for "hint 2 of 3". */
  level: number;
  text: string;
  /** One light per digit of the last code — only once the hints have escalated that far. */
  lights: DigitGrade[] | null;
  /** The clue behind the first digit that is still wrong — only at the last stage. */
  source: PasskeyClue | null;
}

/**
 * The hint the player has earned after `wrongAttempts` wrong codes, the last of which was
 * `lastGuess`. Each stage adds to the one before; none reveals the passkey.
 */
export function getPasskeyHint(wrongAttempts: number, lastGuess: string): PasskeyHint | null {
  if (wrongAttempts < 1) return null;

  const level = Math.min(wrongAttempts, passkeyHintStages.length);
  const grades = gradePasskey(lastGuess);
  const lights = level >= 2 ? grades : null;
  const firstWrong = passkeyClues[grades.findIndex((grade) => grade !== 'match')];

  if (level === 1) {
    return { stage: 'order', level, text: passkeyHintText.order, lights, source: null };
  }
  if (level === 2 || !firstWrong) {
    return { stage: 'lights', level, text: passkeyHintText.lights, lights, source: null };
  }
  return {
    stage: 'source',
    level,
    text: `${passkeyHintText.source(firstWrong.position)} ${firstWrong.pointer}`,
    lights,
    source: firstWrong,
  };
}
