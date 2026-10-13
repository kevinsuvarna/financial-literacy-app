import type { ReactNode } from 'react';
import { copy, formatRupees, openingBalance, transactions, type Transaction } from '@app/content';
import { Badge, Card, Heading, Text, cx } from '../ui';

interface StatementViewProps {
  /** Rows marked as clues. */
  highlightedIds?: string[];
  /** Heading for the per-row action column; the column only renders when both are given. */
  actionHeading?: string;
  renderRowAction?: (transaction: Transaction) => ReactNode;
}

function amount(value: number): string {
  return value > 0 ? formatRupees(value) : '—';
}

export function StatementView({
  highlightedIds = [],
  actionHeading,
  renderRowAction,
}: StatementViewProps) {
  const hasActions = Boolean(actionHeading && renderRowAction);

  return (
    <Card as="section" className="flex flex-col gap-3">
      <div>
        <Heading level={2} size="section">
          {copy.statement.heading}
        </Heading>
        <Text size="sm" tone="muted">
          {copy.statement.accountHolder}
        </Text>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-xl border-collapse text-left text-sm">
          <thead>
            <tr className="border-b-2 border-line">
              <th scope="col" className="py-2 pr-3">
                {copy.statement.date}
              </th>
              <th scope="col" className="py-2 pr-3">
                {copy.statement.description}
              </th>
              <th scope="col" className="py-2 pr-3 text-right">
                {copy.statement.credit}
              </th>
              <th scope="col" className="py-2 pr-3 text-right">
                {copy.statement.debit}
              </th>
              {hasActions && (
                <th scope="col" className="py-2 text-right">
                  {actionHeading}
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-line">
              <td className="py-2 pr-3" />
              <th scope="row" className="py-2 pr-3">
                {copy.statement.openingBalance}
              </th>
              <td className="py-2 pr-3 text-right font-semibold" colSpan={2}>
                {formatRupees(openingBalance)}
              </td>
              {hasActions && <td />}
            </tr>
            {transactions.map((transaction) => {
              const highlighted = highlightedIds.includes(transaction.id);
              return (
                <tr
                  key={transaction.id}
                  className={cx('border-b border-line', highlighted && 'bg-clue-soft')}
                >
                  <td className="py-2 pr-3 whitespace-nowrap">{transaction.date}</td>
                  <td className="py-2 pr-3">
                    {transaction.desc}{' '}
                    {highlighted && <Badge tone="clue">{copy.statement.clue}</Badge>}
                  </td>
                  <td className="py-2 pr-3 text-right">{amount(transaction.credit)}</td>
                  <td className="py-2 pr-3 text-right">{amount(transaction.debit)}</td>
                  {hasActions && (
                    <td className="py-2 text-right">{renderRowAction?.(transaction)}</td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
