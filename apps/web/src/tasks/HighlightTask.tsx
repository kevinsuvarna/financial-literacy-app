import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { motion } from 'motion/react';
import { copy, getTransaction, type Transaction } from '@app/content';
import { playSound } from '../audio/sounds';
import { StatementView, type StatementRowExtras } from '../components/documents/StatementView';
import {
  Card,
  Heading,
  HighlighterPen,
  InkStroke,
  PinTag,
  StickyNote,
  Text,
  cx,
} from '../components/ui';
import { useGame } from '../game';
import { ClueCard } from './highlight/ClueCard';
import { snapToRow, type Point, type RowRect } from './highlight/snapToRow';
import type { TaskOfKind } from './types';

/** How long the clue card sits on its row before it flies to the evidence tray. */
const FILE_CLUE_AFTER_MS = 700;

/**
 * Find the transaction that doesn't fit by marking it with a highlighter.
 *
 * Two ways to do the same thing, both ending in HIGHLIGHT_ROW:
 * - pointer: pick up the highlighter and drop its tip on a row (it snaps to the nearest one);
 * - keyboard: the rows are a grid — arrow keys move between them, Enter marks (CLAUDE.md rule 6).
 *
 * Everything here is presentation. Which row was right, the wording, and whether the task is
 * solved all come from the game; this component only remembers what it last drew.
 */
