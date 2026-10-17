/**
 * The camera scanner (spec 10.2). One instance for the whole app:
 * - Camera access is asked for on the game's first tap (START TRAINING / RESUME CASE), which
 *   iPad Safari requires; there is no in-game request (owner decision). Every table scene then
 *   starts scanning by itself.
 * - It decodes only while a table scene is attached, and stops shortly after the scene closes.
 * - The video feed is never shown: the element stays in the DOM, tiny and transparent
 *   (never display: none), `playsinline` and `muted`, as iPad Safari requires.
 * - It recovers when the app returns from the background or the tab becomes visible again.
 */
import type { decodeQr } from './decodeQr'
import { createRepeatFilter } from './repeatFilter'

export type ScannerStatus = 'off' | 'starting' | 'active' | 'denied' | 'unavailable' | 'error'

/** Returns false if the game couldn't take the code right now, so it should be tried again. */
export type DecodeHandler = (text: string) => boolean

const DECODE_INTERVAL_MS = 120
/** Frames are scaled down to this before decoding: plenty for a card held near the camera. */
const DECODE_MAX_SIDE = 640
/** Keeps the camera running between two table scenes in a row. */
const RELEASE_GRACE_MS = 1500
const REPEAT_WINDOW_MS = 2000

function statusForError(error: unknown): ScannerStatus {
  const name = error instanceof Error ? error.name : ''
  if (name === 'NotAllowedError' || name === 'SecurityError') return 'denied'
  if (name === 'NotFoundError' || name === 'OverconstrainedError' || name === 'TypeError') return 'unavailable'
  return 'error'
}

class CameraScanner {
  private status: ScannerStatus = 'off'
  private listeners = new Set<() => void>()
  /** Camera access has been asked for on a tap this page load. */
  private accessRequested = false
  private handler: DecodeHandler | null = null
  private stream: MediaStream | null = null
  private video: HTMLVideoElement | null = null
  private canvas: HTMLCanvasElement | null = null
  private decodeTimer: number | undefined
  private releaseTimer: number | undefined
  /** Increments on every start/stop, so a slow camera start can't revive a stopped scanner. */
  private generation = 0
  private filter = createRepeatFilter(REPEAT_WINDOW_MS)
  /** The QR decoder is loaded only once the camera is wanted, keeping it out of the first download. */
  private decode: typeof decodeQr | null = null

  constructor() {
    if (typeof document === 'undefined') return
    document.addEventListener('visibilitychange', () => this.recover())
    window.addEventListener('pageshow', () => this.recover())
    window.addEventListener('focus', () => this.recover())
  }

  getStatus = (): ScannerStatus => this.status

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  /** A table scene opens. Returns the cleanup for when it closes. */
  attach(handler: DecodeHandler): () => void {
    window.clearTimeout(this.releaseTimer)
    this.handler = handler
    this.start()
    return () => {
      if (this.handler !== handler) return
      this.handler = null
      this.releaseTimer = window.setTimeout(() => this.stop(), RELEASE_GRACE_MS)
    }
  }

  /**
   * Asks for camera access inside the game's first tap, so the browser's own permission prompt
   * appears at the start rather than mid-task. Does nothing after the first call.
   */
  requestAccess(): void {
    if (this.accessRequested) return
    this.accessRequested = true
    if (!this.decode) void import('./decodeQr').then((module) => (this.decode = module.decodeQr))
    if (this.handler) return this.start()
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) return this.setStatus('unavailable')
    navigator.mediaDevices
      .getUserMedia({ audio: false, video: { facingMode: 'user' } })
      // Access granted: release the camera until a table scene needs it.
      .then((stream) => {
        if (!this.stream) stream.getTracks().forEach((t) => t.stop())
      })
      .catch((error: unknown) => {
        if (!this.handler) this.setStatus(statusForError(error))
      })
  }

  /** TRY AGAIN after the camera failed. Runs inside the tap. */
  retry(): void {
    this.stop()
    this.start()
  }

  private setStatus(status: ScannerStatus) {
    if (status === this.status) return
    this.status = status
    this.listeners.forEach((listener) => listener())
  }

  private start() {
    if (!this.handler) return
    if (this.stream && this.stream.getVideoTracks().some((t) => t.readyState === 'live')) {
      this.setStatus('active')
      this.scheduleDecode()
      return
    }
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      this.setStatus('unavailable')
      return
    }
    const generation = ++this.generation
    this.setStatus('starting')
    if (!this.decode) void import('./decodeQr').then((module) => (this.decode = module.decodeQr))
    navigator.mediaDevices
      .getUserMedia({ audio: false, video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } })
      .then(async (stream) => {
        if (generation !== this.generation || !this.handler) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        this.stream = stream
        stream.getVideoTracks().forEach((t) => t.addEventListener('ended', () => this.recover()))
        const video = this.ensureVideo()
        video.srcObject = stream
        await video.play()
        if (generation !== this.generation) return
        this.setStatus('active')
        this.scheduleDecode()
      })
      .catch((error: unknown) => {
        if (generation === this.generation) this.setStatus(statusForError(error))
      })
  }

  private stop() {
    this.generation++
    window.clearTimeout(this.decodeTimer)
    this.stream?.getTracks().forEach((t) => t.stop())
    this.stream = null
    if (this.video) this.video.srcObject = null
    if (this.status === 'active' || this.status === 'starting') this.setStatus('off')
  }

  /** Back from the background, or the camera was interrupted: get going again. */
  private recover() {
    if (!this.handler || document.visibilityState !== 'visible') return
    const live = this.stream?.getVideoTracks().some((t) => t.readyState === 'live')
    if (!live) {
      this.stop()
      this.start()
    } else if (this.video?.paused) {
      this.video.play().catch(() => {
        this.stop()
        this.start()
      })
    }
  }

  private ensureVideo(): HTMLVideoElement {
    if (this.video) return this.video
    const video = document.createElement('video')
    video.setAttribute('playsinline', '')
    video.setAttribute('muted', '')
    video.setAttribute('aria-hidden', 'true')
    video.playsInline = true
    video.muted = true
    video.autoplay = true
    video.className = 'camera-feed'
    document.body.appendChild(video)
    this.video = video
    return video
  }

  private scheduleDecode() {
    window.clearTimeout(this.decodeTimer)
    this.decodeTimer = window.setTimeout(() => this.decodeFrame(), DECODE_INTERVAL_MS)
  }

  private decodeFrame() {
    const video = this.video
    if (!video || !this.stream || !this.handler) return
    if (this.decode && document.visibilityState === 'visible' && video.readyState >= video.HAVE_CURRENT_DATA && video.videoWidth > 0) {
      const scale = Math.min(1, DECODE_MAX_SIDE / Math.max(video.videoWidth, video.videoHeight))
      const width = Math.round(video.videoWidth * scale)
      const height = Math.round(video.videoHeight * scale)
      this.canvas ??= document.createElement('canvas')
      this.canvas.width = width
      this.canvas.height = height
      const context = this.canvas.getContext('2d', { willReadFrequently: true })
      if (context) {
        context.drawImage(video, 0, 0, width, height)
        const text = this.decode(context.getImageData(0, 0, width, height).data, width, height)
        if (text && this.filter.accept(text, performance.now()) && !this.handler(text)) this.filter.forget()
      }
    }
    this.scheduleDecode()
  }
}

export const cameraScanner = new CameraScanner()
