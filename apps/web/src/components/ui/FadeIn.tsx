import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';

/** Opacity-only entrance; instant when the player prefers reduced motion (CLAUDE.md rule 6). */
export function FadeIn({ className, children }: { className?: string; children: ReactNode }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduceMotion ? 0 : 0.25 }}
    >
      {children}
    </motion.div>
  );
}
