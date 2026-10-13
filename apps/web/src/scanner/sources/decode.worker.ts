// Decodes QR codes off the main thread. Uses the browser's own BarcodeDetector where it exists
// (Android, macOS, ChromeOS) and otherwise the `barcode-detector` ponyfill backed by zxing-wasm.
import wasmUrl from 'zxing-wasm/reader/zxing_reader.wasm?url';
import type { DecodeRequest, DecodeResponse, DecoderKind } from './decodeProtocol';

interface Detector {
  detect(image: ImageBitmap): Promise<Array<{ rawValue: string }>>;
}

interface NativeDetectorConstructor {
  new (options: { formats: string[] }): Detector;
  getSupportedFormats(): Promise<string[]>;
}

// This file runs in a worker, but the app is type-checked with the DOM lib only.
interface WorkerScope {
  postMessage(message: DecodeResponse): void;
  addEventListener(type: 'message', listener: (event: MessageEvent<DecodeRequest>) => void): void;
}
const scope = self as unknown as WorkerScope;

async function createNativeDetector(): Promise<Detector | null> {
  const Native = (globalThis as { BarcodeDetector?: NativeDetectorConstructor }).BarcodeDetector;
  if (!Native) return null;
  try {
    const formats = await Native.getSupportedFormats();
    return formats.includes('qr_code') ? new Native({ formats: ['qr_code'] }) : null;
  } catch {
    return null;
  }
}

async function createDetector(): Promise<{ detector: Detector; decoder: DecoderKind }> {
  const native = await createNativeDetector();
  if (native) return { detector: native, decoder: 'native' };

  const { BarcodeDetector, prepareZXingModule } = await import('barcode-detector/ponyfill');
  // By default zxing-wasm downloads its binary from a public CDN. The game has to work in a
  // classroom with no internet, so point it at the copy bundled with the app, and load it now
  // so a failure surfaces at start-up rather than on the first card.
  await prepareZXingModule({
    overrides: {
      locateFile: (path: string, prefix: string) =>
        path.endsWith('.wasm') ? wasmUrl : prefix + path,
    },
    fireImmediately: true,
  });
  return { detector: new BarcodeDetector({ formats: ['qr_code'] }), decoder: 'zxing-wasm' };
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

const ready = createDetector();
ready.then(
  ({ decoder }) => scope.postMessage({ type: 'ready', decoder }),
  (error: unknown) => scope.postMessage({ type: 'error', fatal: true, message: describe(error) }),
);

scope.addEventListener('message', (event) => {
  const { bitmap, frameId } = event.data;
  const startedAt = performance.now();

  ready
    .then(({ detector }) => detector.detect(bitmap))
    .then(
      (codes) =>
        scope.postMessage({
          type: 'result',
          frameId,
          values: codes.map((code) => code.rawValue),
          ms: performance.now() - startedAt,
        }),
      // A fatal start-up failure has already been reported once, above.
      (error: unknown) =>
        scope.postMessage({ type: 'error', fatal: false, message: describe(error) }),
    )
    .finally(() => bitmap.close());
});
