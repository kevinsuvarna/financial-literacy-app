import { chequeAmount } from './cheque';
import { getClosingBalance, getTransactionAmount, suspiciousTransactionId } from './statement';

function lastDigit(amount: number): number {
  return Math.abs(amount) % 10;
}

/**
 * Per SPEC §6 Task 3: the passkey is the last digit of the closing balance, then the last digit
 * of the cheque amount, then the last digit of the suspicious transaction — in that order.
 */
export function derivePasskey(): string {
  const closingBalanceDigit = lastDigit(getClosingBalance());
  const chequeDigit = lastDigit(chequeAmount.amountFigures);
  const suspiciousDigit = lastDigit(getTransactionAmount(suspiciousTransactionId));
  return `${closingBalanceDigit}${chequeDigit}${suspiciousDigit}`;
}

export const passkey = derivePasskey();
