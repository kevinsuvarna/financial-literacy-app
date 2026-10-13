import { useEffect, useState } from 'react';
import { scanHub } from '../runtime';

/**
 * A brief wash of colour over the scene each time a case-file card is read. It lives on the
 * scene rather than the scan station because the scan that solves a task removes the station.
 * Purely decorative: the result is always also given as text, and with reduced motion the
 * animation is skipped entirely.
 */
export function ScanFlash() {
  const [hits, setHits] = useState(0);

  useEffect(
    () =>
      scanHub.onScan((record) => {
        if (record.kind === 'artefact') setHits((count) => count + 1);
      }),
    [],
  );

  if (hits === 0) return null;
  return (
    <div
      key={hits}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 rounded-card bg-accent opacity-0 animate-scan-flash motion-reduce:hidden"
    />
  );
}
