import { z } from 'zod';

export const phishingMessageSchema = z.object({
  sender: z.string().min(1),
  body: z.string().min(1),
  /** Display text only — never rendered as a real link. Uses the reserved `.example` TLD. */
  linkLabel: z.string().min(1),
});
export type PhishingMessage = z.infer<typeof phishingMessageSchema>;

/** Placeholder wording — the real message design lands with the Figma artefacts. */
export const phishingMessage: PhishingMessage = phishingMessageSchema.parse({
  sender: 'CAMS TEL',
  body: 'URGENT: Your debit card has been BLOCKED. Unblock it immediately by confirming your card details at the link below.',
  linkLabel: 'cams-tel-unblock.example/verify',
});
