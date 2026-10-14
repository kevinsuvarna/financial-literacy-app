import { fakeCameraSequencePath, fakeCameraVideoPath } from '../../../scripts/lib/artefactAssets';

/**
 * The fake webcam for the `camera` project. Chromium plays a .y4m file, on a loop, as the feed
 * of a camera it pretends to have — so these tests drive the game's real CameraSource (the
 * camera, the hidden video, the decode worker, the decoder), with nothing simulated but the
 * lens.
 *
 * Videos come from e2e/fixtures, which globalSetup fills before every run: one per artefact
 * (`pnpm qr` makes the same ones), plus the sequences below.
 */

/** A video of one card held still in front of the camera. */
export const cardVideo = fakeCameraVideoPath;

/** A video of several cards held up in turn, a few seconds each, then round again. */
export const sequenceVideo = fakeCameraSequencePath;

/** The multi-card videos the camera tests use. globalSetup makes one of each. */
export const CAMERA_SEQUENCES = {
  /** Identity: both right documents, PAN first. */
  kyc: ['id-pan-card', 'id-aadhaar-card'],
  /** Identity: a wrong document between the two right ones, Aadhaar first. */
  kycWithWrongCard: ['id-aadhaar-card', 'id-library-card', 'id-pan-card'],
  /** Evidence: the cheque, which isn't needed, between the two pieces that are. */
  evidence: ['bank-statement', 'cheque', 'phishing-message'],
} as const satisfies Record<string, readonly string[]>;

/** The browser for a camera test: a fake camera playing `videoFile`, and no internet. */
export function cameraLaunchOptions(videoFile: string) {
  return {
    args: [
      '--use-fake-device-for-media-stream',
      // Grant the camera without showing the permission dialog (the project also grants it).
      '--use-fake-ui-for-media-stream',
      `--use-file-for-fake-video-capture=${videoFile}`,
      // No internet: if the decoder tried to fetch its WASM from a CDN instead of the bundled
      // copy, nothing would decode and the test would fail.
      '--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE localhost',
    ],
  };
}
