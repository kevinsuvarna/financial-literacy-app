import { useRef, useState, type PointerEvent } from 'react'
import { GAME } from '../content/gameData'
import { useStageScale } from '../app/stageScale'

interface DragStart {
  pointerX: number
  pointerY: number
  x: number
  y: number
}

/**
 * A highlighter the player drags onto a statement row (spec 5, Task 3). On release it reports the
 * row under the pointer: any element with `data-row-id`.
 */
export function Highlighter({ onDrop }: { onDrop: (rowId: string) => void }) {
  const scale = useStageScale()
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const drag = useRef<DragStart | null>(null)

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { pointerX: e.clientX, pointerY: e.clientY, ...offset }
  }

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const start = drag.current
    if (!start) return
    // Pointer movement is in screen pixels; the canvas may be scaled.
    setOffset({ x: start.x + (e.clientX - start.pointerX) / scale, y: start.y + (e.clientY - start.pointerY) / scale })
  }

  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return
    drag.current = null
    const row = document
      .elementsFromPoint(e.clientX, e.clientY)
      .map((el) => el.closest<HTMLElement>('[data-row-id]'))
      .find(Boolean)
    if (row?.dataset.rowId) onDrop(row.dataset.rowId)
  }

  return (
    <div
      className="highlighter"
      data-testid="highlighter"
      role="img"
      aria-label={GAME.ui.highlighter.hint}
      style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => (drag.current = null)}
    >
      {GAME.ui.highlighter.label}
    </div>
  )
}
