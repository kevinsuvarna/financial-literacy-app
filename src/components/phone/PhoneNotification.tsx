import type { ReactNode } from 'react'

/**
 * A phone notification card (mockups 11c, 11d, 15): avatar, sender, time and a menu, then the
 * message. Links are text only: never working links.
 */
export function PhoneNotification({
  sender,
  time,
  className = '',
  children,
}: {
  sender: string
  time: string
  className?: string
  children?: ReactNode
}) {
  return (
    <article className={`phone-note ${className}`} aria-label={sender}>
      <span className="phone-note-avatar" aria-hidden="true">
        <svg viewBox="0 0 48 48">
          <circle cx="24" cy="18" r="8.5" />
          <path d="M8 40 C10 30 17 27 24 27 C31 27 38 30 40 40 Z" />
        </svg>
      </span>
      <p className="phone-note-sender">{sender}</p>
      <p className="phone-note-time">{time}</p>
      <span className="phone-note-menu" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      {children && <div className="phone-note-body">{children}</div>}
    </article>
  )
}
