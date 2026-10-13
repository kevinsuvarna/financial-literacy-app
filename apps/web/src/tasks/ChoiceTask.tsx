import { Button } from '../components/ui';
import { useGame } from '../game';
import type { TaskOfKind } from './types';

export function ChoiceTask({ task }: { task: TaskOfKind<'choice'> }) {
  const game = useGame();
  const solved = game.getTaskStatus(task.id) === 'completed';

  return (
    <div className="flex flex-wrap gap-3">
      {task.optionIds.map((optionId) => (
        <Button
          key={optionId}
          variant="secondary"
          disabled={solved}
          onClick={() => game.choose(optionId)}
        >
          {task.optionLabels[optionId] ?? optionId}
        </Button>
      ))}
    </div>
  );
}
