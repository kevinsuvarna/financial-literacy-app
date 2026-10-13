import { MotionConfig } from 'motion/react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import './audio/gameSounds';
import { AppShell } from './components/AppShell';
import { CaseBoardScreen } from './routes/CaseBoardScreen';
import { CertificateScreen } from './routes/CertificateScreen';
import { PlayScreen } from './routes/PlayScreen';
import { StartScreen } from './routes/StartScreen';

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <AppShell>
          <Routes>
            <Route path="/" element={<StartScreen />} />
            <Route path="/play" element={<PlayScreen />} />
            <Route path="/board" element={<CaseBoardScreen />} />
            <Route path="/certificate" element={<CertificateScreen />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppShell>
      </BrowserRouter>
    </MotionConfig>
  );
}
