import { useSyncExternalStore } from 'react';
import {
  getCameraPreference,
  subscribeToCameraPreference,
  type CameraPreference,
} from './cameraPreference';
import { cameraSource, scanHub } from './runtime';
import type { ScannerStats } from './scanHub';
import type { CameraState } from './sources/CameraSource';

export function useScannerStats(): ScannerStats {
  return useSyncExternalStore(scanHub.subscribe, scanHub.getStats);
}

export function useCameraState(): CameraState {
  return useSyncExternalStore(cameraSource.onStateChange, cameraSource.getState);
}

export function useCameraPreference(): CameraPreference {
  return useSyncExternalStore(subscribeToCameraPreference, getCameraPreference);
}
