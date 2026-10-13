import { z } from 'zod';

export const transactionSchema = z
  .object({
    id: z.string().min(1),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
    desc: z.string().min(1),
    credit: z.number().nonnegative(),
    debit: z.number().nonnegative(),
  })
  .refine((t) => t.credit === 0 || t.debit === 0, {
    message: 'a transaction row cannot have both a credit and a debit',
  })
  .refine((t) => t.credit > 0 || t.debit > 0, {
    message: 'a transaction row must move some amount',
  });

export type Transaction = z.infer<typeof transactionSchema>;

/** Placeholder opening balance — real figures land once the Figma statement artefact is final. */
export const openingBalance = 12_450;

export const chequeIssuedTransactionId = 'txn-03';
export const chequeReturnedTransactionId = 'txn-04';
export const suspiciousTransactionId = 'txn-05';

export const transactions: Transaction[] = z.array(transactionSchema).parse([
  {
    id: 'txn-01',
    date: '2025-01-02',
    desc: 'UPI Credit — Pocket Money from Dad',
    credit: 2000,
    debit: 0,
  },
  {
    id: 'txn-02',
    date: '2025-01-05',
    desc: 'ATM Withdrawal',
    credit: 0,
    debit: 1500,
  },
  {
    id: chequeIssuedTransactionId,
    date: '2025-01-08',
    desc: 'Cheque Issued — School Fees',
    credit: 0,
    debit: 3500,
  },
  {
    id: chequeReturnedTransactionId,
    date: '2025-01-10',
    desc: 'Cheque Returned — School Fees',
    credit: 3500,
    debit: 0,
  },
  {
    id: suspiciousTransactionId,
    date: '2025-01-12',
    desc: 'Mobile Recharge — CAMS TEL',
    credit: 0,
    debit: 5999,
  },
  {
    id: 'txn-06',
    date: '2025-01-15',
    desc: 'UPI Credit — Birthday Gift',
    credit: 1000,
    debit: 0,
  },
  {
    id: 'txn-07',
    date: '2025-01-18',
    desc: 'Grocery Store Payment',
    credit: 0,
    debit: 450,
  },
]);

const transactionsById = new Map(transactions.map((t) => [t.id, t]));

export function getTransaction(id: string): Transaction | undefined {
  return transactionsById.get(id);
}

/** The amount moved by a transaction, regardless of whether it was a credit or a debit. */
export function getTransactionAmount(id: string): number {
  const transaction = getTransaction(id);
  if (!transaction) throw new Error(`Unknown transaction id: ${id}`);
  return transaction.credit > 0 ? transaction.credit : transaction.debit;
}

export function getTotalCredits(): number {
  return transactions.reduce((total, t) => total + t.credit, 0);
}

export function getTotalDebits(): number {
  return transactions.reduce((total, t) => total + t.debit, 0);
}

/** Closing balance is always derived from the ledger, never stored as a literal. */
export function getClosingBalance(): number {
  return transactions.reduce((balance, t) => balance + t.credit - t.debit, openingBalance);
}
