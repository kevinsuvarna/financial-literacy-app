/**
 * CLAUDE.md rule 3: every artefact input — camera, USB scanner, simulated picker, debug tools —
 * is a ScanSource emitting ARTEFACT_SCANNED{id}. Nothing else may tell the game a card was
 * scanned.
 *
 * A source that reads raw codes (camera, USB scanner) can also report a code that isn't one of
 * ours. That never reaches the game; the UI turns it into a friendly "not part of the case
 * file" message.
 */
export interface ArtefactScannedEvent {
  type: 'ARTEFACT_SCANNED';
  id: string;
}

export interface UnknownCodeScannedEvent {
  type: 'UNKNOWN_CODE_SCANNED';
  raw: string;
}

export type ScanEvent = ArtefactScannedEvent | UnknownCodeScannedEvent;
export type ScanListener = (event: ScanEvent) => void;

export interface ScanSource {
  readonly name: string;
  subscribe(listener: ScanListener): () => void;
}

/** A source that only listens between start() and stop(). Both must be safe to call twice. */
export interface SceneScanSource extends ScanSource {
  start(): void;
  stop(): void;
}

export interface ScanEmitter {
  subscribe(listener: ScanListener): () => void;
  emit(event: ScanEvent): void;
}

export function createScanEmitter(): ScanEmitter {
  const listeners = new Set<ScanListener>();
  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    emit(event) {
      for (const listener of listeners) listener(event);
    },
  };
}
