/**
 * The highlighter pen lying on the statement (09, and Level 2, Task 3's tool), drawn lying flat
 * along +x with its tip at the left; the caller rotates it into place. Colours come from tokens.
 */
export function HighlighterPen({ className }: { className?: string }) {
  return (
    <svg className={`highlighter-pen ${className ?? ''}`} viewBox="0 0 340 80" aria-hidden="true">
      <defs>
        <linearGradient id="pen-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--pen-body-light)" />
          <stop offset="0.55" stopColor="var(--pen-body)" />
          <stop offset="1" stopColor="var(--pen-body-shade)" />
        </linearGradient>
        <linearGradient id="pen-teal" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--pen-teal-light)" />
          <stop offset="0.5" stopColor="var(--pen-teal)" />
          <stop offset="1" stopColor="var(--pen-teal-dark)" />
        </linearGradient>
      </defs>
      {/* Chisel tip */}
      <path d="M2 31 L19 27 L19 51 L4 48 Z" fill="var(--pen-tip)" />
      {/* Teal nose, tapering to the tip, with its collar */}
      <path d="M17 28 C30 24 44 15 60 13 L84 13 L84 67 L60 67 C44 65 30 56 17 52 Z" fill="url(#pen-teal)" />
      <rect x="70" y="12" width="14" height="56" rx="2" fill="var(--pen-teal-dark)" opacity="0.55" />
      {/* Body */}
      <rect x="82" y="11" width="170" height="58" rx="3" fill="url(#pen-body)" />
      <rect x="88" y="18" width="158" height="5" rx="2.5" fill="var(--pen-body-light)" opacity="0.7" />
      {/* Cap, with a ring where it meets the body */}
      <rect x="248" y="9" width="88" height="62" rx="9" fill="url(#pen-teal)" />
      <rect x="248" y="9" width="11" height="62" rx="3" fill="var(--pen-teal-dark)" />
      <rect x="264" y="14" width="66" height="5" rx="2.5" fill="var(--pen-teal-light)" opacity="0.6" />
    </svg>
  )
}
