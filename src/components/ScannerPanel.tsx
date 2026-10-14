import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { GAME, type ScanTask } from '../content/gameData'
import { playChime } from '../audio/chime'
import { cameraScanner } from '../scanner/cameraScanner'
import { useScannerStatus } from '../scanner/useScannerStatus'
import { useGameStore } from '../state/gameStore'
import { useActionHandler } from './actionHandler'
import { SimulatedScanPanel } from './SimulatedScanPanel'

const copy = GAME.scanner

/**
 * The scanner on table scenes (spec 10.2): in-story explanation, then a reticle while the hidden
 * camera reads cards. Falls back to the simulated list when there's no camera or it's blocked.
 */
export function ScannerPanel({ task }: { task: ScanTask }) {
  const handle = useActionHandler()
  const scanQr = useGameStore((s) => s.scanQr)
  const status = useScannerStatus()
  const [flashes, setFlashes] = useState(0)
  const [listChosen, setListChosen] = useState(false)

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
  // The list is the fallback; during development it's always there for testing.
  const showList = import.meta.env.DEV || listChosen || cameraFailed

  return (
    <aside className="scanner-panel">
      <div className={`scanner scanner--${status}`} data-testid="scanner" data-status={status}>
        {status === 'off' && (
          <>
            <h2 className="scanner-title">{copy.permissionTitle}</h2>
            <p>{copy.permissionMessage}</p>
            <button type="button" className="cta cta--small" onClick={() => cameraScanner.enable()}>
              {copy.permissionCta}
            </button>
            {!showList && (
              <button type="button" className="scanner-link" onClick={() => setListChosen(true)}>
                {copy.useListCta}
              </button>
            )}
          </>
        )}
        {status === 'starting' && <p>{copy.startingMessage}</p>}
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
              <button type="button" className="cta cta--small" onClick={() => cameraScanner.enable()}>
                {copy.retryCta}
              </button>
            )}
          </>
        )}
      </div>
      {showList && <SimulatedScanPanel task={task} />}
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
