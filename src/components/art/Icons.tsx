/** Hand-drawn style icons from the mockups. Colours come from CSS (tokens), never from here. */

export function BankIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 110 96" aria-hidden="true">
      <g className="icon-ink">
        <path d="M4 30 L55 4 L106 30 L100 38 L55 15 L10 38 Z" />
        <rect x="12" y="34" width="86" height="11" />
        <rect x="18" y="49" width="10" height="34" />
        <rect x="38" y="49" width="10" height="34" />
        <rect x="62" y="49" width="10" height="34" />
        <rect x="82" y="49" width="10" height="34" />
        <rect x="8" y="85" width="94" height="11" />
      </g>
    </svg>
  )
}

/** The red warning badge (start screen, call screens). */
export function AlertBadge({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" aria-hidden="true">
      <circle className="alert-disc" cx="50" cy="50" r="45" />
      <path className="alert-triangle" d="M50 20 L80 72 Q81 76 77 76 L23 76 Q19 76 20 72 Z" />
      <rect className="icon-ink" x="46.5" y="35" width="7" height="25" rx="3.5" />
      <circle className="icon-ink" cx="50" cy="67" r="4" />
    </svg>
  )
}

export function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true">
      <path
        className="icon-light"
        d="M17 5c3-1 6 0 7 3l5 11c1 3 0 5-2 7l-4 3c3 7 8 12 15 15l3-4c2-2 4-3 7-2l11 5c3 1 4 4 3 7l-2 6c-1 3-4 5-8 5C27 61 3 37 3 13c0-4 2-7 5-8z"
      />
    </svg>
  )
}

export function ArrowRight({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 60 24" aria-hidden="true">
      <path className="icon-stroke" d="M3 13 C18 11 34 13 54 12 M44 3 L56 12 L44 21" />
    </svg>
  )
}

/** A faint laurel sprig (start screen). `flip` mirrors it for the right-hand side. */
export function LaurelSprig({ className, flip = false }: { className?: string; flip?: boolean }) {
  return (
    <svg className={className} viewBox="0 0 160 236" aria-hidden="true" style={flip ? { transform: 'scaleX(-1)' } : undefined}>
      <g className="laurel">
        <path d="M118 228 C84 190 70 140 78 70" fill="none" strokeWidth="6" />
        <ellipse cx="62" cy="62" rx="26" ry="48" transform="rotate(-18 62 62)" />
        <ellipse cx="44" cy="128" rx="27" ry="48" transform="rotate(-48 44 128)" />
        <ellipse cx="74" cy="186" rx="26" ry="44" transform="rotate(-70 74 186)" />
        <ellipse cx="118" cy="112" rx="18" ry="36" transform="rotate(22 118 112)" />
      </g>
    </svg>
  )
}

export function InfoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" aria-hidden="true">
      <circle className="icon-ring" cx="20" cy="20" r="17" />
      <circle className="icon-dot" cx="20" cy="12.5" r="2.5" />
      <path className="icon-stroke-thin" d="M17 18 H21 V29 M16.5 29 H24" />
    </svg>
  )
}
