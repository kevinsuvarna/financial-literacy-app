import { useEffect } from 'react';
import { copy } from '@app/content';
import { loopSound, playSound, unlockAudio } from '../audio/sounds';
import { SceneFrame } from '../components/SceneFrame';
import { Heading, PhoneIcon, SwipeToAnswer, Text } from '../components/ui';

interface IncomingCallPanelProps {
  onAnswer: () => void;
  /** The caller's name is the page heading on the intro, but a sub-heading inside a task. */
  headingLevel?: 1 | 2;
}

/** The phone rings (and buzzes) until the player swipes to answer. */
export function IncomingCallPanel({ onAnswer, headingLevel = 1 }: IncomingCallPanelProps) {
  useEffect(() => loopSound('ring'), []);

  function answer() {
    // Answering is a gesture, so it can load every sound now. A call that leads somewhere
    // quiet — the simulated phishing page — then has nothing left to fetch once it is open.
    unlockAudio();
    playSound('answer');
    onAnswer();
  }

  return (
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
        <Heading level={headingLevel} size="display">
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
  );
}

/** The ringing phone as a scene of its own — the game's opening call. */
export function IncomingCall({ onAnswer }: { onAnswer: () => void }) {
  return (
    <SceneFrame scene="call">
      <IncomingCallPanel onAnswer={onAnswer} />
    </SceneFrame>
  );
}
