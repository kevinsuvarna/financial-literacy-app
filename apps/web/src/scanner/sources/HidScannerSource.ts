import { createScanEmitter, type ScanEvent, type SceneScanSource } from '../ScanSource';
import { parseScanPayload } from '../parsePayload';

export interface HidScannerOptions {
  target?: EventTarget;
  parse?: (raw: string) => ScanEvent;
  /** Keys further apart than this are a person typing, not a scanner. */
  maxKeyGapMs?: number;
  /** Shorter bursts are ignored outright rather than reported as unknown codes. */
  minLength?: number;
  now?: () => number;
}

/**
 * A handheld USB/Bluetooth scanner is just a keyboard: it types the code's text within a few
 * milliseconds per key and presses Enter. This collects such a burst and treats it as a scan.
 *
 * What separates a scanner from a person is speed — every key, and the final Enter, must arrive
 * within `maxKeyGapMs` of the one before. A scan's Enter is swallowed so it can't also "click"
 * whichever button has focus.
 */
export function createHidScannerSource({
  target,
  parse = parseScanPayload,
  maxKeyGapMs = 100,
  minLength = 8,
  now = () => performance.now(),
}: HidScannerOptions = {}): SceneScanSource {
  const emitter = createScanEmitter();
  let buffer = '';
  let lastKeyAt = -Infinity;
  let listeningOn: EventTarget | null = null;

  function onKeyDown(event: Event) {
    if (!(event instanceof KeyboardEvent)) return;
    const time = now();
    const withinBurst = time - lastKeyAt <= maxKeyGapMs;

    if (event.key === 'Enter') {
      const code = withinBurst ? buffer : '';
      buffer = '';
      if (code.length < minLength) return;
      event.preventDefault();
      event.stopPropagation();
      emitter.emit(parse(code));
      return;
    }

    // Shift, arrows, F-keys and shortcuts are not part of a code.
    if (event.key.length !== 1 || event.ctrlKey || event.metaKey || event.altKey) return;

    if (!withinBurst) buffer = '';
    buffer += event.key;
    lastKeyAt = time;
  }

  return {
    name: 'hid',
    subscribe: emitter.subscribe,
    start() {
      if (listeningOn) return;
      buffer = '';
      listeningOn = target ?? window;
      // Capture phase, so the Enter is intercepted before a focused control acts on it.
      listeningOn.addEventListener('keydown', onKeyDown, true);
    },
    stop() {
      listeningOn?.removeEventListener('keydown', onKeyDown, true);
      listeningOn = null;
      buffer = '';
    },
  };
}
