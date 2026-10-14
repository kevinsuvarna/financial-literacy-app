/**
 * How many pages a PDF has, read from the file itself: each page is an object of
 * `/Type /Page` (as distinct from `/Type /Pages`, the tree that holds them). Good for the PDFs
 * Chromium writes, which keep those dictionaries uncompressed.
 */
export function countPdfPages(pdf: Uint8Array): number {
  const text = Buffer.from(pdf).toString('latin1');
  return text.match(/\/Type\s*\/Page(?![A-Za-z])/g)?.length ?? 0;
}

/** Whether these bytes start the way a PDF does. */
export function isPdf(bytes: Uint8Array): boolean {
  return Buffer.from(bytes.subarray(0, 5)).toString('latin1') === '%PDF-';
}

const POINTS_PER_MM = 72 / 25.4;

/**
 * The size of each page in millimetres, from its `/MediaBox` (which PDF gives in points),
 * rounded to the nearest millimetre.
 */
export function pdfPageSizesMm(pdf: Uint8Array): { width: number; height: number }[] {
  const text = Buffer.from(pdf).toString('latin1');
  const boxes = text.matchAll(/\/MediaBox\s*\[\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\]/g);
  return [...boxes].map(([, x0, y0, x1, y1]) => ({
    width: Math.round((Number(x1) - Number(x0)) / POINTS_PER_MM),
    height: Math.round((Number(y1) - Number(y0)) / POINTS_PER_MM),
  }));
}
