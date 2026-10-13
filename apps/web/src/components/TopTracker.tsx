import { useNavigate } from 'react-router-dom';
import { copy } from '@app/content';
import { useGame } from '../game';
import { getTaskPosition } from '../game/selectors';
import { Badge, StepDot, cx, type StepDotState } from './ui';
import type { TaskStatus } from '../game';

const dotStates: Record<TaskStatus, StepDotState> = {
  locked: 'locked',
  available: 'open',
  inProgress: 'open',
  completed: 'completed',
};

/** The three levels with their status, plus one dot per task that doubles as navigation. */
export function TopTracker() {
  const game = useGame();
  const navigate = useNavigate();
  const viewedLevelId = getTaskPosition(game.viewedTaskId)?.level.id;

  function openTask(taskId: string) {
    game.gotoTask(taskId);
    navigate('/play');
  }

  return (
    <nav aria-label={copy.nav.tracker}>
      <ol className="grid gap-2 sm:grid-cols-3">
        {game.levels.map((level, levelIndex) => {
          const status = game.getLevelStatus(level.id);
          const current = level.id === viewedLevelId;

          return (
            <li
              key={level.id}
              aria-current={current ? 'step' : undefined}
              className={cx(
                'flex flex-col gap-1 rounded-card border px-3 py-2',
                current ? 'border-gold bg-canvas-raised' : 'border-on-canvas-muted/40',
                status === 'locked' && 'text-on-canvas-muted',
              )}
            >
              <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                <span aria-hidden="true">{status === 'completed' ? '✓' : levelIndex + 1}</span>
                <span>{level.label}</span>
                {status === 'locked' ? (
                  <Badge>{copy.status.locked}</Badge>
                ) : (
                  <span className="sr-only">{copy.status[status]}</span>
                )}
              </div>
              <ol className="flex flex-wrap gap-1">
                {level.taskIds.map((taskId, taskIndex) => {
                  const taskStatus = game.getTaskStatus(taskId);
                  return (
                    <li key={taskId} className="flex">
                      <StepDot
                        state={dotStates[taskStatus]}
                        current={taskId === game.viewedTaskId}
                        disabled={taskStatus === 'locked'}
                        aria-label={copy.tracker.task(
                          level.label,
                          taskIndex + 1,
                          level.taskIds.length,
                          copy.status[taskStatus],
                        )}
                        onClick={() => openTask(taskId)}
                      />
                    </li>
                  );
                })}
              </ol>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
