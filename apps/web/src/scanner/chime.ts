import { Howl } from 'howler';

const SAMPLE_RATE = 22_050;

/**
 * Synthesises a short two-note "ding" as a WAV data URI. A placeholder until real sound design
 * arrives — it keeps a binary asset out of the repo while still going through Howler, which
 * handles mobile audio unlocking and global mute.
 */
function createChimeDataUri(): string {
  const notes = [
    { frequency: 880, start: 0, duration: 0.18 },
    { frequency: 1318.5, start: 0.09, duration: 0.3 },
  ];
  const sampleCount = Math.ceil(SAMPLE_RATE * 0.42);
  const bytes = new Uint8Array(44 + sampleCount * 2);
  const view = new DataView(bytes.buffer);

  const writeText = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i += 1) view.setUint8(offset + i, text.charCodeAt(i));
  };
  writeText(0, 'RIFF');
  view.setUint32(4, 36 + sampleCount * 2, true);
  writeText(8, 'WAVEfmt ');
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, SAMPLE_RATE * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeText(36, 'data');
  view.setUint32(40, sampleCount * 2, true);

  for (let i = 0; i < sampleCount; i += 1) {
    const time = i / SAMPLE_RATE;
    let sample = 0;
    for (const note of notes) {
      const local = time - note.start;
      if (local < 0 || local > note.duration) continue;
      // Fast attack, exponential decay — a struck-bell shape rather than a beep.
      const envelope = Math.min(1, local / 0.005) * Math.exp(-local * 9);
      sample += Math.sin(2 * Math.PI * note.frequency * local) * envelope;
    }
    view.setInt16(44 + i * 2, Math.max(-1, Math.min(1, sample * 0.45)) * 0x7fff, true);
  }

  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return `data:audio/wav;base64,${btoa(binary)}`;
}

let chime: Howl | null = null;

export function playScanChime(): void {
  try {
    chime ??= new Howl({ src: [createChimeDataUri()], format: ['wav'], volume: 0.6 });
    chime.play();
  } catch {
    // Sound is a nicety; never let it break a scan.
  }
}
