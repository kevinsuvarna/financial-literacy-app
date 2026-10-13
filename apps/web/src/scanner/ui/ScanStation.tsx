import { useState, type ReactNode } from 'react';
import { copy } from '@app/content';
import { Badge, Button, Card, Heading, Notice, ScanReticle, Text } from '../../components/ui';
import { setCameraPreference } from '../cameraPreference';
import { useCameraPreference, useCameraState, useScannerStats } from '../hooks';
import { cameraSource, scanHub } from '../runtime';
import type { CameraState } from '../sources/CameraSource';
import { getCameraSupport } from '../sources/cameraSupport';
import { ArtefactPicker } from './ArtefactPicker';

/** Asked in the story's own voice before the browser's permission dialog appears. */
function PermissionPrompt() {
  return (
    <div className="flex flex-col gap-3">
      <Heading level={3} size="section">
        {copy.scanner.permissionHeading}
      </Heading>
      <Text size="sm">{copy.scanner.permissionBody}</Text>
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => setCameraPreference('enabled')}>{copy.scanner.enable}</Button>
        <Button variant="secondary" onClick={() => setCameraPreference('declined')}>
          {copy.scanner.decline}
        </Button>
      </div>
    </div>
  );
}

function CameraScanner({ camera }: { camera: CameraState }) {
  const scanning = camera.status === 'scanning';

  return (
    <div className="flex flex-col items-center gap-3">
      {scanning ? (
        <Badge tone="success" pulse>
          {copy.scanner.active}
        </Badge>
      ) : (
        <Badge>{copy.scanner.starting}</Badge>
      )}
      <ScanReticle active={scanning} />
      <Text className="font-semibold">{copy.scanner.hint}</Text>
      <div className="flex flex-wrap justify-center gap-3">
        {camera.canSwitch && (
          <Button variant="quiet" size="sm" onClick={() => void cameraSource.switchCamera()}>
            {copy.scanner.switchCamera}
          </Button>
        )}
        <Button variant="quiet" size="sm" onClick={() => setCameraPreference('declined')}>
          {copy.scanner.useList}
        </Button>
      </div>
    </div>
  );
}

/**
 * Where scanning happens in a table scene. It shows the camera scanner when the player has
 * switched it on and it is working, and the card list in every other case — no camera, an
 * insecure page, permission declined or denied, or a scanner that failed to start.
 */
export function ScanStation({ artefactIds }: { artefactIds: string[] }) {
  const camera = useCameraState();
  const preference = useCameraPreference();
  const stats = useScannerStats();
  // Only scans made on this task matter here; an earlier task's last scan is not a mistake.
  const [scansBefore] = useState(() => scanHub.getStats().total);

  const picker = <ArtefactPicker artefactIds={artefactIds} />;
  const tryScanner = (onClick: () => void) => (
    <Button variant="quiet" size="sm" className="self-start" onClick={onClick}>
      {copy.scanner.tryScanner}
    </Button>
  );

  let body: ReactNode;
  if (getCameraSupport() !== 'supported') {
    body = (
      <>
        <Text size="sm" tone="muted">
          {copy.scanner.cameraUnavailable}
        </Text>
        {picker}
      </>
    );
  } else if (preference === 'unasked') {
    body = <PermissionPrompt />;
  } else if (preference === 'declined') {
    body = (
      <>
        {picker}
        {tryScanner(() => setCameraPreference('enabled'))}
      </>
    );
  } else if (camera.status === 'error') {
    body = (
      <>
        <Notice tone="info">{copy.scanner.errors[camera.error ?? 'unknown']}</Notice>
        {picker}
        {tryScanner(() => void cameraSource.retry())}
      </>
    );
  } else {
    body = <CameraScanner camera={camera} />;
  }

  const last = stats.last && stats.last.seq > scansBefore ? stats.last : null;
  let scanNotice: string | null = null;
  if (last?.kind === 'unknown') scanNotice = copy.scanner.unknownCode;
  else if (last && !artefactIds.includes(last.id)) scanNotice = copy.scanner.offTask;

  return (
    <Card tone="sunken" as="section" className="flex flex-col gap-3">
      <Heading level={2} size="section">
        {copy.scanner.heading}
      </Heading>
      {body}
      {scanNotice && <Notice tone="info">{scanNotice}</Notice>}
    </Card>
  );
}
