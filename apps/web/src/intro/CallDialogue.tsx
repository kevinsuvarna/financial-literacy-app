import { useEffect, useRef, useState } from 'react';
import { copy } from '@app/content';
import { playSound } from '../audio/sounds';
import { SceneFrame } from '../components/SceneFrame';
import { TypedDialogue } from '../components/TypedDialogue';
import { Badge, Button, Heading, Notice, cx } from '../components/ui';

/** `talking` → `breaking-up` (static and glitch) → `disconnected` (the player moves on). */
type Phase = 'talking' | 'breaking-up' | 'disconnected';

const BREAK_UP_MS = 900;

/**
 * Ananya's first call: her lines type out, the line breaks up, and the call drops. She is cut
 * off mid-sentence, so the line dies almost as soon as she stops. Nothing here advances the
 * game — leaving this screen is always the player's choice, and SKIP jumps straight to the
 * disconnect for anyone who has seen it or doesn't want to wait.
 */
export function CallDialogue({ onContinue }: { onContinue: () => void }) {
  const [phase, setPhase] = useState<Phase>('talking');
  const [skipped, setSkipped] = useState(false);
  const continueRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (phase !== 'breaking-up') return;
    const timer = setTimeout(() => setPhase('disconnected'), BREAK_UP_MS);
    return () => clearTimeout(timer);
  }, [phase]);

  // SKIP (which had focus) is gone once the call drops; hand focus to what replaces it.
  useEffect(() => {
    if (phase === 'disconnected') continueRef.current?.focus();
  }, [phase]);

  function breakUp() {
    if (phase !== 'talking') return;
    playSound('static');
    setPhase('breaking-up');
  }

  function skip() {
    setSkipped(true);
    breakUp();
  }

  return (
    <SceneFrame
      scene="call"
      overlay={
        phase === 'breaking-up' ? (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 animate-static rounded-card bg-static"
          />
        ) : null
      }
    >
      <div className={cx('flex flex-col gap-5', phase === 'breaking-up' && 'animate-glitch')}>
        <div className="flex flex-wrap items-center gap-3">
          <Heading level={1}>{copy.openingCall.caller}</Heading>
          {phase === 'talking' && (
            <Badge tone="success" pulse>
              {copy.openingCall.connected}
            </Badge>
          )}
        </div>

        <TypedDialogue
          lines={copy.openingCall.lines}
          instant={skipped}
          onFinished={breakUp}
          className="min-h-40"
        />

        {phase === 'disconnected' ? (
          <>
            <Notice tone="retry">{copy.openingCall.disconnected}</Notice>
            <Button ref={continueRef} className="self-start" onClick={onContinue}>
              {copy.openingCall.cta}
            </Button>
          </>
        ) : (
          <Button variant="quiet" size="sm" className="self-start" onClick={skip}>
            {copy.openingCall.skip}
          </Button>
        )}
      </div>
    </SceneFrame>
  );
}
