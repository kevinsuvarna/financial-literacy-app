import { useEffect, useId, useRef, useState } from 'react';
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type TapInfo,
} from 'motion/react';
import {
  chequeFieldValues,
  chequeGlowAfterMisses,
  chequeHitZones,
  copy,
  type ChequeHitZone,
} from '@app/content';
import { playSound } from '../audio/sounds';
import { ChequeFace } from '../components/documents/ChequeFace';
import { zoneStyle } from '../components/documents/chequeLayout';
import { Card, Heading, Stamp, StickyNote, Text } from '../components/ui';
import { useGame } from '../game';
import { RedString } from './cheque/RedString';
import {
  lensPositionFor,
  magnifiedOffset,
  zoneAtPoint,
  type Point,
  type ZoneRect,
} from './cheque/geometry';
import type { TaskOfKind } from './types';

const ZOOM = 2;
/**
 * Where the loupe rests before it is picked up, as fractions of the cheque: the blank patch at
 * the lower left. It sits on the cheque rather than beside it so the two are always on screen
 * together.
 */
const PARKED_AT = { x: 0.3, y: 0.68 };
/** A press that moves the loupe further than this many pixels is a drag, not a tap. */
const TAP_SLOP = 4;
/** When the MISMATCH stamp hits the cheque, after the red string has drawn (see index.css). */
const STAMP_LANDS_AFTER_MS = 780;

function zoneCentre(zone: ChequeHitZone, width: number, height: number): Point {
  return {
    x: ((zone.x + zone.width / 2) / 100) * width,
    y: ((zone.y + zone.height / 2) / 100) * height,
  };
}

/**
 * Work out why the cheque was returned by inspecting it.
 *
 * Every field is a button laid over the printed cheque, so tapping, clicking, or Tab + Enter
 * all inspect a field (TAP_ZONE). The loupe is an aid on top of that: a draggable lens showing
 * a magnified copy of whatever is beneath it. It never gets in the way — a tap on the loupe
 * inspects the field under the tap — and it follows keyboard focus, so Tab-ing through the
 * fields magnifies each in turn (CLAUDE.md rule 6).
 */
