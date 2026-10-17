export function formatTimer(seconds: number): string {
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
}

/** When Ananya's second call connected, so its timer runs on across the call and choice screens (11–11f). */
let secondCallStart: number | null = null

export function startSecondCall() {
  secondCallStart = Date.now() - 1000
}

/** Seconds since the second call connected (it picks up at 00:05 if the screen is opened directly). */
export function secondCallSeconds(): number {
  if (secondCallStart === null) secondCallStart = Date.now() - 5000
  return Math.floor((Date.now() - secondCallStart) / 1000)
}
