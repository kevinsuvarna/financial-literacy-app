import { copy } from '@app/content';
import { Card, Heading } from '../ui';
import { ChequeFace } from './ChequeFace';

/** The cheque as a read-only reference (the interactive version is the tap task's own). */
export function ChequeView() {
  return (
    <Card as="section" className="flex flex-col gap-3">
      <Heading level={2} size="section">
        {copy.cheque.heading}
      </Heading>
      <div className="overflow-x-auto p-1">
        <div className="relative aspect-11/5 min-w-xl">
          <ChequeFace />
        </div>
      </div>
    </Card>
  );
}
