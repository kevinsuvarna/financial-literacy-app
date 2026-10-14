import { GAME } from '../content/gameData'
import { Highlighter } from '../components/Highlighter'
import { Statement } from '../components/Statement'
import { useActionHandler } from '../components/actionHandler'
import { TaskScreen } from '../components/TaskScreen'
import { isTaskCompleted, useGameStore } from '../state/gameStore'

function HighlightDesk() {
  const handle = useActionHandler()
  const highlight = useGameStore((s) => s.highlightTransaction)
  const solved = useGameStore((s) => isTaskCompleted(s, 'L2T3'))
  // The clue is only marked once the player has found it.
  const clueRowId = solved ? GAME.statement.rows.find((row) => row.suspicious)?.id : undefined

  return (
    <div className="highlight-desk">
      <Statement balances="all" clueRowId={clueRowId} />
      <div className="highlighter-home">
        <p className="highlighter-hint">{GAME.ui.highlighter.hint}</p>
        <Highlighter onDrop={(rowId) => handle(highlight(rowId))} />
      </div>
    </div>
  )
}

/** 10: Highlight the suspicious transaction. */
export function HighlighterScreen() {
  return (
    <TaskScreen taskId="L2T3">
      <HighlightDesk />
    </TaskScreen>
  )
}
