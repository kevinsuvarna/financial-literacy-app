import { createScanEmitter, type SceneScanSource } from '../ScanSource';

/**
 * Debug-only input: Alt+1 … Alt+9 scans the Nth card the current task offers, and `scan()`
 * injects any id programmatically (the debug panel's "Inject scan" and "Jump").
 *
 * The shortcut needs Alt so it can't collide with a USB scanner, which types bare digits as
 * part of its URL.
 */
export interface KeyboardDebugSource extends SceneScanSource {
  scan(artefactId: string): void;
  /** The cards Alt+1…9 map to, in order. */
  setCandidates(artefactIds: string[]): void;
}

export function createKeyboardDebugSource(target?: EventTarget): KeyboardDebugSource {
  const emitter = createScanEmitter();
  let candidates: string[] = [];
  let listeningOn: EventTarget | null = null;

  function onKeyDown(event: Event) {
    if (!(event instanceof KeyboardEvent)) return;
    if (!event.altKey || event.ctrlKey || event.metaKey) return;

    // `code`, not `key`: on macOS Option+digit produces a symbol.
    const digit = /^Digit([1-9])$/.exec(event.code)?.[1];
    const id = digit ? candidates[Number(digit) - 1] : undefined;
    if (!id) return;

    event.preventDefault();
    emitter.emit({ type: 'ARTEFACT_SCANNED', id });
  }

  return {
    name: 'debug',
    subscribe: emitter.subscribe,
    scan: (id) => emitter.emit({ type: 'ARTEFACT_SCANNED', id }),
    setCandidates(ids) {
      candidates = ids;
    },
    start() {
      if (listeningOn) return;
      listeningOn = target ?? window;
      listeningOn.addEventListener('keydown', onKeyDown);
    },
    stop() {
      listeningOn?.removeEventListener('keydown', onKeyDown);
      listeningOn = null;
    },
  };
}
