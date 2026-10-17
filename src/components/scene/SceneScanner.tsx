import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { GAME } from '../../content/gameData'
import { playChime } from '../../audio/sounds'
import { cameraScanner, type ScannerStatus } from '../../scanner/cameraScanner'
import { useScannerStatus } from '../../scanner/useScannerStatus'
import { useGameStore } from '../../state/gameStore'
import { useActionHandler } from '../actionHandler'

const copy = GAME.scanner

/**
 * The scanner on mockup-matched table scenes (spec 10.2). It starts by itself (access was asked
 * for on the game's first tap); while it runs, the desk lamp pulses (see DeskLamp). Players can
 * also tap a card on screen. If the camera can't be used, a small note says so and offers TRY AGAIN.
 */
export function SceneScanner({ onStatus }: { onStatus?: (status: ScannerStatus) => void }) {
  const handle = useActionHandler()
  const scanQr = useGameStore((s) => s.scanQr)
  const status = useScannerStatus()
  const [flashes, setFlashes] = useState(0)

  useEffect(() => onStatus?.(status), [status, onStatus])

  useEffect(
    () =>
      cameraScanner.attach((text) => {
        const result = handle(scanQr(text))
        if (result.outcome === 'ignored') return false
        playChime()
        setFlashes((n) => n + 1)
        return true
      }),
    [handle, scanQr],
  )

  const cameraFailed = status === 'denied' || status === 'unavailable' || status === 'error'

  return (
    <>
      {cameraFailed && (
        <div className="scanner-note" data-testid="scanner" data-status={status} role="note">
          <strong>{status === 'denied' ? copy.deniedTitle : status === 'error' ? copy.errorTitle : copy.fallbackTitle}</strong>
          <span>{status === 'denied' ? copy.deniedMessage : status === 'error' ? copy.errorMessage : copy.fallbackMessage}</span>
          {status !== 'unavailable' && (
            <button type="button" className="scanner-note-retry" onClick={() => cameraScanner.retry()}>
              {copy.retryCta}
            </button>
          )}
        </div>
      )}

      {flashes > 0 && (
        <motion.div
          key={flashes}
          className="scan-flash"
          aria-hidden="true"
          initial={{ opacity: 0.7 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        />
      )}
    </>
  )
}
