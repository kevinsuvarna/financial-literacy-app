import { setup } from 'xstate';

/**
 * Placeholder root machine. Game progress will move through this machine via events (per
 * CLAUDE.md rule 2) once levels/tasks land — components must never mutate progress directly.
 */
export const appMachine = setup({}).createMachine({
  id: 'app',
  initial: 'idle',
  states: {
    idle: {},
  },
});
