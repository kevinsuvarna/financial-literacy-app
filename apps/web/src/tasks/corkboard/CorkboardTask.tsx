import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { motion, useMotionValue, useTransform } from 'motion/react';
import {
  chequeFieldValues,
  copy,
  formatRupees,
  getTransaction,
  getTransactionAmount,
  phishingMessage,
  suspiciousTransactionId,
} from '@app/content';
import { playSound } from '../../audio/sounds';
import { Card, FadeIn, Heading, RedString, Stamp, Text, cx } from '../../components/ui';
import { useGame } from '../../game';
import { zoneAtPoint, type Point, type ZoneRect } from '../cheque/geometry';
import type { TaskOfKind } from '../types';

/** How close to a pin the end of the string must be dropped to catch on it, in pixels. */
const PIN_REACH = 18;
/** When the reveal sounds, after the string has drawn itself between the pins. */
const REVEAL_AFTER_MS = 500;

interface BoardLayout {
  width: number;
  height: number;
  /** The pin the string starts from, and each pin it can be tied to — centres, in board pixels. */
  source: Point;
  pins: Record<string, Point>;
}

function PinnedCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card as="article" className="flex flex-col gap-2 shadow-lg">
      <Text size="sm" tone="muted" className="tracking-widest uppercase">
        {title}
      </Text>
      {children}
    </Card>
  );
}

/**
 * The scam reveal: clues pinned to a corkboard, and a red string to tie from the name on the
 * statement clue to wherever that name turns up again.
 *
 * Each place the string can go is a pin, and each pin is a button — so tying the string is
 * CHOOSE{pin}, whether the player drags the string onto the pin, clicks the pin, or reaches it
 * with Tab and presses Enter (CLAUDE.md rule 6). The dragged end of the string is decoration
 * for pointer users and is hidden from assistive tech.
 */
