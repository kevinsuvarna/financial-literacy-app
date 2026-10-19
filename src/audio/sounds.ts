import { Howl, Howler } from 'howler'

/**
 * Game sounds, synthesised so no sound files are needed until the real sound design arrives.
 * Howler unlocks audio on the first tap, which iPad Safari requires.
 */

const SAMPLE_RATE = 22050

interface Note {
  freq: number
  /** Seconds from the start of the sound. */
  start: number
  length: number
  volume?: number
  /** How fast the note fades (higher = shorter). */
  decay?: number
  /** Overtones, as volumes relative to the note: [2nd, 3rd, …]. Gives a pluck or a bell its colour. */
  harmonics?: number[]
}

function wavDataUri(notes: Note[], duration: number, sampleRate = SAMPLE_RATE): string {
  const samples = Math.round(sampleRate * duration)
  const mix = new Float32Array(samples)
  // Each note only writes its own stretch of samples, so long tracks (the music) stay quick to build.
  for (const note of notes) {
    const from = Math.max(0, Math.floor(note.start * sampleRate))
    const to = Math.min(samples, Math.ceil((note.start + note.length) * sampleRate))
    const partials = [1, ...(note.harmonics ?? [])]
    for (let i = from; i < to; i++) {
      const local = i / sampleRate - note.start
      const attack = Math.min(1, local / 0.005)
      const release = Math.min(1, (note.length - local) / 0.01)
      const envelope = (note.volume ?? 0.35) * attack * release * Math.exp(-local * (note.decay ?? 9))
      let wave = 0
      for (let h = 0; h < partials.length; h++) wave += partials[h] * Math.sin(2 * Math.PI * note.freq * (h + 1) * local)
      mix[i] += envelope * wave
    }
  }
  const pcm = new Int16Array(samples)
  for (let i = 0; i < samples; i++) pcm[i] = Math.max(-1, Math.min(1, mix[i])) * 0x7fff

  const bytes = new Uint8Array(44 + pcm.byteLength)
  const view = new DataView(bytes.buffer)
  const ascii = (offset: number, text: string) => [...text].forEach((c, i) => view.setUint8(offset + i, c.charCodeAt(0)))
  ascii(0, 'RIFF')
  view.setUint32(4, 36 + pcm.byteLength, true)
  ascii(8, 'WAVE')
  ascii(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true) // PCM
  view.setUint16(22, 1, true) // mono
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  ascii(36, 'data')
  view.setUint32(40, pcm.byteLength, true)
  bytes.set(new Uint8Array(pcm.buffer), 44)

  let binary = ''
  bytes.forEach((b) => (binary += String.fromCharCode(b)))
  return `data:audio/wav;base64,${btoa(binary)}`
}

/** A phone ring: two short warbles, then a pause. Loops while a call is incoming. */
function ringNotes(): Note[] {
  const notes: Note[] = []
  for (const burst of [0, 0.45]) {
    for (let k = 0; k < 8; k++) {
      const start = burst + k * 0.04
      notes.push({ freq: 1180, start, length: 0.04, volume: 0.18, decay: 0 })
      notes.push({ freq: 980, start: start + 0.02, length: 0.02, volume: 0.18, decay: 0 })
    }
  }
  return notes
}

const recipes = {
  /** The scanner read a card. */
  chime: { notes: [{ freq: 880, start: 0, length: 0.2 }, { freq: 1318.5, start: 0.09, length: 0.36 }], duration: 0.45, loop: false },
  ring: { notes: ringNotes(), duration: 2.2, loop: true },
  /** A new line of dialogue. */
  blip: { notes: [{ freq: 660, start: 0, length: 0.08, volume: 0.12, decay: 20 }], duration: 0.09, loop: false },
  /** The call drops: three falling beeps. */
  disconnect: {
    notes: [0, 0.22, 0.44].map((start, i) => ({ freq: 520 - i * 60, start, length: 0.16, volume: 0.25, decay: 2 })),
    duration: 0.62,
    loop: false,
  },
  /** Level complete: a rising four-note fanfare. */
  fanfare: {
    notes: [523.25, 659.25, 783.99, 1046.5].map((freq, i) => ({ freq, start: i * 0.13, length: i === 3 ? 0.9 : 0.3, volume: 0.28, decay: i === 3 ? 2.5 : 5 })),
    duration: 1.35,
    loop: false,
  },
  /** Moving on to the next level: a quick upward sweep, then a bright chime. */
  levelUp: {
    notes: [
      ...Array.from({ length: 14 }, (_, i) => ({ freq: 260 + i * 45, start: i * 0.022, length: 0.05, volume: 0.1, decay: 0 })),
      { freq: 1318.5, start: 0.34, length: 0.6, volume: 0.25, decay: 4 },
      { freq: 1975.5, start: 0.42, length: 0.6, volume: 0.15, decay: 5 },
    ],
    duration: 1.05,
    loop: false,
  },
  /** A rubber stamp hitting paper (SOLVED on the Case Board). */
  stamp: {
    notes: [
      { freq: 92, start: 0, length: 0.22, volume: 0.55, decay: 16 },
      { freq: 185, start: 0, length: 0.12, volume: 0.3, decay: 30 },
      { freq: 410, start: 0.005, length: 0.05, volume: 0.12, decay: 60 },
    ],
    duration: 0.25,
    loop: false,
  },
  /** The view rushing in towards a card. */
  whoosh: {
    notes: Array.from({ length: 18 }, (_, i) => ({ freq: 180 + i * 38 + (i % 2) * 23, start: i * 0.03, length: 0.09, volume: 0.035 + Math.sin((i / 17) * Math.PI) * 0.06, decay: 6 })),
    duration: 0.65,
    loop: false,
  },
  /** A right answer: a bright rising arpeggio. */
  correct: {
    notes: [659.25, 830.61, 987.77, 1318.5].map((freq, i) => ({ freq, start: i * 0.07, length: i === 3 ? 0.6 : 0.2, volume: 0.2, decay: i === 3 ? 4 : 10, harmonics: [0.25] })),
    duration: 0.85,
    loop: false,
  },
  /** A wrong answer: two low, soft "uh-oh" notes. */
  wrong: {
    notes: [
      { freq: 311.13, start: 0, length: 0.18, volume: 0.22, decay: 6, harmonics: [0.4, 0.2] },
      { freq: 233.08, start: 0.17, length: 0.38, volume: 0.22, decay: 5, harmonics: [0.4, 0.2] },
    ],
    duration: 0.6,
    loop: false,
  },
  /** A button press: a tiny wooden click. */
  tap: {
    notes: [{ freq: 1250, start: 0, length: 0.05, volume: 0.1, decay: 70, harmonics: [0.3] }],
    duration: 0.06,
    loop: false,
  },
} satisfies Record<string, { notes: Note[]; duration: number; loop: boolean }>

