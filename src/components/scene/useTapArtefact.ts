import type { ArtefactId } from '../../content/gameData'
import { useGameStore } from '../../state/gameStore'
import { useActionHandler } from '../actionHandler'

/** Tapping an artefact on screen counts exactly like scanning it. */
export function useTapArtefact() {
  const handle = useActionHandler()
  const scanArtefact = useGameStore((s) => s.scanArtefact)
  return (id: ArtefactId) => handle(scanArtefact(id))
}
