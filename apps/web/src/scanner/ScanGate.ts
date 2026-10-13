import type { ScanEvent, ScanSource } from './ScanSource';

export const SAME_CODE_DEBOUNCE_MS = 1500;
export const FEEDBACK_LOCK_MS = 2000;

export interface ScanGateOptions {
  /** A code is ignored until it has been out of sight for this long. */
  debounceMs?: number;
  /** After a scan gets through, every other code is ignored for this long. */
  lockMs?: number;
  now?: () => number;
}

export interface ScanGate {
  /** Whether a sighting of `key` should be let through. Call once per sighting. */
  admit(key: string): boolean;
  isLocked(): boolean;
  getStats(): { admitted: number; suppressed: number };
  reset(): void;
}

/**
 * Stops a camera that sees the same card eight times a second from reporting it eight times a
 * second.
 *
 * - Same-code debounce is *sliding*: each sighting restarts the clock, so a card held in view
 *   fires once however long it is held, and can fire again only after it has been taken away
 *   for `debounceMs`. A fixed window would re-fire a held wrong card every 1.5s and run up the
 *   attempt counter.
 * - The lock covers the feedback for the scan that just got through: a different card shown
 *   during it is dropped (not queued), and fires on its first sighting after the lock ends.
 */
export function createScanGate({
  debounceMs = SAME_CODE_DEBOUNCE_MS,
  lockMs = FEEDBACK_LOCK_MS,
  now = Date.now,
}: ScanGateOptions = {}): ScanGate {
  let lastKey: string | null = null;
  let lastSeenAt = -Infinity;
  let lockedUntil = -Infinity;
  let admitted = 0;
  let suppressed = 0;

  return {
    admit(key) {
      const time = now();

      if (key === lastKey && time - lastSeenAt < debounceMs) {
        lastSeenAt = time;
        suppressed += 1;
        return false;
      }
      if (time < lockedUntil) {
        suppressed += 1;
        return false;
      }

      lastKey = key;
      lastSeenAt = time;
      lockedUntil = time + lockMs;
      admitted += 1;
      return true;
    },
    isLocked: () => now() < lockedUntil,
    getStats: () => ({ admitted, suppressed }),
    reset() {
      lastKey = null;
      lastSeenAt = -Infinity;
      lockedUntil = -Infinity;
    },
  };
}

function gateKey(event: ScanEvent): string {
  return event.type === 'ARTEFACT_SCANNED' ? `artefact:${event.id}` : `unknown:${event.raw}`;
}

/** Wraps a source so only the scans its gate admits reach subscribers. */
export function gateSource<S extends ScanSource>(source: S, gate: ScanGate): S {
  return {
    ...source,
    subscribe(listener) {
      return source.subscribe((event) => {
        if (gate.admit(gateKey(event))) listener(event);
      });
    },
  };
}