export type SoundName = keyof typeof recipes

const cache = new Map<SoundName, Howl>()

function sound(name: SoundName): Howl {
  let howl = cache.get(name)
  if (!howl) {
    const { notes, duration, loop } = recipes[name]
    howl = new Howl({ src: [wavDataUri(notes, duration)], format: ['wav'], loop, volume: 0.6 })
    cache.set(name, howl)
  }
  return howl
}

export function playSound(name: SoundName): void {
  sound(name).play()
}

export function stopSound(name: SoundName): void {
  cache.get(name)?.stop()
}

/** Played when the scanner reads a card (spec 10.2). */
export function playChime(): void {
  playSound('chime')
}

// ─── Music ──────────────────────────────────────────────────────────────────

/** Note frequencies by name, octave 2–5. */
const NOTE = (name: string): number => {
  const steps: Record<string, number> = { C: -9, 'C#': -8, D: -7, 'D#': -6, E: -5, F: -4, 'F#': -3, G: -2, 'G#': -1, A: 0, 'A#': 1, B: 2 }
  const [, letter, octave] = name.match(/^([A-G]#?)(\d)$/)!
  return 440 * 2 ** ((steps[letter] + (Number(octave) - 4) * 12) / 12)
}

/**
 * The background loop: a quiet, curious detective tune in A minor (Am – F – Dm – E), 96 bpm,
 * 32 beats (20 s): a plucked bass, a soft arpeggio and a sparse bell melody. Synthesised, like the
 * other sounds, until the real music arrives.
 */
function musicNotes(): Note[] {
  const beat = 60 / 96
  const chords = [
    { bass: ['A2', 'E2'], arp: ['A3', 'C4', 'E4', 'C4'], tune: ['E5', 'D5', 'C5', 'B4'] },
    { bass: ['F2', 'C3'], arp: ['F3', 'A3', 'C4', 'A3'], tune: ['C5', 'A4', 'C5', 'D5'] },
    { bass: ['D2', 'A2'], arp: ['D3', 'F3', 'A3', 'F3'], tune: ['F5', 'E5', 'D5', 'A4'] },
    { bass: ['E2', 'B2'], arp: ['E3', 'G#3', 'B3', 'G#3'], tune: ['G#4', 'B4', 'E5', 'D5'] },
  ]
  const notes: Note[] = []
  chords.forEach((chord, c) => {
    const at = c * 8 * beat
    // Bass: root on beats 1 and 5, fifth on beats 3 and 7.
    for (let b = 0; b < 8; b += 2) {
      notes.push({ freq: NOTE(chord.bass[(b / 2) % 2]), start: at + b * beat, length: beat * 1.8, volume: 0.16, decay: 2.2, harmonics: [0.5, 0.25] })
    }
    // Arpeggio: eighth notes over the chord.
    for (let e = 0; e < 16; e++) {
      notes.push({ freq: NOTE(chord.arp[e % 4]), start: at + (e * beat) / 2, length: beat * 0.9, volume: 0.05, decay: 5, harmonics: [0.35, 0.1] })
    }
    // Melody: four bell notes, on beats 1, 3, 4½ and 6.
    ;[0, 2, 3.5, 5].forEach((b, i) => {
      notes.push({ freq: NOTE(chord.tune[i]), start: at + b * beat, length: beat * 1.6, volume: 0.045, decay: 2.5, harmonics: [0.15, 0, 0.08] })
    })
  })
  return notes
}

const MUTE_KEY = 'save-the-savings-account:muted'
let music: Howl | null = null

/** Starts the background music (after the first tap, as browsers require). Safe to call often. */
export function startMusic(): void {
  if (!music) {
    music = new Howl({ src: [wavDataUri(musicNotes(), (60 / 96) * 32, 16000)], format: ['wav'], loop: true, volume: 0.32 })
  }
  if (!music.playing()) music.play()
}

/** Whether all game sound is muted (remembered on this device). */
export function isMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === '1'
  } catch {
    return false
  }
}

/** Lowers the music while Ananya speaks, and brings it back after. */
export function duckMusic(ducked: boolean): void {
  music?.fade(music.volume(), ducked ? 0.1 : 0.32, 300)
}

export function setMuted(muted: boolean): void {
  Howler.mute(muted)
  // Ananya's voice goes quiet too.
  if (muted && typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel()
  try {
    localStorage.setItem(MUTE_KEY, muted ? '1' : '0')
  } catch {
    // Storage unavailable (private mode): the choice lasts for this visit only.
  }
}

/** Applies the remembered mute choice; call once at start-up. */
export function restoreMute(): void {
  Howler.mute(isMuted())
}
