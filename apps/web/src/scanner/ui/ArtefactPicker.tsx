import { copy, getArtefact } from '@app/content';
import { Button } from '../../components/ui';
import { simulatedSource } from '../runtime';

/**
 * The simulated scanner: choosing a card here is the stand-in for holding it up to the camera.
 * It emits through SimulatedSource, exactly as a decoded QR code would through CameraSource.
 */
export function ArtefactPicker({ artefactIds }: { artefactIds: string[] }) {
  return (
    <div role="group" aria-label={copy.scanner.picker} className="flex flex-wrap gap-2">
      {artefactIds.map((id) => (
        <Button key={id} variant="secondary" onClick={() => simulatedSource.scan(id)}>
          {getArtefact(id)?.label ?? id}
        </Button>
      ))}
    </div>
  );
}
