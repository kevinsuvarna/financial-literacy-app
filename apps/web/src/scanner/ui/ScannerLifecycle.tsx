import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useGame } from '../../game';
import { keyboardDebugSource, scannerController } from '../runtime';
import { getScanOptionIds } from '../scanTask';
import type { ScannerMode } from '../scannerController';

/**
 * Tells the scanner controller what the current screen needs. Renders nothing.
 *
 * - on /play with an unsolved scan task in a table scene → `active`
 * - anywhere else on /play (the rest of the level)          → `standby`
 * - every other route (start, Case Board, certificate)      → `off`
 */
export function ScannerLifecycle() {
  const game = useGame();
  const { pathname } = useLocation();

  const task = game.viewedTask;
  const playing = pathname === '/play' && game.state !== 'notStarted' && task !== undefined;
  const optionIds = playing
    ? getScanOptionIds(task, game.getTaskStatus(task.id) === 'completed')
    : null;

  const mode: ScannerMode = !playing ? 'off' : optionIds ? 'active' : 'standby';
  const candidates = optionIds?.join('\n') ?? '';

  useEffect(() => {
    scannerController.setMode(mode);
  }, [mode]);

  useEffect(() => {
    keyboardDebugSource.setCandidates(candidates === '' ? [] : candidates.split('\n'));
  }, [candidates]);

  useEffect(() => () => scannerController.setMode('off'), []);

  return null;
}
