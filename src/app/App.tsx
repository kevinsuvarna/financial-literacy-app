import { MotionConfig } from 'motion/react'
import { useLayoutEffect, type ComponentType, type ReactNode } from 'react'
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router'
import { useGameStore } from '../state/gameStore'
import { useScreenAccess } from '../state/hooks'
import { LevelIntro } from '../components/LevelIntro'
import { MuteButton, SoundDirector } from '../components/SoundDirector'
import { AccountTypeScreen } from '../screens/AccountTypeScreen'
import { ClosingBalanceScreen } from '../screens/ClosingBalanceScreen'
import { Level1CompleteScreen } from '../screens/Level1CompleteScreen'
import { VerifyIdentityScreen } from '../screens/VerifyIdentityScreen'
import { WithdrawalSlipScreen } from '../screens/WithdrawalSlipScreen'
import { CallScreen } from '../screens/CallScreen'
import { OpeningCallScreen } from '../screens/OpeningCallScreen'
import { CaseAssignedScreen } from '../screens/CaseAssignedScreen'
import { CaseBoardScreen } from '../screens/CaseBoardScreen'
import { CertificateScreen } from '../screens/CertificateScreen'
import { ChequeClueScreen } from '../screens/ChequeClueScreen'
import { ChequeScreen } from '../screens/ChequeScreen'
import { EvidenceScreen } from '../screens/EvidenceScreen'
import { FakeWebsiteScreen } from '../screens/FakeWebsiteScreen'
import { HighlighterScreen } from '../screens/HighlighterScreen'
import { LevelCompleteScreen } from '../screens/LevelCompleteScreen'
import { PasskeyScreen } from '../screens/PasskeyScreen'
import { PhishingChoiceScreen } from '../screens/PhishingChoiceScreen'
import { PhoneLandingPage } from '../screens/PhoneLandingPage'
import { ReportSubmittedScreen } from '../screens/ReportSubmittedScreen'
import { ReviewReportScreen } from '../screens/ReviewReportScreen'
import { ScamRevealScreen } from '../screens/ScamRevealScreen'
import { StartScreen } from '../screens/StartScreen'
import { canOpenScreen, redirectFor } from './navigation'
import { PHONE_LANDING_PATH, SCREENS, screenForPath, type ScreenKey } from './screens'
import { Stage } from './Stage'

const SCREEN_COMPONENTS: Record<ScreenKey, ComponentType> = {
  start: StartScreen,
  callAnanya1: OpeningCallScreen,
  caseAssigned: CaseAssignedScreen,
  accountType: AccountTypeScreen,
  verifyIdentity: VerifyIdentityScreen,
  withdrawalSlip: WithdrawalSlipScreen,
  level1Complete: Level1CompleteScreen,
  closingBalance: ClosingBalanceScreen,
  chequeClue: ChequeClueScreen,
  cheque: ChequeScreen,
  highlighter: HighlighterScreen,
  level2Complete: () => <LevelCompleteScreen levelId={2} />,
  callAnanya2: CallScreen,
  phishingChoice: PhishingChoiceScreen,
  fakeWebsite: FakeWebsiteScreen,
  scamReveal: ScamRevealScreen,
  passkey: PasskeyScreen,
  scanEvidence: EvidenceScreen,
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
    <MotionConfig reducedMotion="user">
      <Stage>
        <ActiveTaskSync />
        <Outlet />
        <LevelIntro />
        <SoundDirector />
        <MuteButton />
      </Stage>
    </MotionConfig>
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
