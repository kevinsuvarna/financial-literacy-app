import type { TaskReference } from '@app/content';
import { ChequeView } from './ChequeView';
import { PhishingMessageView } from './PhishingMessageView';
import { StatementView } from './StatementView';

function Reference({ reference }: { reference: TaskReference }) {
  switch (reference) {
    case 'statement':
      return <StatementView />;
    case 'cheque':
      return <ChequeView />;
    case 'phishing-message':
      return <PhishingMessageView />;
  }
}

/** Read-only copies of the documents a task asks the player to consult. */
export function TaskReferences({ references }: { references: TaskReference[] }) {
  return references.map((reference) => <Reference key={reference} reference={reference} />);
}
