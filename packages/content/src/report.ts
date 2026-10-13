import { z } from 'zod';
import { getTransactionAmount, suspiciousTransactionId } from './statement';

export const incidentReportSchema = z.object({
  customer: z.string().min(1),
  concern: z.string().min(1),
  /** How each piece of evidence is described on the report, keyed by artefact id. */
  evidenceDescriptions: z.record(z.string(), z.string().min(1)),
});
export type IncidentReport = z.infer<typeof incidentReportSchema>;

export const incidentReport: IncidentReport = incidentReportSchema.parse({
  customer: 'Ananya Sharma',
  concern: 'Suspected fraud',
  evidenceDescriptions: {
    'bank-statement': 'Bank statement — unrecognised CAMS TEL transaction',
    'phishing-message': 'Suspicious message — link claiming to unblock debit card',
  },
});

/** The reported amount is always the suspicious ledger entry, never a separately typed figure. */
export function getReportedTransactionAmount(): number {
  return getTransactionAmount(suspiciousTransactionId);
}
