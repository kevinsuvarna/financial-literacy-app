import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { artefacts } from '@app/content';
import { Button, Card, Heading, SelectField, Text } from '../components/ui';
import { jumpEvents, useGame } from '../game';
import { getCameraSupport, isCameraScanningActive } from '../scan/camera';
import { useScannerStats } from '../scan/useScannerStats';
import { dispatchDebugEvent } from './dispatch';

// Developer tooling, not game content — its labels are deliberately not in packages/content.

function Row({ term, children }: { term: string; children: ReactNode }) {
  return (
    <div className="contents">
      <dt className="font-semibold">{term}</dt>
      <dd className="break-all">{children}</dd>
    </div>
  );
}

export function DebugPanel() {
  const game = useGame();
  const stats = useScannerStats();
  const navigate = useNavigate();
  const [jumpTarget, setJumpTarget] = useState(game.viewedTaskId);
  const [scanId, setScanId] = useState(artefacts[0]?.id ?? '');

  const viewed = game.context.tasks[game.viewedTaskId];
  const sources = Object.entries(stats.bySource);

  function jump() {
    for (const event of jumpEvents(game.state, game.context, jumpTarget)) {
      dispatchDebugEvent(event);
    }
    navigate('/play');
  }

  return (
    <Card
      as="aside"
      tone="raised"
      aria-label="Debug panel"
      className="fixed right-3 bottom-3 z-50 max-h-[85vh] w-80 max-w-[calc(100vw-1.5rem)] overflow-y-auto text-sm"
    >
      <details open>
        <summary className="cursor-pointer font-display font-bold">Debug</summary>
        <div className="mt-3 flex flex-col gap-4">
          <section className="flex flex-col gap-1">
            <Heading level={2} size="section">
              Machine
            </Heading>
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5" data-testid="debug-machine">
              <Row term="State">{game.state}</Row>
              <Row term="Task">{game.viewedTaskId}</Row>
              <Row term="Kind">
                {game.viewedTask ? `${game.viewedTask.kind} · ${game.viewedTask.scene}` : '—'}
              </Row>
              <Row term="Status">{viewed?.status ?? '—'}</Row>
              <Row term="Attempts">{viewed?.attempts ?? 0}</Row>
              <Row term="Scanned">{viewed?.scannedIds.join(', ') || '—'}</Row>
              <Row term="Report">
                {game.context.reportSubmitted ? 'submitted' : 'not submitted'}
              </Row>
            </dl>
          </section>

          <section className="flex flex-col gap-2">
            <SelectField
              label="Jump to task"
              value={jumpTarget}
              onChange={(event) => setJumpTarget(event.target.value)}
            >
              {game.tasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.id} ({game.getTaskStatus(task.id)})
                </option>
              ))}
            </SelectField>
            <Text size="sm" tone="muted">
              Solves every unsolved task before it by replaying real events.
            </Text>
            <Button size="sm" className="self-start" onClick={jump}>
              Jump
            </Button>
          </section>

          <section className="flex flex-col gap-2">
            <SelectField
              label="Inject artefact scan"
              value={scanId}
              onChange={(event) => setScanId(event.target.value)}
            >
              {artefacts.map((artefact) => (
                <option key={artefact.id} value={artefact.id}>
                  {artefact.label} ({artefact.id})
                </option>
              ))}
            </SelectField>
            <Button
              size="sm"
              className="self-start"
              onClick={() => dispatchDebugEvent({ type: 'ARTEFACT_SCANNED', id: scanId })}
            >
              Inject scan
            </Button>
          </section>

          <section className="flex flex-col gap-1">
            <Heading level={2} size="section">
              Scanner
            </Heading>
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5" data-testid="debug-scanner">
              <Row term="Scans">{stats.total}</Row>
              <Row term="By source">
                {sources.length > 0
                  ? sources.map(([name, count]) => `${name} ${count}`).join(', ')
                  : '—'}
              </Row>
              <Row term="Unknown ids">{stats.unknown}</Row>
              <Row term="Last">
                {stats.last ? `${stats.last.id} via ${stats.last.source}` : '—'}
              </Row>
              <Row term="Camera API">{getCameraSupport()}</Row>
              <Row term="Camera scan">{isCameraScanningActive() ? 'active' : 'not running'}</Row>
            </dl>
          </section>

          <Button
            size="sm"
            variant="secondary"
            className="self-start"
            onClick={() => dispatchDebugEvent({ type: 'RESET' })}
          >
            Reset game
          </Button>

          <details>
            <summary className="cursor-pointer">Raw context</summary>
            <pre className="mt-2 max-h-64 overflow-auto text-xs">
              {JSON.stringify(game.context, null, 2)}
            </pre>
          </details>
        </div>
      </details>
    </Card>
  );
}
