/**
 * Records Ananya's call lines with Azure AI Speech (owner, 2026-11-09): a simple, plain young
 * voice with a little concern on the words that carry it. Writes src/assets/voice/<file>.mp3.
 *
 *   npm run voice              record every line
 *   npm run voice -- 2         record only the second line
 *
 * Needs AZURE_SPEECH_KEY and AZURE_SPEECH_REGION in .env (see .env.example). AZURE_VOICE picks
 * another voice; the default is the Indian-English "Ananya" voice.
 */
import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { VOICE_LINES, lineKey, type VoiceLine } from '../src/audio/voiceLines.ts'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(ROOT, 'src', 'assets', 'voice')

/** Young and plain: a touch higher and a touch slower than the voice's own delivery. */
export const DELIVERY = { pitch: '+6%', rate: '-6%' } as const
/** The concerned words: a little slower and higher again, not dramatic. */
export const CONCERN = { pitch: '+3%', rate: '-8%' } as const

const DEFAULT_VOICE = 'en-IN-AnanyaNeural'
const FALLBACK_VOICES = ['en-IN-AashiNeural', 'en-IN-NeerjaNeural']

const escapeXml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')

/** The line as it should be read: written pauses become spoken ones. */
export function spoken(text: string): string {
  return lineKey(text)
    .replace(/\.{3,}/g, '…')
    .replace(/-$/, '—')
}

/** SSML for one line: the whole line in a plain young delivery, its concerned words a little softer. */
export function ssml(line: VoiceLine, voice: string): string {
  const text = spoken(line.text)
  const at = text.indexOf(line.concern)
  const before = at >= 0 ? text.slice(0, at) : text
  const concern = at >= 0 ? line.concern : ''
  const after = at >= 0 ? text.slice(at + line.concern.length) : ''
  const inner =
    escapeXml(before) +
    (concern ? `<prosody pitch="${CONCERN.pitch}" rate="${CONCERN.rate}">${escapeXml(concern)}</prosody>` : '') +
    escapeXml(after)
  return (
    `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-IN">` +
    `<voice name="${voice}"><prosody pitch="${DELIVERY.pitch}" rate="${DELIVERY.rate}">${inner}</prosody></voice></speak>`
  )
}

async function pickVoice(base: string, key: string): Promise<string> {
  const wanted = process.env.AZURE_VOICE || DEFAULT_VOICE
  const res = await fetch(`${base}/cognitiveservices/voices/list`, { headers: { 'Ocp-Apim-Subscription-Key': key } })
  if (!res.ok) throw new Error(`Azure voice list failed: ${res.status} ${await res.text()}`)
  const names = new Set(((await res.json()) as { ShortName: string }[]).map((v) => v.ShortName))
  const voice = [wanted, ...FALLBACK_VOICES].find((name) => names.has(name))
  if (!voice) throw new Error(`None of ${[wanted, ...FALLBACK_VOICES].join(', ')} is available in this region.`)
  if (voice !== wanted) console.log(`${wanted} isn't available here; using ${voice}.`)
  return voice
}

async function main() {
  const key = process.env.AZURE_SPEECH_KEY
  const region = process.env.AZURE_SPEECH_REGION
  if (!key || !region) {
    console.error('Set AZURE_SPEECH_KEY and AZURE_SPEECH_REGION in .env (copy .env.example), then run npm run voice again.')
    process.exit(1)
  }
  const base = `https://${region}.tts.speech.microsoft.com`
  const voice = await pickVoice(base, key)
  const only = process.argv[2] ? Number(process.argv[2]) : null
  const lines = only ? [VOICE_LINES[only - 1]].filter(Boolean) : VOICE_LINES
  for (const line of lines) {
    const res = await fetch(`${base}/cognitiveservices/v1`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': key,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-24khz-96kbitrate-mono-mp3',
        'User-Agent': 'save-the-savings-account',
      },
      body: ssml(line, voice),
    })
    if (!res.ok) throw new Error(`${line.file}: Azure said ${res.status} ${await res.text()}`)
    const file = path.join(OUT, `${line.file}.mp3`)
    await writeFile(file, Buffer.from(await res.arrayBuffer()))
    console.log(`✓ ${line.file}.mp3  "${spoken(line.text)}"`)
  }
  console.log(`Done, with ${voice}. Reload the game to hear her.`)
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main().catch((err: unknown) => {
    console.error(err instanceof Error ? err.message : err)
    process.exit(1)
  })
}
