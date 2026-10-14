import { copy } from '@app/content';
import { setMuted } from '../audio/sounds';
import { useMuted } from '../audio/useMuted';
import { Button, SoundOffIcon, SoundOnIcon } from './ui';

/**
 * Turns the game's sound on and off. Its name is exactly what it shows — "Sound on" or "Sound
 * off" — so someone using voice control can say what they see, and a screen reader hears the
 * same state that is on screen.
 */
export function SoundToggle() {
  const muted = useMuted();

  return (
    <Button variant="secondary" size="sm" onClick={() => setMuted(!muted)}>
      {muted ? <SoundOffIcon /> : <SoundOnIcon />}
      {muted ? copy.sound.off : copy.sound.on}
    </Button>
  );
}
