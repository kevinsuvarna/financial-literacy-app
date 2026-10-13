import type { ArtefactScannedEvent, ScanSource } from './ScanSource';

export interface LastScan {
  id: string;
  source: string;
  known: boolean;
  at: number;
}

export interface ScannerStats {
  total: number;
  /** Scans whose id isn't a registered artefact — e.g. a QR code from outside the game. */
  unknown: number;
  bySource: Record<string, number>;
  last: LastScan | null;
}

export interface ScanHub {
  /** Starts forwarding a source's scans; returns a disconnect function. */
  connect(source: ScanSource): () => void;
  getStats(): ScannerStats;
  subscribe(listener: () => void): () => void;
}

interface ScanHubOptions {
  deliver: (event: ArtefactScannedEvent) => void;
  isKnownId: (id: string) => boolean;
  now?: () => number;
}

const emptyStats: ScannerStats = { total: 0, unknown: 0, bySource: {}, last: null };

/**
 * The one place scans from every source converge before reaching the game. Unknown ids are
 * still delivered — deciding what a scan means is the machine's job — but they are counted.
 */
export function createScanHub({ deliver, isKnownId, now = Date.now }: ScanHubOptions): ScanHub {
  let stats = emptyStats;
  const listeners = new Set<() => void>();

  return {
    connect(source) {
      return source.subscribe((event) => {
        const known = isKnownId(event.id);
        stats = {
          total: stats.total + 1,
          unknown: stats.unknown + (known ? 0 : 1),
          bySource: { ...stats.bySource, [source.name]: (stats.bySource[source.name] ?? 0) + 1 },
          last: { id: event.id, source: source.name, known, at: now() },
        };
        deliver(event);
        for (const listener of listeners) listener();
      });
    },
    getStats: () => stats,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
