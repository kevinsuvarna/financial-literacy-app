import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { copy } from '@app/content';
import { DebugPanel } from '../debug/DebugPanel';
import { isDebugEnabled } from '../debug/debugFlag';
import { useGame } from '../game';
import { ScannerLifecycle } from '../scanner/ui/ScannerLifecycle';
import { focusFirstHeading } from './focus';
import { SoundToggle } from './SoundToggle';
import { TopTracker } from './TopTracker';
import { ButtonLink } from './ui';

/** Persistent chrome: title, Case Board link and level tracker once the game has started. */
export function AppShell({ children }: { children: ReactNode }) {
  const game = useGame();
  const [debug] = useState(isDebugEnabled);
  const started = game.state !== 'notStarted';
  const { pathname } = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const arrived = useRef(false);

  // A new screen takes focus to its title — but not on the page's first load, where the
  // browser's own starting point is the right one.
  useEffect(() => {
    if (!arrived.current) {
      arrived.current = true;
      return;
    }
    const frame = requestAnimationFrame(() => focusFirstHeading(mainRef.current));
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  return (
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 px-4 py-6">
      <header className="flex flex-col gap-4 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link to="/" className="font-display font-bold tracking-wide">
            {copy.appTitle}
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <SoundToggle />
            {started && (
              <ButtonLink to="/board" variant="secondary" size="sm">
                {copy.nav.caseBoard}
              </ButtonLink>
            )}
          </div>
        </div>
        {started && <TopTracker />}
      </header>
      <main ref={mainRef} className="flex flex-1 flex-col gap-6">
        {children}
      </main>
      <ScannerLifecycle />
      {debug && <DebugPanel />}
    </div>
  );
}
