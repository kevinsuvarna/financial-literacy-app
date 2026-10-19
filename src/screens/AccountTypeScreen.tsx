import { useState } from 'react'
import { GAME, type ArtefactId } from '../content/gameData'
import { InfoIcon } from '../components/art/Icons'
import { SceneScanner } from '../components/scene/SceneScanner'
import { ScannedMark } from '../components/scene/Scanned'
import { useScanMarks } from '../components/scene/useScanMarks'
import { useTapArtefact } from '../components/scene/useTapArtefact'
import { Desk, DeskLamp, Mat } from '../components/scene/TableScene'
import { TaskScreen } from '../components/TaskScreen'
import type { ScannerStatus } from '../scanner/cameraScanner'
import currentArt from '../assets/interim/card-current.png'
import fixedArt from '../assets/interim/card-fixed-deposit.png'
import recurringArt from '../assets/interim/card-recurring-deposit.png'
import savingsArt from '../assets/interim/card-savings.png'

const task = GAME.tasks.L1T1

/** Card illustrations; interim art lifted from mockup 04 until the real exports arrive. */
const ART: Partial<Record<ArtefactId, string>> = {
  'savings-account': savingsArt,
  'current-account': currentArt,
  'fixed-deposit-account': fixedArt,
  'recurring-deposit-account': recurringArt,
}

/** 04: Account type cards on the table (mockup 04-L1T1-account-type.png). */
export function AccountTypeScreen() {
  return (
    <TaskScreen taskId="L1T1" variant="scene">
      <AccountTypeTable />
    </TaskScreen>
  )
}

/** Scan a card, or tap it on screen: both count the same. */
function AccountTypeTable() {
  const [scannerStatus, setScannerStatus] = useState<ScannerStatus>('off')
  const tap = useTapArtefact()
  const markOf = useScanMarks('L1T1')

  return (
    <>
      <Desk />
      <DeskLamp scanning={scannerStatus === 'active'} blocked={['denied', 'unavailable', 'error'].includes(scannerStatus)} />
      <Mat>
        <h1 className="mat-title">{task.prompt}</h1>
        <ul className="table-cards" aria-label={task.instruction}>
          {task.options.map((id) => {
            const mark = markOf(id)
            return (
              <li key={id}>
                <button
                  type="button"
                  className={`table-card table-card--${id}${mark ? ' is-scanned' : ''}`}
                  data-artefact={id}
                  disabled={!!mark}
                  onClick={() => tap(id)}
                >
                  <span className="table-card-label">{GAME.artefacts[id].cardLabel}</span>
                  <ScannedMark mark={mark} />
                </button>
              </li>
            )
          })}
        </ul>
        {task.options.map((id) =>
          ART[id] ? (
            <img key={id} className={`table-card-art table-card-art--${id}${markOf(id) ? ' is-scanned' : ''}`} src={ART[id]} alt="" />
          ) : null,
        )}
        <p className="mat-hint">
          <InfoIcon className="mat-hint-icon" />
          {task.instruction}
        </p>
      </Mat>
      <SceneScanner onStatus={setScannerStatus} nearLamp />
    </>
  )
}
