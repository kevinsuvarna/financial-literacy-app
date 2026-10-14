import { createContext, use } from 'react'
import type { ActionResult } from '../state/gameStore'

export type ActionHandler = (result: ActionResult) => ActionResult

export const ActionHandlerContext = createContext<ActionHandler>((result) => result)

/**
 * Wrap every store action a task screen triggers: `handle(scanArtefact(id))`. When the action
 * completes the task, closing its feedback moves the player on.
 */
export function useActionHandler(): ActionHandler {
  return use(ActionHandlerContext)
}
