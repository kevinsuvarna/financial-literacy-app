import { Howl } from 'howler'
import { useEffect, useState } from 'react'
import { duckMusic, isMuted } from './sounds'
import call1Line1 from '../assets/voice/ananya-call1-1.mp3'
import call1Line2 from '../assets/voice/ananya-call1-2.mp3'
import call1Line3 from '../assets/voice/ananya-call1-3.mp3'
import call2Line1 from '../assets/voice/ananya-call2-1.mp3'

/**
 * Ananya's voice. Her lines are recorded (ElevenLabs, voice "Noor"); a line with no recording yet
 * falls back to the device's own speech (Web Speech API), pitched high, quick and shaky (see
 * DISTRESS), so she's never silent.
 */

/** The recorded lines, keyed by the line's text with its line breaks as spaces. */
const RECORDINGS: Record<string, string> = {
  'Helloo? My name is Ananya... Something is wrong with my bank account.': call1Line1,
  'I think someone is trying to steal my pocket money....': call1Line2,
  '... I was checking my account and then-': call1Line3,
  "Hello! It's me, Ananya! My debit card has been blocked": call2Line1,
}

const recordingFor = (text: string): string | undefined => RECORDINGS[text.replace(/\s*\n\s*/g, ' ').trim()]

let playing: Howl | null = null

const synth = typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null

/** Voice names known to be female, by platform (iOS/macOS, Chrome, Windows, Android). */
const FEMALE = /veena|isha|heera|kajal|neerja|aditi|raveena|priya|swara|female|samantha|karen|moira|tessa|serena|fiona|victoria|zira|susan|google uk english female|google us english/i

function pickVoice(): SpeechSynthesisVoice | null {
  if (!synth) return null
  const voices = synth.getVoices()
  const english = voices.filter((v) => v.lang.toLowerCase().startsWith('en'))
  return (
    english.find((v) => v.lang.toLowerCase() === 'en-in' && FEMALE.test(v.name)) ??
    english.find((v) => v.lang.toLowerCase() === 'en-in') ??
    english.find((v) => FEMALE.test(v.name)) ??
    english[0] ??
    null
  )
}

/** Browsers load voices late; ask once early so they're ready for the first line. */
synth?.getVoices()

/** iPad Safari only speaks after a tap: call this from the first tap to unlock speech. */
export function unlockVoice(): void {
  if (!synth) return
  const silent = new SpeechSynthesisUtterance(' ')
  silent.volume = 0
  synth.speak(silent)
}

export function stopVoice(): void {
  synth?.cancel()
  playing?.stop()
  duckMusic(false)
}

/** Roughly how long a line takes to say: a safety net when the device never reports the end. */
const estimateMs = (text: string) => 1500 + text.length * 80

/**
 * Casual, like a girl chatting on the phone: a little higher than an adult voice, at an easy pace,
 * with each line broken at its pauses. Owner (2026-10-24): not dramatic.
 */
const DISTRESS = { pitch: 1.3, rate: 1.0, wobble: [0] }
/** Worried lines: only a touch higher and quicker. */
const PANIC = { pitch: 1.4, rate: 1.05, wobble: [0] }

/** Splits a line at its pauses (commas, full stops, ellipses, dashes), keeping the punctuation. */
function fragments(text: string): string[] {
  const clean = text.replace(/\n/g, ' ').replace(/\.{3,}/g, '…').trim()
  return (clean.match(/[^,.?!…-]+[,.?!…-]*/g) ?? [clean]).map((f) => f.trim()).filter(Boolean)
}

/**
 * Speaks a line of Ananya's, and reports when she's finished (at once if muted or the device has
 * no voice). A new line stops the one before.
 */
export function useAnanyaVoice(
  text: string,
  { active = true, worried = false } = {},
): { done: boolean; voiced: boolean } {
  const [doneFor, setDoneFor] = useState<string | null>(null)
  // Whether this line will be heard: decided while rendering, so nothing waits on a silent device.
  const recording = recordingFor(text)
  const voiced = active && !!text && !isMuted() && (!!recording || (!!synth && !!pickVoice()))
  useEffect(() => {
    if (!voiced) return
    if (recording) {
      let finished = false
      const finish = () => {
        if (finished) return
        finished = true
        duckMusic(false)
        setDoneFor(text)
      }
      synth?.cancel()
      playing?.stop()
      const clip = new Howl({ src: [recording], format: ['mp3'], volume: 1, onend: finish, onloaderror: finish, onplayerror: finish })
      playing = clip
      duckMusic(true)
      clip.play()
      // A safety net in case the clip never reports its end.
      const safety = window.setTimeout(finish, 12000)
      return () => {
        window.clearTimeout(safety)
        clip.off()
        clip.unload()
        if (playing === clip) playing = null
        duckMusic(false)
      }
    }
    const voice = pickVoice()!
    const style = worried ? PANIC : DISTRESS
    const finish = () => {
      duckMusic(false)
      setDoneFor(text)
    }
    synth!.cancel()
    const parts = fragments(text).map((part, i) => {
      const line = new SpeechSynthesisUtterance(part)
      try {
        line.voice = voice
      } catch {
        // Some engines reject a voice object they didn't create; the language still picks the accent.
      }
      line.lang = voice.lang
      line.pitch = Math.min(2, style.pitch + style.wobble[i % style.wobble.length])
      line.rate = style.rate
      return line
    })
    const last = parts[parts.length - 1]
    last.onend = finish
    last.onerror = finish
    duckMusic(true)
    // The engine queues the fragments and says them one after another, with a breath between.
    parts.forEach((part) => synth!.speak(part))
    const safety = window.setTimeout(finish, estimateMs(text))
    return () => {
      window.clearTimeout(safety)
      last.onend = null
      last.onerror = null
      synth!.cancel()
      duckMusic(false)
    }
  }, [text, voiced, worried, recording])
  return { done: !voiced || doneFor === text, voiced }
}
