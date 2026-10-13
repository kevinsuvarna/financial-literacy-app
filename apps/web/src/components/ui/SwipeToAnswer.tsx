import { useRef } from 'react';
import { motion } from 'motion/react';
import { buttonClasses } from './buttonStyles';
import { PhoneIcon } from './icons';

interface SwipeToAnswerProps {
  /** The hint written in the track, e.g. "Swipe to answer". */
  hint: string;
  /** The name of the non-swipe button, e.g. "Answer the call". */
  actionLabel: string;
  onAnswer: () => void;
}

/** How far along the track the handle must be dragged to count. */
const ANSWER_AT = 0.7;

/**
 * A phone-style slide-to-answer control.
 *
 * Dragging is a pointer-only gesture, so the handle itself is hidden from assistive tech and
 * the tab order, and a real button does the same job (CLAUDE.md rule 6). That button is
 * visually hidden until it has keyboard focus: sighted keyboard users see it appear, screen
 * reader users find it by name, and pointer users get the swipe.
 */
export function SwipeToAnswer({ hint, actionLabel, onAnswer }: SwipeToAnswerProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex w-full max-w-xs flex-col items-center gap-3">
      <div
        ref={trackRef}
        data-testid="swipe-track"
        className="relative h-14 w-full rounded-control border border-on-canvas-muted/50 bg-canvas p-1"
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex items-center justify-center pl-12 text-sm font-semibold text-on-canvas-muted"
        >
          {hint}
          <span className="ml-2 animate-nudge motion-reduce:animate-none">→</span>
        </span>
        <motion.div
          ref={handleRef}
          data-testid="swipe-handle"
          aria-hidden="true"
          drag="x"
          dragConstraints={trackRef}
          dragElastic={0}
          dragMomentum={false}
          dragSnapToOrigin
          onDragEnd={(_event, info) => {
            const track = trackRef.current;
            const handle = handleRef.current;
            if (!track || !handle) return;
            const travel = track.clientWidth - handle.offsetWidth;
            if (info.offset.x >= travel * ANSWER_AT) onAnswer();
          }}
          className="relative flex size-12 cursor-grab touch-none items-center justify-center rounded-control bg-accent text-on-accent active:cursor-grabbing"
        >
          <PhoneIcon />
        </motion.div>
      </div>
      <button
        type="button"
        onClick={onAnswer}
        className={buttonClasses('primary', 'sm', 'sr-only focus-visible:not-sr-only')}
      >
        {actionLabel}
      </button>
    </div>
  );
}
