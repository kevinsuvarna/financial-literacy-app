import { describe, expect, it, vi } from 'vitest';
import { createScanEmitter, type ArtefactScannedEvent, type ScanEvent } from './ScanSource';
import { createScanHub, type ScanRecord } from './scanHub';

function source(name: string) {
  const emitter = createScanEmitter();
  return {
    name,
    subscribe: emitter.subscribe,
    scan: (id: string) => emitter.emit({ type: 'ARTEFACT_SCANNED', id }),
    emit: (event: ScanEvent) => emitter.emit(event),
  };
}

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
  it('forwards a known artefact from a connected source as ARTEFACT_SCANNED', () => {
    const { hub, delivered } = setup();
    const simulated = source('simulated');
    hub.connect(simulated);

    simulated.scan('known-a');

    expect(delivered).toEqual([{ type: 'ARTEFACT_SCANNED', id: 'known-a' }]);
  });

  it('delivers nothing from a source that was never connected or has been disconnected', () => {
    const { hub, delivered } = setup();
    const simulated = source('simulated');

    simulated.scan('known-a');
    const disconnect = hub.connect(simulated);
    disconnect();
    simulated.scan('known-b');

    expect(delivered).toEqual([]);
    expect(hub.getStats().total).toBe(0);
  });

  it('counts scans per source and records the last one', () => {
    const { hub } = setup();
    const simulated = source('simulated');
    const camera = source('camera');
    hub.connect(simulated);
    hub.connect(camera);

    simulated.scan('known-a');
    simulated.scan('known-b');
    camera.scan('known-c');

    expect(hub.getStats()).toEqual({
      total: 3,
      unknown: 0,
      bySource: { simulated: 2, camera: 1 },
      last: { kind: 'artefact', id: 'known-c', source: 'camera', at: 1234, seq: 3 },
    });
  });

  it('keeps an unknown code away from the game and records what was read', () => {
    const { hub, delivered } = setup();
    const camera = source('camera');
    hub.connect(camera);

    camera.emit({ type: 'UNKNOWN_CODE_SCANNED', raw: 'https://example.com/menu' });

    expect(delivered).toEqual([]);
    expect(hub.getStats().unknown).toBe(1);
    expect(hub.getStats().last).toMatchObject({ kind: 'unknown', raw: 'https://example.com/menu' });
  });

  it('treats an artefact id that is not in the case file as unknown too', () => {
    const { hub, delivered } = setup();
    const debug = source('debug');
    hub.connect(debug);

    debug.scan('mystery');

    expect(delivered).toEqual([]);
    expect(hub.getStats().last).toMatchObject({ kind: 'unknown', raw: 'mystery' });
  });

  it('tells onScan listeners about each scan, after the game has received it', () => {
    const { hub, delivered } = setup();
    const simulated = source('simulated');
    hub.connect(simulated);
    const seen: Array<[ScanRecord['kind'], number]> = [];
    const stop = hub.onScan((record) => seen.push([record.kind, delivered.length]));

    simulated.scan('known-a');
    simulated.scan('mystery');
    stop();
    simulated.scan('known-b');

    expect(seen).toEqual([
      ['artefact', 1],
      ['unknown', 1],
    ]);
  });

  it('notifies subscribers with a fresh stats object on each scan', () => {
    const { hub } = setup();
    const simulated = source('simulated');
    hub.connect(simulated);
    const listener = vi.fn();
    const before = hub.getStats();
    const unsubscribe = hub.subscribe(listener);

    simulated.scan('known-a');
    unsubscribe();
    simulated.scan('known-b');

    expect(listener).toHaveBeenCalledTimes(1);
    expect(hub.getStats()).not.toBe(before);
  });
});
