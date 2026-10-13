// Generates the placeholder sound effects in public/audio as small mono WAV files.
//
//   node apps/web/scripts/generate-placeholder-audio.mjs
//
// These are synthesised stand-ins so the game has audio feedback before real sound design
// exists. To replace one, drop a file with the same name into public/audio (and update the
// extension in src/audio/sounds.ts if it isn't a .wav); this script is only needed to
// regenerate the placeholders.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SAMPLE_RATE = 22_050;
const outputDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'audio');

// A tiny deterministic PRNG, so regenerating gives byte-identical noise.
let seed = 0x5eed;
function noise() {
  seed = (seed * 1_103_515_245 + 12_345) & 0x7fffffff;
  return seed / 0x3fffffff - 1;
}

const sine = (frequency, t) => Math.sin(2 * Math.PI * frequency * t);
const square = (frequency, t) => Math.sign(sine(frequency, t));
const saw = (frequency, t) => 2 * ((frequency * t) % 1) - 1;
/** Fast attack, exponential decay — a plucked or struck shape. */
const pluck = (t, decay, attack = 0.004) => Math.min(1, t / attack) * Math.exp(-t * decay);
/** Flat with short fades at both ends, to avoid clicks. */
const gate = (t, duration, fade = 0.008) =>
  Math.max(0, Math.min(1, t / fade, (duration - t) / fade));

/** Renders `duration` seconds of `sampleAt(t)` to 16-bit PCM. */
function render(duration, sampleAt) {
  const count = Math.ceil(duration * SAMPLE_RATE);
  const samples = new Int16Array(count);
  for (let i = 0; i < count; i += 1) {
    const value = Math.max(-1, Math.min(1, sampleAt(i / SAMPLE_RATE)));
    samples[i] = Math.round(value * 0x7fff);
  }
  return samples;
}

/** Sums notes of the form { at, duration, voice(t) } where `t` is time since the note began. */
function mix(duration, notes) {
  return render(duration, (t) => {
    let value = 0;
    for (const note of notes) {
      const local = t - note.at;
      if (local >= 0 && local <= note.duration) value += note.voice(local);
    }
    return value;
  });
}

function toWav(samples) {
  const buffer = Buffer.alloc(44 + samples.length * 2);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + samples.length * 2, 4);
  buffer.write('WAVEfmt ', 8);
  buffer.writeUInt32LE(16, 16); // PCM chunk size
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28); // byte rate
  buffer.writeUInt16LE(2, 32); // block align
  buffer.writeUInt16LE(16, 34); // bits per sample
  buffer.write('data', 36);
  buffer.writeUInt32LE(samples.length * 2, 40);
  for (let i = 0; i < samples.length; i += 1) buffer.writeInt16LE(samples[i], 44 + i * 2);
  return buffer;
}

const bell =
  (frequency, decay = 8) =>
  (t) =>
    sine(frequency, t) * pluck(t, decay) * 0.5;

const sounds = {
  // A soft UI tick for buttons.
  click: () => render(0.06, (t) => sine(1100, t) * pluck(t, 70) * 0.5),

  // One loopable ring cycle: two trilled bursts with a phone-buzz underneath, then silence.
  ring: () =>
    render(1.8, (t) => {
      const inBurst = (t >= 0 && t < 0.42) || (t >= 0.55 && t < 0.97);
      if (!inBurst) return 0;
      const local = t < 0.5 ? t : t - 0.55;
      const trill = sine(local % 0.05 < 0.025 ? 1040 : 1320, t) * 0.32;
      const buzz = square(155, t) * 0.12;
      return (trill + buzz) * gate(local, 0.42);
    }),

  // Picking up: a quick rising pair.
  answer: () =>
    mix(0.26, [
      { at: 0, duration: 0.12, voice: bell(620, 22) },
      { at: 0.09, duration: 0.17, voice: bell(930, 16) },
    ]),

  // One typewriter key.
  type: () => render(0.035, (t) => (noise() * 0.5 + sine(2100, t) * 0.3) * pluck(t, 160) * 0.45),

  // The line going dead: crackling static that cuts out, then a click.
  static: () =>
    render(0.85, (t) => {
      if (t > 0.74) return t < 0.76 ? noise() * 0.5 : 0;
      const crackle = sine(31, t) * sine(7.3, t) > -0.25 ? 1 : 0.15;
      return noise() * crackle * (0.42 - t * 0.25);
    }),

  // The scanner reading a card: a single short blip.
  scan: () => render(0.09, (t) => sine(1480, t) * gate(t, 0.09, 0.006) * 0.3),

  // A rubber stamp landing, then a bright two-note chime.
  correct: () =>
    mix(0.6, [
      { at: 0, duration: 0.12, voice: (t) => (sine(110, t) + noise() * 0.6) * pluck(t, 38) * 0.6 },
      { at: 0.07, duration: 0.3, voice: bell(880, 9) },
      { at: 0.16, duration: 0.44, voice: bell(1318.5, 7) },
    ]),

  // Two flat, falling buzzes — clearly "no", without being harsh.
  wrong: () =>
    mix(0.36, [
      { at: 0, duration: 0.15, voice: (t) => saw(196, t) * gate(t, 0.15) * 0.22 },
      { at: 0.18, duration: 0.18, voice: (t) => saw(147, t) * gate(t, 0.18) * 0.22 },
    ]),

  // A rising arpeggio that lands on a held chord.
  'level-complete': () =>
    mix(1.3, [
      { at: 0, duration: 0.3, voice: bell(523.25, 9) },
      { at: 0.11, duration: 0.3, voice: bell(659.25, 9) },
      { at: 0.22, duration: 0.3, voice: bell(783.99, 9) },
      { at: 0.33, duration: 0.95, voice: bell(1046.5, 3.5) },
      { at: 0.33, duration: 0.95, voice: (t) => bell(659.25, 3.5)(t) * 0.6 },
      { at: 0.33, duration: 0.95, voice: (t) => bell(783.99, 3.5)(t) * 0.6 },
    ]),

  // A felt-tip marker dragged across paper: a wavering high squeak over soft friction noise.
  squeak: () =>
    render(0.38, (t) => {
      const pitch = 1900 + 500 * (t / 0.38) + 90 * sine(31, t);
      const tone = sine(pitch, t) * (0.55 + 0.45 * sine(23, t)) * 0.16;
      return (tone + noise() * 0.07) * gate(t, 0.38, 0.03);
    }),
};

mkdirSync(outputDir, { recursive: true });
for (const [name, build] of Object.entries(sounds)) {
  const wav = toWav(build());
  writeFileSync(join(outputDir, `${name}.wav`), wav);
  console.log(`${name}.wav  ${(wav.length / 1024).toFixed(1)} KB`);
}
