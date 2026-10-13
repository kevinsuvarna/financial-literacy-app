import { artefactIds } from '@app/content';
import { gameActor } from '../game/actor';
import { createManualScanSource } from './ScanSource';
import { createScanHub } from './scanHub';

/** The on-screen card picker — the stand-in for the camera. */
export const simulatedScanSource = createManualScanSource('simulated');

/** Scans injected from the ?debug=1 panel. */
export const debugScanSource = createManualScanSource('debug');

export const scanHub = createScanHub({
  deliver: (event) => gameActor.send(event),
  isKnownId: (id) => artefactIds.has(id),
});

scanHub.connect(simulatedScanSource);
scanHub.connect(debugScanSource);
