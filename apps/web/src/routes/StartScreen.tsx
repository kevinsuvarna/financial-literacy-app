import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { copy } from '@app/content';
import { playSound, unlockAudio } from '../audio/sounds';
import { Button, ButtonLink, FadeIn, Heading, Text } from '../components/ui';
import { useGame } from '../game';
import { CallDialogue } from '../intro/CallDialogue';
import { CaseAssigned } from '../intro/CaseAssigned';
import { IncomingCall } from '../intro/IncomingCall';

type IntroStep = 'title' | 'ringing' | 'call' | 'assigned';

/**
 * Title → incoming call → Ananya's call → case assigned. The intro is presentation only: the
 * game itself starts (START) when the player opens the case file.
 */
export function StartScreen() {
  const game = useGame();
  const navigate = useNavigate();
  const [step, setStep] = useState<IntroStep>('title');

  function startTraining() {
    // This click is the player's first interaction, which is what lets the browser play audio.
    unlockAudio();
    playSound('click');
    setStep('ringing');
  }

  function openCaseFile() {
    playSound('click');
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
          <Button onClick={startTraining}>{copy.start.cta}</Button>
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

  if (step === 'ringing') {
    return (
      <FadeIn key="ringing">
        <IncomingCall onAnswer={() => setStep('call')} />
      </FadeIn>
    );
  }

  if (step === 'call') {
    return (
      <FadeIn key="call">
        <CallDialogue onContinue={() => setStep('assigned')} />
      </FadeIn>
    );
  }

  return (
    <FadeIn key="assigned">
      <CaseAssigned onOpen={openCaseFile} />
    </FadeIn>
  );
}
