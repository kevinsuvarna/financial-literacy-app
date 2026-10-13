import { z } from 'zod';
import { formatRupees } from './format';

export const chequeHitZoneIdSchema = z.enum([
  'payee-name',
  'date',
  'amount-figures',
  'amount-words',
  'signature',
  'cheque-number',
]);
export type ChequeHitZoneId = z.infer<typeof chequeHitZoneIdSchema>;

const percentSchema = z.number().min(0).max(100);

export const chequeHitZoneSchema = z.object({
  id: chequeHitZoneIdSchema,
  /** The field's full name, used when talking about it. */
  label: z.string().min(1),
  /** The short caption printed next to the field on the cheque itself. */
  caption: z.string().min(1),
  /** Hit-zone rectangle, in percent of the cheque image's width/height. */
  x: percentSchema,
  y: percentSchema,
  width: percentSchema,
  height: percentSchema,
});
export type ChequeHitZone = z.infer<typeof chequeHitZoneSchema>;

export const chequeHitZones: ChequeHitZone[] = z.array(chequeHitZoneSchema).parse([
  { id: 'payee-name', label: 'Payee Name', caption: 'Pay', x: 8, y: 14, width: 55, height: 10 },
  { id: 'date', label: 'Date', caption: 'Date', x: 70, y: 6, width: 22, height: 8 },
  {
    id: 'amount-figures',
    label: 'Amount in Figures',
    caption: 'Amount',
    x: 70,
    y: 28,
    width: 22,
    height: 10,
  },
  {
    id: 'amount-words',
    label: 'Amount in Words',
    caption: 'Rupees',
    x: 8,
    y: 40,
    width: 80,
    height: 10,
  },
  { id: 'signature', label: 'Signature', caption: 'Signed', x: 60, y: 70, width: 32, height: 12 },
  {
    id: 'cheque-number',
    label: 'Cheque Number',
    caption: 'Cheque no.',
    x: 8,
    y: 85,
    width: 30,
    height: 8,
  },
]);

export const chequeHitZoneIds = chequeHitZones.map((zone) => zone.id);

/** After this many wrong taps, the mismatched amount starts to glow as a nudge. */
export const chequeGlowAfterMisses = 3;

/** Tapping either half of the mismatched amount reveals the discrepancy. */
export const chequeMismatchZoneIds: ChequeHitZoneId[] = ['amount-figures', 'amount-words'];

export const chequeAmountSchema = z
  .object({
    /** The numeral amount printed in the figures box. */
    amountFigures: z.number().int().positive(),
    /** The amount spelled out in the words line, for display. */
    amountWords: z.string().min(1),
    /** The numeric value that `amountWords` actually spells out — kept alongside the string so
     * the mismatch can be checked without parsing English number words. */
    amountWordsValue: z.number().int().positive(),
  })
  .refine((v) => v.amountFigures !== v.amountWordsValue, {
    message: 'amountFigures and amountWordsValue must mismatch — that mismatch is the clue',
  })
  .refine((v) => v.amountFigures % 10 === v.amountWordsValue % 10, {
    message: 'amountFigures and amountWordsValue must share the same last digit for the passkey',
  });

/** Placeholder cheque amount — real figures land once the Figma cheque artefact is final. */
export const chequeAmount = chequeAmountSchema.parse({
  amountFigures: 3500,
  amountWords: 'Three Thousand Five Hundred Eighty Rupees Only',
  amountWordsValue: 3580,
});

/** What is written in each field of the cheque. The two amounts come from `chequeAmount`. */
export const chequeFieldValues: Record<ChequeHitZoneId, string> = {
  'payee-name': 'Greenfield Public School',
  date: '08 Jan 2025',
  'amount-figures': formatRupees(chequeAmount.amountFigures),
  'amount-words': chequeAmount.amountWords,
  signature: 'Ananya Sharma',
  'cheque-number': '000123',
};
