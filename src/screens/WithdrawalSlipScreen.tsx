import { GAME } from '../content/gameData'
import { InfoIcon } from '../components/art/Icons'
import { SceneScanner } from '../components/scene/SceneScanner'
import { ScannedMark } from '../components/scene/Scanned'
import { useScanMarks } from '../components/scene/useScanMarks'
import { useTapArtefact } from '../components/scene/useTapArtefact'
import { Desk } from '../components/scene/TableScene'
import { TaskScreen } from '../components/TaskScreen'
import folderArt from '../assets/interim/bank-docs-folder.png'

const task = GAME.tasks.L1T3

/** 06: Deposit vs withdrawal slips in Ananya's bank docs folder (mockup 06-L1T3-withdrawal-slip.png). */
export function WithdrawalSlipScreen() {
  return (
    <TaskScreen taskId="L1T3" variant="scene">
      <SlipsFolder />
    </TaskScreen>
  )
}

/** Scan a slip, or tap it in the folder: both count the same. */
function SlipsFolder() {
  const tap = useTapArtefact()
  const markOf = useScanMarks('L1T3')

  return (
    <>
      <Desk variant="folder" />
      <p className="slips-intro">{task.intro}</p>
      <h1 className="slips-prompt">{task.prompt}</h1>
      {/* Interim art: the folder and both slips, lifted from mockup 06. */}
      <img className="slips-folder" src={folderArt} alt="" />
      {/* Tap areas over the two slips in the folder art. */}
      {task.options.map((id) => {
        const mark = markOf(id)
        return (
          <button
            key={id}
            type="button"
            className={`slip-tap slip-tap--${id}${mark ? ' is-scanned' : ''}`}
            data-artefact={id}
            aria-label={GAME.artefacts[id].name}
            disabled={!!mark}
            onClick={() => tap(id)}
          >
            <ScannedMark mark={mark} />
          </button>
        )
      })}
      <p className="slips-hint">
        <InfoIcon className="mat-hint-icon" />
        {task.instruction}
      </p>
      <SceneScanner />
    </>
  )
}
