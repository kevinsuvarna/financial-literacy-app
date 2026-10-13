import { writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { create } from 'qrcode';

/** The card the fake camera is "holding up": the Savings Account artefact's QR payload. */
export const FAKE_CAMERA_PAYLOAD = 'https://ssa.game/a/account-savings';

export const fakeCameraFile = join(tmpdir(), 'ssa-fake-camera.y4m');

const WIDTH = 640;
const HEIGHT = 480;
const QUIET_ZONE_MODULES = 4;

/**
 * Writes a Y4M video of a QR code for Chromium's `--use-file-for-fake-video-capture`, which
 * loops it as the webcam feed. Y4M is uncompressed YUV, so it can be written by hand: a black
 * and white image only needs the luma plane, with both chroma planes held at neutral grey.
 */
export function writeFakeCameraFile(): void {
  const { size, data } = create(FAKE_CAMERA_PAYLOAD, { errorCorrectionLevel: 'M' }).modules;
  const scale = Math.floor(HEIGHT / (size + QUIET_ZONE_MODULES * 2));
  const offsetX = Math.floor((WIDTH - size * scale) / 2);
  const offsetY = Math.floor((HEIGHT - size * scale) / 2);

  const luma = Buffer.alloc(WIDTH * HEIGHT, 235); // white
  for (let row = 0; row < size; row += 1) {
    for (let column = 0; column < size; column += 1) {
      if (!data[row * size + column]) continue;
      for (let y = 0; y < scale; y += 1) {
        const start = (offsetY + row * scale + y) * WIDTH + offsetX + column * scale;
        luma.fill(16, start, start + scale); // black
      }
    }
  }
  const chroma = Buffer.alloc((WIDTH / 2) * (HEIGHT / 2) * 2, 128);

  const header = Buffer.from(`YUV4MPEG2 W${WIDTH} H${HEIGHT} F10:1 Ip A1:1 C420jpeg\n`);
  const frame = Buffer.concat([Buffer.from('FRAME\n'), luma, chroma]);
  writeFileSync(fakeCameraFile, Buffer.concat([header, frame, frame]));
}
