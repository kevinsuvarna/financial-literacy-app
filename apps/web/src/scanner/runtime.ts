import { artefactIds } from '@app/content';
import { playSound } from '../audio/sounds';
import { isDebugEnabled } from '../debug/debugFlag';
import { gameActor } from '../game/actor';
import { createScanGate, gateSource } from './ScanGate';
import {
  getCameraPreference,
  getStoredFacingMode,
  storeFacingMode,
  subscribeToCameraPreference,
} from './cameraPreference';
import { createScanHub } from './scanHub';
import { createScannerController } from './scannerController';
import { createCameraSource } from './sources/CameraSource';
import { createHidScannerSource } from './sources/HidScannerSource';
import { createKeyboardDebugSource } from './sources/KeyboardDebugSource';
import { createSimulatedSource } from './sources/SimulatedSource';

// The app's single set of scan sources, wired to the game. Everything here is a singleton for
// the same reason the game actor is: every screen must see the same scanner.

export const simulatedSource = createSimulatedSource();
export const keyboardDebugSource = createKeyboardDebugSource();
export const hidScannerSource = createHidScannerSource();
export const cameraSource = createCameraSource({
  facingMode: getStoredFacingMode(),
  onFacingModeChange: storeFacingMode,
});

/** The camera re-reads a card every frame, so it gets both the debounce and the feedback lock. */
export const cameraGate = createScanGate();
/** A trigger pull is deliberate; only an accidental double-read of the same code is filtered. */
const hidGate = createScanGate({ lockMs: 0 });

export const scanHub = createScanHub({
  deliver: (event) => gameActor.send(event),
  isKnownId: (id) => artefactIds.has(id),
});

// The picker and debug tools are single, deliberate actions and go through ungated.
scanHub.connect(simulatedSource);
scanHub.connect(keyboardDebugSource);
scanHub.connect(gateSource(hidScannerSource, hidGate));
scanHub.connect(gateSource(cameraSource, cameraGate));

scanHub.onScan((record) => {
  if (record.kind === 'artefact') playSound('scan');
});

export const scannerController = createScannerController({
  camera: cameraSource,
  sceneSources: isDebugEnabled() ? [hidScannerSource, keyboardDebugSource] : [hidScannerSource],
});

scannerController.setCameraEnabled(getCameraPreference() === 'enabled');
subscribeToCameraPreference(() => {
  scannerController.setCameraEnabled(getCameraPreference() === 'enabled');
});

scannerController.setVisible(document.visibilityState === 'visible');
document.addEventListener('visibilitychange', () => {
  scannerController.setVisible(document.visibilityState === 'visible');
});
