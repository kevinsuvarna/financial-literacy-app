import { describe, expect, it } from 'vitest';
import { artefacts } from '@app/content';
import { extractArtefactId, parseScanPayload } from './parsePayload';

describe('extractArtefactId', () => {
  it('reads the id back out of every artefact’s real QR payload', () => {
    for (const artefact of artefacts) {
      expect(extractArtefactId(artefact.qrPayload), artefact.qrPayload).toBe(artefact.id);
    }
  });

  it.each([
    ['surrounding whitespace', '  https://ssa.game/a/id-pan-card\n', 'id-pan-card'],
    ['a trailing slash', 'https://ssa.game/a/id-pan-card/', 'id-pan-card'],
    ['a query string and fragment', 'https://ssa.game/a/id-pan-card?src=print#x', 'id-pan-card'],
    ['plain http', 'http://ssa.game/a/id-pan-card', 'id-pan-card'],
    ['Caps Lock on a USB scanner', 'HTTPS://SSA.GAME/A/ID-PAN-CARD', 'id-pan-card'],
  ])('accepts %s', (_case, payload, id) => {
    expect(extractArtefactId(payload)).toBe(id);
  });

  it.each([
    ['an empty string', ''],
    ['text that is not a URL', 'hello there'],
    ['a bare id', 'id-pan-card'],
    ['a URL without a scheme', 'ssa.game/a/id-pan-card'],
    ['another site', 'https://example.com/a/id-pan-card'],
    ['a look-alike subdomain', 'https://ssa.game.example.com/a/id-pan-card'],
    ['a look-alike parent domain', 'https://notssa.game/a/id-pan-card'],
    ['our host used as a username', 'https://ssa.game@example.com/a/id-pan-card'],
    ['a different port', 'https://ssa.game:8443/a/id-pan-card'],
    ['a different path', 'https://ssa.game/b/id-pan-card'],
    ['a missing id', 'https://ssa.game/a/'],
    ['a nested path', 'https://ssa.game/a/id-pan-card/extra'],
    ['a non-web scheme', 'ftp://ssa.game/a/id-pan-card'],
    ['a script URL', 'javascript:alert(1)'],
    ['broken percent-encoding', 'https://ssa.game/a/%E0%A4%A'],
  ])('rejects %s', (_case, payload) => {
    expect(extractArtefactId(payload)).toBeNull();
  });
});

describe('parseScanPayload', () => {
  it('turns one of our payloads into ARTEFACT_SCANNED', () => {
    expect(parseScanPayload('https://ssa.game/a/account-savings')).toEqual({
      type: 'ARTEFACT_SCANNED',
      id: 'account-savings',
    });
  });

  it('reports a well-formed payload for an id that is not in the case file as unknown', () => {
    expect(parseScanPayload('https://ssa.game/a/not-a-real-card')).toEqual({
      type: 'UNKNOWN_CODE_SCANNED',
      raw: 'https://ssa.game/a/not-a-real-card',
    });
  });

  it('reports any other code as unknown, keeping what was read', () => {
    expect(parseScanPayload(' https://example.com/menu ')).toEqual({
      type: 'UNKNOWN_CODE_SCANNED',
      raw: 'https://example.com/menu',
    });
  });

  it('uses the id check it is given', () => {
    expect(parseScanPayload('https://ssa.game/a/custom', (id) => id === 'custom')).toEqual({
      type: 'ARTEFACT_SCANNED',
      id: 'custom',
    });
  });
});
