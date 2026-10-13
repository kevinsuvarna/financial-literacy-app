import type { ReactNode } from 'react';
import type { Task } from '@app/content';
import { useGame } from '../game';
import { ScanStation } from '../scan/ScanStation';
import { SceneFrame } from './SceneFrame';

interface TaskSceneProps {
  task: Task;
  children: ReactNode;
  /** Rendered after the scan station, e.g. feedback for the scan just made. */
  footer?: ReactNode;
}

/**
 * Wraps a task in the scene named by `task.scene`. Scanning is offered only here, and only for
 * an unsolved scan task in a `table` scene — the single place rule 4 is enforced in the UI.
 */
export function TaskScene({ task, children, footer }: TaskSceneProps) {
  const game = useGame();
  const solved = game.getTaskStatus(task.id) === 'completed';
  const scanOptionIds =
    task.scene === 'table' && (task.kind === 'scanOne' || task.kind === 'scanAll') && !solved
      ? task.optionIds
      : null;

  return (
    <SceneFrame scene={task.scene}>
      {children}
      {scanOptionIds && <ScanStation artefactIds={scanOptionIds} />}
      {footer}
    </SceneFrame>
  );
}