export function CorkboardTask({ task }: { task: TaskOfKind<'choice'> }) {
  const game = useGame();
  const helpId = useId();
  const solved = game.getTaskStatus(task.id) === 'completed';
  // Solved before this screen opened: show the board as it was left, without the reveal.
  const [openedSolved] = useState(solved);

  const boardRef = useRef<HTMLDivElement>(null);
  const sourcePinRef = useRef<HTMLSpanElement>(null);
  const stringEndRef = useRef<HTMLDivElement>(null);
  const pinButtons = useRef(new Map<string, HTMLButtonElement>());
  /** The pin under the string's end at the last drag update — what a drop now would tie to. */
  const dropPinId = useRef<string | null>(null);

  const [layout, setLayout] = useState<BoardLayout | null>(null);
  const [hoverPinId, setHoverPinId] = useState<string | null>(null);

  // The loose end's offset from the source pin while it is dragged. Motion values, so the
  // string follows the pointer without re-rendering React.
  const pullX = useMotionValue(0);
  const pullY = useMotionValue(0);
  const sourceX = useMotionValue(0);
  const sourceY = useMotionValue(0);
  const looseString = useTransform(() => {
    const fromX = sourceX.get();
    const fromY = sourceY.get();
    return `M ${fromX} ${fromY} L ${fromX + pullX.get()} ${fromY + pullY.get()}`;
  });

  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;

    const measure = () => {
      const frame = board.getBoundingClientRect();
      const centreOf = (element: Element): Point => {
        const rect = element.getBoundingClientRect();
        return {
          x: rect.left + rect.width / 2 - frame.left,
          y: rect.top + rect.height / 2 - frame.top,
        };
      };
      if (!sourcePinRef.current) return;

      const source = centreOf(sourcePinRef.current);
      const pins: Record<string, Point> = {};
      for (const [id, button] of pinButtons.current) pins[id] = centreOf(button);

      sourceX.set(source.x);
      sourceY.set(source.y);
      setLayout({ width: frame.width, height: frame.height, source, pins });
    };

    const observer = new ResizeObserver(measure);
    observer.observe(board);
    return () => observer.disconnect();
  }, [sourceX, sourceY]);

  function tie(pinId: string) {
    if (solved) return;
    game.choose(pinId);
    if (task.acceptedIds.includes(pinId)) playSound('reveal', { delayMs: REVEAL_AFTER_MS });
  }

  function pinUnderStringEnd(): string | null {
    const end = stringEndRef.current?.getBoundingClientRect();
    if (!end) return null;
    const reach: ZoneRect[] = [...pinButtons.current].map(([id, button]) => {
      const rect = button.getBoundingClientRect();
      return {
        id,
        top: rect.top - PIN_REACH,
        bottom: rect.bottom + PIN_REACH,
        left: rect.left - PIN_REACH,
        right: rect.right + PIN_REACH,
      };
    });
    return zoneAtPoint(reach, { x: end.left + end.width / 2, y: end.top + end.height / 2 });
  }

  function handleDrag() {
    const pinId = pinUnderStringEnd();
    dropPinId.current = pinId;
    setHoverPinId(pinId);
  }

  function handleDragEnd() {
    // Not measured again here: by the time Motion reports the drop, the string's end is
    // already springing back to its pin.
    const pinId = dropPinId.current;
    dropPinId.current = null;
    setHoverPinId(null);
    if (pinId) tie(pinId);
  }

  /** `side`: whether the pin sits before or after the words it belongs to. */
  function pin(pinId: string, side: 'before' | 'after' = 'after') {
    return (
      <button
        ref={(button) => {
          if (button) pinButtons.current.set(pinId, button);
          else pinButtons.current.delete(pinId);
        }}
        type="button"
        data-pin={pinId}
        aria-label={copy.corkboard.tieTo(task.optionLabels[pinId] ?? pinId)}
        aria-describedby={helpId}
        disabled={solved}
        onClick={() => tie(pinId)}
        className={cx(
          'inline-flex size-7 shrink-0 items-center justify-center rounded-control border-2 border-clue bg-surface align-middle enabled:cursor-pointer enabled:hover:bg-clue-soft',
          side === 'before' ? 'mr-2' : 'ml-2',
          hoverPinId === pinId && 'bg-clue-soft ring-4 ring-clue/40',
        )}
      >
        <span aria-hidden="true" className="size-3 rounded-control bg-clue" />
      </button>
    );
  }

  const clue = getTransaction(suspiciousTransactionId);
  const scamName = phishingMessage.sender;
  const [beforeName, afterName] = clue?.desc.includes(scamName)
    ? clue.desc.split(scamName)
    : [clue?.desc ?? '', undefined];
  const connectedPin = solved ? task.acceptedIds.find((id) => layout?.pins[id]) : undefined;

  return (
    <div className="flex flex-col gap-4">
      <Text id={helpId} size="sm" tone="muted">
        {copy.corkboard.help}
      </Text>

      <div
        ref={boardRef}
        role="group"
        aria-label={copy.corkboard.board}
        className="relative grid gap-6 rounded-card border-8 border-cork-edge bg-cork p-6 sm:grid-cols-2"
      >
        <div className="flex flex-col gap-6">
          <PinnedCard title={copy.corkboard.clueCard}>
            <Text className="font-semibold">
              {beforeName}
              {afterName !== undefined && (
                <mark className="bg-highlighter px-1 text-ink">{scamName}</mark>
              )}
              {afterName}
              <span
                ref={sourcePinRef}
                aria-hidden="true"
                className="ml-2 inline-block size-4 rounded-control bg-clue align-middle"
              />
            </Text>
            <Text className="font-display">
              {formatRupees(getTransactionAmount(suspiciousTransactionId))}
            </Text>
          </PinnedCard>

          <PinnedCard title={copy.corkboard.chequeCard}>
            <Text className="font-semibold">
              {copy.corkboard.payee}: {chequeFieldValues['payee-name']}
              {pin('cheque-payee')}
            </Text>
            <Text size="sm">{copy.corkboard.chequeNote}</Text>
          </PinnedCard>
        </div>

        <div className="self-start">
          <PinnedCard title={copy.corkboard.messageCard}>
            {/* Pinned at the near edge, so the tied string stops short of the name it points to. */}
            <Text className="font-semibold">
              {pin('message-sender', 'before')}
              {copy.phishing.from}: {phishingMessage.sender}
            </Text>
            <Text size="sm">{phishingMessage.body}</Text>
            <Text size="sm" className="font-semibold break-all underline">
              {phishingMessage.linkLabel}
            </Text>
          </PinnedCard>
        </div>

        {/* The string: loose and draggable until it is tied, then fixed between the two pins. */}
        {layout && !solved && (
          <>
            <svg
              aria-hidden="true"
              viewBox={`0 0 ${layout.width} ${layout.height}`}
              className="pointer-events-none absolute inset-0 size-full overflow-visible"
            >
              <motion.path
                d={looseString}
                fill="none"
                strokeWidth={3}
                strokeLinecap="round"
                className="stroke-clue"
              />
            </svg>
            <motion.div
              ref={stringEndRef}
              aria-hidden="true"
              data-testid="string-end"
              drag
              dragSnapToOrigin
              dragMomentum={false}
              dragElastic={0}
              style={{ left: layout.source.x, top: layout.source.y, x: pullX, y: pullY }}
              onDrag={handleDrag}
              onDragEnd={handleDragEnd}
              className="absolute z-20 -mt-4 -ml-4 flex size-8 cursor-grab touch-none items-center justify-center rounded-control bg-clue shadow-lg ring-2 ring-surface active:cursor-grabbing"
            >
              <span className="size-2.5 animate-nudge rounded-control bg-surface motion-reduce:animate-none" />
            </motion.div>
          </>
        )}
        {layout && connectedPin && (
          <RedString
            width={layout.width}
            height={layout.height}
            from={layout.source}
            to={layout.pins[connectedPin] ?? layout.source}
            animate={!openedSolved}
          />
        )}
      </div>

      {solved && (
        <FadeIn>
          <Card
            tone="story"
            data-testid="reveal"
            className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 border-4 py-8 text-center"
          >
            <Stamp tone="gold" size="lg" animate={openedSolved ? false : 'late'}>
              {copy.corkboard.revealStamp}
            </Stamp>
            <Heading level={2} size="display">
              {copy.corkboard.revealHeading}
            </Heading>
          </Card>
        </FadeIn>
      )}
    </div>
  );
}
