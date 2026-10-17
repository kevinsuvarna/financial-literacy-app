import { useRef, useState, type PointerEvent } from 'react'
import { GAME } from '../content/gameData'
import { useStageScale } from '../app/stageScale'
import { HighlighterPen } from './art/HighlighterPen'
import { penStyle } from './statement/highlighterLayout'

interface DragStart {
  pointerX: number
  pointerY: number
  x: number
  y: number
}

/**
 * The highlighter pen the player drags onto a statement row (spec 5, Task 3; mockup 10). On
 * release it reports the row under the pen's tip (any element with `data-row-id`), then springs
 * back to where it rests.
 */
export function Highlighter({ home, onDrop }: { home: { x: number; y: number }; onDrop: (rowId: string) => void }) {
  const scale = useStageScale()
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  /** Gliding back home after a drop that missed the statement. */
  const [returning, setReturning] = useState(false)
  const drag = useRef<DragStart | null>(null)
  const tip = useRef<HTMLSpanElement>(null)

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { pointerX: e.clientX, pointerY: e.clientY, ...offset }
    setDragging(true)
    setReturning(false)
  }

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const start = drag.current
    if (!start) return
    // Pointer movement is in screen pixels; the canvas may be scaled.
    setOffset({ x: start.x + (e.clientX - start.pointerX) / scale, y: start.y + (e.clientY - start.pointerY) / scale })
  }

  /** Back home: gliding after a miss, at once after a hit (the feedback covers the desk). */
  const release = (glide: boolean) => {
    drag.current = null
    setDragging(false)
    setReturning(glide)
    setOffset({ x: 0, y: 0 })
  }

  const onPointerUp = () => {
    if (!drag.current) return
    const point = tip.current?.getBoundingClientRect()
    const row = point
      ? document
          .elementsFromPoint(point.x + point.width / 2, point.y + point.height / 2)
          .map((el) => el.closest<HTMLElement>('[data-row-id]'))
          .find(Boolean)
      : null
    release(!row?.dataset.rowId)
    if (row?.dataset.rowId) onDrop(row.dataset.rowId)
  }

  return (
    <div
      className={`highlighter${dragging ? ' is-dragging' : ''}${returning ? ' is-returning' : ''}`}
      data-testid="highlighter"
      role="img"
      aria-label={GAME.ui.highlighter.hint}
      style={{ ...penStyle(home), translate: `${offset.x}px ${offset.y}px` }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => release(true)}
    >
      <HighlighterPen />
      {/* The point the pen highlights with: hit-tested on release. */}
      <span ref={tip} className="highlighter-tip" data-testid="highlighter-tip" />
    </div>
  )
}
