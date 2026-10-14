/**
 * "The same artefact detected repeatedly within a short window counts once" (spec 10.2).
 * A card held up to the camera is decoded many times a second; it counts once, and counts again
 * only after it has been out of view for `windowMs`.
 */
export function createRepeatFilter(windowMs: number) {
  let last: string | null = null
  let lastSeen = Number.NEGATIVE_INFINITY

  return {
    /** True if this decode should go to the game. */
    accept(text: string, now: number): boolean {
      const repeat = text === last && now - lastSeen < windowMs
      last = text
      lastSeen = now
      return !repeat
    },
    /** The game couldn't take the last code (e.g. feedback was showing): let it count on the next frame. */
    forget() {
      last = null
    },
  }
}
