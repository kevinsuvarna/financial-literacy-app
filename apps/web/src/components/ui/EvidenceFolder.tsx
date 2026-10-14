import { motion } from 'motion/react';
import { LockIcon } from './icons';

const LIFT = { type: 'spring', stiffness: 170, damping: 16 } as const;

interface EvidenceFolderProps {
  open: boolean;
  /** Printed on the papers inside. */
  label: string;
}

/**
 * A manila folder held shut by a padlock. When `open` turns true the padlock drops away, the
 * cover swings down and the papers inside slide up into view.
 *
 * Decorative: say whether it is locked in text nearby. A folder that mounts already open is
 * simply drawn open; under reduced motion it changes state without the movement (MotionConfig).
 */
export function EvidenceFolder({ open, label }: EvidenceFolderProps) {
  return (
    <div
      aria-hidden="true"
      data-state={open ? 'open' : 'closed'}
      className="relative h-36 w-52 shrink-0 perspective-midrange"
    >
      <div className="absolute top-0 left-3 h-6 w-20 rounded-t-md bg-cork-edge" />
      <div className="absolute inset-x-0 top-4 bottom-0 rounded-md bg-cork-edge" />

      <motion.div
        initial={false}
        animate={{ y: open ? -30 : 0 }}
        transition={{ ...LIFT, delay: open ? 0.4 : 0 }}
        className="absolute inset-x-4 top-8 flex h-24 flex-col gap-2 rounded-sm border border-line bg-surface p-2"
      >
        <span className="font-display text-xs font-bold tracking-widest text-clue">{label}</span>
        <span className="h-0.5 w-full bg-line" />
        <span className="h-0.5 w-4/5 bg-line" />
        <span className="h-0.5 w-3/5 bg-line" />
      </motion.div>

      <motion.div
        initial={false}
        animate={{ rotateX: open ? -42 : 0 }}
        transition={{ ...LIFT, delay: open ? 0.25 : 0 }}
        className="absolute inset-x-0 bottom-0 h-24 origin-bottom rounded-md border-t-2 border-cork-edge bg-gold shadow-md"
      />

      <motion.div
        initial={false}
        animate={open ? { y: 60, rotate: 30, opacity: 0 } : { y: 0, rotate: 0, opacity: 1 }}
        transition={{ duration: 0.45, ease: 'easeIn' }}
        className="absolute top-1/2 left-1/2 -ml-6 flex size-12 items-center justify-center rounded-control border-2 border-gold bg-ink text-gold shadow-lg"
      >
        <LockIcon />
      </motion.div>
    </div>
  );
}
