import { GAME } from '../../content/gameData'
import { Icon } from '../Icon'
import type { ScanMark } from './useScanMarks'

/**
 * Drawn inside a scanned artefact's (disabled) tap target: a wash that greys it out, and a
 * SCANNED tag — green with a tick for a right answer, navy for a wrong one already tried.
 */
export function ScannedMark({ mark, wash = true }: { mark: ScanMark; wash?: boolean }) {
  if (!mark) return null
  return (
    <>
      {wash && <span className="scanned-wash" aria-hidden="true" />}
      <span className={`scanned-tag scanned-tag--${mark}`}>
        {mark === 'accepted' && <Icon name="check" size={20} />}
        {GAME.ui.slotDone}
      </span>
    </>
  )
}
