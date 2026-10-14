import { createContext, use } from 'react'

/** The fixed design canvas (spec 9.1). Every screen is laid out at this size, then scaled to fit. */
export const CANVAS = { width: 1280, height: 831 } as const

export const ScaleContext = createContext(1)

/** Current canvas scale, for converting pointer movement into canvas pixels. */
export function useStageScale(): number {
  return use(ScaleContext)
}
