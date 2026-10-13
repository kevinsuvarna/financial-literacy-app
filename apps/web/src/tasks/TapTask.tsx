import { ChequeView } from '../components/documents/ChequeView';
import { useGame } from '../game';
import type { TaskOfKind } from './types';

export function TapTask({ task }: { task: TaskOfKind<'tap'> }) {
  const game = useGame();
  const solved = game.getTaskStatus(task.id) === 'completed';

  return (
    <ChequeView
      onTapZone={game.tapZone}
      disabled={solved}
      highlightedZoneIds={solved ? task.acceptedIds : []}
    />
  );
}
