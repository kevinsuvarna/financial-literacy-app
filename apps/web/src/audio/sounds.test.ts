import { describe, expect, it, vi } from 'vitest';
import { activeLoudnessDb, volumeFor } from './loudness';

// Howler needs Web Audio; these tests only need the table of sounds.
vi.mock('howler', () => ({ Howl: class {}, Howler: { mute: () => {}, ctx: null } }));
const { LOUDNESS_TIERS, SOUNDS, soundVolume } = await import('./sounds');

// Every file in public/audio, as base64 data URLs — read through Vite, as the game reads them.
const files = import.meta.glob<string>('../../public/audio/*.wav', {
  query: '?inline',
  import: 'default',
  eager: true,
});
const fileNames = Object.keys(files).map((path) => path.split('/').pop() ?? path);

/** Decodes a 16-bit mono PCM WAV — the format the placeholder generator writes. */
function readWav(file: string) {
  const url = files[`../../public/audio/${file}`];
  if (!url) throw new Error(`no such file: ${file}`);
  const bytes = Uint8Array.from(atob(url.slice(url.indexOf(',') + 1)), (c) => c.charCodeAt(0));
  const view = new DataView(bytes.buffer);
  const sampleRate = view.getUint32(24, true);
  const samples = new Float32Array((bytes.length - 44) / 2);
  for (let i = 0; i < samples.length; i += 1) samples[i] = view.getInt16(44 + i * 2, true) / 32768;
  return { samples, sampleRate };
}

const names = Object.keys(SOUNDS) as (keyof typeof SOUNDS)[];
const playedLevel = (name: keyof typeof SOUNDS) =>
  SOUNDS[name].loudness + 20 * Math.log10(soundVolume(name));

describe('sound levels', () => {
  it('lists every file in public/audio, and nothing that is not there', () => {
    expect(fileNames.length).toBeGreaterThan(10);
    expect(names.map((name) => SOUNDS[name].file).sort()).toEqual([...fileNames].sort());
  });

  it('records each file’s loudness as it measures — replace a sound, then update this', () => {
    for (const name of names) {
      const { samples, sampleRate } = readWav(SOUNDS[name].file);
      const measured = activeLoudnessDb(samples, sampleRate);
      expect(SOUNDS[name].loudness, `${name} measures ${measured.toFixed(1)} dBFS`).toBeCloseTo(
        measured,
        0,
      );
    }
  });

  it('brings every sound to its tier’s level, without needing to boost any', () => {
    for (const name of names) {
      const volume = soundVolume(name);
      expect(volume, name).toBeGreaterThan(0);
      expect(volume, `${name} would need boosting`).toBeLessThanOrEqual(1);
      expect(playedLevel(name), name).toBeCloseTo(LOUDNESS_TIERS[SOUNDS[name].tier], 1);
    }
  });

  it('plays "wrong" exactly as loud as "correct"', () => {
    expect(playedLevel('wrong')).toBeCloseTo(playedLevel('correct'), 1);
  });

  it('orders the tiers: feedback, then events, then the interface, then texture', () => {
    expect(LOUDNESS_TIERS.feedback).toBeGreaterThan(LOUDNESS_TIERS.event);
    expect(LOUDNESS_TIERS.event).toBeGreaterThan(LOUDNESS_TIERS.ui);
    expect(LOUDNESS_TIERS.ui).toBeGreaterThan(LOUDNESS_TIERS.texture);
  });
});

describe('activeLoudnessDb', () => {
  it('measures a full-scale sine at about −3 dBFS, and ignores silence around it', () => {
    const rate = 22_050;
    const tone = new Float32Array(rate).map((_, i) => Math.sin((2 * Math.PI * 440 * i) / rate));
    const padded = new Float32Array(rate * 3);
    padded.set(tone, rate);

    expect(activeLoudnessDb(tone, rate)).toBeCloseTo(-3, 0);
    expect(activeLoudnessDb(padded, rate)).toBeCloseTo(-3, 0);
  });

  it('calls silence silent', () => {
    expect(activeLoudnessDb(new Float32Array(1000), 22_050)).toBe(-Infinity);
  });
});

describe('volumeFor', () => {
  it('turns a sound down by the difference, and never up past full volume', () => {
    expect(volumeFor(-12, -18)).toBeCloseTo(0.5, 2);
    expect(volumeFor(-18, -18)).toBe(1);
    expect(volumeFor(-30, -18)).toBe(1);
  });
});
