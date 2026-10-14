import { createActor } from 'xstate';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SyncEngine } from '@app/sync-client';
import { progressSchema } from '@app/api-contract';
import { gameActor, isRestoring, onGameEvent, restoreGame } from '../game/actor';
import { gameMachine } from '../game/machine';
import { SCHEMA_VERSION } from '../game/persistence';
import { parseGameSave } from '../game/save';
import { getTaskStatus } from '../game/selectors';
import { jumpEvents } from '../game/solve';
import type { GameSave } from '../game/types';
import { applyRemoteSave, connectGameToSync, readLocalSave, type SyncedGame } from './gameSync';

// The real game — the same actor the app runs — connected to a stand-in engine that only
// records what it is told.

const game: SyncedGame = {
  getPersistedSnapshot: () => gameActor.getPersistedSnapshot(),
  schemaVersion: SCHEMA_VERSION,
  subscribe: (listener) => gameActor.subscribe(listener),
  onEvent: onGameEvent,
  restore: restoreGame,
  isRestoring,
};

function createRecordingEngine() {
  const notifyLocalChange = vi.fn();
  const recordEvent = vi.fn();
  return {
    notifyLocalChange,
    recordEvent,
    engine: { notifyLocalChange, recordEvent } as unknown as SyncEngine,
  };
}

/** A save made by a different game — another device — that got as far as `taskId`. */
function saveFromElsewhere(taskId: string): { snapshot: Record<string, unknown>; save: GameSave } {
  const other = createActor(gameMachine).start();
  const { value, context } = other.getSnapshot();
  for (const event of jumpEvents(String(value), context, taskId)) other.send(event);

  const snapshot = JSON.parse(JSON.stringify(other.getPersistedSnapshot())) as Record<
    string,
    unknown
  >;
  const save = parseGameSave(snapshot);
  if (!save) throw new Error('a real save did not parse');
  return { snapshot, save };
}

let disconnect = () => {};

beforeEach(() => {
  disconnect();
  gameActor.send({ type: 'RESET' });
});

function connect() {
  const recording = createRecordingEngine();
  disconnect = connectGameToSync(game, recording.engine);
  return recording;
}

describe('connectGameToSync', () => {
  it('tells the engine when the save changes — after the device already has it', () => {
    const { notifyLocalChange } = connect();
    notifyLocalChange.mockImplementation(() => {
      // By the time sync hears of a change, it is in localStorage.
      expect(window.localStorage.getItem('ssa-game')).toContain('"inGame"');
    });

    gameActor.send({ type: 'START' });

    expect(notifyLocalChange).toHaveBeenCalledTimes(1);
  });

  it('says nothing when an event leaves the save as it was', () => {
    const { notifyLocalChange, recordEvent } = connect();
    gameActor.send({ type: 'START' });
    gameActor.send({ type: 'ARTEFACT_SCANNED', id: 'account-savings' });
    notifyLocalChange.mockClear();
    recordEvent.mockClear();

    // The task is solved: scanning again, or tapping where there is nothing to tap, is a no-op.
    gameActor.send({ type: 'ARTEFACT_SCANNED', id: 'account-savings' });
    gameActor.send({ type: 'TAP_ZONE', id: 'date' });

    expect(notifyLocalChange).not.toHaveBeenCalled();
    expect(recordEvent).not.toHaveBeenCalled();
  });

  it('queues each attempt as an event', () => {
    const { recordEvent } = connect();
    gameActor.send({ type: 'START' });
    gameActor.send({ type: 'ARTEFACT_SCANNED', id: 'account-current' });
    gameActor.send({ type: 'ARTEFACT_SCANNED', id: 'account-savings' });

    expect(recordEvent.mock.calls.map(([event]) => event)).toEqual([
      { taskId: 'l1-t1-account-type', kind: 'scan', artefactId: 'account-current', correct: false },
      { taskId: 'l1-t1-account-type', kind: 'scan', artefactId: 'account-savings', correct: true },
    ]);
  });

  it('stops when disconnected', () => {
    const { notifyLocalChange, recordEvent } = connect();
    disconnect();
    disconnect = () => {};

    gameActor.send({ type: 'START' });
    gameActor.send({ type: 'ARTEFACT_SCANNED', id: 'account-current' });

    expect(notifyLocalChange).not.toHaveBeenCalled();
    expect(recordEvent).not.toHaveBeenCalled();
  });
});

