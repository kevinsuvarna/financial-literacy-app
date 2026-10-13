import { describe, expect, it, vi } from 'vitest';
import { createManualScanSource, type ArtefactScannedEvent } from './ScanSource';
import { createScanHub } from './scanHub';

function setup() {
  const delivered: ArtefactScannedEvent[] = [];
  const hub = createScanHub({
    deliver: (event) => delivered.push(event),
    isKnownId: (id) => id.startsWith('known-'),
    now: () => 1234,
  });
  return { hub, delivered };
}

describe('scan hub', () => {
  it('forwards every scan from a connected source as ARTEFACT_SCANNED', () => {
    const { hub, delivered } = setup();
    const source = createManualScanSource('simulated');
    hub.connect(source);

    source.scan('known-a');

    expect(delivered).toEqual([{ type: 'ARTEFACT_SCANNED', id: 'known-a' }]);
  });

  it('delivers nothing from a source that was never connected or has been disconnected', () => {
    const { hub, delivered } = setup();
    const source = createManualScanSource('simulated');

    source.scan('known-a');
    const disconnect = hub.connect(source);
    disconnect();
    source.scan('known-b');

    expect(delivered).toEqual([]);
    expect(hub.getStats().total).toBe(0);
  });

  it('counts scans per source and records the last one', () => {
    const { hub } = setup();
    const simulated = createManualScanSource('simulated');
    const debug = createManualScanSource('debug');
    hub.connect(simulated);
    hub.connect(debug);

    simulated.scan('known-a');
    simulated.scan('known-b');
    debug.scan('known-c');

    expect(hub.getStats()).toEqual({
      total: 3,
      unknown: 0,
      bySource: { simulated: 2, debug: 1 },
      last: { id: 'known-c', source: 'debug', known: true, at: 1234 },
    });
  });

  it('still delivers an unknown id, but counts it as unknown', () => {
    const { hub, delivered } = setup();
    const source = createManualScanSource('simulated');
    hub.connect(source);

    source.scan('mystery');

    expect(delivered).toHaveLength(1);
    expect(hub.getStats().unknown).toBe(1);
    expect(hub.getStats().last?.known).toBe(false);
  });

  it('notifies subscribers with a fresh stats object on each scan', () => {
    const { hub } = setup();
    const source = createManualScanSource('simulated');
    hub.connect(source);
    const listener = vi.fn();
    const before = hub.getStats();
    const unsubscribe = hub.subscribe(listener);

    source.scan('known-a');
    unsubscribe();
    source.scan('known-b');

    expect(listener).toHaveBeenCalledTimes(1);
    expect(hub.getStats()).not.toBe(before);
  });
});
