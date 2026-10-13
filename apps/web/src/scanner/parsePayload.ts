import { QR_PAYLOAD_HOST, QR_PAYLOAD_PATH, artefactIds } from '@app/content';
import type { ScanEvent } from './ScanSource';

/**
 * Pulls the artefact id out of a scanned payload URL (`https://ssa.game/a/<id>`), or returns
 * null if the text isn't one of our payload URLs at all.
 *
 * The host must match exactly — a look-alike such as `ssa.game.example.com` or
 * `ssa.game@example.com` is rejected. The path is matched case-insensitively because USB
 * scanners type with Caps Lock applied, and every artefact id is lowercase.
 */
export function extractArtefactId(text: string): string | null {
  let url: URL;
  try {
    url = new URL(text.trim());
  } catch {
    return null;
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
  if (url.host !== QR_PAYLOAD_HOST || url.username !== '' || url.password !== '') return null;

  const path = url.pathname.toLowerCase();
  if (!path.startsWith(QR_PAYLOAD_PATH)) return null;

  const id = path.slice(QR_PAYLOAD_PATH.length).replace(/\/$/, '');
  if (id === '' || id.includes('/')) return null;

  try {
    return decodeURIComponent(id);
  } catch {
    return null;
  }
}

/** Turns whatever a scanner read into a scan event: one of our artefacts, or an unknown code. */
export function parseScanPayload(
  raw: string,
  isKnownId: (id: string) => boolean = (id) => artefactIds.has(id),
): ScanEvent {
  const id = extractArtefactId(raw);
  return id !== null && isKnownId(id)
    ? { type: 'ARTEFACT_SCANNED', id }
    : { type: 'UNKNOWN_CODE_SCANNED', raw: raw.trim() };
}
