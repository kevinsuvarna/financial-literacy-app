import { useSyncExternalStore } from 'react';
import type { ScannerStats } from './scanHub';
import { scanHub } from './sources';

export function useScannerStats(): ScannerStats {
  return useSyncExternalStore(scanHub.subscribe, scanHub.getStats);
}
