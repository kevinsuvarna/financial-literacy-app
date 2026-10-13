import {
  copy,
  formatRupees,
  getArtefact,
  getReportedTransactionAmount,
  incidentReport,
} from '@app/content';
import { Badge, Button, Card, Heading } from '../components/ui';
import { useGame } from '../game';
import type { TaskOfKind } from './types';

export function ReportTask({ task }: { task: TaskOfKind<'report'> }) {
  const game = useGame();
  const solved = game.getTaskStatus(task.id) === 'completed';

  const facts = [
    [copy.report.customer, incidentReport.customer],
    [copy.report.transaction, formatRupees(getReportedTransactionAmount())],
    [copy.report.concern, incidentReport.concern],
  ] as const;

  return (
    <div className="flex flex-col gap-4">
      <Card tone="sunken" className="flex flex-col gap-4">
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
          {facts.map(([term, value]) => (
            <div key={term} className="contents">
              <dt className="font-semibold">{term}:</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        <div className="flex flex-col gap-2">
          <Heading level={2} size="section">
            {copy.report.evidence}
          </Heading>
          <ul className="flex flex-col gap-2">
            {task.requiredEvidenceIds.map((evidenceId) => {
              const attached = game.attachedEvidenceIds.includes(evidenceId);
              return (
                <li key={evidenceId} className="flex flex-wrap items-center gap-2">
                  <Badge tone={attached ? 'success' : 'clue'}>
                    {attached ? copy.report.attached : copy.report.missing}
                  </Badge>
                  {incidentReport.evidenceDescriptions[evidenceId] ??
                    getArtefact(evidenceId)?.label ??
                    evidenceId}
                </li>
              );
            })}
          </ul>
        </div>
      </Card>
      <Button className="self-start" disabled={solved} onClick={game.submitReport}>
        {copy.report.submit}
      </Button>
    </div>
  );
}
