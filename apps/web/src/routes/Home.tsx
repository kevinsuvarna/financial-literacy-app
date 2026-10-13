import { useMachine } from '@xstate/react';
import { motion, useReducedMotion } from 'motion/react';
import { appMachine } from '../machines/appMachine';

export function Home() {
  const [state] = useMachine(appMachine);
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.main
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.4 }}
      className="flex min-h-screen flex-col items-center justify-center gap-2 bg-slate-950 text-slate-50"
    >
      <h1 className="text-2xl font-semibold">Save the Savings Account</h1>
      <p className="text-sm text-slate-300">Scaffold ready — app state: {state.value as string}</p>
    </motion.main>
  );
}
