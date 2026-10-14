import { useEffect, useEffectEvent, useState } from 'react';
import { playSound } from '../audio/sounds';
import { Typewriter, cx } from './ui';

interface TypedDialogueProps {
  lines: readonly string[];
  /** Show every line at once — the player skipped, or the conversation is already over. */
  instant?: boolean;
  /** Called once, a moment after the last line has finished typing. Not called when `instant`. */
  onFinished?: () => void;
  pauseBetweenLinesMs?: number;
  pauseAfterLastLineMs?: number;
  className?: string;
}

function typingTick(character: string, index: number) {
  if (character.trim() !== '' && index % 3 === 0) playSound('type');
}

/**
 * Someone speaking on a call: their lines type out one after another, each appearing once the
 * one before has finished. Screen readers are told each line as it arrives, in full.
 */
export function TypedDialogue({
  lines,
  instant = false,
  onFinished,
  pauseBetweenLinesMs = 650,
  pauseAfterLastLineMs = 250,
  className,
}: TypedDialogueProps) {
  const [lineIndex, setLineIndex] = useState(0);
  const [finishedLine, setFinishedLine] = useState(-1);
  const notifyFinished = useEffectEvent(() => onFinished?.());
  const lastLine = lines.length - 1;

  // A finished line leads to the next one — or, after the last, to `onFinished`.
  useEffect(() => {
    if (instant || finishedLine !== lineIndex) return;
    const isLast = lineIndex === lastLine;
    const timer = setTimeout(
      () => {
        if (isLast) notifyFinished();
        else setLineIndex(lineIndex + 1);
      },
      isLast ? pauseAfterLastLineMs : pauseBetweenLinesMs,
    );
    return () => clearTimeout(timer);
  }, [instant, finishedLine, lineIndex, lastLine, pauseAfterLastLineMs, pauseBetweenLinesMs]);

  const shownLines = instant ? lines : lines.slice(0, lineIndex + 1);

  return (
    <div aria-live="polite" className={cx('flex flex-col gap-3', className)}>
      {shownLines.map((line, index) => (
        <Typewriter
          key={line}
          text={`“${line}”`}
          instant={instant || index < lineIndex}
          onCharacter={typingTick}
          onDone={() => setFinishedLine(index)}
          className="text-lg"
        />
      ))}
    </div>
  );
}
