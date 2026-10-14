import { artefacts } from '@app/content';
import { generateFakeCameraVideos } from '../../../scripts/lib/artefactAssets';

/** Makes sure every artefact's fake-camera video exists and matches the registry. */
export default async function globalSetup(): Promise<void> {
  await generateFakeCameraVideos(artefacts);
}
