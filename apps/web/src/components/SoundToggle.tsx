import { copy } from '@app/content';
import { setMuted } from '../audio/sounds';
import { useMuted } from '../audio/useMuted';
import { Button, SoundOffIcon, SoundOnIcon } from './ui';

/** A toggle button: its name stays "Mute sound" and `aria-pressed` says whether it is on. */
export function SoundToggle() {
  const muted = useMuted();

  return (
    <Button
      variant="secondary"
      size="sm"
      aria-label={copy.sound.mute}
      aria-pressed={muted}
      onClick={() => setMuted(!muted)}
    >
      {muted ? <SoundOffIcon /> : <SoundOnIcon />}
      <span aria-hidden="true">{muted ? copy.sound.off : copy.sound.on}</span>
    </Button>
  );
}
