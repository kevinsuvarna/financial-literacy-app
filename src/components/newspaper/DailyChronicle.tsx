import { GAME } from '../../content/gameData'

const { newspaper } = GAME.tasks.L3T2.reveal
const { phishingMessage } = GAME

/**
 * The Daily Chronicle (12c; also on the desk in 13): laid out flat at 1060 × 720 and projected
 * with `transform` onto wherever it lies.
 */
export function DailyChronicle({ transform, className = '' }: { transform: string; className?: string }) {
  return (
    <div className={`reveal-paper ${className}`} style={{ transform }}>
      <div className="reveal-paper-under" aria-hidden="true" />
      <div className="reveal-paper-sheet">
        <svg className="reveal-paper-emblem" viewBox="0 0 92 92" aria-hidden="true">
          <circle cx="46" cy="46" r="42" />
          <path d="M4 46 H88 M46 4 V88" />
          <path className="reveal-paper-emblem-fill" d="M28 32 L44 24 L56 30 L64 28 L62 44 L54 50 L52 64 L44 58 L36 50 L30 46 Z" />
        </svg>
        <p className="reveal-paper-masthead">{newspaper.masthead}</p>
        <span className="reveal-paper-sep" aria-hidden="true" />
        <p className="reveal-paper-date">{newspaper.date}</p>
        <span className="reveal-paper-rule" aria-hidden="true" />
        <h2 className="reveal-paper-headline">{newspaper.headline}</h2>
        <p className="reveal-paper-body">{newspaper.body}</p>
        <div className="reveal-paper-photo" aria-hidden="true">
          <div className="reveal-paper-phone">
            <p className="reveal-paper-phone-from">{phishingMessage.sender}</p>
            <p className="reveal-paper-phone-time">Now</p>
            <p className="reveal-paper-phone-text">
              Your debit card
              <br />
              has been blocked.
              <br />
              Click here to unlock:
            </p>
            {/* The same unusable address as the message (spec review note 8): never a real site. */}
            <p className="reveal-paper-phone-link">{phishingMessage.link}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
