import { createActor, type ActorOptions } from 'xstate';
import { gameMachine } from './machine';
import { loadSnapshot, saveSnapshot } from './persistence';

// Dev-only, and kept out of Vitest runs (where import.meta.env.DEV is also true) so tests never
// try to open a browser inspector window. The dynamic import keeps the inspector's websocket/UI
// code out of production bundles entirely, since `import.meta.env.DEV` is statically false there.
const inspector =
  import.meta.env.DEV && !import.meta.env.VITEST
    ? (await import('@statelyai/inspect')).createBrowserInspector()
    : undefined;

const restoredSnapshot = loadSnapshot();

const actorOptions: ActorOptions<typeof gameMachine> = {
  inspect: inspector?.inspect,
};
if (restoredSnapshot !== undefined) {
  actorOptions.snapshot = restoredSnapshot as NonNullable<typeof actorOptions.snapshot>;
}

export const gameActor = createActor(gameMachine, actorOptions);

gameActor.subscribe(() => {
  saveSnapshot(gameActor.getPersistedSnapshot());
});

gameActor.start();
