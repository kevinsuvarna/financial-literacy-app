import { artefacts, getArtefact } from '@app/content';
import {
  generateFakeCameraSequences,
  generateFakeCameraVideos,
} from '../../../scripts/lib/artefactAssets';
import { CAMERA_SEQUENCES } from './fakeCamera';

/** Makes sure every fake-camera video the tests play exists and matches the registry. */
export default async function globalSetup(): Promise<void> {
  await generateFakeCameraVideos(artefacts);
  await generateFakeCameraSequences(
    Object.values(CAMERA_SEQUENCES).map((ids) =>
      ids.map((id) => {
        const artefact = getArtefact(id);
        if (!artefact) throw new Error(`camera sequence names an unknown artefact: ${id}`);
        return artefact;
      }),
    ),
  );
}
