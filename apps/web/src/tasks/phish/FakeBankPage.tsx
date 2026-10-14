import { useEffect, useEffectEvent, useId, useState } from 'react';
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react';
import { copy, fakeBankPage, formatRupees, getClosingBalance } from '@app/content';
import { playSound } from '../../audio/sounds';
import { holdSync } from '../../sync/runtime';
import { Badge, Button, Heading, Text, Typewriter } from '../../components/ui';

/** `form` (tap the fields, then submit) → `draining` (the balance runs down) → `done`. */
type Phase = 'form' | 'draining' | 'done';

const DRAIN_SECONDS = 1.7;

function typingTick(character: string, index: number) {
  if (character !== '-' && index % 2 === 0) playSound('type');
}

/**
 * The page behind the phishing link, for a player who chose to click it. It shows what such a
 * page asks for and what happens when someone answers — without ever taking a keystroke.
 *
 * CLAUDE.md rule 5 ("no input may accept real credentials") is met structurally rather than by
 * validation: there is no <input>, <textarea> or <form> here at all. Each "field" is a button
 * that, when tapped, has the game type a made-up value from packages/content (which only
 * allows X, 0 and dashes). Nothing is submitted and nothing leaves the page; the "loss" is an
 * animation of a number, shown only after the player presses the pretend submit button. Even
 * the game's own background sync is held off for as long as this is on screen.
 */
export function FakeBankPage({ onFinished }: { onFinished: () => void }) {
  const reduceMotion = useReducedMotion();
  const helpId = useId();
  const [phase, setPhase] = useState<Phase>('form');
  /** Fields the player has tapped (the game is typing, or has typed, their made-up value). */
  const [tapped, setTapped] = useState<string[]>([]);
  const [filled, setFilled] = useState<string[]>([]);

  const savings = getClosingBalance();
  const balance = useMotionValue(savings);
  const balanceText = useTransform(balance, (value) => formatRupees(Math.round(value)));
  const allFilled = fakeBankPage.fields.every((field) => filled.includes(field.id));
  const notifyFinished = useEffectEvent(onFinished);

  // "Nothing here is sent anywhere" has to be true of the whole app while this page is open,
  // so background sync of the game's own progress waits until it has closed.
  useEffect(() => holdSync(), []);

  useEffect(() => {
    if (phase !== 'draining') return;
    playSound('drain');
    const controls = animate(balance, 0, {
      duration: reduceMotion ? 0 : DRAIN_SECONDS,
      ease: 'easeIn',
      onComplete: () => {
        setPhase('done');
        notifyFinished();
      },
    });
    return () => controls.stop();
  }, [phase, reduceMotion, balance]);

  function tap(fieldId: string) {
    setTapped((ids) => (ids.includes(fieldId) ? ids : [...ids, fieldId]));
  }

  return (
    <section
      aria-label={fakeBankPage.heading}
      data-testid="fake-bank-page"
      className="overflow-hidden rounded-card border-2 border-clue bg-surface text-ink shadow-xl"
    >
      <p className="bg-clue px-4 py-1.5 text-center text-xs font-bold tracking-wide text-surface">
        {fakeBankPage.simulationBanner}
      </p>

      {/* A drawing of a browser's address bar — not a real one, and not a link. */}
      <div className="flex items-center gap-2 border-b border-line bg-surface-sunken px-4 py-2 text-sm">
        <Badge tone="clue">{fakeBankPage.notSecure}</Badge>
        <span className="truncate font-display">{fakeBankPage.address}</span>
      </div>

      <div className="flex flex-col gap-4 p-5">
        <Heading level={2} size="section" className="text-clue">
          {fakeBankPage.heading}
        </Heading>
        <Text size="sm">{fakeBankPage.intro}</Text>
        <Text id={helpId} size="sm" tone="muted">
          {fakeBankPage.fieldHelp}
        </Text>

        <ul className="flex max-w-sm flex-col gap-3">
          {fakeBankPage.fields.map((field) => {
            const isFilled = filled.includes(field.id);
            return (
              <li key={field.id} className="flex flex-col gap-1">
                <span aria-hidden="true" className="text-sm font-semibold">
                  {field.label}
                </span>
                <button
                  type="button"
                  data-field={field.id}
                  aria-label={copy.phishing.fieldName(
                    field.label,
                    isFilled ? field.fakeValue : fakeBankPage.emptyField,
                  )}
                  aria-describedby={helpId}
                  disabled={phase !== 'form'}
                  onClick={() => tap(field.id)}
                  className="flex min-h-11 items-center rounded-card border border-line bg-surface px-3 text-left font-display tracking-widest enabled:cursor-pointer enabled:hover:bg-notice-soft"
                >
                  {tapped.includes(field.id) ? (
                    <Typewriter
                      as="span"
                      text={field.fakeValue}
                      charMs={55}
                      onCharacter={typingTick}
                      onDone={() =>
                        setFilled((ids) => (ids.includes(field.id) ? ids : [...ids, field.id]))
                      }
                    />
                  ) : (
                    <span className="font-body text-sm tracking-normal text-ink-muted">
                      {fakeBankPage.emptyField}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        <Button
          className="self-start"
          disabled={!allFilled || phase !== 'form'}
          onClick={() => setPhase('draining')}
        >
          {fakeBankPage.submit}
        </Button>
      </div>

      {phase !== 'form' && (
        <div className="flex flex-col gap-2 border-t-2 border-clue bg-clue-soft p-5">
          <Text size="sm" className="font-semibold">
            {fakeBankPage.lossHeading}
          </Text>
          {/* The running number is for the eye; screen readers get one sentence at the end. */}
          <div aria-hidden="true" className="flex flex-wrap items-baseline gap-4">
            <motion.span
              data-testid="simulated-balance"
              className="font-display text-3xl font-bold"
            >
              {balanceText}
            </motion.span>
            {phase === 'done' && (
              <span
                data-testid="simulated-loss"
                className="animate-stamp font-display text-xl font-bold text-clue"
              >
                {copy.phishing.lossTaken(formatRupees(savings))}
              </span>
            )}
          </div>
          <Text size="sm">{fakeBankPage.lossCaption}</Text>
          {phase === 'done' && (
            <span role="status" className="sr-only">
              {copy.phishing.lossAnnouncement(formatRupees(savings))}
            </span>
          )}
        </div>
      )}
    </section>
  );
}
