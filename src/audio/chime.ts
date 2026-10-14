import { Howl } from 'howler'

const SAMPLE_RATE = 22050

/** A short two-note chime, synthesised so no sound file is needed until the real sound design. */
function chimeWavDataUri(): string {
  const duration = 0.45
  const samples = Math.round(SAMPLE_RATE * duration)
  const notes = [
    { freq: 880, start: 0, length: 0.2 },
    { freq: 1318.5, start: 0.09, length: 0.36 },
  ]
  const pcm = new Int16Array(samples)
  for (let i = 0; i < samples; i++) {
    const t = i / SAMPLE_RATE
    let value = 0
    for (const note of notes) {
      const local = t - note.start
      if (local < 0 || local > note.length) continue
      const attack = Math.min(1, local / 0.005)
      value += 0.35 * attack * Math.exp(-local * 9) * Math.sin(2 * Math.PI * note.freq * local)
    }
    pcm[i] = Math.max(-1, Math.min(1, value)) * 0x7fff
  }

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
  view.setUint32(24, SAMPLE_RATE, true)
  view.setUint32(28, SAMPLE_RATE * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  ascii(36, 'data')
  view.setUint32(40, pcm.byteLength, true)
  bytes.set(new Uint8Array(pcm.buffer), 44)

  let binary = ''
  bytes.forEach((b) => (binary += String.fromCharCode(b)))
  return `data:audio/wav;base64,${btoa(binary)}`
}

let chime: Howl | null = null

/** Played when the scanner reads a card (spec 10.2). */
export function playChime(): void {
  chime ??= new Howl({ src: [chimeWavDataUri()], format: ['wav'], volume: 0.6 })
  chime.play()
}
