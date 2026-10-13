import { motion } from 'motion/react';
import { formatRupees, type Transaction } from '@app/content';

/**
 * The flagged transaction as a card. Rendered first on its statement row and then in the
 * evidence tray under the same `layoutId`, which is what makes Motion fly it from one to the
 * other. (Motion skips that flight when the player prefers reduced motion.)
 */
export function ClueCard({
  transaction,
  layoutId,
}: {
  transaction: Transaction;
  layoutId: string;
}) {
  return (
    <motion.div
      layoutId={layoutId}
      transition={{ type: 'spring', stiffness: 170, damping: 22 }}
      className="inline-flex flex-col gap-0.5 rounded-sm border-2 border-clue bg-surface px-3 py-2 text-sm text-ink shadow-lg"
    >
      <span className="font-semibold">{transaction.desc}</span>
      <span className="font-display">
        {formatRupees(transaction.debit > 0 ? transaction.debit : transaction.credit)}
      </span>
    </motion.div>
  );
}
