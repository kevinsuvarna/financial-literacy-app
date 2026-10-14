import type { TaskId } from '../content/gameData'

/** Scene types from spec 13.1. Only `table` scenes scan artefacts. */
export type SceneType = 'screen' | 'call' | 'cinematic' | 'table'

export interface ScreenDef {
  /** Mockup number in spec 13.1. */
  number: string
  path: string
  scene: SceneType
  /** The task this screen belongs to; the store treats it as the active task while it's showing. */
  task?: TaskId
}

/** One route per screen in spec 13.1 (22, the feedback pop-ups, is an overlay, not a route). */
export const SCREENS = {
  start: { number: '01', path: '/', scene: 'screen' },
  callAnanya1: { number: '02', path: '/call/ananya', scene: 'call' },
  caseAssigned: { number: '03', path: '/case-assigned', scene: 'cinematic' },
  accountType: { number: '04', path: '/level-1/account-type', scene: 'table', task: 'L1T1' },
  verifyIdentity: { number: '05', path: '/level-1/verify-identity', scene: 'table', task: 'L1T2' },
  withdrawalSlip: { number: '06', path: '/level-1/withdrawal-slip', scene: 'table', task: 'L1T3' },
  level1Complete: { number: '07', path: '/level-1/complete', scene: 'cinematic' },
  closingBalance: { number: '08', path: '/level-2/closing-balance', scene: 'table', task: 'L2T1' },
  cheque: { number: '09', path: '/level-2/cheque', scene: 'screen', task: 'L2T2' },
  highlighter: { number: '10', path: '/level-2/highlighter', scene: 'screen', task: 'L2T3' },
  level2Complete: { number: '11', path: '/level-2/complete', scene: 'cinematic' },
  callAnanya2: { number: '12', path: '/level-3/call-ananya', scene: 'call', task: 'L3T1' },
  phishingChoice: { number: '13', path: '/level-3/phishing', scene: 'screen', task: 'L3T1' },
  fakeWebsite: { number: '14', path: '/level-3/fake-website', scene: 'screen', task: 'L3T1' },
  scamReveal: { number: '15', path: '/level-3/scam-reveal', scene: 'cinematic', task: 'L3T2' },
  passkey: { number: '16', path: '/level-3/passkey', scene: 'screen', task: 'L3T3' },
  scanEvidence: { number: '17', path: '/level-3/scan-evidence', scene: 'table', task: 'L3T4' },
  reviewReport: { number: '18', path: '/level-3/review-report', scene: 'screen', task: 'L3T5' },
  reportSubmitted: { number: '19', path: '/report-submitted', scene: 'cinematic' },
  certificate: { number: '20', path: '/certificate', scene: 'cinematic' },
  caseBoard: { number: '21', path: '/case-board', scene: 'screen' },
} as const satisfies Record<string, ScreenDef>

export type ScreenKey = keyof typeof SCREENS

/** The page a phone camera opens from a printed QR code (spec 10.3). Outside the game canvas. */
export const PHONE_LANDING_PATH = '/a/:artefactId'

export function screenForPath(pathname: string): ScreenDef | undefined {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname
  return Object.values(SCREENS).find((screen) => screen.path === path)
}
