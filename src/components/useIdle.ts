import { useEffect, useState } from 'react'

/**
 * True once nobody has touched the screen (or a key) for `ms`. Any tap or key press resets it.
 * Used to nudge a stuck player towards what they can use, without giving the answer away.
 */
export function useIdle(ms: number, enabled = true): boolean {
  const [idle, setIdle] = useState(false)
  useEffect(() => {
    if (!enabled) return
    let timer = window.setTimeout(() => setIdle(true), ms)
    const reset = () => {
      setIdle(false)
      window.clearTimeout(timer)
      timer = window.setTimeout(() => setIdle(true), ms)
    }
    window.addEventListener('pointerdown', reset)
    window.addEventListener('keydown', reset)
    return () => {
      // Starts fresh next time (after a feedback card, say).
      setIdle(false)
      window.clearTimeout(timer)
      window.removeEventListener('pointerdown', reset)
      window.removeEventListener('keydown', reset)
    }
  }, [ms, enabled])
  return enabled && idle
}
