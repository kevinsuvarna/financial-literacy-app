export type CameraSupport = 'supported' | 'insecure-context' | 'unsupported';

/** Whether this browser can run the camera scanner at all (it needs HTTPS or localhost). */
export function getCameraSupport(): CameraSupport {
  // `mediaDevices` is typed as always present, but it is undefined on insecure pages.
  const mediaDevices: MediaDevices | undefined =
    typeof navigator === 'undefined' ? undefined : navigator.mediaDevices;
  if (typeof mediaDevices?.getUserMedia === 'function') return 'supported';
  return typeof window !== 'undefined' && !window.isSecureContext
    ? 'insecure-context'
    : 'unsupported';
}

export type CameraErrorCode = 'denied' | 'no-camera' | 'in-use' | 'decoder' | 'unknown';

/** Maps a getUserMedia rejection onto the handful of cases the player-facing copy covers. */
export function classifyCameraError(error: unknown): CameraErrorCode {
  const name = error instanceof Error ? error.name : '';
  switch (name) {
    case 'NotAllowedError':
    case 'SecurityError':
      return 'denied';
    case 'NotFoundError':
    case 'OverconstrainedError':
      return 'no-camera';
    case 'NotReadableError':
    case 'AbortError':
      return 'in-use';
    default:
      return 'unknown';
  }
}
