import { copy } from '@app/content';
import { drawCertificate } from './drawCertificate';

/** A4 landscape at roughly 150 dpi — sharp on screen and fine to print. */
const WIDTH = 1754;
const HEIGHT = 1240;

function toBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}

/**
 * Paints the certificate onto an off-screen canvas and hands it to the browser as a PNG
 * download. Everything happens on this device: the picture is drawn here from the game's own
 * wording, and nothing is uploaded or fetched.
 *
 * Colours and fonts are read from the on-screen certificate (`styledLike`, and the heading
 * inside it), so the picture follows the theme tokens instead of repeating their values.
 *
 * Resolves to false when the browser can't make the picture, so the caller can say so.
 */
export async function downloadCertificate(styledLike: HTMLElement): Promise<boolean> {
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) return false;

  const card = getComputedStyle(styledLike);
  const heading = styledLike.querySelector('h1');

  drawCertificate(ctx, {
    width: WIDTH,
    height: HEIGHT,
    colors: {
      background: card.backgroundColor,
      text: card.color,
      accent: card.borderTopColor,
    },
    fonts: {
      display: heading ? getComputedStyle(heading).fontFamily : card.fontFamily,
      body: card.fontFamily,
    },
    text: {
      issuer: copy.certificate.issuer,
      heading: copy.certificate.heading,
      subheading: copy.certificate.subheading,
      lines: copy.certificate.lines,
      awardedTo: copy.certificate.awardedTo,
      badge: copy.certificate.badge,
    },
  });

  const blob = await toBlob(canvas);
  if (!blob) return false;

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = copy.certificate.fileName;
  document.body.append(link);
  link.click();
  link.remove();
  // Give the browser a moment to start the download before the blob is released.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return true;
}
