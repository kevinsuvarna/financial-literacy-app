import { gameActor, isRestoring } from '../game/actor';
import { progressSounds } from '../game/progressSounds';
import { playSound } from './sounds';

/** Long enough to land just after the scanner's own blip instead of on top of it. */
const RESULT_DELAY_MS = 160;

let previous = gameActor.getSnapshot().context;

gameActor.subscribe((snapshot) => {
  const next = snapshot.context;
  // A save swapped in from the server isn't something the player just did: no fanfare for it.
  if (!isRestoring()) {
    for (const sound of progressSounds(previous, next)) {
      playSound(sound, { delayMs: RESULT_DELAY_MS });
    }
  }
  previous = next;
});
