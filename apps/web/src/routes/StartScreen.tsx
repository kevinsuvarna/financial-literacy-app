import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { copy } from '@app/content';
import { SceneFrame } from '../components/SceneFrame';
import { Button, ButtonLink, FadeIn, Heading, Notice, Text } from '../components/ui';
import { useGame } from '../game';

type IntroStep = 'title' | 'call' | 'assigned';

/**
 * Title → opening call → case assigned. The intro steps are presentation only; the game itself
 * starts (START) when the player opens the case file.
 */
export function StartScreen() {
  const game = useGame();
  const navigate = useNavigate();
  const [step, setStep] = useState<IntroStep>('title');

  function openCaseFile() {
    game.start();
    navigate('/play');
  }

  if (game.state !== 'notStarted' || step === 'title') {
    return (
      <FadeIn className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
        <Heading level={1} size="display">
          {copy.start.title}
        </Heading>
        <Text className="max-w-prose">{copy.start.intro}</Text>
        {game.state === 'notStarted' ? (
          <Button onClick={() => setStep('call')}>{copy.start.cta}</Button>
        ) : (
          <div className="flex flex-wrap justify-center gap-3">
            <ButtonLink to="/play">{copy.start.resume}</ButtonLink>
            {game.state === 'missionComplete' && (
              <ButtonLink to="/certificate" variant="secondary">
                {copy.caseBoard.viewCertificate}
              </ButtonLink>
            )}
          </div>
        )}
      </FadeIn>
    );
  }

  if (step === 'call') {
    return (
      <FadeIn key="call">
        <SceneFrame scene="call">
          <Heading level={1}>{copy.openingCall.caller}</Heading>
          {copy.openingCall.lines.map((line) => (
            <Text key={line}>“{line}”</Text>
          ))}
          <Notice tone="info">{copy.openingCall.disconnected}</Notice>
          <Button className="self-start" onClick={() => setStep('assigned')}>
            {copy.openingCall.cta}
          </Button>
        </SceneFrame>
      </FadeIn>
    );
  }

  return (
    <FadeIn key="assigned">
      <SceneFrame scene="screen">
        <Heading level={1}>{copy.caseAssigned.heading}</Heading>
        <Text>{copy.caseAssigned.body}</Text>
        <Button className="self-start" onClick={openCaseFile}>
          {copy.caseAssigned.cta}
        </Button>
      </SceneFrame>
    </FadeIn>
  );
}
