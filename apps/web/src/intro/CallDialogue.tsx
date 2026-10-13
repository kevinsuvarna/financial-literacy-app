import { useEffect, useRef, useState } from 'react';
import { copy } from '@app/content';
import { playSound } from '../audio/sounds';
import { SceneFrame } from '../components/SceneFrame';
import { Badge, Button, Heading, Notice, Typewriter, cx } from '../components/ui';

/** `talking` → `breaking-up` (static and glitch) → `disconnected` (the player moves on). */
type Phase = 'talking' | 'breaking-up' | 'disconnected';

const PAUSE_BETWEEN_LINES_MS = 650;
/** Ananya is cut off mid-sentence, so the line dies almost as soon as she stops. */
const PAUSE_BEFORE_CUT_OFF_MS = 250;
const BREAK_UP_MS = 900;

const lines = copy.openingCall.lines;
const lastLine = lines.length - 1;

function typingTick(character: string, index: number) {
  if (character.trim() !== '' && index % 3 === 0) playSound('type');
}

/**
 * Ananya's call: her lines type out one after another, the line breaks up, and the call drops.
 * Nothing here advances the game — leaving this screen is always the player's choice, and SKIP
 * jumps straight to the disconnect for anyone who has seen it or doesn't want to wait.
 */
export function CallDialogue({ onContinue }: { onContinue: () => void }) {
  const [phase, setPhase] = useState<Phase>('talking');
  const [lineIndex, setLineIndex] = useState(0);
  const [finishedLine, setFinishedLine] = useState(-1);
  const [skipped, setSkipped] = useState(false);
  const continueRef = useRef<HTMLButtonElement>(null);

  // A finished line leads to the next one — or, after the last, to the call breaking up.
  useEffect(() => {
    if (phase !== 'talking' || finishedLine !== lineIndex) return;
    const isLast = lineIndex === lastLine;
    const timer = setTimeout(
      () => {
        if (isLast) {
          playSound('static');
          setPhase('breaking-up');
        } else {
          setLineIndex(lineIndex + 1);
        }
      },
      isLast ? PAUSE_BEFORE_CUT_OFF_MS : PAUSE_BETWEEN_LINES_MS,
    );
    return () => clearTimeout(timer);
  }, [phase, finishedLine, lineIndex]);

  useEffect(() => {
    if (phase !== 'breaking-up') return;
    const timer = setTimeout(() => setPhase('disconnected'), BREAK_UP_MS);
    return () => clearTimeout(timer);
  }, [phase]);

  // SKIP (which had focus) is gone once the call drops; hand focus to what replaces it.
  useEffect(() => {
    if (phase === 'disconnected') continueRef.current?.focus();
  }, [phase]);

  function skip() {
    setSkipped(true);
    setLineIndex(lastLine);
    playSound('static');
    setPhase('breaking-up');
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

        <div aria-live="polite" className="flex min-h-40 flex-col gap-3">
          {lines.slice(0, lineIndex + 1).map((line, index) => (
            <Typewriter
              key={line}
              text={`“${line}”`}
              instant={skipped || index < lineIndex}
              onCharacter={typingTick}
              onDone={() => setFinishedLine(index)}
              className="text-lg"
            />
          ))}
        </div>

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
