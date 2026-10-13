import { afterEach, describe, expect, it } from 'vitest';
import type { ScanEvent } from '../ScanSource';
import { createHidScannerSource } from './HidScannerSource';

let stop: (() => void) | undefined;
afterEach(() => stop?.());

function setup() {
  let time = 0;
  const target = new EventTarget();
  const source = createHidScannerSource({ target, now: () => time });
  const scans: ScanEvent[] = [];
  source.subscribe((event) => scans.push(event));
  source.start();
  stop = source.stop;

  function press(key: string, gapMs: number, init: KeyboardEventInit = {}) {
    time += gapMs;
    const event = new KeyboardEvent('keydown', { key, cancelable: true, ...init });
    target.dispatchEvent(event);
    return event;
  }

  /** Types `text` then Enter, with `gapMs` between every key. Returns the Enter event. */
  function type(text: string, gapMs: number) {
    for (const key of text) press(key, gapMs);
    return press('Enter', gapMs);
  }

  return { source, scans, press, type };
}

describe('HID scanner source', () => {
  it('turns a fast burst ending in Enter into a scan', () => {
    const { scans, type } = setup();

    type('https://ssa.game/a/id-pan-card', 5);

    expect(scans).toEqual([{ type: 'ARTEFACT_SCANNED', id: 'id-pan-card' }]);
  });

  it('swallows the scan’s Enter so it cannot activate a focused button', () => {
    const { type } = setup();

    expect(type('https://ssa.game/a/id-pan-card', 5).defaultPrevented).toBe(true);
  });

  it('ignores the same text typed at human speed, and leaves its Enter alone', () => {
    const { scans, type } = setup();

    const enter = type('https://ssa.game/a/id-pan-card', 180);

    expect(scans).toEqual([]);
    expect(enter.defaultPrevented).toBe(false);
  });

  it('ignores a burst whose Enter arrives late', () => {
    const { scans, press } = setup();

    for (const key of 'https://ssa.game/a/id-pan-card') press(key, 5);
    press('Enter', 400);

    expect(scans).toEqual([]);
  });

  it('drops anything typed slowly before the burst', () => {
    const { scans, press, type } = setup();

    press('x', 500);
    press('y', 500);
    press('h', 500);
    type('ttps://ssa.game/a/id-pan-card', 5);

    expect(scans).toEqual([{ type: 'ARTEFACT_SCANNED', id: 'id-pan-card' }]);
  });

  it('skips modifier and navigation keys inside a burst', () => {
    const { scans, press } = setup();

    for (const key of 'https') press(key, 5);
    press('Shift', 5);
    press(':', 5, { shiftKey: true });
    for (const key of '//ssa.game/a/id-pan-card') press(key, 5);
    press('Enter', 5);

    expect(scans).toEqual([{ type: 'ARTEFACT_SCANNED', id: 'id-pan-card' }]);
  });

  it('reports a fast burst that is not one of our codes as unknown', () => {
    const { scans, type } = setup();

    type('9780141036144', 5);

    expect(scans).toEqual([{ type: 'UNKNOWN_CODE_SCANNED', raw: '9780141036144' }]);
  });

  it('ignores a very short burst rather than calling it an unknown code', () => {
    const { scans, type } = setup();

    type('109', 5);

    expect(scans).toEqual([]);
  });

  it('scans twice in a row', () => {
    const { scans, type } = setup();

    type('https://ssa.game/a/id-pan-card', 5);
    type('https://ssa.game/a/id-aadhaar-card', 5);

    expect(scans.map((scan) => scan.type === 'ARTEFACT_SCANNED' && scan.id)).toEqual([
      'id-pan-card',
      'id-aadhaar-card',
    ]);
  });

  it('hears nothing after stop()', () => {
    const { source, scans, type } = setup();

    source.stop();
    type('https://ssa.game/a/id-pan-card', 5);

    expect(scans).toEqual([]);
  });
});
