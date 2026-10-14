import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { copy, getArtefact, incidentReport } from '@app/content';
import { playSound } from '../audio/sounds';
import { PaperThumbnail, Stamp, Text, cx } from '../components/ui';
import { useGame } from '../game';
import type { TaskOfKind } from './types';

/** When the paperclip sounds: as the page that is flying in reaches its slot. */
const CLIP_AFTER_MS = 260;

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
 * Evidence for the incident report: every required artefact has a dashed slot of its own,
 * named for it. Scanning one flies a page into its slot, where a paperclip holds it.
 *
 * The slots only show what the game has recorded (`scannedIds`); evidence that was attached
 * before this screen opened is simply there, without the flight or the sound.
 */
function EvidenceSlots({ task }: { task: TaskOfKind<'scanAll'> }) {
  const game = useGame();
  const scannedIds = game.getScannedIds(task.id);
  const [attachedOnOpen] = useState(scannedIds);
  const attachedCount = scannedIds.length;

  useEffect(() => {
    if (attachedCount > attachedOnOpen.length) playSound('paperclip', { delayMs: CLIP_AFTER_MS });
  }, [attachedCount, attachedOnOpen]);

  return (
    <div className="flex flex-col gap-2">
      <Text size="sm" tone="muted" aria-live="polite">
        {copy.evidence.progress(attachedCount, task.acceptedIds.length)}
      </Text>
      <ol aria-label={copy.evidence.slots} className="grid gap-4 sm:grid-cols-2">
        {task.acceptedIds.map((artefactId) => {
          const attached = scannedIds.includes(artefactId);
          const justAttached = attached && !attachedOnOpen.includes(artefactId);
          const title = incidentReport.evidenceTitles[artefactId] ?? artefactId;

          return (
            <li
              key={artefactId}
              data-slot={artefactId}
              data-state={attached ? 'attached' : 'empty'}
              className={cx(
                'flex min-h-52 flex-col items-center justify-center gap-3 rounded-card border-2 p-4 text-center',
                attached ? 'border-success bg-success-soft' : 'border-dashed border-ink-muted',
              )}
            >
              <span className="font-semibold">{getArtefact(artefactId)?.label ?? artefactId}</span>
              {attached ? (
                <>
                  <motion.span
                    initial={
                      justAttached ? { x: -60, y: 180, rotate: -28, scale: 0.5, opacity: 0 } : false
                    }
                    animate={{ x: 0, y: 0, rotate: -3, scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 220, damping: 20 }}
                    className="inline-flex"
                  >
                    <PaperThumbnail title={title} />
                  </motion.span>
                  <Stamp tone="success" animate={justAttached ? 'late' : false}>
                    {copy.evidence.attached}
                  </Stamp>
                  <Text size="sm">{incidentReport.evidenceDescriptions[artefactId]}</Text>
                </>
              ) : (
                <>
                  <PaperThumbnail title={title} ghost />
                  <Text size="sm" tone="muted">
                    {copy.evidence.waiting}
                  </Text>
                </>
              )}
            </li>
          );
        })}
      </ol>
    </div>
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

  if (task.slotStyle === 'labelled') return <EvidenceSlots task={task} />;

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
