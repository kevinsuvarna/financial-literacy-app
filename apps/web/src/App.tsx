import { MotionConfig } from 'motion/react';
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import './audio/gameSounds';
import { AppShell } from './components/AppShell';
import { CaseBoardScreen } from './routes/CaseBoardScreen';
import { CertificateScreen } from './routes/CertificateScreen';
import { PlayScreen } from './routes/PlayScreen';
import { PrintScreen } from './routes/PrintScreen';
import { StartScreen } from './routes/StartScreen';

/** The game's screens share its chrome: the title bar, the tracker, the scanner's lifecycle. */
function GameLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <Routes>
          {/* The print sheets are laid out to the millimetre, so they stand outside the shell. */}
          <Route path="/print" element={<PrintScreen />} />
          <Route element={<GameLayout />}>
            <Route path="/" element={<StartScreen />} />
            <Route path="/play" element={<PlayScreen />} />
            <Route path="/board" element={<CaseBoardScreen />} />
            <Route path="/certificate" element={<CertificateScreen />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </MotionConfig>
  );
}
