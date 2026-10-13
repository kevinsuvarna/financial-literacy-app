import { useState, type FormEvent } from 'react';
import { copy, passkey } from '@app/content';
import { Button, TextField } from '../components/ui';
import { useGame } from '../game';
import type { TaskOfKind } from './types';

/**
 * The only free-text input in the game. It accepts digits only, capped at the passkey's length,
 * so there is nowhere to type a real PIN, password or OTP (CLAUDE.md rule 5).
 */
export function PasskeyTask({ task }: { task: TaskOfKind<'passkey'> }) {
  const game = useGame();
  const [code, setCode] = useState('');
  const solved = game.getTaskStatus(task.id) === 'completed';
  const length = passkey.length;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    game.submitPasskey(code);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <TextField
        label={copy.passkey.input}
        value={code}
        onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, length))}
        inputMode="numeric"
        autoComplete="off"
        maxLength={length}
        disabled={solved}
        className="w-28 text-center font-display tracking-widest"
      />
      <Button type="submit" disabled={solved || code.length !== length}>
        {copy.passkey.submit}
      </Button>
    </form>
  );
}
