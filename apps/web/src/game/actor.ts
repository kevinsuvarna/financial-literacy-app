import { createActor, type ActorOptions } from 'xstate';
import { gameMachine } from './machine';
import { loadSnapshot, saveSnapshot } from './persistence';

const INSPECT_KEY = 'ssa-inspect';

/**
 * The inspector opens a window to stately.ai — and where popups aren't available it navigates
 * the current tab there instead — so it is opt-in: `?inspect=1` turns it on for the browser tab
 * and `?inspect=0` turns it off.
 */
function inspectorRequested(): boolean {
  try {
    const param = new URLSearchParams(window.location.search).get('inspect');
    if (param === '1') window.sessionStorage.setItem(INSPECT_KEY, '1');
    if (param === '0') window.sessionStorage.removeItem(INSPECT_KEY);
    return window.sessionStorage.getItem(INSPECT_KEY) === '1';
  } catch {
    return false;
  }
}

// Dev-only, and kept out of Vitest runs (where import.meta.env.DEV is also true). The dynamic
// import keeps the inspector's code out of production bundles entirely, since
// `import.meta.env.DEV` is statically false there.
const inspector =
  import.meta.env.DEV && !import.meta.env.VITEST && inspectorRequested()
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
