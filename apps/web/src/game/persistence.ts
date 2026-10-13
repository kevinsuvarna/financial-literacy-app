/**
 * localStorage persistence for the game actor's XState snapshot.
 *
 * The envelope carries its own schema version. If a future change to the machine/context shape
 * needs real migration, add a case to `migrate` keyed on the stored version — anything that
 * fails to load or migrate just falls back to a fresh game rather than throwing.
 */

const STORAGE_KEY = 'ssa-game';
const SCHEMA_VERSION = 1;

interface PersistedEnvelope {
  version: number;
  snapshot: unknown;
}

function isPersistedEnvelope(value: unknown): value is PersistedEnvelope {
  return (
    typeof value === 'object' &&
    value !== null &&
    'version' in value &&
    typeof (value as { version: unknown }).version === 'number' &&
    'snapshot' in value
  );
}

/** Bump SCHEMA_VERSION and add a case here whenever the persisted shape changes incompatibly. */
function migrate(envelope: PersistedEnvelope): unknown | undefined {
  if (envelope.version === SCHEMA_VERSION) return envelope.snapshot;
  return undefined;
}

export function loadSnapshot(): unknown | undefined {
  if (typeof window === 'undefined') return undefined;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return undefined;

    const parsed = JSON.parse(raw);
    if (!isPersistedEnvelope(parsed)) return undefined;

    return migrate(parsed);
  } catch {
    return undefined;
  }
}

export function saveSnapshot(snapshot: unknown): void {
  if (typeof window === 'undefined') return;

  try {
    const envelope: PersistedEnvelope = { version: SCHEMA_VERSION, snapshot };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
  } catch {
    // Best-effort — quota exceeded or storage disabled shouldn't break the game.
  }
}

export function clearSnapshot(): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Best-effort.
  }
}
