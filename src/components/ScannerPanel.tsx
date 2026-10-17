import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { GAME } from '../content/gameData'
import { playChime } from '../audio/sounds'
import { cameraScanner } from '../scanner/cameraScanner'
import { useScannerStatus } from '../scanner/useScannerStatus'
import { useGameStore } from '../state/gameStore'
import { useActionHandler } from './actionHandler'

const copy = GAME.scanner

/**
 * The scanner on table scenes (spec 10.2): in-story explanation, then a reticle while the hidden
 * camera reads cards. Falls back to the simulated list when there's no camera or it's blocked.
 */
export function ScannerPanel() {
  const handle = useActionHandler()
  const scanQr = useGameStore((s) => s.scanQr)
  const status = useScannerStatus()
  const [flashes, setFlashes] = useState(0)

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
    <aside className="scanner-panel">
      <div className={`scanner scanner--${status}`} data-testid="scanner" data-status={status}>
        {(status === 'off' || status === 'starting') && <p>{copy.startingMessage}</p>}
        {status === 'active' && (
          <>
            <div className="reticle" aria-hidden="true">
              <span className="reticle-line" />
            </div>
            <p className="scanner-hint">{copy.holdHint}</p>
          </>
        )}
        {cameraFailed && (
          <>
            <h2 className="scanner-title">
              {status === 'denied' ? copy.deniedTitle : status === 'error' ? copy.errorTitle : copy.fallbackTitle}
            </h2>
            <p>{status === 'denied' ? copy.deniedMessage : status === 'error' ? copy.errorMessage : copy.fallbackMessage}</p>
            {status !== 'unavailable' && (
              <button type="button" className="cta cta--small" onClick={() => cameraScanner.retry()}>
                {copy.retryCta}
              </button>
            )}
          </>
        )}
      </div>
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
    </aside>
  )
}
