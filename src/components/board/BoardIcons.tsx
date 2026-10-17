/**
 * The level icons on the Case Board cards (mockup 21). Drawn in `currentColor` (the board ink),
 * with paper and glass fills from tokens via CSS classes.
 */

/** Level 1: the bank, with an open roof. */
export function BoardBankIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 74 64" aria-hidden="true">
      <path d="M5 17 L37 4 L69 17 Z" fill="none" stroke="currentColor" strokeWidth="4.2" strokeLinejoin="round" />
      <g fill="currentColor">
        <rect x="9" y="20" width="56" height="5" rx="1" />
        <rect x="12" y="29" width="5.5" height="25" rx="1" />
        <rect x="25" y="29" width="5.5" height="25" rx="1" />
        <rect x="43.5" y="29" width="5.5" height="25" rx="1" />
        <rect x="56.5" y="29" width="5.5" height="25" rx="1" />
        <rect x="6" y="57" width="62" height="5.5" rx="1" />
      </g>
    </svg>
  )
}

/** Level 2: a statement under a magnifying glass. */
export function BoardStatementIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 89 69" aria-hidden="true">
      <g transform="rotate(-7 32 36)">
        <rect className="board-icon-paper" x="5" y="8" width="56" height="54" rx="3" stroke="currentColor" strokeWidth="3.6" />
        <g stroke="currentColor" strokeWidth="3" strokeLinecap="round">
          <path d="M14 22 H50" />
          <path d="M14 31 H44" />
          <path d="M14 40 H40" />
          <path d="M14 49 H34" />
        </g>
      </g>
      <path d="M68 51 L84 65" stroke="currentColor" strokeWidth="6.5" strokeLinecap="round" />
      <circle className="board-icon-glass" cx="57" cy="40" r="16" stroke="currentColor" strokeWidth="4" />
    </svg>
  )
}

/** Level 3: a shield with a tick. */
export function BoardShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 66 76" aria-hidden="true">
      <path
        d="M33 3 L62 13 V36 C62 54 50 66 33 73 C16 66 4 54 4 36 V13 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="5.5"
        strokeLinejoin="round"
      />
      <path
        className="board-icon-paper"
        d="M33 13 L53 20 V37 C53 50 45 58 33 63 C21 58 13 50 13 37 V20 Z"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinejoin="round"
      />
      <path d="M22 38 L30 46 L45 29" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** A padlock, hung on a locked level's card. */
export function BoardLockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 36" aria-hidden="true">
      <path d="M9 16 V11 a7 7 0 0 1 14 0 V16" fill="none" stroke="currentColor" strokeWidth="3.4" />
      <rect x="4" y="15" width="24" height="18" rx="3" fill="currentColor" />
      <circle className="board-icon-paper" cx="16" cy="23" r="2.6" />
      <rect className="board-icon-paper" x="15" y="24" width="2" height="5" />
    </svg>
  )
}
