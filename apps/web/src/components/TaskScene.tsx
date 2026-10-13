import type { ReactNode } from 'react';
import type { Task } from '@app/content';
import { useGame } from '../game';
import { getScanOptionIds } from '../scanner/scanTask';
import { ScanFlash } from '../scanner/ui/ScanFlash';
import { ScanStation } from '../scanner/ui/ScanStation';
import { SceneFrame } from './SceneFrame';

interface TaskSceneProps {
  task: Task;
  children: ReactNode;
  /** Rendered after the scan station, e.g. feedback for the scan just made. */
  footer?: ReactNode;
}

/**
 * Wraps a task in the scene named by `task.scene`. The scan station appears only for an
 * unsolved scan task in a `table` scene — the same rule that decides whether the scanner runs.
 */
export function TaskScene({ task, children, footer }: TaskSceneProps) {
  const game = useGame();
  const scanOptionIds = getScanOptionIds(task, game.getTaskStatus(task.id) === 'completed');

  return (
    <SceneFrame scene={task.scene} overlay={task.scene === 'table' ? <ScanFlash /> : null}>
      {children}
      {scanOptionIds && <ScanStation artefactIds={scanOptionIds} />}
      {footer}
    </SceneFrame>
  );
}
