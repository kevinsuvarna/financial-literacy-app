import cover from '../assets/interim/casefile-cover.jpg'
import profile from '../assets/interim/casefile-profile.png'
import brief from '../assets/interim/casefile-brief.png'

/** Ananya's case file (owner art, 2026-11-10): the cover, her profile inside it, and the case brief. */
export const CASE_FILE_ART = { cover, profile, brief }

/** The pages are big: fetch them while the case-assigned screen is up, so the file opens at once. */
export function preloadCaseFile() {
  for (const src of Object.values(CASE_FILE_ART)) new Image().src = src
}
