import { createScanEmitter, type ScanEvent, type ScanSource } from '../ScanSource';
import { parseScanPayload } from '../parsePayload';
import { classifyCameraError, getCameraSupport, type CameraErrorCode } from './cameraSupport';
import type { DecodeRequest, DecodeResponse, DecoderKind } from './decodeProtocol';
import { fitWithin } from './frameSize';

export type FacingMode = 'user' | 'environment';

/**
 * - `idle`     no camera stream held
 * - `starting` asking for the camera / waiting for the first frame
 * - `scanning` stream live and frames being decoded
 * - `standby`  stream live but nothing decoded (a non-table scene mid-level)
 * - `error`    could not start; stays here until `retry()` so we never re-prompt on our own
 */
export type CameraStatus = 'idle' | 'starting' | 'scanning' | 'standby' | 'error';

export interface CameraState {
  status: CameraStatus;
  error: CameraErrorCode | null;
  facingMode: FacingMode;
  /** True when the device has more than one camera to switch between. */
  canSwitch: boolean;
  decoder: DecoderKind | null;
}

export interface CameraDiagnostics {
  framesDecoded: number;
  codesRead: number;
  lastDecodeMs: number | null;
}

export interface CameraSource extends ScanSource {
  getState(): CameraState;
  onStateChange(listener: () => void): () => void;
  getDiagnostics(): CameraDiagnostics;
  /** Acquire the camera if needed and decode frames. Does nothing while in `error`. */
  start(): Promise<void>;
  /** Stop decoding but keep the stream, so resuming is instant and never re-prompts. */
  pause(): void;
  /** Release the camera entirely (its indicator light goes off). */
  stop(): void;
  /** Clear an error and try again — only ever called from an explicit player action. */
  retry(): Promise<void>;
  switchCamera(): Promise<void>;
}

export interface CameraSourceOptions {
  facingMode?: FacingMode;
  onFacingModeChange?: (facingMode: FacingMode) => void;
  parse?: (raw: string) => ScanEvent;
  /** Longer side of the frames sent for decoding, in pixels. */
  maxFrameSide?: number;
  framesPerSecond?: number;
  createWorker?: () => Worker;
}

/** If the worker hasn't answered a frame in this long, stop waiting for it. */
const DECODE_TIMEOUT_MS = 2000;

function createDecodeWorker(): Worker {
  return new Worker(new URL('./decode.worker.ts', import.meta.url), { type: 'module' });
}

function stopTracks(stream: MediaStream) {
  for (const track of stream.getTracks()) track.stop();
}

/**
 * The video element is never shown, but it must not be `display: none`: iOS Safari stops
 * delivering frames for a video that isn't rendered. 1×1px at near-zero opacity keeps it
 * "visible" to the browser and invisible to the player.
 */
function createHiddenVideo(): HTMLVideoElement {
  const video = document.createElement('video');
  video.muted = true;
  video.playsInline = true;
  video.autoplay = true;
  // The properties above don't reflect to attributes, and iOS reads the attributes.
  video.setAttribute('muted', '');
  video.setAttribute('playsinline', '');
  video.setAttribute('aria-hidden', 'true');
  video.tabIndex = -1;
  Object.assign(video.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '1px',
    height: '1px',
    opacity: '0.01',
    pointerEvents: 'none',
  });
  document.body.appendChild(video);
  return video;
}