export function HighlightTask({ task }: { task: TaskOfKind<'highlight'> }) {
  const game = useGame();
  const helpId = useId();
  const solved = game.getTaskStatus(task.id) === 'completed';
  // Solved before this screen opened: show the end state without replaying how it got there.
  const [openedSolved] = useState(solved);

  const rowElements = useRef(new Map<string, HTMLDivElement>());
  const penRef = useRef<HTMLDivElement>(null);
  /** The row under the pen at the last drag update — what a drop right now would mark. */
  const dropRowId = useRef<string | null>(null);

  const [dragging, setDragging] = useState(false);
  /** The row the dragged highlighter would mark if dropped now. */
  const [targetRowId, setTargetRowId] = useState<string | null>(null);
  /** The row keyboard focus is on, or will land on when the grid is tabbed into. */
  const [cursorRowId, setCursorRowId] = useState(task.optionIds[0]);
  /** The last row marked on this screen; `count` re-keys its ink and note so they replay. */
  const [lastMark, setLastMark] = useState<{ rowId: string; count: number } | null>(null);
  const [clueFiled, setClueFiled] = useState(openedSolved);

  useEffect(() => {
    if (!solved || clueFiled) return;
    const timer = setTimeout(() => setClueFiled(true), FILE_CLUE_AFTER_MS);
    return () => clearTimeout(timer);
  }, [solved, clueFiled]);

  const clueRowId = solved ? task.acceptedIds[0] : undefined;
  const clueTransaction = clueRowId ? getTransaction(clueRowId) : undefined;
  const clueLayoutId = `clue-${task.id}`;

  function markRow(rowId: string) {
    if (solved) return;
    playSound('squeak');
    game.highlightRow(rowId);
    setLastMark((previous) => ({ rowId, count: (previous?.count ?? 0) + 1 }));
  }

  // --- Pointer: drag the highlighter ----------------------------------------------------

  function penTip(): Point | null {
    const rect = penRef.current?.getBoundingClientRect();
    return rect ? { x: rect.left + 6, y: rect.top + rect.height / 2 } : null;
  }

  function rowRects(): RowRect[] {
    return task.optionIds.flatMap((id) => {
      const rect = rowElements.current.get(id)?.getBoundingClientRect();
      return rect
        ? [{ id, top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right }]
        : [];
    });
  }

  function rowUnderPen(): string | null {
    const tip = penTip();
    return tip ? snapToRow(rowRects(), tip) : null;
  }

  function handleDrag() {
    const rowId = rowUnderPen();
    dropRowId.current = rowId;
    setTargetRowId(rowId);
  }

  function handleDragEnd() {
    // Not measured again here: by the time Motion reports the drop, the pen is already on its
    // way back to where it was picked up.
    const rowId = dropRowId.current;
    dropRowId.current = null;
    setDragging(false);
    setTargetRowId(null);
    if (rowId) markRow(rowId);
  }

  // --- Keyboard: the rows are a grid ----------------------------------------------------

  function moveCursor(rowId: string | undefined) {
    if (!rowId) return;
    setCursorRowId(rowId);
    rowElements.current.get(rowId)?.focus();
  }

  function handleRowKeyDown(event: KeyboardEvent, rowId: string) {
    const index = task.optionIds.indexOf(rowId);
    switch (event.key) {
      case 'ArrowDown':
        moveCursor(task.optionIds[index + 1]);
        break;
      case 'ArrowUp':
        moveCursor(task.optionIds[index - 1]);
        break;
      case 'Home':
        moveCursor(task.optionIds[0]);
        break;
      case 'End':
        moveCursor(task.optionIds.at(-1));
        break;
      case 'Enter':
      case ' ':
        markRow(rowId);
        break;
      default:
        return;
    }
    // Arrow keys and Space would otherwise scroll the page.
    event.preventDefault();
  }

  // --- What each row shows --------------------------------------------------------------

  function getRowExtras(transaction: Transaction): StatementRowExtras {
    const rowId = transaction.id;
    if (!task.optionIds.includes(rowId)) return {};

    const isClue = rowId === clueRowId;
    const isWrongMark = !solved && lastMark?.rowId === rowId;
    const isTarget = dragging && targetRowId === rowId;

    return {
      ref: (element) => {
        if (element) rowElements.current.set(rowId, element);
        else rowElements.current.delete(rowId);
      },
      rowProps: {
        tabIndex: solved ? undefined : rowId === cursorRowId ? 0 : -1,
        onFocus: () => setCursorRowId(rowId),
        onKeyDown: (event) => handleRowKeyDown(event, rowId),
        'data-target': isTarget ? 'true' : 'false',
        className: cx(
          'rounded-sm outline-offset-0',
          isTarget && 'bg-highlighter/40',
          !solved && 'focus-visible:bg-highlighter/40',
        ),
      },
      tag: isClue ? <PinTag animate={!openedSolved}>{copy.statement.clue}</PinTag> : null,
      overlay: (
        <>
          {isClue && <InkStroke animate={!openedSolved} />}
          {isWrongMark && <InkStroke key={lastMark.count} fading />}
          {isClue && !clueFiled && clueTransaction && (
            <div className="pointer-events-none absolute top-1 right-2 z-10">
              <ClueCard transaction={clueTransaction} layoutId={clueLayoutId} />
            </div>
          )}
        </>
      ),
      below: isWrongMark ? (
        <div className="flex justify-end py-2">
          <StickyNote key={lastMark.count} role="status" className="animate-stamp">
            {game.getLastFeedback(task.id)}
          </StickyNote>
        </div>
      ) : null,
    };
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-start">
      {/* The desk: tools stay in view beside the statement (above it on narrow screens), so
          the highlighter never has to be dragged to a row that has scrolled off screen. */}
      <div className="grid gap-4 sm:grid-cols-2 lg:sticky lg:top-4 lg:col-start-2 lg:row-start-1 lg:grid-cols-1">
        <Card tone="sunken" className="flex flex-col items-start gap-3">
          <Text id={helpId} size="sm">
            {copy.statement.highlighterHelp}
          </Text>
          {/* Pointer-only: keyboard and screen-reader users mark rows in the grid instead. */}
          <motion.div
            ref={penRef}
            aria-hidden="true"
            data-testid="highlighter"
            drag={!solved}
            dragSnapToOrigin
            dragMomentum={false}
            dragElastic={0}
            whileDrag={{ scale: 1.06 }}
            onDragStart={() => setDragging(true)}
            onDrag={handleDrag}
            onDragEnd={handleDragEnd}
            className={cx(
              'relative z-20 touch-none',
              solved ? 'opacity-40' : 'cursor-grab active:cursor-grabbing',
            )}
          >
            <HighlighterPen label={copy.statement.highlighter} lifted={dragging} />
          </motion.div>
        </Card>

        <Card
          as="section"
          tone="sunken"
          aria-label={copy.statement.evidenceTray}
          className="flex flex-col items-start gap-3"
        >
          <Heading level={2} size="section">
            {copy.statement.evidenceTray}
          </Heading>
          {clueFiled && clueTransaction ? (
            <ClueCard transaction={clueTransaction} layoutId={clueLayoutId} />
          ) : (
            <Text size="sm" tone="muted">
              {copy.statement.evidenceTrayEmpty}
            </Text>
          )}
        </Card>
      </div>

      <div className="lg:col-start-1 lg:row-start-1">
        <StatementView interactive describedBy={helpId} getRowExtras={getRowExtras} />
      </div>
    </div>
  );
}
