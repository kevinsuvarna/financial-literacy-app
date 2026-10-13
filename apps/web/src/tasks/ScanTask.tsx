import { copy, getArtefact } from '@app/content';
import { Badge, Text } from '../components/ui';
import { useGame } from '../game';
import type { TaskOfKind } from './types';

/**
 * Scan tasks have no input of their own — scanning lives in the scene's ScanStation. A scanAll
 * task shows one slot per required card so partial progress is visible.
 */
export function ScanTask({ task }: { task: TaskOfKind<'scanOne' | 'scanAll'> }) {
  const game = useGame();
  if (task.kind === 'scanOne') return null;

  const scannedIds = game.getScannedIds(task.id);
  const slots = task.acceptedIds.map((_, index) => scannedIds[index]);

  return (
    <div className="flex flex-col gap-2">
      <Text size="sm" tone="muted">
        {copy.scanner.progress(scannedIds.length, task.acceptedIds.length)}
      </Text>
      <ol className="flex flex-wrap gap-2">
        {slots.map((scannedId, index) => (
          <li key={scannedId ?? `empty-${index}`}>
            {scannedId ? (
              <Badge tone="success">{getArtefact(scannedId)?.label ?? scannedId}</Badge>
            ) : (
              <Badge>{copy.scanner.slotEmpty}</Badge>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
