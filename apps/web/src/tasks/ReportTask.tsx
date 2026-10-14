import { useState } from 'react';
import {
  copy,
  formatRupees,
  getArtefact,
  getReportedTransactionAmount,
  incidentReport,
} from '@app/content';
import {
  Badge,
  Button,
  Card,
  Heading,
  Notice,
  PaperThumbnail,
  Stamp,
  Text,
  cx,
} from '../components/ui';
import { useGame } from '../game';
import type { TaskOfKind } from './types';

/**
 * The incident report, laid out as the form it is: who, what, the concern, and the evidence
 * clipped to it.
 *
 * Whether the report can go in is the game's decision (SUBMIT_REPORT → `handleReportSubmission`),
 * and it is always asked. The button only shows what the answer will be: while any evidence is
 * missing it is marked `aria-disabled`, and pressing it earns a shake and the reason instead
 * of a submission. In ordinary play this screen is locked until both pieces are attached, so
 * that state is for a save that got here some other way.
 */
export function ReportTask({ task }: { task: TaskOfKind<'report'> }) {
  const game = useGame();
  const solved = game.getTaskStatus(task.id) === 'completed';
  const attempts = game.getAttempts(task.id);
  // Refused attempts made before this screen opened are old news: no shake for those.
  const [attemptsOnOpen] = useState(attempts);
  const [solvedOnOpen] = useState(solved);

  const missingIds = task.requiredEvidenceIds.filter(
    (evidenceId) => !game.attachedEvidenceIds.includes(evidenceId),
  );
  const blocked = !solved && missingIds.length > 0;
  const justRefused = blocked && attempts > attemptsOnOpen;
  // Where the missing evidence gets attached — the way out of a blocked report.
  const evidenceTask = game.tasks.find(
    (other) => other.kind === 'scanAll' && missingIds.some((id) => other.acceptedIds.includes(id)),
  );

  const facts = [
    [copy.report.customer, incidentReport.customer],
    [copy.report.transaction, formatRupees(getReportedTransactionAmount())],
    [copy.report.concern, incidentReport.concern],
  ] as const;

  return (
    <div className="flex flex-col gap-4">
      <Card
        as="section"
        tone="sunken"
        aria-label={copy.report.form}
        data-testid="incident-report"
        className="relative flex flex-col gap-5 border-2"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-ink-muted pb-3">
          <Text className="font-display font-bold tracking-widest">{copy.report.form}</Text>
          {solved && (
            <Stamp tone="clue" size="lg" animate={!solvedOnOpen}>
              {copy.report.submittedStamp}
            </Stamp>
          )}
        </div>

        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
          {facts.map(([term, value]) => (
            <div key={term} className="contents">
              <dt className="font-semibold">{term}:</dt>
              <dd className="font-display">{value}</dd>
            </div>
          ))}
        </dl>

        <div className="flex flex-col gap-3">
          <Heading level={2} size="section">
            {copy.report.evidence}
          </Heading>
          <ul className="flex flex-col gap-5">
            {task.requiredEvidenceIds.map((evidenceId) => {
              const attached = game.attachedEvidenceIds.includes(evidenceId);
              return (
                <li
                  key={evidenceId}
                  data-evidence={evidenceId}
                  data-state={attached ? 'attached' : 'missing'}
                  className="flex items-center gap-4"
                >
                  <PaperThumbnail
                    title={incidentReport.evidenceTitles[evidenceId] ?? evidenceId}
                    ghost={!attached}
                    className={attached ? '-rotate-2' : undefined}
                  />
                  <div className="flex flex-col items-start gap-1.5">
                    <span>
                      {incidentReport.evidenceDescriptions[evidenceId] ??
                        getArtefact(evidenceId)?.label ??
                        evidenceId}
                    </span>
                    <Badge tone={attached ? 'success' : 'clue'}>
                      {attached ? copy.report.attached : copy.report.missing}
                    </Badge>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {solved && (
          <Text size="sm" className="font-display font-bold tracking-widest text-clue">
            {copy.report.submittedNote}
          </Text>
        )}
      </Card>

      {/* Keyed by attempt, so that each refusal replays the wobble. */}
      {blocked && (
        <Notice
          key={attempts}
          tone="retry"
          data-testid="report-blocked"
          className={justRefused ? 'animate-wobble' : undefined}
        >
          {task.missingEvidenceText}
        </Notice>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          disabled={solved}
          aria-disabled={blocked || undefined}
          onClick={game.submitReport}
          className={cx(
            'motion-reduce:animate-none',
            blocked && 'cursor-not-allowed opacity-60',
            // Two names for one shake, so that every refusal replays it (see index.css).
            justRefused && (attempts % 2 === 1 ? 'animate-shake' : 'animate-shake-again'),
          )}
        >
          {copy.report.submit}
        </Button>
        {blocked && evidenceTask && (
          <Button variant="secondary" onClick={() => game.gotoTask(evidenceTask.id)}>
            {copy.report.goTo(evidenceTask.prompt)}
          </Button>
        )}
      </div>
    </div>
  );
}
