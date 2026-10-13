import { copy, type Task } from '@app/content';
import { Button, ButtonLink, Notice } from '../components/ui';
import { useGame } from '../game';
import { getNextTaskId } from '../game/selectors';

/**
 * Feedback for the last interaction, any escalating hint, and — only once the task is solved —
 * the way forward. The "next" control never appears before the required interaction is done
 * (CLAUDE.md rule 3).
 */
export function TaskFeedback({ task }: { task: Task }) {
  const game = useGame();
  const solved = game.getTaskStatus(task.id) === 'completed';
  const feedback = game.getLastFeedback(task.id);
  const hint = solved ? null : game.getCurrentHint(task.id);
  const nextTaskId = getNextTaskId(task.id);

  return (
    <div className="flex flex-col gap-3">
      {feedback && <Notice tone={solved ? 'success' : 'retry'}>{feedback}</Notice>}
      {hint && hint !== feedback && (
        <Notice tone="info">
          <strong>{copy.play.hint}:</strong> {hint}
        </Notice>
      )}
      {solved && nextTaskId && game.isTaskReachable(nextTaskId) && (
        <Button className="self-start" onClick={() => game.gotoTask(nextTaskId)}>
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
