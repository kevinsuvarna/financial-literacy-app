import { useEffect, useEffectEvent, useState } from 'react';
import { useReducedMotion } from 'motion/react';

interface TypewriterProps {
  text: string;
  /** Milliseconds per character. */
  charMs?: number;
  /** Show everything at once (the player skipped, or this line was already typed). */
  instant?: boolean;
  /** Called for each character as it appears — never when shown instantly. */
  onCharacter?: (character: string, index: number) => void;
  /** Called once, when the whole text is showing. */
  onDone?: () => void;
  /** `span` when the text sits inside something that can't hold a paragraph, like a button. */
  as?: 'p' | 'span';
  className?: string;
}

/**
 * Types text out one character at a time.
 *
 * The full text is always in the DOM: screen readers get it in one piece rather than a letter
 * at a time, and the untyped remainder is laid out invisibly so the box doesn't grow and
 * reflow as it fills. With reduced motion the text simply appears (CLAUDE.md rule 6).
 */
export function Typewriter({
  text,
  charMs = 28,
  instant = false,
  onCharacter,
  onDone,
  as: Tag = 'p',
  className,
}: TypewriterProps) {
  const reduceMotion = useReducedMotion();
  const immediate = instant || reduceMotion === true;
  const [typed, setTyped] = useState(0);

  const shown = immediate ? text.length : Math.min(typed, text.length);
  const finished = shown >= text.length;

  const notifyCharacter = useEffectEvent((index: number) => {
    onCharacter?.(text.charAt(index), index);
  });
  const notifyDone = useEffectEvent(() => onDone?.());

  useEffect(() => {
    if (finished) return;
    const timer = setTimeout(() => {
      notifyCharacter(typed);
      setTyped(typed + 1);
    }, charMs);
    return () => clearTimeout(timer);
  }, [finished, typed, charMs]);

  useEffect(() => {
    if (finished) notifyDone();
  }, [finished]);

  return (
    <Tag className={className}>
      <span aria-hidden="true">
        {text.slice(0, shown)}
        <span className="invisible">{text.slice(shown)}</span>
      </span>
      <span className="sr-only">{text}</span>
    </Tag>
  );
}
