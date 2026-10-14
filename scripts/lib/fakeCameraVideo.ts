import { createQrMatrix, QR_QUIET_ZONE_MODULES } from './artefactQr';

// A webcam frame: VGA, the size Chromium's fake camera expects by default.
export const VIDEO_WIDTH = 640;
export const VIDEO_HEIGHT = 480;
const FRAMES = 2;
const FRAMES_PER_SECOND = 10;
/**
 * A sequence only has to show each card for a few seconds, and every frame is the same still
 * picture — so it is written at a low frame rate to keep the file small.
 */
const SEQUENCE_FRAMES_PER_SECOND = 2;
export const SEQUENCE_SECONDS_PER_CARD = 3;

// "Video range" luma, as a camera would deliver it: 16 is black and 235 is white.
const BLACK = 16;
const WHITE = 235;
const NEUTRAL_CHROMA = 128;

const y4mHeader = (framesPerSecond: number) =>
  `YUV4MPEG2 W${VIDEO_WIDTH} H${VIDEO_HEIGHT} F${framesPerSecond}:1 Ip A1:1 C420jpeg\n`;
export const Y4M_HEADER = y4mHeader(FRAMES_PER_SECOND);
const FRAME_MARKER = 'FRAME\n';

/** Where the code sits in the frame, and how big its modules are, in pixels. */
export function videoLayout(moduleCount: number) {
  const scale = Math.floor(VIDEO_HEIGHT / (moduleCount + QR_QUIET_ZONE_MODULES * 2));
  return {
    scale,
    offsetX: Math.floor((VIDEO_WIDTH - moduleCount * scale) / 2),
    offsetY: Math.floor((VIDEO_HEIGHT - moduleCount * scale) / 2),
  };
}

/** One frame's brightness plane: the QR code for `payload`, centred on white. */
export function renderLuma(payload: string): Buffer {
  const matrix = createQrMatrix(payload);
  const { scale, offsetX, offsetY } = videoLayout(matrix.size);
  if (scale < 1) throw new Error(`"${payload}" makes a code too big for a ${VIDEO_HEIGHT}px frame`);

  const luma = Buffer.alloc(VIDEO_WIDTH * VIDEO_HEIGHT, WHITE);
  for (let row = 0; row < matrix.size; row += 1) {
    for (let column = 0; column < matrix.size; column += 1) {
      if (!matrix.isDark(row, column)) continue;
      for (let y = 0; y < scale; y += 1) {
        const start = (offsetY + row * scale + y) * VIDEO_WIDTH + offsetX + column * scale;
        luma.fill(BLACK, start, start + scale);
      }
    }
  }
  return luma;
}

/**
 * A Y4M video of the QR code for `payload`, held still in front of the camera — the format
 * Chromium's `--use-file-for-fake-video-capture` plays, on a loop, as the webcam feed.
 *
 * Y4M is uncompressed: a text header, then for each frame the brightness of every pixel
 * followed by two quarter-size colour planes. A black-and-white picture only needs the first;
 * the colour planes are held at neutral grey. That makes the file simple enough to write
 * directly, byte for byte the same every time, with no encoder to install — which is why this
 * doesn't shell out to ffmpeg.
 */
export function renderFakeCameraVideo(payload: string): Buffer {
  const frame = renderFrame(payload);
  return Buffer.concat([Buffer.from(Y4M_HEADER), ...Array.from({ length: FRAMES }, () => frame)]);
}

function renderFrame(payload: string): Buffer {
  const chroma = Buffer.alloc((VIDEO_WIDTH / 2) * (VIDEO_HEIGHT / 2) * 2, NEUTRAL_CHROMA);
  return Buffer.concat([Buffer.from(FRAME_MARKER), renderLuma(payload), chroma]);
}

/**
 * Several cards held up one after another, each for `SEQUENCE_SECONDS_PER_CARD`, then round
 * again (the fake camera loops the file) — a player scanning one document and then the next,
 * for tasks that need more than one card. Between cards the picture changes at once, the way
 * it does when one card is swapped for another in front of a camera.
 */
export function renderFakeCameraSequence(payloads: readonly string[]): Buffer {
  if (payloads.length === 0) throw new Error('a sequence needs at least one card');
  const framesPerCard = SEQUENCE_FRAMES_PER_SECOND * SEQUENCE_SECONDS_PER_CARD;
  const frames = payloads.flatMap((payload) => {
    const frame = renderFrame(payload);
    return Array.from({ length: framesPerCard }, () => frame);
  });
  return Buffer.concat([Buffer.from(y4mHeader(SEQUENCE_FRAMES_PER_SECOND)), ...frames]);
}

/** The size in bytes every video made here has, whatever its code. */
export const VIDEO_BYTES =
  Y4M_HEADER.length + FRAMES * (FRAME_MARKER.length + (VIDEO_WIDTH * VIDEO_HEIGHT * 3) / 2);
