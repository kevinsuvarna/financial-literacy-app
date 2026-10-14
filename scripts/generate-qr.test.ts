import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { beforeAll, describe, expect, it } from 'vitest';
import { prepareZXingModule, readBarcodes } from 'zxing-wasm/reader';
import { artefacts } from '@app/content';
import { findStaleQrSvgs, qrSvgPath } from './lib/artefactAssets';
import {
  createQrMatrix,
  QR_ERROR_CORRECTION,
  QR_QUIET_ZONE_MODULES,
  renderQrSvg,
} from './lib/artefactQr';
import {
  renderFakeCameraVideo,
  renderLuma,
  VIDEO_BYTES,
  VIDEO_HEIGHT,
  VIDEO_WIDTH,
  videoLayout,
  Y4M_HEADER,
} from './lib/fakeCameraVideo';

// The decoder the game itself uses (zxing, via WebAssembly), loaded from disk rather than
// from the CDN it would otherwise fetch — so these tests read the codes the way a player's
// device will, and work offline.
beforeAll(async () => {
  const require = createRequire(import.meta.url);
  const wasm = readFileSync(require.resolve('zxing-wasm/reader/zxing_reader.wasm'));
  await prepareZXingModule({
    overrides: {
      wasmBinary: wasm.buffer.slice(wasm.byteOffset, wasm.byteOffset + wasm.byteLength),
    },
    fireImmediately: true,
  });
});

/** Decodes a greyscale picture, as the scanner would a camera frame. */
async function decode(luma: Uint8Array, width: number, height: number) {
  const rgba = new Uint8ClampedArray(width * height * 4);
  for (let pixel = 0; pixel < luma.length; pixel += 1) {
    const value = luma[pixel] ?? 0;
    rgba.set([value, value, value, 255], pixel * 4);
  }
  const image = { data: rgba, width, height, colorSpace: 'srgb' } as ImageData;
  return readBarcodes(image, { formats: ['QRCode'] });
}

/**
 * Draws one of the generated SVGs into pixels. The files are simple by construction — a white
 * square, then one path of horizontal strokes ("M4 4.5h7m1 0h2…", each stroke one module tall)
 * — so reading them back takes a dozen lines rather than an SVG renderer.
 */
function rasterise(svg: string, pixelsPerModule: number) {
  const side = Number(/viewBox="0 0 (\d+) \d+"/.exec(svg)?.[1]);
  const path = /<path stroke="#000000" d="([^"]+)"/.exec(svg)?.[1];
  if (!side || !path) throw new Error('not one of the generated QR SVGs');

  const dark = new Set<number>();
  let x = 0;
  let y = 0;
  for (const [, command, args] of path.matchAll(/([Mmh])([^Mmh]*)/g)) {
    const [a = 0, b = 0] = (args ?? '').trim().split(/\s+/).map(Number);
    if (command === 'M') [x, y] = [a, b];
    if (command === 'm') [x, y] = [x + a, y + b];
    if (command === 'h') {
      for (let column = x; column < x + a; column += 1) dark.add(Math.floor(y) * side + column);
      x += a;
    }
  }

  const size = side * pixelsPerModule;
  const luma = new Uint8Array(size * size).fill(255);
  for (const module of dark) {
    const row = Math.floor(module / side);
    const column = module % side;
    for (let dy = 0; dy < pixelsPerModule; dy += 1) {
      const start = (row * pixelsPerModule + dy) * size + column * pixelsPerModule;
      luma.fill(0, start, start + pixelsPerModule);
    }
  }
  return { side, size, luma, dark };
}

describe('the artefact registry', () => {
  it('gives every artefact a payload of its own', () => {
    expect(artefacts.length).toBeGreaterThanOrEqual(16);
    expect(new Set(artefacts.map((artefact) => artefact.qrPayload)).size).toBe(artefacts.length);
  });
});

