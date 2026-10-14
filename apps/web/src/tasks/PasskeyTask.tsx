import { useEffect, useEffectEvent, useId, useLayoutEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import {
  copy,
  getPasskeyHint,
  passkeyClues,
  passkeyHintStages,
  passkeyLength,
  type DigitGrade,
  type TaskReference,
} from '@app/content';
import { playSound } from '../audio/sounds';
import { ReferenceDocument } from '../components/documents/TaskReferences';
import {
  Button,
  Casing,
  CrtCursor,
  CrtScreen,
  DisplayCell,
  EvidenceFolder,
  Heading,
  KeyCap,
  PinTag,
  SignalLight,
  Stamp,
  Text,
  cx,
  type SignalLightState,
} from '../components/ui';
import { useGame } from '../game';
import { applyKey, keyFromKeyboard, keyName, type KeypadKey } from './passkey/keypad';
import { useTaskStage } from './taskStage';
import type { TaskOfKind } from './types';

/** The pause before the first line of the start-up log, and between its lines. */
const BOOT_WARMUP_MS = 650;
const BOOT_LINE_MS = 380;
/** How long the folder takes to unlock and open, before the explanation follows. */
const UNLOCK_MS = 1500;
const UNLOCK_SOUND_AFTER_MS = 450;

const digitKey = (digit: string): KeypadKey => ({ type: 'digit', digit });
/** The keypad, row by row, like a telephone's. */
const KEYPAD: KeypadKey[] = [
  ...['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(digitKey),
  { type: 'delete' },
  digitKey('0'),
  { type: 'enter' },
];

const GRADES: DigitGrade[] = ['match', 'misplaced', 'miss'];
const lightStates: Record<DigitGrade, SignalLightState> = {
  match: 'on',
  misplaced: 'half',
  miss: 'off',
};

/** Every document a clue is read from, once each, in the order the clues need them. */
const documents: TaskReference[] = [...new Set(passkeyClues.map((clue) => clue.reference))];

/**
 * Level 3 Task 3: an old computer guarding the evidence folder.
 *
 * There is no text field here. The display is filled by a keypad of ten digits — on screen, or
 * the same ten keys on a real keyboard — so there is nowhere to type a real PIN, password or
 * OTP (CLAUDE.md rule 5). A full display goes to the game as SUBMIT_PASSKEY; the game alone
 * decides whether it is right (against `derivePasskey()`), and what hint a wrong code earns.
 *
 * Everything else on the screen — the start-up log, ACCESS DENIED, the lights, the folder
 * swinging open — is presentation of what the game has recorded, so it survives a reload.
 */
export function PasskeyTask({ task }: { task: TaskOfKind<'passkey'> }) {
  const game = useGame();
  const stage = useTaskStage();
  const helpId = useId();
  const reduceMotion = useReducedMotion() === true;

  const solved = game.getTaskStatus(task.id) === 'completed';
  const attempts = game.getAttempts(task.id);
  const lastCode = game.getLastSubmission(task.id);
  // As this screen opened: an old result is shown as it stands, without its shake or fanfare.
  const [openedSolved] = useState(solved);
  const [openedAttempts] = useState(attempts);
  const justSolved = solved && !openedSolved;
  const hint = !solved && lastCode ? getPasskeyHint(attempts, lastCode) : null;

  /** The digits on the display, and the last code sent off from it. */
  const [entry, setEntry] = useState('');
  const [submitted, setSubmitted] = useState<string | null>(null);
  /** Which on-screen key a held keyboard key belongs to, so that it can be shown pressed. */
  const [heldKey, setHeldKey] = useState<string | null>(null);

  const bootLog = [
    ...copy.passkey.boot,
    solved ? copy.passkey.folderUnlocked : copy.passkey.folderLocked,
  ];
  const skipsBoot = openedSolved || reduceMotion;
  const [bootLines, setBootLines] = useState(skipsBoot ? bootLog.length : 0);
  const booted = skipsBoot || bootLines >= bootLog.length;

  useEffect(() => {
    if (!skipsBoot) playSound('boot');
  }, [skipsBoot]);

  useEffect(() => {
    if (booted) return;
    const timer = setTimeout(
      () => {
        playSound('type');
        setBootLines((lines) => lines + 1);
      },
      bootLines === 0 ? BOOT_WARMUP_MS : BOOT_LINE_MS,
    );
    return () => clearTimeout(timer);
  }, [booted, bootLines]);

  useEffect(() => {
    if (justSolved) playSound('unlock', { delayMs: UNLOCK_SOUND_AFTER_MS });
  }, [justSolved]);

  // The explanation and the way forward wait for the folder to finish opening. A layout effect,
  // so they never show for a frame first; with reduced motion there is nothing to wait for.
  useLayoutEffect(() => {
    if (!justSolved || reduceMotion) return;
    stage.holdFeedback(true);
    const timer = setTimeout(() => stage.holdFeedback(false), UNLOCK_MS);
    return () => clearTimeout(timer);
  }, [justSolved, reduceMotion, stage]);

  function press(key: KeypadKey) {
    if (solved) return;
    // Touching the terminal is enough to skip the rest of its warm-up.
    setBootLines(bootLog.length);

    if (key.type === 'enter') {
      if (entry.length !== passkeyLength) return;
      playSound('key');
      setSubmitted(entry);
      setEntry('');
      game.submitPasskey(entry);
      return;
    }

    const next = applyKey(entry, key, passkeyLength);
    if (next === entry) return;
    playSound('key');
    setEntry(next);
  }

  const handleKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
    const key = keyFromKeyboard(event.key);
    if (!key) return;

    const target = event.target instanceof Element ? event.target : null;
    // Anything that takes typing of its own (the debug panel's fields) keeps its keys.
    if (target?.closest('input, textarea, select, [contenteditable]')) return;
    // Enter on a focused button or link belongs to that control — the keypad's keys included.
    // The exception is a digit key once the display is full: it has nothing left to add, so
    // Enter means what it says. (Click "1", type "09", press Enter — that should go through.)
    if (key.type === 'enter' && target?.closest('button, a')) {
      const onSpentDigitKey = target.closest('[data-digit]') && entry.length === passkeyLength;
      if (!onSpentDigitKey) return;
    }

    event.preventDefault();
    setHeldKey(keyName(key));
    if (!event.repeat) press(key);
  });
  const handleKeyUp = useEffectEvent(() => setHeldKey(null));

  useEffect(() => {
    if (solved) return;
    const onKeyDown = (event: KeyboardEvent) => handleKeyDown(event);
    const onKeyUp = () => handleKeyUp();
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [solved]);

  const documentElements = useRef(new Map<TaskReference, HTMLDivElement>());

  function showDocument(reference: TaskReference) {
    const element = documentElements.current.get(reference);
    if (!element) return;
    element.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
    element.focus({ preventScroll: true });
  }

  const status = solved ? 'granted' : attempts > 0 && entry === '' ? 'denied' : 'enter';
  // A code accepted on an earlier visit is no longer known to the screen, so it is masked.
  const shown = solved ? (submitted ?? copy.passkey.mask.repeat(passkeyLength)) : entry;
  const cells = Array.from({ length: passkeyLength }, (_, index) => shown.charAt(index));
  const readout = copy.passkey.display(
    cells.map((cell) => {
      if (cell === '') return copy.passkey.blank;
      return cell === copy.passkey.mask ? copy.passkey.hidden : cell;
    }),
  );

  return (
    <div className="flex flex-col gap-6">
      <Casing
        data-testid="terminal"
        className="grid items-center gap-4 sm:grid-cols-[minmax(0,1fr)_auto]"
      >
        <CrtScreen
          role="group"
          aria-label={copy.passkey.terminal}
          poweringOn={!skipsBoot}
          shake={!solved && attempts > openedAttempts ? attempts : 0}
          onPointerDown={() => setBootLines(bootLog.length)}
          className="min-h-80 self-stretch"
        >
          <ol data-testid="boot-log" className="flex flex-col gap-0.5 text-xs text-phosphor-dim">
            {bootLog.slice(0, booted ? bootLog.length : bootLines).map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ol>
          {!booted && <CrtCursor />}

          {booted && (
            <>
              <p className="text-sm font-bold tracking-widest sm:text-base">{task.prompt}</p>

              <p
                role="status"
                data-testid="terminal-status"
                data-status={status}
                className={cx(
                  'text-xl font-bold tracking-widest sm:text-2xl',
                  status === 'denied' && 'text-phosphor-alert',
                )}
              >
                {copy.passkey[status]}
              </p>

              <div data-testid="passkey-display" className="flex gap-2">
                {cells.map((cell, index) => (
                  <DisplayCell key={index} active={!solved && index === entry.length}>
                    {cell || (!solved && index === entry.length && <CrtCursor />)}
                  </DisplayCell>
                ))}
              </div>
              <p data-testid="passkey-readout" aria-live="polite" className="sr-only">
                {readout}
              </p>

              {!solved && lastCode && (
                <div
                  data-testid="last-code"
                  className="flex flex-col gap-2 border-t border-phosphor-dim pt-3"
                >
                  <p className="text-xs tracking-widest text-phosphor-dim">
                    {copy.passkey.lastCode}
                  </p>
                  <ul
                    aria-label={hint?.lights ? copy.passkey.lights : copy.passkey.lastCode}
                    className="flex gap-2"
                  >
                    {[...lastCode].map((digit, index) => {
                      const grade = hint?.lights?.[index];
                      const position = passkeyClues[index]?.position ?? '';
                      return (
                        <li
                          key={index}
                          data-grade={grade}
                          className="flex flex-col items-center gap-1.5"
                        >
                          <DisplayCell small tone="dim">
                            {digit}
                          </DisplayCell>
                          {grade && (
                            <SignalLight
                              state={lightStates[grade]}
                              symbol={copy.passkey.grades[grade].symbol}
                            />
                          )}
                          <span className="sr-only">
                            {grade
                              ? copy.passkey.light(
                                  position,
                                  digit,
                                  copy.passkey.grades[grade].meaning,
                                )
                              : digit}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                  {hint?.lights && (
                    // Each light already says what it means to a screen reader; this key is
                    // for the eye.
                    <ul aria-hidden="true" className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
                      {GRADES.map((grade) => (
                        <li key={grade} className="flex items-center gap-1.5">
                          <SignalLight
                            state={lightStates[grade]}
                            symbol={copy.passkey.grades[grade].symbol}
                          />
                          {copy.passkey.grades[grade].legend}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {hint && (
                <div className="flex flex-col items-start gap-2 border-t border-phosphor-dim pt-3">
                  <div
                    role="status"
                    data-testid="terminal-hint"
                    data-stage={hint.stage}
                    className="flex flex-col gap-1 text-sm leading-relaxed"
                  >
                    <p className="text-xs font-bold tracking-widest text-phosphor-amber">
                      {copy.passkey.hintCount(hint.level, passkeyHintStages.length)}
                    </p>
                    <p>{hint.text}</p>
                  </div>
                  {hint.source && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        if (hint.source) showDocument(hint.source.reference);
                      }}
                    >
                      {copy.passkey.showSource(copy.passkey.sources[hint.source.reference])}
                    </Button>
                  )}
                </div>
              )}
            </>
          )}
        </CrtScreen>

        <div
          role="group"
          aria-label={copy.passkey.keypad}
          aria-describedby={helpId}
          className="grid grid-cols-3 gap-2 justify-self-center"
        >
          {KEYPAD.map((key) => {
            const name = keyName(key);
            const pressed = !solved && heldKey === name;
            if (key.type === 'digit') {
              return (
                <KeyCap
                  key={name}
                  data-digit={key.digit}
                  pressed={pressed}
                  inactive={solved}
                  onClick={() => press(key)}
                >
                  {key.digit}
                </KeyCap>
              );
            }
            const isEnter = key.type === 'enter';
            return (
              <KeyCap
                key={name}
                tone={isEnter ? 'action' : 'plain'}
                pressed={pressed}
                inactive={solved || (isEnter && entry.length !== passkeyLength)}
                aria-label={isEnter ? copy.passkey.enterLabel : copy.passkey.deleteLabel}
                onClick={() => press(key)}
                className="text-sm"
              >
                {isEnter ? copy.passkey.enterKey : copy.passkey.deleteKey}
              </KeyCap>
            );
          })}
        </div>

        <Text id={helpId} size="sm" className="sm:col-span-2">
          {copy.passkey.keypadHelp}
        </Text>
      </Casing>

      <div
        data-testid="evidence-folder"
        data-state={solved ? 'unlocked' : 'locked'}
        className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 pt-6"
      >
        <EvidenceFolder open={solved} label={copy.passkey.folder} />
        <div className="flex flex-col items-start gap-3">
          <Text className="font-display font-bold tracking-widest">
            {copy.passkey.folderState(solved ? copy.passkey.unlocked : copy.passkey.locked)}
          </Text>
          {solved && (
            <Stamp tone="success" size="lg" animate={justSolved ? 'late' : false}>
              {copy.passkey.unlocked}
            </Stamp>
          )}
        </div>
      </div>

      <section aria-label={copy.passkey.documents} className="flex flex-col gap-5">
        <div>
          <Heading level={2} size="section">
            {copy.passkey.documents}
          </Heading>
          <Text size="sm" tone="muted">
            {copy.passkey.documentsHelp}
          </Text>
        </div>
        {documents.map((reference) => {
          const pointed = hint?.source?.reference === reference;
          return (
            <div
              key={reference}
              ref={(element) => {
                if (element) documentElements.current.set(reference, element);
                else documentElements.current.delete(reference);
              }}
              tabIndex={-1}
              data-reference={reference}
              data-pointed={pointed || undefined}
              className={cx(
                'relative rounded-card',
                pointed && 'animate-glow ring-4 ring-gold motion-reduce:animate-none',
              )}
            >
              {pointed && (
                <span className="absolute -top-3 right-4 z-10">
                  <PinTag animate>{copy.passkey.lookHere}</PinTag>
                </span>
              )}
              <ReferenceDocument reference={reference} />
            </div>
          );
        })}
      </section>
    </div>
  );
}
