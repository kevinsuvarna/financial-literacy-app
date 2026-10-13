/**
 * What the current screen needs from the scanner:
 * - `active`  an unsolved scan task in a table scene — read codes now
 * - `standby` elsewhere in a level — keep the camera warm, read nothing
 * - `off`     Case Board, certificate, start screen — release the camera
 */
export type ScannerMode = 'off' | 'standby' | 'active';

export const STANDBY_IDLE_MS = 60_000;

interface ControlledCamera {
  start(): Promise<void> | void;
  pause(): void;
  stop(): void;
}

interface ControlledSceneSource {
  start(): void;
  stop(): void;
}

export interface ScannerControllerOptions {
  camera: ControlledCamera;
  /** Sources that listen only while scanning is active (USB scanner, debug keys). */
  sceneSources?: ControlledSceneSource[];
  /** How long the camera may sit in standby before it is released. */
  idleMs?: number;
}

export interface ScannerController {
  setMode(mode: ScannerMode): void;
  /** The tab's visibility. A hidden tab never holds the camera. */
  setVisible(visible: boolean): void;
  /** Whether the player has agreed to use the camera at all. */
  setCameraEnabled(enabled: boolean): void;
  getMode(): ScannerMode;
}

/**
 * Decides when the camera runs (CLAUDE.md rule 4: decoding only in table scenes).
 *
 * The stream is deliberately kept through the non-table scenes of a level, so walking from a
 * scan task to a screen task and back doesn't restart the camera. It is released when the
 * player leaves the level, hides the tab, or has spent `idleMs` in standby — "idle" here means
 * the scanner has had nothing to do for that long, not that the player was slow to scan.
 */
export function createScannerController({
  camera,
  sceneSources = [],
  idleMs = STANDBY_IDLE_MS,
}: ScannerControllerOptions): ScannerController {
  let mode: ScannerMode = 'off';
  let visible = true;
  let cameraEnabled = false;
  let idleTimer: ReturnType<typeof setTimeout> | null = null;

  function clearIdleTimer() {
    if (idleTimer !== null) clearTimeout(idleTimer);
    idleTimer = null;
  }

  function apply() {
    const effective: ScannerMode = visible ? mode : 'off';

    for (const source of sceneSources) {
      if (effective === 'active') source.start();
      else source.stop();
    }

    if (!cameraEnabled || effective === 'off') {
      clearIdleTimer();
      camera.stop();
      return;
    }

    if (effective === 'active') {
      clearIdleTimer();
      void camera.start();
      return;
    }

    camera.pause();
    idleTimer ??= setTimeout(() => {
      idleTimer = null;
      camera.stop();
    }, idleMs);
  }

  return {
    setMode(next) {
      if (next === mode) return;
      mode = next;
      apply();
    },
    setVisible(next) {
      if (next === visible) return;
      visible = next;
      apply();
    },
    setCameraEnabled(next) {
      if (next === cameraEnabled) return;
      cameraEnabled = next;
      apply();
    },
    getMode: () => mode,
  };
}
