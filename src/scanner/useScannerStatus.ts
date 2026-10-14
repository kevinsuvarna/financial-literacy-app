import { useSyncExternalStore } from 'react'
import { cameraScanner, type ScannerStatus } from './cameraScanner'

export function useScannerStatus(): ScannerStatus {
  return useSyncExternalStore(cameraScanner.subscribe, cameraScanner.getStatus)
}
