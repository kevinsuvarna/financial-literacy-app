import { fakeCameraVideoPath } from '../../../scripts/lib/artefactAssets';

/** The card the fake camera is "holding up" in the `chromium-fake-camera` project. */
export const FAKE_CAMERA_ARTEFACT = 'account-savings';

/**
 * A video of that card's QR code — the same code that is printed on the card — made by
 * `pnpm qr` (and by globalSetup before every run) into e2e/fixtures, one per artefact.
 */
export const fakeCameraFile = fakeCameraVideoPath(FAKE_CAMERA_ARTEFACT);
