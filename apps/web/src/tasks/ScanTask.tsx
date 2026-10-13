import { copy, getArtefact } from '@app/content';
import { Stamp, Text, cx } from '../components/ui';
import { useGame } from '../game';
import type { TaskOfKind } from './types';

interface SlotProps {
  title: string;
  /** The card in this slot, or undefined while it waits for a scan. */
  artefactId: string | undefined;
  /** Stamped onto the slot when it fills. */
  stamp?: string;
}

function Slot({ title, artefactId, stamp }: SlotProps) {
  return (
    <li
      className={cx(
        'flex min-h-24 flex-col justify-center gap-1 rounded-card border-2 px-4 py-3',
        artefactId ? 'border-success bg-success-soft' : 'border-dashed border-ink-muted',
      )}
    >
      <Text size="sm" tone="muted">
        {title}
      </Text>
      {artefactId ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="font-semibold">{getArtefact(artefactId)?.label ?? artefactId}</span>
          {stamp && (
            <Stamp tone="success" animate>
              {stamp}
            </Stamp>
          )}
        </div>
      ) : (
        <span>{copy.scanner.slotEmpty}</span>
      )}
    </li>
  );
}

/**
 * Scan tasks have no input of their own — scanning lives in the scene's ScanStation. This shows
 * what has been scanned so far: one slot per required card, filled (and stamped) in whatever
 * order the cards are scanned. A scanOne task shows its answer once it is solved.
 */
export function ScanTask({ task }: { task: TaskOfKind<'scanOne' | 'scanAll'> }) {
  const game = useGame();

  if (task.kind === 'scanOne') {
    const solved = game.getTaskStatus(task.id) === 'completed';
    if (!solved) return null;
    return (
      <ul>
        <Slot title={copy.scanner.answer} artefactId={task.acceptedIds[0]} />
      </ul>
    );
  }

  const scannedIds = game.getScannedIds(task.id);

  return (
    <div className="flex flex-col gap-2">
      <Text size="sm" tone="muted">
        {copy.scanner.progress(scannedIds.length, task.acceptedIds.length)}
      </Text>
      <ol className="grid gap-3 sm:grid-cols-2">
        {task.acceptedIds.map((_, index) => (
          // Keyed by position: a slot stays put and its stamp lands when it fills.
          <Slot
            key={index}
            title={copy.scanner.slot(index + 1)}
            artefactId={scannedIds[index]}
            stamp={copy.scanner.verified}
          />
        ))}
      </ol>
    </div>
  );
}
