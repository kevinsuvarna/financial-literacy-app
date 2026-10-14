import { describe, expect, it } from 'vitest'
import { createRepeatFilter } from './repeatFilter'

describe('repeat filter (spec 10.2: the same artefact within a short window counts once)', () => {
  it('counts a card held in view once', () => {
    const filter = createRepeatFilter(2000)
    const results = [0, 120, 240, 1000, 2500, 4000].map((t) => filter.accept('pan', t))
    expect(results).toEqual([true, false, false, false, false, false])
  })

  it('counts the card again after it has been out of view for the window', () => {
    const filter = createRepeatFilter(2000)
    expect(filter.accept('pan', 0)).toBe(true)
    expect(filter.accept('pan', 2100)).toBe(true)
  })

  it('counts a different card straight away', () => {
    const filter = createRepeatFilter(2000)
    expect(filter.accept('pan', 0)).toBe(true)
    expect(filter.accept('aadhaar', 100)).toBe(true)
    expect(filter.accept('pan', 200)).toBe(true)
  })

  it('lets a code the game could not take count on the next frame', () => {
    const filter = createRepeatFilter(2000)
    expect(filter.accept('pan', 0)).toBe(true)
    filter.forget()
    expect(filter.accept('pan', 120)).toBe(true)
  })
})