describe('QR SVGs', () => {
  it('are checked in for every artefact, and match the registry', async () => {
    // If this fails: run `pnpm qr` and commit apps/web/public/qr.
    expect(await findStaleQrSvgs(artefacts)).toEqual([]);
  });

  it('use error correction level Q', () => {
    expect(QR_ERROR_CORRECTION).toBe('Q');
  });

  it('carry a four-module quiet zone inside the image, on every side', async () => {
    expect(QR_QUIET_ZONE_MODULES).toBe(4);

    for (const artefact of artefacts) {
      const svg = await renderQrSvg(artefact.qrPayload);
      const { side, dark } = rasterise(svg, 1);
      const matrix = createQrMatrix(artefact.qrPayload);

      expect(side, artefact.id).toBe(matrix.size + 8);
      // White all the way round: a white square under everything…
      expect(svg).toContain(`<path fill="#ffffff" d="M0 0h${side}v${side}H0z"/>`);
      // …and nothing dark in the outer four modules.
      for (const module of dark) {
        const row = Math.floor(module / side);
        const column = module % side;
        expect(Math.min(row, column, side - 1 - row, side - 1 - column)).toBeGreaterThanOrEqual(4);
      }
      // The code reaches right up to that margin (its finder patterns sit in the corners).
      expect(dark.has(4 * side + 4)).toBe(true);
      expect(dark.has(4 * side + (side - 5))).toBe(true);
      expect(dark.has((side - 5) * side + 4)).toBe(true);
    }
  });

  it('are plain black on white, in module units, so they stay sharp at any size', async () => {
    const svg = await renderQrSvg('https://ssa.game/a/account-savings');

    expect(svg).toMatch(/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 \d+ \d+"/);
    expect(svg).toContain('shape-rendering="crispEdges"');
    expect(svg).toContain('stroke="#000000"');
    // No fixed pixel size, no scripts, nothing fetched from anywhere.
    expect(svg).not.toMatch(/\s(width|height)="/);
    expect(svg).not.toMatch(/<script|href=|<image/);
  });

  it('come out the same every time', async () => {
    const first = await renderQrSvg('https://ssa.game/a/cheque');
    const second = await renderQrSvg('https://ssa.game/a/cheque');
    expect(second).toBe(first);
  });

  it('scan: every checked-in SVG decodes to its own artefact’s payload, at level Q', async () => {
    for (const artefact of artefacts) {
      const { luma, size } = rasterise(readFileSync(qrSvgPath(artefact.id), 'utf8'), 6);
      const [result, ...others] = await decode(luma, size, size);

      expect(others, artefact.id).toEqual([]);
      expect(result?.text, artefact.id).toBe(artefact.qrPayload);
      expect(result?.ecLevel, artefact.id).toBe('Q');
    }
  });

  it('still scan when printed small: 3 cm at a phone camera’s worst', async () => {
    // Roughly a 3 cm code filling a fifth of a VGA frame: three pixels to the module.
    for (const artefact of artefacts) {
      const { luma, size } = rasterise(readFileSync(qrSvgPath(artefact.id), 'utf8'), 3);
      const [result] = await decode(luma, size, size);
      expect(result?.text, artefact.id).toBe(artefact.qrPayload);
    }
  });
});

describe('fake-camera videos', () => {
  const payload = 'https://ssa.game/a/account-savings';

  it('are Y4M files Chromium’s fake camera can play: a header and two VGA frames', () => {
    const video = renderFakeCameraVideo(payload);
    const header = 'YUV4MPEG2 W640 H480 F10:1 Ip A1:1 C420jpeg\n';

    expect(Y4M_HEADER).toBe(header);
    expect(video.subarray(0, header.length).toString('latin1')).toBe(header);
    expect(video.length).toBe(VIDEO_BYTES);
    expect(video.length).toBe(header.length + 2 * ('FRAME\n'.length + 640 * 480 * 1.5));

    const frameBytes = 'FRAME\n'.length + 640 * 480 * 1.5;
    for (const frame of [0, 1]) {
      const start = header.length + frame * frameBytes;
      expect(video.subarray(start, start + 6).toString('latin1')).toBe('FRAME\n');
    }
  });

  it('hold the colour planes at neutral grey: a black-and-white picture', () => {
    const video = renderFakeCameraVideo(payload);
    const chromaStart = Y4M_HEADER.length + 'FRAME\n'.length + VIDEO_WIDTH * VIDEO_HEIGHT;
    const chroma = video.subarray(chromaStart, chromaStart + (VIDEO_WIDTH * VIDEO_HEIGHT) / 2);

    expect(chroma.every((value) => value === 128)).toBe(true);
  });

  it('show the same code as the printed card, centred, with its quiet zone', () => {
    const matrix = createQrMatrix(payload);
    const luma = renderLuma(payload);
    const { scale, offsetX, offsetY } = videoLayout(matrix.size);

    // The middle of every module is black or white as the code says.
    for (let row = 0; row < matrix.size; row += 1) {
      for (let column = 0; column < matrix.size; column += 1) {
        const x = offsetX + column * scale + Math.floor(scale / 2);
        const y = offsetY + row * scale + Math.floor(scale / 2);
        expect(luma[y * VIDEO_WIDTH + x]).toBe(matrix.isDark(row, column) ? 16 : 235);
      }
    }
    // At least four modules of white on every side.
    expect(offsetY).toBeGreaterThanOrEqual(QR_QUIET_ZONE_MODULES * scale);
    expect(offsetX).toBeGreaterThanOrEqual(QR_QUIET_ZONE_MODULES * scale);
    expect(luma.subarray(0, offsetY * VIDEO_WIDTH).every((value) => value === 235)).toBe(true);
  });

  it('come out the same every time', () => {
    expect(renderFakeCameraVideo(payload).equals(renderFakeCameraVideo(payload))).toBe(true);
  });

  it('scan: every artefact’s video frame decodes to its payload', async () => {
    for (const artefact of artefacts) {
      const luma = renderLuma(artefact.qrPayload);
      const [result, ...others] = await decode(luma, VIDEO_WIDTH, VIDEO_HEIGHT);

      expect(others, artefact.id).toEqual([]);
      expect(result?.text, artefact.id).toBe(artefact.qrPayload);
      expect(result?.ecLevel, artefact.id).toBe('Q');
    }
  });

  it('refuse a payload whose code would not fit in the frame', () => {
    expect(() => renderLuma('x'.repeat(2000))).toThrow(/too big/);
  });
});
