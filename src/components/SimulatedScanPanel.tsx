import { useState } from 'react'
import { ARTEFACT_IDS, GAME, type ArtefactId, type ScanTask } from '../content/gameData'
import { useGameStore } from '../state/gameStore'
import { useActionHandler } from './actionHandler'

/**
 * Fallback for testing without a camera (spec 2, 10.2). Clearly labelled as simulated: choosing a
 * card here is a simulated scan, never presented as a real one.
 */
export function SimulatedScanPanel({ task }: { task: ScanTask }) {
  const handle = useActionHandler()
  const scanArtefact = useGameStore((s) => s.scanArtefact)
  const scanQr = useGameStore((s) => s.scanQr)
  const others = ARTEFACT_IDS.filter((id) => !task.options.includes(id))
  const [other, setOther] = useState<ArtefactId>(others[0])
  const copy = GAME.ui.simulatedScan

  return (
    <aside className="sim-panel" data-testid="simulated-scan" aria-labelledby="sim-panel-title">
      <h2 id="sim-panel-title" className="sim-panel-title">
        {copy.title}
      </h2>
      <p className="sim-panel-note">{copy.note}</p>

      <h3 className="sim-panel-heading">{copy.onTable}</h3>
      <div className="sim-panel-options">
        {task.options.map((id) => (
          <button key={id} type="button" className="sim-button" onClick={() => handle(scanArtefact(id))}>
            {GAME.artefacts[id].name}
          </button>
        ))}
      </div>

      <label className="sim-panel-heading" htmlFor="sim-other">
        {copy.other}
      </label>
      <div className="sim-panel-row">
        <select id="sim-other" value={other} onChange={(e) => setOther(e.target.value as ArtefactId)}>
          {others.map((id) => (
            <option key={id} value={id}>
              {GAME.artefacts[id].name}
            </option>
          ))}
        </select>
        <button type="button" className="sim-button" onClick={() => handle(scanArtefact(other))}>
          {copy.scanOther}
        </button>
      </div>

      <button type="button" className="sim-button sim-button--wide" onClick={() => handle(scanQr(copy.unrelatedQrText))}>
        {copy.unrelated}
      </button>
    </aside>
  )
}
