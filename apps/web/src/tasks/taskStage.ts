import { createContext, useContext } from 'react';

export interface TaskStage {
  /**
   * Keeps the task's feedback (and the way forward that comes with it) off screen while the
   * task is still showing the player something — e.g. the consequences of a choice. This is
   * presentation only: it cannot change what the game has recorded.
   */
  holdFeedback: (held: boolean) => void;
}

export const TaskStageContext = createContext<TaskStage>({ holdFeedback: () => {} });

export function useTaskStage(): TaskStage {
  return useContext(TaskStageContext);
}
