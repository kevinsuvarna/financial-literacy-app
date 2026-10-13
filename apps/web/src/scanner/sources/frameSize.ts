export interface FrameSize {
  width: number;
  height: number;
}

/** Scales a frame down so its longer side is at most `maxSide`. Never scales up. */
export function fitWithin(width: number, height: number, maxSide: number): FrameSize {
  const scale = Math.min(1, maxSide / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}
