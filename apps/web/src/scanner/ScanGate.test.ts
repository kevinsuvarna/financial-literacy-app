import { describe, expect, it } from 'vitest';
import { createScanGate, gateSource } from './ScanGate';
import { createScanEmitter, type ScanEvent } from './ScanSource';

function setup(options: { debounceMs?: number; lockMs?: number } = {}) {
  let time = 0;
  const gate = createScanGate({ debounceMs: 1500, lockMs: 0, ...options, now: () => time });
  return {
    gate,
    at(ms: number) {
      time = ms;
    },
  };
}

describe('same-code debounce', () => {
  it('lets the first sighting of a code through', () => {
    const { gate } = setup();
    expect(gate.admit('a')).toBe(true);
  });

  it('suppresses the same code seen again within 1.5s', () => {
    const { gate, at } = setup();
    gate.admit('a');
    at(1499);
    expect(gate.admit('a')).toBe(false);
  });

  it('lets the same code through again once it has been out of sight for 1.5s', () => {
    const { gate, at } = setup();
    gate.admit('a');
    at(1500);
    expect(gate.admit('a')).toBe(true);
  });

  it('fires only once for a card held in view, however long it is held', () => {
    const { gate, at } = setup();
    const results: boolean[] = [];
    // ~8 sightings a second for ten seconds.
    for (let ms = 0; ms <= 10_000; ms += 125) {
      at(ms);
      results.push(gate.admit('a'));
    }
    expect(results.filter(Boolean)).toHaveLength(1);
  });

  it('measures the 1.5s from the last sighting, not from the first', () => {
    const { gate, at } = setup();
    gate.admit('a');
    at(1000);
    gate.admit('a');
    at(2000);
    // 2s after the first sighting, but only 1s after the card was last seen.
    expect(gate.admit('a')).toBe(false);
    at(3500);
    expect(gate.admit('a')).toBe(true);
  });

  it('does not hold back a different code', () => {
    const { gate, at } = setup();
    gate.admit('a');
    at(100);
    expect(gate.admit('b')).toBe(true);
  });

  it('remembers only the most recent code', () => {
    const { gate, at } = setup();
    gate.admit('a');
    at(100);
    gate.admit('b');
    at(200);
    expect(gate.admit('a')).toBe(true);
  });
});

describe('feedback lock', () => {
  it('drops a different code shown while feedback is on screen', () => {
    const { gate, at } = setup({ lockMs: 2000 });
    gate.admit('a');
    at(1999);
    expect(gate.admit('b')).toBe(false);
    expect(gate.isLocked()).toBe(true);
  });

  it('lets that code through on its first sighting after the lock ends', () => {
    const { gate, at } = setup({ lockMs: 2000 });
    gate.admit('a');
    at(500);
    gate.admit('b');
    at(2000);
    expect(gate.isLocked()).toBe(false);
    expect(gate.admit('b')).toBe(true);
  });

  it('starts a new lock for each scan that gets through', () => {
    const { gate, at } = setup({ lockMs: 2000 });
    gate.admit('a');
    at(2000);
    gate.admit('b');
    at(3999);
    expect(gate.admit('c')).toBe(false);
    at(4000);
    expect(gate.admit('c')).toBe(true);
  });

  it('keeps suppressing the original card after the lock, while it stays in view', () => {
    const { gate, at } = setup({ lockMs: 500 });
    gate.admit('a');
    for (let ms = 125; ms <= 3000; ms += 125) {
      at(ms);
      expect(gate.admit('a')).toBe(false);
    }
  });
});

describe('bookkeeping', () => {
  it('counts admitted and suppressed sightings', () => {
    const { gate, at } = setup();
    gate.admit('a');
    at(10);
    gate.admit('a');
    at(20);
    gate.admit('b');
    expect(gate.getStats()).toEqual({ admitted: 2, suppressed: 1 });
  });

  it('forgets everything on reset', () => {
    const { gate, at } = setup({ lockMs: 2000 });
    gate.admit('a');
    at(10);
    gate.reset();
    expect(gate.admit('a')).toBe(true);
  });
});

describe('gateSource', () => {
  it('passes only admitted events on, keeping artefacts and unknown codes apart', () => {
    let time = 0;
    const emitter = createScanEmitter();
    const gated = gateSource(
      { name: 'camera', subscribe: emitter.subscribe },
      createScanGate({ debounceMs: 1500, lockMs: 0, now: () => time }),
    );
    const received: ScanEvent[] = [];
    gated.subscribe((event) => received.push(event));

    emitter.emit({ type: 'ARTEFACT_SCANNED', id: 'x' });
    time = 100;
    emitter.emit({ type: 'ARTEFACT_SCANNED', id: 'x' });
    time = 200;
    emitter.emit({ type: 'UNKNOWN_CODE_SCANNED', raw: 'x' });

    expect(gated.name).toBe('camera');
    expect(received).toEqual([
      { type: 'ARTEFACT_SCANNED', id: 'x' },
      { type: 'UNKNOWN_CODE_SCANNED', raw: 'x' },
    ]);
  });
});
