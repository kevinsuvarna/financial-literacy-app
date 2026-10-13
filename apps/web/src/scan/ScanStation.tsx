import { copy } from '@app/content';
import { Card, Heading, Text } from '../components/ui';
import { ArtefactPicker } from './ArtefactPicker';
import { isCameraScanningActive } from './camera';

/** Where scanning happens in a table scene. Falls back to the picker without a live camera. */
export function ScanStation({ artefactIds }: { artefactIds: string[] }) {
  if (isCameraScanningActive()) return null;

  return (
    <Card tone="sunken" as="section" className="flex flex-col gap-3">
      <Heading level={2} size="section">
        {copy.scanner.heading}
      </Heading>
      <Text size="sm" tone="muted">
        {copy.scanner.cameraUnavailable}
      </Text>
      <ArtefactPicker artefactIds={artefactIds} />
    </Card>
  );
}
