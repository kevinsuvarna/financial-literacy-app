import { useShallow } from 'zustand/react/shallow'
import type { ScreenAccessState } from '../app/navigation'
import { useGameStore, type GameProgress } from './gameStore'

/** The persisted progress, re-rendering only when it changes. */
export function useProgress(): GameProgress {
  return useGameStore(
    useShallow(({ introCompleted, completedTasks, accepted, wrongAttempts, phishingChoice }) => ({
      introCompleted,
      completedTasks,
      accepted,
      wrongAttempts,
      phishingChoice,
    })),
  )
}

/** Everything the route guards need. */
export function useScreenAccess(): ScreenAccessState {
  const progress = useProgress()
  const fakeSiteOpen = useGameStore((s) => s.fakeSite.open)
  return { ...progress, fakeSiteOpen }
}
