import { describe, expect, it } from 'vitest';
import { fitWithin } from './frameSize';

describe('fitWithin', () => {
  it('scales a landscape frame so its width is the limit', () => {
    expect(fitWithin(1280, 720, 640)).toEqual({ width: 640, height: 360 });
  });

  it('scales a portrait frame so its height is the limit', () => {
    expect(fitWithin(720, 1280, 640)).toEqual({ width: 360, height: 640 });
  });

  it('never scales a small frame up', () => {
    expect(fitWithin(320, 240, 640)).toEqual({ width: 320, height: 240 });
  });
});
