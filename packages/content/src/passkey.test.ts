import { describe, expect, it } from 'vitest';
import { chequeAmount } from './cheque';
import { getClosingBalance, getTransactionAmount, suspiciousTransactionId } from './statement';
import { passkey } from './passkey';

describe('passkey derivation', () => {
  it('is the last digit of the closing balance, cheque amount, then suspicious transaction, in that order', () => {
    const expected = [
      getClosingBalance() % 10,
      chequeAmount.amountFigures % 10,
      getTransactionAmount(suspiciousTransactionId) % 10,
    ].join('');

    expect(passkey).toBe(expected);
  });

  it('is exactly three digits', () => {
    expect(passkey).toMatch(/^\d{3}$/);
  });
});
