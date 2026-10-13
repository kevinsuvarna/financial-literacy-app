import { createScanEmitter, type ScanSource } from '../ScanSource';

/** The on-screen card picker: the fallback when there is no camera, and the dev default. */
export interface SimulatedSource extends ScanSource {
  scan(artefactId: string): void;
}

export function createSimulatedSource(): SimulatedSource {
  const emitter = createScanEmitter();
  return {
    name: 'simulated',
    subscribe: emitter.subscribe,
    scan: (id) => emitter.emit({ type: 'ARTEFACT_SCANNED', id }),
  };
}
