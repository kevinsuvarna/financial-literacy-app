import { assign, setup } from 'xstate';
import type { TaskKind } from '@app/content';
import type { GameContext, GameEvent } from './types';
import {
  createInitialContext,
  handleIdSubmission,
  handlePasskeySubmission,
  handleReportSubmission,
  markViewed,
} from './rules';

const SCAN_KINDS: TaskKind[] = ['scanOne', 'scanAll'];
const TAP_KINDS: TaskKind[] = ['tap'];
const HIGHLIGHT_KINDS: TaskKind[] = ['highlight'];
const CHOICE_KINDS: TaskKind[] = ['choice'];

export const gameMachine = setup({
  types: {} as {
    context: GameContext;
    events: GameEvent;
  },
  guards: {
    isReportSubmitted: ({ context }) => context.reportSubmitted,
  },
  actions: {
    adoptSave: assign(({ context, event }) =>
      event.type === 'HYDRATE' ? event.save.context : context,
    ),
  },
}).createMachine({
  id: 'game',
  context: createInitialContext,
  initial: 'notStarted',
  on: {
    RESET: {
      target: '.notStarted',
      actions: assign(() => createInitialContext()),
    },
    // A save from elsewhere takes over: the machine moves to that save's state, with its
    // context. The save has been checked (`parseGameSave`) before it gets this far.
    HYDRATE: [
      {
        guard: ({ event }) => event.save.value === 'notStarted',
        target: '.notStarted',
        actions: 'adoptSave',
      },
      {
        guard: ({ event }) => event.save.value === 'inGame',
        target: '.inGame',
        actions: 'adoptSave',
      },
      { target: '.missionComplete', actions: 'adoptSave' },
    ],
  },
  states: {
    notStarted: {
      on: {
        START: {
          target: 'inGame',
          actions: assign(({ context }) => markViewed(context, context.viewedTaskId)),
        },
      },
    },
    inGame: {
      always: { guard: 'isReportSubmitted', target: 'missionComplete' },
      on: {
        ARTEFACT_SCANNED: {
          actions: assign(({ context, event }) =>
            handleIdSubmission(context, event.id, SCAN_KINDS),
          ),
        },
        TAP_ZONE: {
          actions: assign(({ context, event }) => handleIdSubmission(context, event.id, TAP_KINDS)),
        },
        HIGHLIGHT_ROW: {
          actions: assign(({ context, event }) =>
            handleIdSubmission(context, event.id, HIGHLIGHT_KINDS),
          ),
        },
        CHOOSE: {
          actions: assign(({ context, event }) =>
            handleIdSubmission(context, event.id, CHOICE_KINDS),
          ),
        },
        SUBMIT_PASSKEY: {
          actions: assign(({ context, event }) => handlePasskeySubmission(context, event.code)),
        },
        SUBMIT_REPORT: {
          actions: assign(({ context }) => handleReportSubmission(context)),
        },
        GOTO_TASK: {
          actions: assign(({ context, event }) => markViewed(context, event.taskId)),
        },
      },
    },
    missionComplete: {
      on: {
        GOTO_TASK: {
          actions: assign(({ context, event }) => markViewed(context, event.taskId)),
        },
      },
    },
  },
});
