import type { ArtefactScannedEvent, ScanSource } from './ScanSource';

interface ScanRecordBase {
  /** 1-based position of this scan among everything the hub has seen. */
  seq: number;
  source: string;
  at: number;
}

/** What the hub made of one scan: a card from the case file, or a code that isn't ours. */
export type ScanRecord =
  | (ScanRecordBase & { kind: 'artefact'; id: string })
  | (ScanRecordBase & { kind: 'unknown'; raw: string });

export interface ScannerStats {
  total: number;
  /** Codes that aren't a registered artefact — e.g. a QR code from a cereal box. */
  unknown: number;
  bySource: Record<string, number>;
  last: ScanRecord | null;
}

export interface ScanHub {
  /** Starts forwarding a source's scans; returns a disconnect function. */
  connect(source: ScanSource): () => void;
  getStats(): ScannerStats;
  /** Notified after every scan, for state that mirrors `getStats()`. */
  subscribe(listener: () => void): () => void;
  /** Notified with each scan as it happens, for one-off effects such as the chime. */
  onScan(listener: (record: ScanRecord) => void): () => void;
}

interface ScanHubOptions {
  deliver: (event: ArtefactScannedEvent) => void;
  isKnownId: (id: string) => boolean;
  now?: () => number;
}

const emptyStats: ScannerStats = { total: 0, unknown: 0, bySource: {}, last: null };

/**
 * The one place scans from every source converge before reaching the game. Only artefacts in
 * the case file are delivered; anything else is recorded as unknown so the UI can say so.
 */
export function createScanHub({ deliver, isKnownId, now = Date.now }: ScanHubOptions): ScanHub {
  let stats = emptyStats;
  const listeners = new Set<() => void>();
  const scanListeners = new Set<(record: ScanRecord) => void>();

  return {
    connect(source) {
      return source.subscribe((event) => {
        const base = { seq: stats.total + 1, source: source.name, at: now() };
        const record: ScanRecord =
          event.type === 'ARTEFACT_SCANNED' && isKnownId(event.id)
            ? { ...base, kind: 'artefact', id: event.id }
            : {
                ...base,
                kind: 'unknown',
                raw: event.type === 'ARTEFACT_SCANNED' ? event.id : event.raw,
              };

        stats = {
          total: record.seq,
          unknown: stats.unknown + (record.kind === 'unknown' ? 1 : 0),
          bySource: { ...stats.bySource, [source.name]: (stats.bySource[source.name] ?? 0) + 1 },
          last: record,
        };

        if (record.kind === 'artefact') deliver({ type: 'ARTEFACT_SCANNED', id: record.id });
        for (const listener of scanListeners) listener(record);
        for (const listener of listeners) listener();
      });
    },
    getStats: () => stats,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    onScan(listener) {
      scanListeners.add(listener);
      return () => scanListeners.delete(listener);
    },
  };
}
