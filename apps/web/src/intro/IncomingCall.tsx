import { useEffect } from 'react';
import { copy } from '@app/content';
import { loopSound, playSound } from '../audio/sounds';
import { SceneFrame } from '../components/SceneFrame';
import { Heading, PhoneIcon, SwipeToAnswer, Text } from '../components/ui';

/** The phone rings (and buzzes) until the player swipes to answer. */
export function IncomingCall({ onAnswer }: { onAnswer: () => void }) {
  useEffect(() => loopSound('ring'), []);

  function answer() {
    playSound('answer');
    onAnswer();
  }

  return (
    <SceneFrame scene="call">
      <div className="flex flex-col items-center gap-6 py-6 text-center">
        <div
          aria-hidden="true"
          className="flex size-24 animate-buzz items-center justify-center rounded-control bg-accent text-4xl text-on-accent"
        >
          <PhoneIcon />
        </div>
        <div className="flex flex-col gap-1">
          <Text size="sm" tone="muted" className="tracking-widest uppercase">
            {copy.incomingCall.heading}
          </Text>
          <Heading level={1} size="display">
            {copy.incomingCall.caller}
          </Heading>
          <Text tone="muted">{copy.incomingCall.callerDetail}</Text>
        </div>
        <SwipeToAnswer
          hint={copy.incomingCall.swipe}
          actionLabel={copy.incomingCall.answer}
          onAnswer={answer}
        />
      </div>
    </SceneFrame>
  );
}