export function createCameraSource(options: CameraSourceOptions = {}): CameraSource {
  const {
    parse = parseScanPayload,
    maxFrameSide = 640,
    framesPerSecond = 8,
    createWorker = createDecodeWorker,
    onFacingModeChange,
  } = options;
  const frameIntervalMs = 1000 / framesPerSecond;

  const emitter = createScanEmitter();
  const stateListeners = new Set<() => void>();
  const diagnostics: CameraDiagnostics = { framesDecoded: 0, codesRead: 0, lastDecodeMs: null };

  let state: CameraState = {
    status: 'idle',
    error: null,
    facingMode: options.facingMode ?? 'user',
    canSwitch: false,
    decoder: null,
  };

  let stream: MediaStream | null = null;
  let video: HTMLVideoElement | null = null;
  let worker: Worker | null = null;
  let workerReady = false;
  /** Whether the caller currently wants frames decoded (start) or just held (pause). */
  let wantDecoding = false;
  /** Bumped whenever the stream is released, so a slow getUserMedia can tell it was overtaken. */
  let generation = 0;
  let cancelFrameRequest: (() => void) | null = null;
  let awaitingDecodeSince: number | null = null;
  let lastFrameSentAt = -Infinity;
  let frameId = 0;

  function setState(patch: Partial<CameraState>) {
    state = { ...state, ...patch };
    for (const listener of stateListeners) listener();
  }

  function release() {
    cancelFrameRequest?.();
    cancelFrameRequest = null;
    if (stream) stopTracks(stream);
    stream = null;
    if (video) video.srcObject = null;
    awaitingDecodeSince = null;
  }

  function fail(error: CameraErrorCode) {
    generation += 1;
    release();
    setState({ status: 'error', error });
  }

  function onWorkerMessage(event: MessageEvent<DecodeResponse>) {
    const message = event.data;

    if (message.type === 'ready') {
      workerReady = true;
      setState({ decoder: message.decoder });
      return;
    }

    awaitingDecodeSince = null;

    if (message.type === 'error') {
      if (!message.fatal) return;
      worker?.terminate();
      worker = null;
      workerReady = false;
      fail('decoder');
      return;
    }

    diagnostics.framesDecoded += 1;
    diagnostics.lastDecodeMs = message.ms;
    // A frame sent just before pause()/stop() must not produce a scan afterwards.
    if (state.status !== 'scanning') return;

    for (const value of new Set(message.values)) {
      diagnostics.codesRead += 1;
      emitter.emit(parse(value));
    }
  }

  function ensureWorker() {
    if (worker) return;
    worker = createWorker();
    worker.addEventListener('message', onWorkerMessage);
    worker.addEventListener('error', () => {
      worker = null;
      workerReady = false;
      fail('decoder');
    });
  }

  async function sendFrame(element: HTMLVideoElement) {
    try {
      const size = fitWithin(element.videoWidth, element.videoHeight, maxFrameSide);
      const bitmap = await createImageBitmap(element, {
        resizeWidth: size.width,
        resizeHeight: size.height,
        resizeQuality: 'low',
      });
      if (!worker || state.status !== 'scanning') {
        bitmap.close();
        awaitingDecodeSince = null;
        return;
      }
      frameId += 1;
      const request: DecodeRequest = { type: 'frame', frameId, bitmap };
      worker.postMessage(request, [bitmap]);
    } catch {
      awaitingDecodeSince = null;
    }
  }

  function onVideoFrame() {
    cancelFrameRequest = null;
    if (state.status !== 'scanning' || !video) return;

    const time = performance.now();
    if (awaitingDecodeSince !== null && time - awaitingDecodeSince > DECODE_TIMEOUT_MS) {
      awaitingDecodeSince = null;
    }

    // One frame in flight at a time: if decoding is slower than the target rate, frames are
    // skipped rather than queued.
    const due = time - lastFrameSentAt >= frameIntervalMs;
    if (workerReady && awaitingDecodeSince === null && due && video.videoWidth > 0) {
      lastFrameSentAt = time;
      awaitingDecodeSince = time;
      void sendFrame(video);
    }

    requestNextFrame();
  }

  function requestNextFrame() {
    if (!video || cancelFrameRequest) return;
    const element = video;

    if ('requestVideoFrameCallback' in element) {
      const handle = element.requestVideoFrameCallback(onVideoFrame);
      cancelFrameRequest = () => element.cancelVideoFrameCallback(handle);
    } else {
      const handle = requestAnimationFrame(onVideoFrame);
      cancelFrameRequest = () => cancelAnimationFrame(handle);
    }
  }

  async function countCameras(): Promise<number> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter((device) => device.kind === 'videoinput').length;
    } catch {
      return 1;
    }
  }

  async function acquire() {
    generation += 1;
    const attempt = generation;
    setState({ status: 'starting', error: null });

    try {
      if (getCameraSupport() !== 'supported') {
        throw new DOMException('Camera API unavailable', 'NotFoundError');
      }

      const media = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: state.facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      if (attempt !== generation) {
        stopTracks(media);
        return;
      }
      stream = media;
      for (const track of media.getVideoTracks()) {
        // Unplugged, or permission revoked from the browser UI mid-game.
        track.addEventListener('ended', () => {
          if (stream === media) fail('no-camera');
        });
      }

      video ??= createHiddenVideo();
      video.srcObject = media;
      await video.play();
      if (attempt !== generation) return;

      ensureWorker();
      const canSwitch = (await countCameras()) > 1;
      if (attempt !== generation) return;

      setState({ status: wantDecoding ? 'scanning' : 'standby', canSwitch });
      if (wantDecoding) requestNextFrame();
    } catch (error) {
      if (attempt !== generation) return;
      fail(classifyCameraError(error));
    }
  }

  return {
    name: 'camera',
    subscribe: emitter.subscribe,
    getState: () => state,
    onStateChange(listener) {
      stateListeners.add(listener);
      return () => stateListeners.delete(listener);
    },
    getDiagnostics: () => ({ ...diagnostics }),

    async start() {
      wantDecoding = true;
      if (state.status === 'error' || state.status === 'starting') return;
      if (state.status === 'scanning') return;
      if (stream) {
        setState({ status: 'scanning' });
        requestNextFrame();
        return;
      }
      await acquire();
    },

    pause() {
      wantDecoding = false;
      if (state.status !== 'scanning') return;
      cancelFrameRequest?.();
      cancelFrameRequest = null;
      setState({ status: 'standby' });
    },

    stop() {
      wantDecoding = false;
      generation += 1;
      release();
      if (state.status !== 'error' && state.status !== 'idle') setState({ status: 'idle' });
    },

    async retry() {
      wantDecoding = true;
      if (state.status !== 'error') return;
      await acquire();
    },

    async switchCamera() {
      const facingMode: FacingMode = state.facingMode === 'user' ? 'environment' : 'user';
      setState({ facingMode });
      onFacingModeChange?.(facingMode);
      if (!stream) return;

      // The facing mode can't be changed on a live track; reopen the camera with the other one.
      release();
      await acquire();
    },
  };
}
