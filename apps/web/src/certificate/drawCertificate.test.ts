import { describe, expect, it } from 'vitest';
import {
  drawCertificate,
  wrapText,
  type CertificateArt,
  type CertificateCanvas,
} from './drawCertificate';

/** One "pixel" per character: enough to exercise wrapping without a real canvas. */
const byLength = (text: string) => text.length;

describe('wrapText', () => {
  it('keeps text that fits on one line', () => {
    expect(wrapText('GOOD JOB', 20, byLength)).toEqual(['GOOD JOB']);
  });

  it('breaks between words, never wider than the limit', () => {
    const lines = wrapText('how to track money coming in and going out', 12, byLength);

    expect(lines).toEqual(['how to track', 'money coming', 'in and going', 'out']);
    for (const line of lines) expect(line.length).toBeLessThanOrEqual(12);
  });

  it('gives a word that is too wide a line of its own rather than cutting it', () => {
    expect(wrapText('an extraordinarily long word', 6, byLength)).toEqual([
      'an',
      'extraordinarily',
      'long',
      'word',
    ]);
  });

  it('ignores extra whitespace and returns nothing for empty text', () => {
    expect(wrapText('  a   b  ', 10, byLength)).toEqual(['a b']);
    expect(wrapText('   ', 10, byLength)).toEqual([]);
  });
});

interface Painted {
  text: string;
  x: number;
  y: number;
  font: string;
  fillStyle: unknown;
}

function fakeCanvas() {
  const painted: Painted[] = [];
  const rects: { kind: 'fill' | 'stroke'; args: number[]; style: unknown }[] = [];
  let arcs = 0;
  let depth = 0;

  const ctx: CertificateCanvas = {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    font: '',
    textAlign: 'start',
    textBaseline: 'alphabetic',
    fillRect: (...args) => void rects.push({ kind: 'fill', args, style: ctx.fillStyle }),
    strokeRect: (...args) => void rects.push({ kind: 'stroke', args, style: ctx.strokeStyle }),
    fillText: (text, x, y) =>
      void painted.push({ text, x, y, font: ctx.font, fillStyle: ctx.fillStyle }),
    measureText: (text) => ({ width: text.length * 10 }) as TextMetrics,
    beginPath: () => {},
    arc: () => void (arcs += 1),
    stroke: () => {},
    save: () => void (depth += 1),
    restore: () => void (depth -= 1),
    translate: () => {},
    rotate: () => {},
  };

  return { ctx, painted, rects, arcs: () => arcs, depth: () => depth };
}

const art: CertificateArt = {
  width: 1600,
  height: 1000,
  colors: { background: 'navy', text: 'cream', accent: 'gold' },
  fonts: { display: 'Courier', body: 'sans-serif' },
  text: {
    issuer: 'A BANK',
    heading: 'MISSION COMPLETE',
    subheading: 'GOOD JOB, OFFICER!',
    lines: ['Ananya has been notified about the report.', 'You learned how to keep money safe.'],
    awardedTo: 'This certifies that you are now a',
    badge: 'Junior Bank Officer',
  },
};

describe('drawCertificate', () => {
  it('fills the whole page with the background before anything else', () => {
    const { ctx, rects } = fakeCanvas();
    drawCertificate(ctx, art);

    expect(rects[0]).toEqual({ kind: 'fill', args: [0, 0, 1600, 1000], style: 'navy' });
    // A double border, in the accent colour.
    expect(rects.filter((rect) => rect.kind === 'stroke')).toHaveLength(2);
    for (const rect of rects.slice(1)) expect(rect.style).toBe('gold');
  });

  it('writes every line of the certificate, centred', () => {
    const { ctx, painted } = fakeCanvas();
    drawCertificate(ctx, art);

    const written = painted.map((entry) => entry.text);
    for (const expected of [
      'A BANK',
      'MISSION COMPLETE',
      'GOOD JOB, OFFICER!',
      'Ananya has been notified about the report.',
      'You learned how to keep money safe.',
      'This certifies that you are now a',
    ]) {
      expect(written).toContain(expected);
    }
    // Everything outside the seal is centred on the page.
    for (const entry of painted.filter((entry) => entry.x !== 0)) expect(entry.x).toBe(800);
    expect(ctx.textAlign).toBe('center');
  });

  it('puts the title in the seal, in capitals, inside two rings', () => {
    const { ctx, painted, arcs, depth } = fakeCanvas();
    drawCertificate(ctx, art);

    const seal = painted.filter((entry) => entry.x === 0);
    expect(seal.map((entry) => entry.text).join(' ')).toContain('JUNIOR BANK OFFICER');
    for (const entry of seal) expect(entry.fillStyle).toBe('gold');
    expect(arcs()).toBe(2);
    // The seal's tilt is undone afterwards.
    expect(depth()).toBe(0);
  });

  it('wraps a long paragraph instead of running off the page', () => {
    const { ctx, painted } = fakeCanvas();
    const long = Array.from({ length: 40 }, () => 'savings').join(' ');
    drawCertificate(ctx, { ...art, text: { ...art.text, lines: [long] } });

    const paragraph = painted.filter((entry) => entry.text.startsWith('savings'));
    expect(paragraph.length).toBeGreaterThan(1);
    for (const line of paragraph) expect(line.text.length * 10).toBeLessThanOrEqual(1600 * 0.7);
    // Each line sits below the one before.
    for (let i = 1; i < paragraph.length; i += 1) {
      expect(paragraph[i]?.y).toBeGreaterThan(paragraph[i - 1]?.y ?? Infinity);
    }
  });

  it('scales its type with the page', () => {
    const small = fakeCanvas();
    const large = fakeCanvas();
    drawCertificate(small.ctx, { ...art, width: 800, height: 500 });
    drawCertificate(large.ctx, art);

    const headingSize = (painted: Painted[]) =>
      Number(/(\d+)px/.exec(painted.find((e) => e.text === 'MISSION COMPLETE')?.font ?? '')?.[1]);
    expect(headingSize(large.painted)).toBe(headingSize(small.painted) * 2);
  });
});
