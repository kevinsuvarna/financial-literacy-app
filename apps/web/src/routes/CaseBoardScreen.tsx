import { Navigate, useNavigate } from 'react-router-dom';
import { copy, type LevelId } from '@app/content';
import {
  Badge,
  Button,
  ButtonLink,
  Card,
  FadeIn,
  Heading,
  Text,
  type BadgeTone,
} from '../components/ui';
import { useGame, type TaskStatus } from '../game';

const statusTones: Record<TaskStatus, BadgeTone> = {
  locked: 'neutral',
  available: 'gold',
  inProgress: 'accent',
  completed: 'success',
};

export function CaseBoardScreen() {
  const game = useGame();
  const navigate = useNavigate();

  if (game.state === 'notStarted') return <Navigate to="/" replace />;

  function openLevel(levelId: LevelId) {
    const taskId = game.getLevelEntryTaskId(levelId);
    if (!taskId) return;
    game.gotoTask(taskId);
    navigate('/play');
  }

  return (
    <FadeIn className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Heading level={1} size="display">
          {copy.caseBoard.heading}
        </Heading>
        <Text tone="muted">{copy.caseBoard.intro}</Text>
      </div>
      <ul className="grid gap-4 md:grid-cols-3">
        {game.levels.map((level, index) => {
          const status = game.getLevelStatus(level.id);
          const solved = level.taskIds.filter(
            (taskId) => game.getTaskStatus(taskId) === 'completed',
          ).length;
          const action = copy.caseBoard.actions[status];

          return (
            <Card
              key={level.id}
              as="li"
              tone={status === 'locked' ? 'raised' : 'paper'}
              className="flex flex-col gap-3"
            >
              <Heading level={2} size="section">
                {copy.caseBoard.card(index + 1, level.label)}
              </Heading>
              <Badge tone={statusTones[status]} className="self-start">
                {copy.status[status]}
              </Badge>
              <Text size="sm" tone="muted">
                {copy.caseBoard.tasksSolved(solved, level.taskIds.length)}
              </Text>
              <Button
                className="mt-auto self-start"
                variant={status === 'completed' ? 'secondary' : 'primary'}
                disabled={status === 'locked'}
                aria-label={copy.caseBoard.actionLabel(action, level.label)}
                onClick={() => openLevel(level.id)}
              >
                {action}
              </Button>
            </Card>
          );
        })}
      </ul>
      {game.state === 'missionComplete' && (
        <ButtonLink to="/certificate" className="self-start">
          {copy.caseBoard.viewCertificate}
        </ButtonLink>
      )}
    </FadeIn>
  );
}
