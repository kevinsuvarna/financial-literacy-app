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

const fakeFieldSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  /**
   * What the game "types" into the field when it is tapped. Only X, 0 and dashes are allowed,
   * so a filled-in field can never look like — or be — a real card number, PIN or code.
   */
  fakeValue: z.string().regex(/^[X0-]+$/, 'fake values may contain only X, 0 and -'),
});

export const fakeBankPageSchema = z.object({
  /** Shown in the simulated address bar. Display text only. */
  address: z.string().min(1),
  notSecure: z.string().min(1),
  simulationBanner: z.string().min(1),
  heading: z.string().min(1),
  intro: z.string().min(1),
  fieldHelp: z.string().min(1),
  emptyField: z.string().min(1),
  fields: z.array(fakeFieldSchema).min(1),
  submit: z.string().min(1),
  lossHeading: z.string().min(1),
  lossCaption: z.string().min(1),
});
export type FakeBankPage = z.infer<typeof fakeBankPageSchema>;

/**
 * The page the phishing link leads to in the "YES" path. It is a picture of a form, not a form:
 * the player can only tap a field to have the game fill in a made-up value.
 */
export const fakeBankPage: FakeBankPage = fakeBankPageSchema.parse({
  address: phishingMessage.linkLabel,
  notSecure: 'Not secure',
  simulationBanner: 'SIMULATION — this is not a real page. Nothing here is sent anywhere.',
  heading: 'URGENT: UNBLOCK YOUR DEBIT CARD',
  intro: 'Confirm your card details now, or your card will stay blocked.',
  fieldHelp: 'Tap each box. The game fills it in with made-up details — you can’t type here.',
  emptyField: 'Tap to fill in',
  fields: [
    { id: 'card-number', label: 'Card number', fakeValue: 'XXXX-XXXX-XXXX-0000' },
    { id: 'card-pin', label: 'Card PIN', fakeValue: 'XXXX' },
    { id: 'otp', label: 'One-time password (OTP)', fakeValue: '000000' },
  ],
  submit: 'UNBLOCK MY CARD',
  lossHeading: 'Ananya’s savings',
  lossCaption:
    'In this simulation, the details typed into the fake page were used to take the money.',
});
