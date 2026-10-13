import { copy, getArtefact } from '@app/content';
import { Button } from '../components/ui';
import { simulatedScanSource } from './sources';

/**
 * The simulated scanner: choosing a card here is the stand-in for holding it up to the camera.
 * It emits through the simulated ScanSource, exactly as a decoded QR code would.
 */
export function ArtefactPicker({ artefactIds }: { artefactIds: string[] }) {
  return (
    <div role="group" aria-label={copy.scanner.picker} className="flex flex-wrap gap-2">
      {artefactIds.map((id) => (
        <Button key={id} variant="secondary" onClick={() => simulatedScanSource.scan(id)}>
          {getArtefact(id)?.label ?? id}
        </Button>
      ))}
    </div>
  );
}
