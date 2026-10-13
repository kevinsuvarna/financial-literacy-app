/** Messages between CameraSource (main thread) and decode.worker. */

export type DecoderKind = 'native' | 'zxing-wasm';

export interface DecodeFrameRequest {
  type: 'frame';
  frameId: number;
  /** Transferred to the worker, which closes it when done. */
  bitmap: ImageBitmap;
}

export type DecodeRequest = DecodeFrameRequest;

export type DecodeResponse =
  | { type: 'ready'; decoder: DecoderKind }
  | { type: 'result'; frameId: number; values: string[]; ms: number }
  /** `fatal` means no decoder could be created at all; otherwise one frame failed. */
  | { type: 'error'; fatal: boolean; message: string };
