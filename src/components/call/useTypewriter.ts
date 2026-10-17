import { useEffect, useState } from 'react'

/** Milliseconds per character, like someone speaking quickly. */
export const TYPE_MS_PER_CHAR = 38

/**
 * Reveals `text` one character at a time. `finish()` shows it all at once (a tap).
 * With reduced motion the text appears immediately.
 */
export function useTypewriter(text: string) {
  const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  const start = reduced ? text.length : 0
  const [state, setState] = useState({ text, shown: start })
  // A new line starts from the beginning (adjusting state during render, not in an effect).
  if (state.text !== text) setState({ text, shown: start })
  const shown = state.text === text ? state.shown : start

  useEffect(() => {
    if (reduced) return
    const timer = window.setInterval(() => {
      setState((s) => (s.shown >= s.text.length ? s : { ...s, shown: s.shown + 1 }))
    }, TYPE_MS_PER_CHAR)
    return () => window.clearInterval(timer)
  }, [text, reduced])

  return {
    shown: text.slice(0, shown),
    rest: text.slice(shown),
    done: shown >= text.length,
    finish: () => setState({ text, shown: text.length }),
  }
}