export function TapTask({ task }: { task: TaskOfKind<'tap'> }) {
  const game = useGame();
  const reduceMotion = useReducedMotion();
  const helpId = useId();
  const solved = game.getTaskStatus(task.id) === 'completed';
  // Solved before this screen opened: show the result without replaying the reveal.
  const [openedSolved] = useState(solved);
  const glowing = !solved && game.getAttempts(task.id) >= chequeGlowAfterMisses;

  const chequeRef = useRef<HTMLDivElement>(null);
  const lensRef = useRef<HTMLDivElement>(null);
  const glassRef = useRef<HTMLDivElement>(null);
  const zoneButtons = useRef(new Map<string, HTMLButtonElement>());
  /** Where the loupe was when the current press on it began. */
  const loupePressedAt = useRef<Point>({ x: 0, y: 0 });

  const [chequeSize, setChequeSize] = useState<{ width: number; height: number } | null>(null);
  const [lensWidth, setLensWidth] = useState(0);
  /** Fields ruled out on this screen — a memory aid, not progress. */
  const [checkedZoneIds, setCheckedZoneIds] = useState<string[]>([]);
  const [lastMiss, setLastMiss] = useState<{ zoneId: string; count: number } | null>(null);

  // The loupe's offset from the cheque's top-left corner, and the sizes the magnified copy's
  // position depends on. All motion values, so dragging never re-renders React.
  const lensX = useMotionValue(0);
  const lensY = useMotionValue(0);
  const lensSize = useMotionValue(0);
  const glassSize = useMotionValue(0);
  const copyX = useTransform(() =>
    magnifiedOffset(lensX.get(), lensSize.get(), glassSize.get(), ZOOM),
  );
  const copyY = useTransform(() =>
    magnifiedOffset(lensY.get(), lensSize.get(), glassSize.get(), ZOOM),
  );

  useEffect(() => {
    const cheque = chequeRef.current;
    const lens = lensRef.current;
    const glass = glassRef.current;
    if (!cheque || !lens || !glass) return;

    let parked = false;
    const observer = new ResizeObserver(() => {
      setChequeSize({ width: cheque.offsetWidth, height: cheque.offsetHeight });
      setLensWidth(lens.offsetWidth);
      lensSize.set(lens.offsetWidth);
      glassSize.set(glass.clientWidth);
      if (!parked) {
        parked = true;
        lensX.set(lensPositionFor(cheque.offsetWidth * PARKED_AT.x, lens.offsetWidth));
        lensY.set(lensPositionFor(cheque.offsetHeight * PARKED_AT.y, lens.offsetWidth));
      }
    });
    observer.observe(cheque);
    return () => observer.disconnect();
  }, [lensX, lensY, lensSize, glassSize]);

  function inspect(zoneId: string) {
    if (solved) return;
    game.tapZone(zoneId);

    if (task.acceptedIds.includes(zoneId)) {
      playSound('thud', { delayMs: STAMP_LANDS_AFTER_MS });
      return;
    }
    setCheckedZoneIds((ids) => (ids.includes(zoneId) ? ids : [...ids, zoneId]));
    setLastMiss((previous) => ({ zoneId, count: (previous?.count ?? 0) + 1 }));
  }

  /**
   * A tap on the loupe is a tap on whatever the loupe is covering. Motion also reports a "tap"
   * when a drag ends, and putting the loupe down is not inspecting — so a press that moved the
   * loupe is ignored. (Judged by distance, because the order in which Motion delivers its
   * tap and drag callbacks is not something to rely on.)
   */
  function handleLoupeTap(_event: Event, info: TapInfo) {
    const moved = Math.hypot(
      lensX.get() - loupePressedAt.current.x,
      lensY.get() - loupePressedAt.current.y,
    );
    if (moved > TAP_SLOP) return;
    const rects: ZoneRect[] = [...zoneButtons.current].map(([id, button]) => {
      const rect = button.getBoundingClientRect();
      return { id, top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right };
    });
    // `info.point` is in page coordinates; the rects are relative to the viewport.
    const zoneId = zoneAtPoint(rects, {
      x: info.point.x - window.scrollX,
      y: info.point.y - window.scrollY,
    });
    if (zoneId) inspect(zoneId);
  }

  /** Keyboard focus brings the loupe to the field, so Tab-ing through the cheque magnifies it. */
  function bringLoupeTo(zone: ChequeHitZone, button: HTMLButtonElement) {
    if (!chequeSize || !button.matches(':focus-visible')) return;
    const centre = zoneCentre(zone, chequeSize.width, chequeSize.height);
    const x = lensPositionFor(centre.x, lensSize.get());
    const y = lensPositionFor(centre.y, lensSize.get());

    if (reduceMotion) {
      lensX.set(x);
      lensY.set(y);
    } else {
      animate(lensX, x, { duration: 0.25 });
      animate(lensY, y, { duration: 0.25 });
    }
  }

  // The loupe's *centre* may go anywhere on the cheque, so the loupe itself overhangs the edge
  // by up to half its width. Kept inside the cheque instead, it could never be centred on the
  // fields near the edge — the date, the cheque number.
  const half = lensWidth / 2;
  const dragBounds = chequeSize
    ? {
        left: -half,
        top: -half,
        right: chequeSize.width - half,
        bottom: chequeSize.height - half,
      }
    : undefined;

  const faceState = {
    mismatchZoneIds: solved ? task.acceptedIds : [],
    glowingZoneIds: glowing ? task.acceptedIds : [],
    checkedZoneIds,
  };

  // The red string runs between the two fields that disagree.
  const [fromZone, toZone] = task.acceptedIds.map((id) =>
    chequeHitZones.find((zone) => zone.id === id),
  );
  const missedZone = lastMiss && chequeHitZones.find((zone) => zone.id === lastMiss.zoneId);

  return (
    <Card as="section" className="flex flex-col gap-3">
      <Heading level={2} size="section">
        {copy.cheque.heading}
      </Heading>
      {/* No scroll container here: it would clip the loupe where it overhangs the cheque. */}
      <div>
        <div className="relative">
          <div ref={chequeRef} className="relative aspect-11/5">
            {/* The buttons below name every field; the printed face would only repeat them. */}
            <div aria-hidden="true" data-testid="cheque-face">
              <ChequeFace {...faceState} />
            </div>

            {chequeHitZones.map((zone) => {
              const name = copy.cheque.zone(zone.label, chequeFieldValues[zone.id]);
              const checked = checkedZoneIds.includes(zone.id);
              return (
                <button
                  key={zone.id}
                  ref={(button) => {
                    if (button) zoneButtons.current.set(zone.id, button);
                    else zoneButtons.current.delete(zone.id);
                  }}
                  type="button"
                  aria-label={checked ? `${name} — ${copy.cheque.checked}` : name}
                  aria-describedby={helpId}
                  disabled={solved}
                  style={zoneStyle(zone)}
                  className="absolute rounded-sm enabled:cursor-pointer enabled:hover:bg-notice-soft/60"
                  onClick={() => inspect(zone.id)}
                  onFocus={(event) => bringLoupeTo(zone, event.currentTarget)}
                />
              );
            })}

            {solved && chequeSize && fromZone && toZone && (
              <RedString
                width={chequeSize.width}
                height={chequeSize.height}
                // Pinned to the edges of the two fields, so the pins don't cover the amounts.
                from={{
                  x: (fromZone.x / 100) * chequeSize.width,
                  y: ((fromZone.y + fromZone.height / 2) / 100) * chequeSize.height,
                }}
                to={{
                  x: ((toZone.x + toZone.width * 0.3) / 100) * chequeSize.width,
                  y: (toZone.y / 100) * chequeSize.height,
                }}
                animate={!openedSolved}
              />
            )}
            {solved && (
              <Stamp
                tone="clue"
                size="lg"
                animate={openedSolved ? false : 'late'}
                className="absolute top-[54%] left-[52%] z-10 bg-surface/80"
              >
                {copy.cheque.mismatchStamp}
              </Stamp>
            )}
          </div>

          {/* The desk under the cheque: how to use it, and where sticky notes land. */}
          <div className="flex min-h-24 items-start justify-between gap-4 pt-4">
            <Text id={helpId} size="sm" tone="muted" className="max-w-xs">
              {copy.cheque.loupeHelp}
            </Text>
            {lastMiss && missedZone && !solved && (
              <StickyNote key={lastMiss.count} role="status" className="animate-stamp">
                <strong>{missedZone.label}</strong>
                <br />
                {game.getLastFeedback(task.id)}
              </StickyNote>
            )}
            {/* The glow is visual only; say the same thing to people who can't see it. */}
            {glowing && (
              <span role="status" className="sr-only">
                {copy.cheque.glowHint}
              </span>
            )}
          </div>

          <motion.div
            ref={lensRef}
            aria-hidden="true"
            data-testid="loupe"
            drag
            dragConstraints={dragBounds}
            dragElastic={0}
            dragMomentum={false}
            style={{ x: lensX, y: lensY }}
            onPointerDown={() => {
              loupePressedAt.current = { x: lensX.get(), y: lensY.get() };
            }}
            onTap={handleLoupeTap}
            className="absolute top-0 left-0 z-20 size-32 cursor-grab touch-none active:cursor-grabbing"
          >
            <span className="absolute right-0 bottom-0 h-4 w-12 origin-right translate-x-4 translate-y-4 rotate-45 rounded-control bg-ink shadow-md" />
            <div
              ref={glassRef}
              className="relative size-full overflow-hidden rounded-control border-[6px] border-ink bg-surface shadow-xl"
            >
              {chequeSize && (
                <motion.div
                  data-testid="loupe-copy"
                  style={{
                    x: copyX,
                    y: copyY,
                    scale: ZOOM,
                    originX: 0,
                    originY: 0,
                    width: chequeSize.width,
                    height: chequeSize.height,
                  }}
                  className="pointer-events-none absolute top-0 left-0"
                >
                  <ChequeFace {...faceState} />
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </Card>
  );
}
