import { useLayoutEffect, type ComponentType, type ReactNode } from 'react'
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router'
import { useGameStore } from '../state/gameStore'
import { useScreenAccess } from '../state/hooks'
import { CallScreen } from '../screens/CallScreen'
import { CaseAssignedScreen } from '../screens/CaseAssignedScreen'
import { CaseBoardScreen } from '../screens/CaseBoardScreen'
import { CertificateScreen } from '../screens/CertificateScreen'
import { ChequeScreen } from '../screens/ChequeScreen'
import { FakeWebsiteScreen } from '../screens/FakeWebsiteScreen'
import { HighlighterScreen } from '../screens/HighlighterScreen'
import { LevelCompleteScreen } from '../screens/LevelCompleteScreen'
import { PasskeyScreen } from '../screens/PasskeyScreen'
import { PhishingChoiceScreen } from '../screens/PhishingChoiceScreen'
import { PhoneLandingPage } from '../screens/PhoneLandingPage'
import { ReportSubmittedScreen } from '../screens/ReportSubmittedScreen'
import { ReviewReportScreen } from '../screens/ReviewReportScreen'
import { ScamRevealScreen } from '../screens/ScamRevealScreen'
import { ScanTableScreen } from '../screens/ScanTableScreen'
import { StartScreen } from '../screens/StartScreen'
import { Statement } from '../components/Statement'
import { canOpenScreen, redirectFor } from './navigation'
import { PHONE_LANDING_PATH, SCREENS, screenForPath, type ScreenKey } from './screens'
import { Stage } from './Stage'

const SCREEN_COMPONENTS: Record<ScreenKey, ComponentType> = {
  start: StartScreen,
  callAnanya1: () => <CallScreen variant="opening" />,
  caseAssigned: CaseAssignedScreen,
  accountType: () => <ScanTableScreen taskId="L1T1" />,
  verifyIdentity: () => <ScanTableScreen taskId="L1T2" />,
  withdrawalSlip: () => <ScanTableScreen taskId="L1T3" />,
  level1Complete: () => <LevelCompleteScreen levelId={1} />,
  closingBalance: () => <ScanTableScreen taskId="L2T1" document={<Statement balances="closing-after-solved" />} />,
  cheque: ChequeScreen,
  highlighter: HighlighterScreen,
  level2Complete: () => <LevelCompleteScreen levelId={2} />,
  callAnanya2: () => <CallScreen variant="second" />,
  phishingChoice: PhishingChoiceScreen,
  fakeWebsite: FakeWebsiteScreen,
  scamReveal: ScamRevealScreen,
  passkey: PasskeyScreen,
  scanEvidence: () => <ScanTableScreen taskId="L3T4" />,
  reviewReport: ReviewReportScreen,
  reportSubmitted: ReportSubmittedScreen,
  certificate: CertificateScreen,
  caseBoard: CaseBoardScreen,
}

/** Sends the player elsewhere if a screen is still locked (spec 8: no skipping). */
function Guarded({ screen, children }: { screen: ScreenKey; children: ReactNode }) {
  const access = useScreenAccess()
  if (!canOpenScreen(screen, access)) return <Navigate to={redirectFor(screen, access)} replace />
  return children
}

/** Tells the store which task is on screen, so scans and taps are checked against it. */
function ActiveTaskSync() {
  const { pathname } = useLocation()
  const viewTask = useGameStore((s) => s.viewTask)
  const leaveTask = useGameStore((s) => s.leaveTask)
  useLayoutEffect(() => {
    const task = screenForPath(pathname)?.task
    if (task) viewTask(task)
    else leaveTask()
  }, [pathname, viewTask, leaveTask])
  return null
}

function GameShell() {
  return (
    <Stage>
      <ActiveTaskSync />
      <Outlet />
    </Stage>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={PHONE_LANDING_PATH} element={<PhoneLandingPage />} />
        <Route element={<GameShell />}>
          {(Object.keys(SCREENS) as ScreenKey[]).map((key) => {
            const Screen = SCREEN_COMPONENTS[key]
            return (
              <Route
                key={key}
                path={SCREENS[key].path}
                element={
                  <Guarded screen={key}>
                    <Screen />
                  </Guarded>
                }
              />
            )
          })}
          <Route path="*" element={<Navigate to={SCREENS.start.path} replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
