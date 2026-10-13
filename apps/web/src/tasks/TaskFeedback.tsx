import { copy, type Task } from '@app/content';
import { Button, ButtonLink, Card, Notice, Stamp } from '../components/ui';
import { useGame } from '../game';
import { getNextTaskId, getTaskPosition } from '../game/selectors';

interface TaskFeedbackProps {
  task: Task;
  /** The task was already solved when it was opened, so nothing here is news. */
  reviewing: boolean;
  /** Called instead of going straight to the next task when this solve finished a level. */
  onFinishLevel: () => void;
}

/**
 * What the last interaction earned: a wobbling explanation of a wrong answer (the player just
 * tries again), an escalating hint, or — once solved — a stamped explanation card with the way
 * forward. The way forward never appears before the required interaction is done (CLAUDE.md
 * rule 3).
 */
export function TaskFeedback({ task, reviewing, onFinishLevel }: TaskFeedbackProps) {
  const game = useGame();
  const solved = game.getTaskStatus(task.id) === 'completed';
  const feedback = game.getLastFeedback(task.id);
  const attempts = game.getAttempts(task.id);
  const hint = solved ? null : game.getCurrentHint(task.id);
  // The highlighter and cheque tasks stick their wrong-answer feedback onto the thing that was
  // marked or tapped, so repeating it down here would say everything twice.
  const showsRetryFeedback = task.kind !== 'highlight' && task.kind !== 'tap';
  // Hints escalate with each wrong answer; say how far along the player is.
  const hintLabel =
    task.hints.length > 1
      ? copy.play.hintCount(Math.min(attempts, task.hints.length), task.hints.length)
      : copy.play.hint;

  const nextTaskId = getNextTaskId(task.id);
  const goOnTo = solved && nextTaskId && game.isTaskReachable(nextTaskId) ? nextTaskId : null;
  const position = getTaskPosition(task.id);
  // Solving a level's last task for the first time earns the level-complete beat; reviewing it
  // later just moves on.
  const finishesLevel =
    position !== undefined && position.taskNumber === position.taskCount && !reviewing;

  return (
    <div className="flex flex-col gap-3">
      {solved && feedback && (
        <Card tone="success" className="flex flex-wrap items-center gap-x-5 gap-y-3 border-2">
          {task.kind !== 'narrative' && (
            <Stamp tone="success" animate={!reviewing}>
              {copy.play.stamp}
            </Stamp>
          )}
          <p role="status" className="min-w-48 flex-1">
            {feedback}
          </p>
        </Card>
      )}

      {/* Keyed by attempt count so each new wrong answer replays the wobble. */}
      {!solved && feedback && showsRetryFeedback && (
        <Notice
          key={attempts}
          tone={attempts > 0 ? 'retry' : 'info'}
          className={attempts > 0 ? 'animate-wobble' : undefined}
        >
          {feedback}
        </Notice>
      )}

      {hint && hint !== feedback && (
        <Notice tone="info">
          <strong>{hintLabel}:</strong> {hint}
        </Notice>
      )}

      {goOnTo && finishesLevel && (
        <Button className="self-start" onClick={onFinishLevel}>
          {copy.play.finishLevel}
        </Button>
      )}
      {goOnTo && !finishesLevel && (
        <Button className="self-start" onClick={() => game.gotoTask(goOnTo)}>
          {copy.play.nextTask}
        </Button>
      )}
      {solved && !nextTaskId && game.state === 'missionComplete' && (
        <ButtonLink className="self-start" to="/certificate">
          {copy.play.viewCertificate}
        </ButtonLink>
      )}
    </div>
  );
}
