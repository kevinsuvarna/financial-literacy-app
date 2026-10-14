/** Everything the terminal's keypad — on screen or on the real keyboard — can ask for. */
export type KeypadKey =
  { type: 'digit'; digit: string } | { type: 'delete' } | { type: 'clear' } | { type: 'enter' };

/**
 * The keypad key a real keyboard key stands for, from a KeyboardEvent's `key`. Anything that is
 * not a digit or one of three control keys is no key at all: letters, symbols and pasted text
 * have no way onto the display (CLAUDE.md rule 5).
 */
export function keyFromKeyboard(key: string): KeypadKey | null {
  if (/^[0-9]$/.test(key)) return { type: 'digit', digit: key };
  if (key === 'Backspace') return { type: 'delete' };
  if (key === 'Delete' || key === 'Escape') return { type: 'clear' };
  if (key === 'Enter') return { type: 'enter' };
  return null;
}

/** A stable name for a key, for telling which on-screen key a keyboard press belongs to. */
export function keyName(key: KeypadKey): string {
  return key.type === 'digit' ? key.digit : key.type;
}

/**
 * What the display holds after `key` is pressed. A full display ignores further digits rather
 * than overwriting, and Enter never changes what is shown.
 */
export function applyKey(entry: string, key: KeypadKey, length: number): string {
  switch (key.type) {
    case 'digit':
      return entry.length < length ? entry + key.digit : entry;
    case 'delete':
      return entry.slice(0, -1);
    case 'clear':
      return '';
    case 'enter':
      return entry;
  }
}
