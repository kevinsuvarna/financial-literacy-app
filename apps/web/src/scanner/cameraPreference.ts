import type { FacingMode } from './sources/CameraSource';

/**
 * Whether the player has answered the in-story "switch on the scanner?" prompt, remembered per
 * device so it is asked once rather than on every scan task. This is a device setting, not game
 * progress, so RESET leaves it alone.
 */
export type CameraPreference = 'unasked' | 'enabled' | 'declined';

const PREFERENCE_KEY = 'ssa-scanner-camera';
const FACING_KEY = 'ssa-scanner-facing';

const listeners = new Set<() => void>();

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage disabled: the choice simply lasts for this page load.
  }
}

function load(): CameraPreference {
  const stored = read(PREFERENCE_KEY);
  return stored === 'enabled' || stored === 'declined' ? stored : 'unasked';
}

let preference: CameraPreference = load();

export function getCameraPreference(): CameraPreference {
  return preference;
}

export function setCameraPreference(next: CameraPreference): void {
  if (next === preference) return;
  preference = next;
  write(PREFERENCE_KEY, next);
  for (const listener of listeners) listener();
}

export function subscribeToCameraPreference(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Front camera by default: the device sits on the desk and cards are held up to it. */
export function getStoredFacingMode(): FacingMode {
  return read(FACING_KEY) === 'environment' ? 'environment' : 'user';
}

export function storeFacingMode(facingMode: FacingMode): void {
  write(FACING_KEY, facingMode);
}
