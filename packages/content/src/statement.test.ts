import { describe, expect, it } from 'vitest';
import { openingBalance, transactions, getClosingBalance } from './statement';
import { artefactsOfKind } from './artefacts';

describe('statement arithmetic', () => {
  it('computes the closing balance from the opening balance plus every credit minus every debit', () => {
    const totalCredits = transactions.reduce((sum, t) => sum + t.credit, 0);
    const totalDebits = transactions.reduce((sum, t) => sum + t.debit, 0);

    expect(getClosingBalance()).toBe(openingBalance + totalCredits - totalDebits);
  });

  it('never has a transaction row with both a credit and a debit', () => {
    for (const t of transactions) {
      expect(t.credit === 0 || t.debit === 0).toBe(true);
    }
  });
});

describe('closing-balance answer cards', () => {
  it('has exactly one card whose amount matches the computed closing balance', () => {
    const balanceCards = artefactsOfKind('balance-answer');
    const matching = balanceCards.filter((card) => card.amount === getClosingBalance());

    expect(balanceCards.length).toBeGreaterThanOrEqual(2);
    expect(matching).toHaveLength(1);
  });
});
