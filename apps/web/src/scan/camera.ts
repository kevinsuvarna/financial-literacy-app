export type CameraSupport = 'supported' | 'insecure-context' | 'unsupported';

/** Whether this browser could run a camera scanner at all (it needs HTTPS or localhost). */
export function getCameraSupport(): CameraSupport {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    return typeof window !== 'undefined' && !window.isSecureContext
      ? 'insecure-context'
      : 'unsupported';
  }
  return 'supported';
}

/**
 * No camera ScanSource exists yet, so camera scanning is never active and the simulated picker
 * is always offered. When the QR decoder lands it registers with the scan hub like any other
 * source, and this becomes "is that source running".
 */
export function isCameraScanningActive(): boolean {
  return false;
}
