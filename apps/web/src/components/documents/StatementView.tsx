import type { HTMLAttributes, ReactNode, Ref } from 'react';
import { copy, formatRupees, openingBalance, transactions, type Transaction } from '@app/content';
import { Card, Heading, Text, cx } from '../ui';

/** What an interactive use (the highlighter task) can add to one transaction's row. */
export interface StatementRowExtras {
  ref?: Ref<HTMLDivElement>;
  /** Spread onto the row itself: focus, keyboard handling, state attributes. */
  rowProps?: HTMLAttributes<HTMLDivElement> & { [dataAttribute: `data-${string}`]: string };
  /** Shown after the description, e.g. a "CLUE" tag. */
  tag?: ReactNode;
  /** Laid over the row (the row is its positioning context), e.g. highlighter ink. */
  overlay?: ReactNode;
  /** Placed in the page directly under the row, e.g. a sticky note. */
  below?: ReactNode;
}

interface StatementViewProps {
  /**
   * Rows are things the player acts on (a `grid`) rather than a table to read. The caller makes
   * them focusable through `getRowExtras`.
   */
  interactive?: boolean;
  /** Id of text describing how to use the interactive statement. */
  describedBy?: string;
  getRowExtras?: (transaction: Transaction) => StatementRowExtras;
}

// One grid template for every row keeps the columns aligned without a <table>. On narrow
// screens the date gets its own line above the description.
const columns =
  'grid grid-cols-[1fr_4.75rem_4.75rem] gap-x-3 sm:grid-cols-[6.5rem_1fr_5.5rem_5.5rem]';
const dateCell = 'col-span-3 text-xs text-ink-muted sm:col-span-1 sm:text-sm sm:text-ink';
const amountCell = 'text-right font-display';

function amount(value: number): string {
  return value > 0 ? formatRupees(value) : '—';
}

/**
 * Ananya's bank statement, drawn as a page from a paper ledger: ruled rows and a red margin.
 *
 * Built from divs with table roles rather than a <table> so that a row can be a positioning
 * context — highlighter ink and pinned tags sit directly on the row they belong to, on every
 * browser. Screen readers still get a table (or, when interactive, a grid).
 */
export function StatementView({
  interactive = false,
  describedBy,
  getRowExtras,
}: StatementViewProps) {
  const cellRole = interactive ? 'gridcell' : 'cell';

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

      <div
        role={interactive ? 'grid' : 'table'}
        aria-label={copy.statement.heading}
        aria-describedby={describedBy}
        className="border-l-4 border-clue/40 pl-3 text-sm"
      >
        <div role="rowgroup">
          <div role="row" className={cx(columns, 'border-b-2 border-ink-muted py-2 font-semibold')}>
            <span role="columnheader" className={dateCell}>
              {copy.statement.date}
            </span>
            <span role="columnheader">{copy.statement.description}</span>
            <span role="columnheader" className="text-right">
              {copy.statement.credit}
            </span>
            <span role="columnheader" className="text-right">
              {copy.statement.debit}
            </span>
          </div>
        </div>

        <div role="rowgroup">
          <div role="row" className={cx(columns, 'border-b border-line py-2')}>
            <span role={cellRole} className={cx(dateCell, 'hidden sm:block')} />
            <span role="rowheader" className="font-semibold">
              {copy.statement.openingBalance}
            </span>
            <span
              role={cellRole}
              aria-colspan={2}
              className={cx(amountCell, 'col-span-2 font-bold')}
            >
              {formatRupees(openingBalance)}
            </span>
          </div>

          {transactions.map((transaction) => {
            const extras = getRowExtras?.(transaction) ?? {};
            return (
              <div key={transaction.id}>
                <div className="relative">
                  <div
                    role="row"
                    ref={extras.ref}
                    {...extras.rowProps}
                    className={cx(columns, 'border-b border-line py-2', extras.rowProps?.className)}
                  >
                    <span role={cellRole} className={dateCell}>
                      {transaction.date}
                    </span>
                    <span role={cellRole}>
                      {transaction.desc}
                      {extras.tag}
                    </span>
                    <span role={cellRole} className={amountCell}>
                      {amount(transaction.credit)}
                    </span>
                    <span role={cellRole} className={amountCell}>
                      {amount(transaction.debit)}
                    </span>
                  </div>
                  {extras.overlay}
                </div>
                {extras.below}
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
