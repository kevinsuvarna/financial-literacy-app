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
import aadhaarArt from '../assets/interim/table-aadhaar-card.png'
import libraryArt from '../assets/interim/table-library-card.png'
import panArt from '../assets/interim/table-pan-card.png'
import passportArt from '../assets/interim/table-passport.png'

const task = GAME.tasks.L1T2

/** Interim art lifted from mockup 05 (un-warped from the mat). */
const ART: Partial<Record<ArtefactId, string>> = {
  'expired-passport': passportArt,
  'library-card': libraryArt,
  'pan-card': panArt,
  'aadhaar-card': aadhaarArt,
}

/** 05: Identity documents on the table (mockup 05-L1T2-verify-identity.png). */
export function VerifyIdentityScreen() {
  return (
    <TaskScreen taskId="L1T2" variant="scene">
      <IdentityTable />
    </TaskScreen>
  )
}

/** Scan a document, or tap it on screen: both count the same. */
function IdentityTable() {
  const [scannerStatus, setScannerStatus] = useState<ScannerStatus>('off')
  const tap = useTapArtefact()
  // A document already scanned is greyed out and marked, and can't be tapped again.
  const markOf = useScanMarks('L1T2')

  return (
    <>
      <Desk />
      {/* Mockup 05's lamp is mockup 04's, smaller and further from the viewer. */}
      <DeskLamp scanning={scannerStatus === 'active'} placement="translate(32.2 30.8) scale(0.876)" />
      <Mat name="verifyIdentity">
        <h1 className="mat-title">{task.prompt}</h1>
        <ul className="id-docs" aria-label={task.instruction}>
          {task.options.map((id) => {
            const mark = markOf(id)
            const scanned = !!mark
            return (
              <li key={id} className={`id-doc id-doc--${id}${scanned ? ' is-scanned' : ''}`}>
                <button type="button" className="id-doc-art" data-artefact={id} disabled={scanned} onClick={() => tap(id)}>
                  {ART[id] && <img src={ART[id]} alt="" />}
                  <span className="visually-hidden">{GAME.artefacts[id].cardLabel}</span>
                  <ScannedMark mark={mark} wash={false} />
                </button>
                {/* The printed label is part of the tap target too. */}
                <span className="id-doc-label" aria-hidden="true" onClick={() => !scanned && tap(id)}>
                  {GAME.artefacts[id].cardLabel}
                </span>
              </li>
            )
          })}
        </ul>
        <p className="mat-hint">
          <InfoIcon className="mat-hint-icon" />
          {task.instruction}
        </p>
      </Mat>
      <SceneScanner onStatus={setScannerStatus} />
    </>
  )
}
