import QRCode from 'qrcode';

/**
 * How every artefact's QR code is made — on the printed card, in the fake-camera video, and
 * anywhere else. One definition, so the code a test "holds up" is the code that gets printed.
 *
 * Error correction is level Q (about a quarter of the code can be damaged and it still reads):
 * these are cards that get handled, bent and scanned at an angle by a classroom of children.
 */
export const QR_ERROR_CORRECTION = 'Q';

/**
 * The quiet zone: blank modules around the code. Four is what the QR standard asks for, and
 * what scanners rely on to find the code's edge — it is part of the image, so a card can be
 * laid out without having to remember to leave the space.
 */
export const QR_QUIET_ZONE_MODULES = 4;

/** A QR code as a grid of modules, without its quiet zone. */
export interface QrMatrix {
  /** Modules along one side. */
  size: number;
  isDark: (row: number, column: number) => boolean;
}

export function createQrMatrix(payload: string): QrMatrix {
  const { size, data } = QRCode.create(payload, {
    errorCorrectionLevel: QR_ERROR_CORRECTION,
  }).modules;
  return { size, isDark: (row, column) => data[row * size + column] === 1 };
}

/**
 * The QR code for `payload` as an SVG: black on white, quiet zone included, one unit per
 * module — so it stays sharp at any printed size. The output is the same every time for the
 * same payload.
 */
export async function renderQrSvg(payload: string): Promise<string> {
  const svg = await QRCode.toString(payload, {
    type: 'svg',
    errorCorrectionLevel: QR_ERROR_CORRECTION,
    margin: QR_QUIET_ZONE_MODULES,
    color: { dark: '#000000', light: '#ffffff' },
  });
  return svg.endsWith('\n') ? svg : `${svg}\n`;
}
