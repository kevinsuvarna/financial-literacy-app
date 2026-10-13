import {
  copy,
  formatRupees,
  getClosingBalance,
  getTotalCredits,
  getTotalDebits,
  openingBalance,
} from '@app/content';
import { Card, Heading, cx } from '../ui';

/**
 * The sum behind the closing balance, shown once the player has the answer: money in pushes
 * the balance up, money out pulls it down. Every figure comes from the ledger.
 */
export function BalanceWorking() {
  const working = copy.statement.working;
  const lines = [
    { sign: '', label: working.opening, note: null, amount: openingBalance },
    { sign: '+', label: working.moneyIn, note: working.moneyInNote, amount: getTotalCredits() },
    { sign: '−', label: working.moneyOut, note: working.moneyOutNote, amount: getTotalDebits() },
    { sign: '=', label: working.closing, note: null, amount: getClosingBalance() },
  ];

  return (
    <Card as="section" tone="sunken" aria-label={working.heading} className="flex flex-col gap-3">
      <Heading level={2} size="section">
        {working.heading}
      </Heading>
      <ul className="flex max-w-md flex-col">
        {lines.map((line, index) => (
          <li
            key={line.label}
            className={cx(
              'grid grid-cols-[1.25rem_1fr_auto] items-baseline gap-x-2 py-1.5',
              index === lines.length - 1 && 'border-t-2 border-ink font-bold',
            )}
          >
            <span className="font-display font-bold">{line.sign}</span>
            <span>
              {line.label}
              {line.note && <span className="text-sm text-ink-muted"> — {line.note}</span>}
            </span>
            <span className="font-display">{formatRupees(line.amount)}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
