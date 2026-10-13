import { copy } from '@app/content';
import { StatementView } from '../components/documents/StatementView';
import { Button } from '../components/ui';
import { useGame } from '../game';
import type { TaskOfKind } from './types';

/**
 * Stub for the drag-a-highlighter interaction: one button per row. The buttons stay as the
 * keyboard alternative once dragging is built (CLAUDE.md rule 6).
 */
export function HighlightTask({ task }: { task: TaskOfKind<'highlight'> }) {
  const game = useGame();
  const solved = game.getTaskStatus(task.id) === 'completed';

  return (
    <StatementView
      highlightedIds={solved ? task.acceptedIds : []}
      actionHeading={copy.statement.highlighter}
      renderRowAction={(transaction) =>
        task.optionIds.includes(transaction.id) && (
          <Button
            size="sm"
            variant="secondary"
            disabled={solved}
            aria-label={copy.statement.highlight(transaction.desc)}
            onClick={() => game.highlightRow(transaction.id)}
          >
            {copy.statement.highlightShort}
          </Button>
        )
      }
    />
  );
}
