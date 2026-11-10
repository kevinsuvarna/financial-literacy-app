import { describe, expect, it } from 'vitest'
import { VOICE_LINES } from '../src/audio/voiceLines.ts'
import { spoken, ssml } from './voice-azure.ts'

describe('Ananya voice lines', () => {
  it('marks words that are really in each line', () => {
    for (const line of VOICE_LINES) expect(spoken(line.text)).toContain(line.concern)
  })

  it('builds SSML for the chosen voice, with the concerned words softened', () => {
    const xml = ssml(VOICE_LINES[0], 'en-IN-AnanyaNeural')
    expect(xml).toContain('<voice name="en-IN-AnanyaNeural">')
    expect(xml).toMatch(/<prosody pitch="\+3%" rate="-8%">Something is wrong with my bank account\.<\/prosody>/)
  })

  it('escapes apostrophes and reads written pauses as pauses', () => {
    const xml = ssml(VOICE_LINES[3], 'v')
    expect(xml).toContain('It&apos;s me')
    expect(spoken(VOICE_LINES[2].text)).toBe('… I was checking my account and then—')
  })
})
