/**
 * CLAUDE.md rule 3: every artefact input — camera, simulated picker, debug injection — is a
 * ScanSource emitting ARTEFACT_SCANNED{id}. Nothing else is allowed to tell the game a card was
 * scanned.
 */
export interface ArtefactScannedEvent {
  type: 'ARTEFACT_SCANNED';
  id: string;
}

export type ScanListener = (event: ArtefactScannedEvent) => void;

export interface ScanSource {
  readonly name: string;
  subscribe(listener: ScanListener): () => void;
}

/** A source driven by an explicit call — the simulated picker and the debug panel. */
export interface ManualScanSource extends ScanSource {
  scan(id: string): void;
}

export function createManualScanSource(name: string): ManualScanSource {
  const listeners = new Set<ScanListener>();
  return {
    name,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    scan(id) {
      for (const listener of listeners) listener({ type: 'ARTEFACT_SCANNED', id });
    },
  };
}
