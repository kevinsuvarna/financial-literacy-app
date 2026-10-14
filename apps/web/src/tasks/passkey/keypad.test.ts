import { describe, expect, it } from 'vitest';
import { applyKey, keyFromKeyboard, keyName, type KeypadKey } from './keypad';

const digit = (d: string): KeypadKey => ({ type: 'digit', digit: d });

describe('keyFromKeyboard', () => {
  it('maps the ten digits', () => {
    for (const d of '0123456789') expect(keyFromKeyboard(d)).toEqual(digit(d));
  });

  it('maps Backspace, Delete, Escape and Enter', () => {
    expect(keyFromKeyboard('Backspace')).toEqual({ type: 'delete' });
    expect(keyFromKeyboard('Delete')).toEqual({ type: 'clear' });
    expect(keyFromKeyboard('Escape')).toEqual({ type: 'clear' });
    expect(keyFromKeyboard('Enter')).toEqual({ type: 'enter' });
  });

  it('has no key for anything else', () => {
    for (const key of [
      'a',
      'Z',
      ' ',
      '-',
      '.',
      '#',
      'Tab',
      'ArrowLeft',
      'F5',
      'Shift',
      '12',
      '٣',
    ]) {
      expect(keyFromKeyboard(key), key).toBeNull();
    }
  });
});

describe('applyKey', () => {
  it('adds digits until the display is full, then ignores more', () => {
    let entry = '';
    for (const d of ['4', '0', '7']) entry = applyKey(entry, digit(d), 3);
    expect(entry).toBe('407');

    expect(applyKey(entry, digit('9'), 3)).toBe('407');
  });

  it('deletes one digit at a time, and nothing from an empty display', () => {
    expect(applyKey('407', { type: 'delete' }, 3)).toBe('40');
    expect(applyKey('4', { type: 'delete' }, 3)).toBe('');
    expect(applyKey('', { type: 'delete' }, 3)).toBe('');
  });

  it('clears the whole display', () => {
    expect(applyKey('407', { type: 'clear' }, 3)).toBe('');
  });

  it('leaves the display alone on Enter', () => {
    expect(applyKey('40', { type: 'enter' }, 3)).toBe('40');
  });
});

describe('keyName', () => {
  it('names a digit by itself and other keys by what they do', () => {
    expect(keyName(digit('7'))).toBe('7');
    expect(keyName({ type: 'delete' })).toBe('delete');
    expect(keyName({ type: 'enter' })).toBe('enter');
  });
});
