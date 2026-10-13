import { Navigate } from 'react-router-dom';
import { copy } from '@app/content';
import { Badge, Button, ButtonLink, Card, FadeIn, Heading, Text } from '../components/ui';
import { useGame } from '../game';

export function CertificateScreen() {
  const game = useGame();

  // Also covers "Replay mission": RESET returns the game to notStarted, which lands here.
  if (game.state === 'notStarted') return <Navigate to="/" replace />;
  if (game.state !== 'missionComplete') return <Navigate to="/board" replace />;

  return (
    <FadeIn>
      <Card tone="story" className="flex flex-col items-center gap-5 border-4 py-10 text-center">
        <Heading level={1} size="display">
          {copy.certificate.heading}
        </Heading>
        <Heading level={2}>{copy.certificate.subheading}</Heading>
        {copy.certificate.lines.map((line) => (
          <Text key={line} className="max-w-prose">
            {line}
          </Text>
        ))}
        <div className="flex flex-col items-center gap-2">
          <Text size="sm" tone="muted">
            {copy.certificate.awardedTo}
          </Text>
          <Badge tone="gold" className="px-5 py-2 font-display text-base">
            {copy.certificate.badge}
          </Badge>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <ButtonLink to="/board">{copy.certificate.backToBoard}</ButtonLink>
          <Button variant="secondary" onClick={game.reset}>
            {copy.certificate.replay}
          </Button>
        </div>
      </Card>
    </FadeIn>
  );
}
