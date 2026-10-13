import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createScannerController } from './scannerController';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

function setup({ cameraEnabled = true } = {}) {
  const calls: string[] = [];
  const camera = {
    start: () => void calls.push('start'),
    pause: () => void calls.push('pause'),
    stop: () => void calls.push('stop'),
  };
  const sceneSource = { start: vi.fn(), stop: vi.fn() };
  const controller = createScannerController({
    camera,
    sceneSources: [sceneSource],
    idleMs: 60_000,
  });
  controller.setCameraEnabled(cameraEnabled);
  calls.length = 0;
  return { controller, calls, sceneSource };
}

describe('scanner controller', () => {
  it('starts the camera only for an active (table) scene', () => {
    const { controller, calls } = setup();

    controller.setMode('standby');
    expect(calls).not.toContain('start');

    controller.setMode('active');
    expect(calls.at(-1)).toBe('start');
  });

  it('pauses rather than stops when a level moves to a non-table scene', () => {
    const { controller, calls } = setup();
    controller.setMode('active');

    controller.setMode('standby');

    expect(calls).toEqual(['start', 'pause']);
  });

  it('releases the camera after 60s in standby, and not before', () => {
    const { controller, calls } = setup();
    controller.setMode('active');
    controller.setMode('standby');

    vi.advanceTimersByTime(59_999);
    expect(calls).not.toContain('stop');

    vi.advanceTimersByTime(1);
    expect(calls.at(-1)).toBe('stop');
  });

  it('does not count time spent actively scanning as idle', () => {
    const { controller, calls } = setup();
    controller.setMode('active');

    vi.advanceTimersByTime(10 * 60_000);

    expect(calls).toEqual(['start']);
  });

  it('cancels the idle countdown when scanning resumes', () => {
    const { controller, calls } = setup();
    controller.setMode('active');
    controller.setMode('standby');
    vi.advanceTimersByTime(30_000);

    controller.setMode('active');
    vi.advanceTimersByTime(60_000);

    expect(calls).toEqual(['start', 'pause', 'start']);
  });

  it('releases the camera on the Case Board and certificate (mode off)', () => {
    const { controller, calls } = setup();
    controller.setMode('active');

    controller.setMode('off');

    expect(calls.at(-1)).toBe('stop');
  });

  it('releases the camera while the tab is hidden and restarts it when shown again', () => {
    const { controller, calls } = setup();
    controller.setMode('active');

    controller.setVisible(false);
    expect(calls.at(-1)).toBe('stop');

    controller.setVisible(true);
    expect(calls.at(-1)).toBe('start');
  });

  it('never starts the camera until the player has enabled it', () => {
    const { controller, calls } = setup({ cameraEnabled: false });

    controller.setMode('active');
    expect(calls).not.toContain('start');

    controller.setCameraEnabled(true);
    expect(calls.at(-1)).toBe('start');
  });

  it('stops the camera as soon as the player turns it off', () => {
    const { controller, calls } = setup();
    controller.setMode('active');

    controller.setCameraEnabled(false);

    expect(calls.at(-1)).toBe('stop');
  });

  it('runs scene sources only while scanning is active and the tab is visible', () => {
    const { controller, sceneSource } = setup({ cameraEnabled: false });

    controller.setMode('active');
    expect(sceneSource.start).toHaveBeenCalledTimes(1);

    controller.setVisible(false);
    expect(sceneSource.stop).toHaveBeenCalled();

    sceneSource.start.mockClear();
    sceneSource.stop.mockClear();
    controller.setVisible(true);
    expect(sceneSource.start).toHaveBeenCalledTimes(1);

    controller.setMode('standby');
    expect(sceneSource.stop).toHaveBeenCalledTimes(1);
  });
});
