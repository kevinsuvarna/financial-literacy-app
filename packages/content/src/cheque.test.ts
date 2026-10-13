import { describe, expect, it } from 'vitest';
import { chequeAmount, chequeHitZoneIds, chequeMismatchZoneIds } from './cheque';

describe('cheque amount mismatch', () => {
  it('mismatches the figures and words amounts', () => {
    expect(chequeAmount.amountFigures).not.toBe(chequeAmount.amountWordsValue);
  });

  it('shares the same last digit between figures and words, so the passkey is unambiguous', () => {
    expect(chequeAmount.amountFigures % 10).toBe(chequeAmount.amountWordsValue % 10);
  });

  it('points the mismatch hit-zones at real cheque fields', () => {
    for (const zoneId of chequeMismatchZoneIds) {
      expect(chequeHitZoneIds).toContain(zoneId);
    }
  });
});
