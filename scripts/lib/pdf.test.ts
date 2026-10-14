import { describe, expect, it } from 'vitest';
import { countPdfPages, isPdf, pdfPageSizesMm } from './pdf';

const bytes = (text: string) => new Uint8Array(Buffer.from(text, 'latin1'));

/** The skeleton of a PDF: a page tree, and one object per page. */
function fakePdf(pages: [number, number, number, number][]) {
  const kids = pages.map((_, index) => `${index + 3} 0 R`).join(' ');
  const objects = pages.map(
    (box, index) =>
      `${index + 3} 0 obj\n<</Type /Page\n/Parent 2 0 R\n/MediaBox [${box.join(' ')}]>>\nendobj`,
  );
  return bytes(
    [
      '%PDF-1.4',
      '1 0 obj\n<</Type /Catalog /Pages 2 0 R>>\nendobj',
      `2 0 obj\n<</Type /Pages /Count ${pages.length} /Kids [${kids}]>>\nendobj`,
      ...objects,
      '%%EOF',
    ].join('\n'),
  );
}

// A4 in PDF points (1/72 inch).
const A4_PORTRAIT: [number, number, number, number] = [0, 0, 594.96, 841.92];
const A4_LANDSCAPE: [number, number, number, number] = [0, 0, 841.92, 594.96];

describe('isPdf', () => {
  it('knows a PDF by how it starts', () => {
    expect(isPdf(fakePdf([A4_PORTRAIT]))).toBe(true);
    expect(isPdf(bytes('<!doctype html><title>Not found</title>'))).toBe(false);
    expect(isPdf(new Uint8Array())).toBe(false);
  });
});

describe('countPdfPages', () => {
  it('counts pages, not the tree that holds them', () => {
    expect(countPdfPages(fakePdf([A4_PORTRAIT]))).toBe(1);
    expect(countPdfPages(fakePdf([A4_PORTRAIT, A4_PORTRAIT, A4_PORTRAIT]))).toBe(3);
  });

  it('copes with either spacing of the type entry', () => {
    expect(countPdfPages(bytes('<</Type/Page>> <</Type /Page>> <</Type/Pages>>'))).toBe(2);
  });

  it('finds none in something that is not a PDF', () => {
    expect(countPdfPages(bytes('hello'))).toBe(0);
  });
});

describe('pdfPageSizesMm', () => {
  it('reads each page’s size in millimetres', () => {
    expect(pdfPageSizesMm(fakePdf([A4_PORTRAIT, A4_LANDSCAPE]))).toEqual([
      { width: 210, height: 297 },
      { width: 297, height: 210 },
    ]);
  });

  it('measures from the box’s origin, wherever that is', () => {
    expect(pdfPageSizesMm(fakePdf([[10, 20, 604.96, 861.92]]))).toEqual([
      { width: 210, height: 297 },
    ]);
  });
});
