import { GAME } from '../content/gameData.ts'

/**
 * Ananya's recorded lines: which call line each audio file belongs to. The game matches a line
 * by its text; `npm run voice` records the files (scripts/voice-azure.ts).
 */
export interface VoiceLine {
  /** The file in src/assets/voice/, without ".mp3". */
  file: string
  /** The line as the game shows it. */
  text: string
  /** Read more slowly, a little higher, on the words that carry her concern. */
  concern: string
}

const opening = GAME.openingCall.steps
const second = GAME.tasks.L3T1.call.steps

/** A line's text with its line breaks as spaces: how lines are matched to recordings. */
export const lineKey = (text: string) => text.replace(/\s*\n\s*/g, ' ').trim()

export const VOICE_LINES: VoiceLine[] = [
  { file: 'ananya-call1-1', text: opening[0].text, concern: 'Something is wrong with my bank account.' },
  { file: 'ananya-call1-2', text: opening[1].text, concern: 'steal my pocket money' },
  { file: 'ananya-call1-3', text: opening[2].text, concern: 'and then' },
  { file: 'ananya-call2-1', text: second[0].text, concern: 'My debit card has been blocked' },
  { file: 'ananya-call2-2', text: second[1].text, concern: 'by clicking a link.' },
]