describe('a save taken from the server', () => {
  it('replaces the running game, through the machine', () => {
    gameActor.send({ type: 'START' });
    const { snapshot } = saveFromElsewhere('l2-t1-closing-balance');

    const taken = applyRemoteSave(game, { snapshot, version: SCHEMA_VERSION, updatedAt: 5 });

    expect(taken).toBe(true);
    const { context, value } = gameActor.getSnapshot();
    expect(value).toBe('inGame');
    expect(context.viewedTaskId).toBe('l2-t1-closing-balance');
    expect(getTaskStatus(context, 'l1-t3-withdrawal-slip')).toBe('completed');
    expect(getTaskStatus(context, 'l2-t2-returned-cheque')).toBe('locked');
    // And it is saved to the device like any other change.
    expect(window.localStorage.getItem('ssa-game')).toContain('l2-t1-closing-balance');
  });

  it('is not echoed back to the server, or reported as attempts made here', () => {
    const { notifyLocalChange, recordEvent } = connect();
    const { snapshot } = saveFromElsewhere('l3-t1-spot-the-phish');

    applyRemoteSave(game, { snapshot, version: SCHEMA_VERSION, updatedAt: 5 });

    expect(notifyLocalChange).not.toHaveBeenCalled();
    expect(recordEvent).not.toHaveBeenCalled();
    expect(isRestoring()).toBe(false);

    // What the player does next is theirs again.
    gameActor.send({ type: 'CHOOSE', id: 'no-dont-click' });
    expect(notifyLocalChange).toHaveBeenCalledTimes(1);
    expect(recordEvent).toHaveBeenCalledTimes(1);
  });

  it('can be a finished mission, or a game not yet started', () => {
    const finished = createActor(gameMachine).start();
    const start = finished.getSnapshot();
    for (const event of jumpEvents(String(start.value), start.context, 'l3-t5-review-submit')) {
      finished.send(event);
    }
    finished.send({ type: 'SUBMIT_REPORT' });
    const snapshot = JSON.parse(JSON.stringify(finished.getPersistedSnapshot())) as Record<
      string,
      unknown
    >;

    expect(applyRemoteSave(game, { snapshot, version: SCHEMA_VERSION, updatedAt: 5 })).toBe(true);
    expect(gameActor.getSnapshot().value).toBe('missionComplete');
    expect(gameActor.getSnapshot().context.reportSubmitted).toBe(true);

    const fresh = JSON.parse(
      JSON.stringify(createActor(gameMachine).start().getPersistedSnapshot()),
    ) as Record<string, unknown>;
    expect(applyRemoteSave(game, { snapshot: fresh, version: SCHEMA_VERSION, updatedAt: 6 })).toBe(
      true,
    );
    expect(gameActor.getSnapshot().value).toBe('notStarted');
  });

  it('is refused if it is from another schema version, leaving the game untouched', () => {
    gameActor.send({ type: 'START' });
    const before = JSON.stringify(gameActor.getPersistedSnapshot());
    const { snapshot } = saveFromElsewhere('l2-t1-closing-balance');

    for (const version of [SCHEMA_VERSION + 1, SCHEMA_VERSION + 40]) {
      expect(applyRemoteSave(game, { snapshot, version, updatedAt: 5 })).toBe(false);
    }
    expect(JSON.stringify(gameActor.getPersistedSnapshot())).toBe(before);
  });

  it('is refused if it is not a game this build can run', () => {
    gameActor.send({ type: 'START' });
    const before = JSON.stringify(gameActor.getPersistedSnapshot());
    const { save } = saveFromElsewhere('l2-t1-closing-balance');
    const tasks = save.context.tasks;
    const [firstTaskId] = Object.keys(tasks);
    if (!firstTaskId) throw new Error('no tasks');
    const missingATask = Object.fromEntries(
      Object.entries(tasks).filter(([taskId]) => taskId !== firstTaskId),
    );

    const notGames: Record<string, unknown>[] = [
      {},
      { value: 'inGame' },
      { value: 'paused', context: save.context },
      { value: 'inGame', context: { ...save.context, viewedTaskId: 'no-such-task' } },
      { value: 'inGame', context: { ...save.context, tasks: missingATask } },
      { value: 'inGame', context: { ...save.context, reportSubmitted: 'yes' } },
      {
        value: 'inGame',
        context: {
          ...save.context,
          tasks: { ...tasks, [firstTaskId]: { ...tasks[firstTaskId], status: 'won' } },
        },
      },
    ];

    for (const snapshot of notGames) {
      expect(
        applyRemoteSave(game, { snapshot, version: SCHEMA_VERSION, updatedAt: 5 }),
        JSON.stringify(snapshot).slice(0, 60),
      ).toBe(false);
    }
    expect(JSON.stringify(gameActor.getPersistedSnapshot())).toBe(before);
  });
});

describe('readLocalSave', () => {
  it('reads a save the API accepts, small enough to send', () => {
    gameActor.send({ type: 'START' });
    const local = readLocalSave(game);

    expect(local.version).toBe(SCHEMA_VERSION);
    const sendable = JSON.parse(JSON.stringify({ ...local, updatedAt: 1 })) as unknown;
    expect(progressSchema.safeParse(sendable).success).toBe(true);
    expect(JSON.stringify(local.snapshot).length).toBeLessThan(16 * 1024);
  });

  it('round-trips: a save that was sent can be taken back', () => {
    const { snapshot } = saveFromElsewhere('l3-t4-scan-evidence');
    applyRemoteSave(game, { snapshot, version: SCHEMA_VERSION, updatedAt: 5 });

    const again = JSON.parse(JSON.stringify(readLocalSave(game).snapshot)) as unknown;

    expect(parseGameSave(again)).toEqual(parseGameSave(snapshot));
  });
});
