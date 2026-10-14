import { describe, expect, it } from 'vitest';
import { chequeAmount } from './cheque';
import { getClosingBalance, getTransactionAmount, suspiciousTransactionId } from './statement';
import {
  derivePasskey,
  getPasskeyHint,
  gradePasskey,
  isPasskeyAttempt,
  passkey,
  passkeyClueSchema,
  passkeyClues,
} from './passkey';

/** Every code the keypad can enter. */
const everyCode = Array.from({ length: 1000 }, (_, n) => String(n).padStart(3, '0'));

describe('passkey derivation', () => {
  it('is the last digit of the closing balance, cheque amount, then suspicious transaction, in that order', () => {
    const expected = [
      getClosingBalance() % 10,
      chequeAmount.amountFigures % 10,
      getTransactionAmount(suspiciousTransactionId) % 10,
    ].join('');

    expect(passkey).toBe(expected);
    expect(derivePasskey()).toBe(expected);
  });

  it('is exactly three digits', () => {
    expect(passkey).toMatch(/^\d{3}$/);
  });

  it('has one clue per digit, in the order the task lists them', () => {
    expect(passkeyClues.map((clue) => clue.id)).toEqual([
      'closing-balance',
      'cheque-amount',
      'suspicious-transaction',
    ]);
    expect(passkeyClues.map((clue) => clue.reference)).toEqual([
      'statement',
      'cheque',
      'statement',
    ]);
  });
});

describe('isPasskeyAttempt', () => {
  it('accepts only as many digits as the passkey has', () => {
    expect(isPasskeyAttempt('000')).toBe(true);
    expect(isPasskeyAttempt(passkey)).toBe(true);

    for (const notACode of ['', '12', '1234', '12a', ' 12', '1.2', '-12', 'abc', '١٢٣']) {
      expect(isPasskeyAttempt(notACode), JSON.stringify(notACode)).toBe(false);
    }
  });
});

describe('gradePasskey', () => {
  it('marks each digit as a match, misplaced, or a miss', () => {
    expect(gradePasskey('123', '123')).toEqual(['match', 'match', 'match']);
    expect(gradePasskey('456', '123')).toEqual(['miss', 'miss', 'miss']);
    expect(gradePasskey('312', '123')).toEqual(['misplaced', 'misplaced', 'misplaced']);
    expect(gradePasskey('129', '123')).toEqual(['match', 'match', 'miss']);
    expect(gradePasskey('321', '123')).toEqual(['misplaced', 'match', 'misplaced']);
  });

  it('does not call a digit misplaced once every copy of it is accounted for', () => {
    // One 1 in the code, already matched in place: the other 1s are misses, not "misplaced".
    expect(gradePasskey('111', '123')).toEqual(['match', 'miss', 'miss']);
    // One 1 in the code, not matched in place: only the first stray 1 is "misplaced".
    expect(gradePasskey('011', '100')).toEqual(['misplaced', 'misplaced', 'miss']);
    expect(gradePasskey('110', '011')).toEqual(['misplaced', 'match', 'misplaced']);
  });

  it('grades against the passkey by default', () => {
    expect(gradePasskey(passkey)).toEqual(['match', 'match', 'match']);
  });

  it('treats a short code as missing digits rather than failing', () => {
    expect(gradePasskey('1', '123')).toEqual(['match', 'miss', 'miss']);
    expect(gradePasskey('', '123')).toEqual(['miss', 'miss', 'miss']);
  });
});

describe('passkey hints', () => {
  const wrongCodes = everyCode.filter((code) => code !== passkey);

  it('has nothing to say before a wrong code', () => {
    expect(getPasskeyHint(0, '000')).toBeNull();
  });

  it('first reminds the player of the order — with no lights yet', () => {
    const hint = getPasskeyHint(1, '000');

    expect(hint?.stage).toBe('order');
    expect(hint?.level).toBe(1);
    expect(hint?.text).toMatch(/closing balance first.*cheque.*suspicious transaction/);
    expect(hint?.lights).toBeNull();
    expect(hint?.source).toBeNull();
  });

  it('then lights up one light per digit of the last code', () => {
    const [first, second, third] = passkey;
    const guess = `${first}${third}${second === '5' ? '6' : '5'}`;
    const hint = getPasskeyHint(2, guess);

    expect(hint?.stage).toBe('lights');
    expect(hint?.level).toBe(2);
    expect(hint?.lights).toEqual(gradePasskey(guess));
    expect(hint?.lights?.[0]).toBe('match');
    expect(hint?.text).toMatch(/Green.*Amber.*Dark/);
    expect(hint?.source).toBeNull();
  });

  it('then points to the document behind the first digit that is still wrong', () => {
    const [first, second, third] = passkey;
    const off = (digit: string | undefined) => (digit === '5' ? '6' : '5');

    const firstWrong = getPasskeyHint(3, `${off(first)}${second}${third}`);
    expect(firstWrong?.stage).toBe('source');
    expect(firstWrong?.source?.id).toBe('closing-balance');
    expect(firstWrong?.source?.reference).toBe('statement');
    expect(firstWrong?.text).toMatch(/^The first digit is not right yet\. .*closing balance/);

    const secondWrong = getPasskeyHint(3, `${first}${off(second)}${third}`);
    expect(secondWrong?.source?.id).toBe('cheque-amount');
    expect(secondWrong?.source?.reference).toBe('cheque');
    expect(secondWrong?.text).toMatch(/^The second digit is not right yet\. .*cheque/);

    const thirdWrong = getPasskeyHint(3, `${first}${second}${off(third)}`);
    expect(thirdWrong?.source?.id).toBe('suspicious-transaction');
    expect(thirdWrong?.text).toMatch(/^The third digit is not right yet\. .*CAMS TEL/);

    // The lights stay on at the last stage: each hint adds to the one before.
    expect(thirdWrong?.lights).toEqual(['match', 'match', 'miss']);
  });

  it('stays at the last stage however many more wrong codes follow', () => {
    expect(getPasskeyHint(4, '000')?.stage).toBe('source');
    expect(getPasskeyHint(40, '000')?.level).toBe(3);
  });

  it('never states a digit, whatever was entered and however often', () => {
    for (const attempts of [1, 2, 3, 4, 10]) {
      for (const guess of wrongCodes) {
        const hint = getPasskeyHint(attempts, guess);
        expect(hint?.text, `${attempts} attempts, ${guess}`).toMatch(/^\D+$/);
      }
    }
  });

  it('refuses clue text that contains a digit', () => {
    const clue = passkeyClues[0];
    expect(passkeyClueSchema.safeParse(clue).success).toBe(true);
    expect(
      passkeyClueSchema.safeParse({ ...clue, pointer: `The answer ends in ${passkey[0]}.` })
        .success,
    ).toBe(false);
  });

  it('never lights up every digit for a wrong code', () => {
    for (const guess of wrongCodes) {
      expect(
        gradePasskey(guess).every((grade) => grade === 'match'),
        guess,
      ).toBe(false);
    }
  });
});
