import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { Navigate } from 'react-router-dom';
import { copy, type Task } from '@app/content';
import { LevelComplete } from '../components/LevelComplete';
import { TaskScene } from '../components/TaskScene';
import { TaskReferences } from '../components/documents/TaskReferences';
import { FadeIn, Heading, Notice, Text } from '../components/ui';
import { useGame } from '../game';
import { getNextTaskId, getTaskPosition } from '../game/selectors';
import { TaskFeedback } from '../tasks/TaskFeedback';
import { TaskRenderer } from '../tasks/TaskRenderer';
import { TaskStageContext, type TaskStage } from '../tasks/taskStage';

interface TaskViewProps {
  task: Task;
  headingRef: RefObject<HTMLHeadingElement | null>;
}

/** Remounted per task (keyed by id), so per-task UI state never leaks into the next task. */
function TaskView({ task, headingRef }: TaskViewProps) {
  const game = useGame();
  // "Reviewing" means the task was already solved when it was opened — not that it was just
  // solved on this screen. Narrative beats have nothing to solve, so they never show the banner.
  const [openedSolved] = useState(() => game.getTaskStatus(task.id) === 'completed');
  const [showLevelComplete, setShowLevelComplete] = useState(false);
  // A task can hold its feedback back while it is still showing the player something.
  const [feedbackHeld, setFeedbackHeld] = useState(false);
  const stage = useMemo<TaskStage>(() => ({ holdFeedback: setFeedbackHeld }), []);
  const solved = game.getTaskStatus(task.id) === 'completed';
  const position = getTaskPosition(task.id);
  const nextTaskId = getNextTaskId(task.id);

  if (showLevelComplete && position && nextTaskId) {
    return (
      <LevelComplete
        level={position.level}
        levelNumber={position.levelNumber}
        nextTaskId={nextTaskId}
      />
    );
  }

  return (
    <FadeIn className="flex flex-col gap-4">
      {position && (
        <Text size="sm" tone="muted">
          {copy.play.position(position.level.label, position.taskNumber, position.taskCount)}
        </Text>
      )}
      {openedSolved && task.kind !== 'narrative' && (
        <Notice tone="info">{copy.play.reviewBanner}</Notice>
      )}
      <TaskScene
        task={task}
        footer={
          feedbackHeld ? null : (
            <TaskFeedback
              task={task}
              reviewing={openedSolved}
              onFinishLevel={() => setShowLevelComplete(true)}
            />
          )
        }
      >
        <div className="flex flex-col gap-2">
          <Heading level={1} ref={headingRef} tabIndex={-1}>
            {task.prompt}
          </Heading>
          {task.detail && <Text>{task.detail}</Text>}
          {task.steps.length > 0 && (
            <ol className="list-decimal pl-6">
              {task.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          )}
        </div>
        <TaskReferences references={task.references} />
        <TaskStageContext value={stage}>
          <TaskRenderer task={task} />
        </TaskStageContext>
        {solved && <TaskReferences references={task.solvedReferences} />}
      </TaskScene>
    </FadeIn>
  );
}

export function PlayScreen() {
  const game = useGame();
  const task = game.viewedTask;
  const taskId = task?.id;
  const headingRef = useRef<HTMLHeadingElement>(null);
  const isFirstTask = useRef(true);

  // Moving to another task replaces the control that had focus; send focus to the new prompt
  // so keyboard and screen-reader users aren't dropped at the top of the page.
  useEffect(() => {
    if (isFirstTask.current) {
      isFirstTask.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [taskId]);

  if (game.state === 'notStarted') return <Navigate to="/" replace />;
  if (!task) return <Navigate to="/board" replace />;

  return <TaskView key={task.id} task={task} headingRef={headingRef} />;
}
