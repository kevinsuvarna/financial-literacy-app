import { gameActor } from '../game/actor';
import type { GameEvent } from '../game';
import { debugScanSource } from '../scan/sources';

/**
 * Sends a debug-originated event to the game. Scans still go out through a ScanSource, so even
 * debug tooling can't bypass CLAUDE.md rule 3 (and they show up in the scanner stats).
 */
export function dispatchDebugEvent(event: GameEvent): void {
  if (event.type === 'ARTEFACT_SCANNED') {
    debugScanSource.scan(event.id);
    return;
  }
  gameActor.send(event);
}
