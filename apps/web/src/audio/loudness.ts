/**
 * How loud a sound is while it is actually sounding, in dBFS: the RMS of its louder half, taken
 * over 20 ms windows and ignoring near-silence. A short click and a long chord can then be set
 * to sound equally loud, which a peak or a whole-file average would not tell you.
 */
export function activeLoudnessDb(samples: Float32Array, sampleRate: number): number {
  const window = Math.max(1, Math.round(sampleRate * 0.02));
  const levels: number[] = [];
  for (let start = 0; start + window <= samples.length; start += window) {
    let sum = 0;
    for (let i = start; i < start + window; i += 1) sum += (samples[i] ?? 0) ** 2;
    const rms = Math.sqrt(sum / window);
    // Below about −50 dBFS is a tail or a gap, not the sound.
    if (rms > 0.003) levels.push(rms);
  }
  if (levels.length === 0) return -Infinity;
  levels.sort((a, b) => b - a);
  const louder = levels.slice(0, Math.ceil(levels.length / 2));
  const meanSquare = louder.reduce((total, rms) => total + rms * rms, 0) / louder.length;
  return 10 * Math.log10(meanSquare);
}

/** The volume (0–1) that brings a sound measured at `loudnessDb` to `targetDb`. */
export function volumeFor(loudnessDb: number, targetDb: number): number {
  return Math.min(1, 10 ** ((targetDb - loudnessDb) / 20));
}
