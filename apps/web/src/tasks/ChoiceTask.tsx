import { useEffect, useRef, useState } from 'react';
import { copy } from '@app/content';
import { playSound } from '../audio/sounds';
import { TypedDialogue } from '../components/TypedDialogue';
import { PhishingMessageView } from '../components/documents/PhishingMessageView';
import { Badge, Button, FadeIn, Heading, Text } from '../components/ui';
import { useGame } from '../game';
import { IncomingCallPanel } from '../intro/IncomingCall';
import { CorkboardTask } from './corkboard/CorkboardTask';
import { FakeBankPage } from './phish/FakeBankPage';
import { useTaskStage } from './taskStage';
import type { TaskOfKind } from './types';

/** `ringing` → `talking` (Ananya's lines type out) → `deciding` (the message, then the choice). */
type Phase = 'ringing' | 'talking' | 'deciding';

/** The message landing on Ananya's phone: it pings, and takes focus so it is read out. */
function ArrivingNotification({ announce }: { announce: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!announce) return;
    playSound('ping');
    ref.current?.focus();
  }, [announce]);

  return (
    <FadeIn>
      <div ref={ref} tabIndex={-1}>
        <PhishingMessageView />
      </div>
    </FadeIn>
  );
}

/**
 * A choice offered as buttons — optionally at the end of a phone call, and optionally followed
 * by a simulation of where the choice leads.
 *
 * The call and the simulation are presentation: the only thing that changes the game is the
 * CHOOSE sent when a button is pressed. A simulation therefore plays *after* the choice is
 * recorded, with the task's feedback held back until it has finished.
 */
function ButtonChoiceTask({ task }: { task: TaskOfKind<'choice'> }) {
  const game = useGame();
  const stage = useTaskStage();
  const solved = game.getTaskStatus(task.id) === 'completed';
  // Solved before this screen opened: show how it ended, without the call or the simulation.
  const [openedSolved] = useState(solved);
  const [phase, setPhase] = useState<Phase>(
    solved || task.dialogue.length === 0 ? 'deciding' : 'ringing',
  );
  const [simulating, setSimulating] = useState(false);
  const chosenId = game.getScannedIds(task.id)[0];

  function choose(optionId: string) {
    if (solved) return;
    if (task.simulations[optionId]) {
      stage.holdFeedback(true);
      setSimulating(true);
    }
    game.choose(optionId);
  }

  if (phase === 'ringing') {
    return <IncomingCallPanel headingLevel={2} onAnswer={() => setPhase('talking')} />;
  }

  return (
    <div className="flex flex-col gap-5">
      {task.dialogue.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <Heading level={2} size="section">
              {copy.incomingCall.caller}
            </Heading>
            {!solved && (
              <Badge tone="success" pulse>
                {copy.openingCall.connected}
              </Badge>
            )}
          </div>
          <TypedDialogue
            lines={task.dialogue}
            instant={phase === 'deciding'}
            onFinished={() => setPhase('deciding')}
          />
          {phase === 'talking' && (
            <Button
              variant="quiet"
              size="sm"
              className="self-start"
              onClick={() => setPhase('deciding')}
            >
              {copy.openingCall.skip}
            </Button>
          )}
        </div>
      )}

      {phase === 'deciding' && (
        <>
          {task.notification === 'phishing-message' && (
            <ArrivingNotification announce={!openedSolved} />
          )}

          <div role="group" aria-label={task.prompt} className="flex flex-wrap gap-3">
            {task.optionIds.map((optionId) => (
              <Button
                key={optionId}
                variant={optionId === chosenId ? 'primary' : 'secondary'}
                disabled={solved}
                onClick={() => choose(optionId)}
              >
                {task.optionLabels[optionId] ?? optionId}
              </Button>
            ))}
          </div>
          {chosenId && (
            <Text size="sm" tone="muted">
              {copy.phishing.youChose}: {task.optionLabels[chosenId] ?? chosenId}
            </Text>
          )}

          {simulating && <FakeBankPage onFinished={() => stage.holdFeedback(false)} />}
        </>
      )}
    </div>
  );
}

export function ChoiceTask({ task }: { task: TaskOfKind<'choice'> }) {
  return task.presentation === 'corkboard' ? (
    <CorkboardTask task={task} />
  ) : (
    <ButtonChoiceTask task={task} />
  );
}
