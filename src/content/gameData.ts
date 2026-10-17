/**
 * Save the Savings Account: the single game content module (spec 10.1).
 *
 * Everything the game says or checks lives here: copy, amounts, answers, artefact IDs, QR URLs,
 * feedback and hints. Components read content from here and progress from the game store.
 * They never contain answers themselves.
 *
 * PLACEHOLDER: the statement and cheque figures in CASE_FIGURES are fictional placeholders until
 * the Stage 4 mockups supply the real values. Everything that depends on them (running balances,
 * closing balance, answer-card amounts, cheque words, passkey, figure-dependent copy) is derived in
 * buildGameContent(). Replacing a placeholder updates everything downstream, so never type a
 * derived value in by hand.
 */

// ─── Config ──────────────────────────────────────────────────────────────────

/**
 * Domain encoded in every printed QR code: https://<GAME_DOMAIN>/a/<artefact-id> (spec 10.3).
 * PLACEHOLDER: set the real domain before printing the artefacts.
 */
export const GAME_DOMAIN = 'save-the-savings.example'

// ─── Identifiers ─────────────────────────────────────────────────────────────

export const LEVEL_IDS = [1, 2, 3] as const
export type LevelId = (typeof LEVEL_IDS)[number]

/** Every task in play order. Tasks unlock strictly one after another (spec 8). */
export const TASK_ORDER = [
  'L1T1', 'L1T2', 'L1T3',
  'L2T1', 'L2T2', 'L2T3',
  'L3T1', 'L3T2', 'L3T3', 'L3T4', 'L3T5',
] as const
export type TaskId = (typeof TASK_ORDER)[number]

/** Every QR-coded physical artefact. The ID is the last path segment of its QR URL. */
export const ARTEFACT_IDS = [
  // Level 1, Task 1: bank account type cards
  'savings-account', 'current-account', 'fixed-deposit-account', 'recurring-deposit-account',
  // Level 1, Task 2: identity document cards
  'expired-passport', 'library-card', 'pan-card', 'aadhaar-card',
  // Level 1, Task 3: bank slips
  'deposit-slip', 'withdrawal-slip',
  // Level 2, Task 1: closing-balance answer cards (neutral IDs, so a QR URL never gives the answer away)
  'balance-card-a', 'balance-card-b', 'balance-card-c', 'balance-card-d',
  // Level 3, Task 4: documents (the cheque is scannable but is not evidence)
  'bank-statement', 'phishing-message-card', 'cheque',
] as const
export type ArtefactId = (typeof ARTEFACT_IDS)[number]
export type BalanceCardId = Extract<ArtefactId, `balance-card-${string}`>

export function isArtefactId(value: string): value is ArtefactId {
  return (ARTEFACT_IDS as readonly string[]).includes(value)
}

// ─── Money helpers ───────────────────────────────────────────────────────────

const RUPEES = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 })

/** Whole rupees with Indian digit grouping: ₹4,691, ₹1,00,000. */
export function formatRupees(amount: number): string {
  return `₹${RUPEES.format(amount)}`
}

const STATEMENT_AMOUNT = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/** Statement style, Indian grouping with paise: 8,200.00. */
export function formatStatementAmount(amount: number): string {
  return STATEMENT_AMOUNT.format(amount)
}

export function lastDigit(amount: number): number {
  return Math.abs(Math.trunc(amount)) % 10
}

const ONES = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven',
  'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen',
]
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

function wordsBelowHundred(n: number): string {
  if (n < 20) return ONES[n]
  const ones = ONES[n % 10]
  return ones ? `${TENS[Math.floor(n / 10)]}-${ones}` : TENS[Math.floor(n / 10)]
}

function wordsBelowThousand(n: number, hasHigherPart: boolean): string {
  const hundreds = Math.floor(n / 100)
  const rest = n % 100
  if (!rest) return `${ONES[hundreds]} Hundred`
  const tail = wordsBelowHundred(rest)
  if (hundreds) return `${ONES[hundreds]} Hundred and ${tail}`
  return hasHigherPart ? `and ${tail}` : tail
}

/** Whole rupees in words, Indian numbering, cheque style: 1550 → "One Thousand Five Hundred and Fifty". */
export function amountInWords(amount: number): string {
  if (!Number.isInteger(amount) || amount < 0 || amount >= 1_000_000_000) {
    throw new RangeError(`Cannot write ${amount} in words`)
  }
  if (amount === 0) return 'Zero'
  const groups = [
    [Math.floor(amount / 10_000_000), 'Crore'],
    [Math.floor((amount % 10_000_000) / 100_000), 'Lakh'],
    [Math.floor((amount % 100_000) / 1000), 'Thousand'],
  ] as const
  const words = groups.filter(([n]) => n > 0).map(([n, unit]) => `${wordsBelowHundred(n)} ${unit}`)
  if (amount % 1000) words.push(wordsBelowThousand(amount % 1000, words.length > 0))
  return words.join(' ')
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** ISO date → "03 Sep 2026" (statement style). */
export function formatStatementDate(iso: string): string {
  const [year, month, day] = iso.split('-')
  return `${day} ${MONTHS[Number(month) - 1]} ${year}`
}

/** ISO date → "08-09-2026" (cheque style). */
export function formatChequeDate(iso: string): string {
  const [year, month, day] = iso.split('-')
  return `${day}-${month}-${year}`
}

// ─── Statement arithmetic ────────────────────────────────────────────────────

export type Direction = 'credit' | 'debit'

export function signedAmount(entry: { direction: Direction; amount: number }): number {
  return entry.direction === 'credit' ? entry.amount : -entry.amount
}

export interface Ledger<T> {
  openingBalance: number
  rows: (T & { balanceAfter: number })[]
  totalCredits: number
  totalDebits: number
  closingBalance: number
}

/** Running balances and totals. The closing balance only ever comes from here. */
export function computeLedger<T extends { direction: Direction; amount: number }>(
  openingBalance: number,
  entries: readonly T[],
): Ledger<T> {
  let balance = openingBalance
  const rows = entries.map((entry) => {
    balance += signedAmount(entry)
    return { ...entry, balanceAfter: balance }
  })
  const total = (direction: Direction) =>
    entries.filter((e) => e.direction === direction).reduce((sum, e) => sum + e.amount, 0)
  return {
    openingBalance,
    rows,
    totalCredits: total('credit'),
    totalDebits: total('debit'),
    closingBalance: balance,
  }
}

// ─── Passkey (spec 6, Task 3) ────────────────────────────────────────────────

export interface PasskeyClues {
  closingBalance: number
  chequeAmountInFigures: number
  chequeAmountInWords: number
  suspiciousAmount: number
}

/** Last digit of the closing balance, the cheque amount and the suspicious transaction, in that order. */
export function derivePasskey(clues: PasskeyClues): string {
  if (lastDigit(clues.chequeAmountInFigures) !== lastDigit(clues.chequeAmountInWords)) {
    throw new Error('The cheque amounts in figures and in words must end in the same digit (spec 5, Task 2)')
  }
  return [clues.closingBalance, clues.chequeAmountInFigures, clues.suspiciousAmount].map(lastDigit).join('')
}

// ─── Copy templates ──────────────────────────────────────────────────────────

/** Replaces {name} tokens. Throws on a token with no value, so no copy ships half-filled. */
export function fillTemplate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    if (!(key in values)) throw new Error(`No value for {${key}} in "${template}"`)
    return String(values[key])
  })
}

// ─── QR codes and printing (spec 10.3) ───────────────────────────────────────

export function artefactQrUrl(id: ArtefactId, domain: string = GAME_DOMAIN): string {
  return `https://${domain}/a/${id}`
}

/** The artefact a scanned QR code stands for, or null for any code that isn't from the case file. */
export function artefactIdFromQr(text: string, domain: string = GAME_DOMAIN): ArtefactId | null {
  let url: URL
  try {
    url = new URL(text.trim())
  } catch {
    return null
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
  if (url.hostname !== domain.toLowerCase()) return null
  const match = /^\/a\/([a-z0-9-]+)\/?$/.exec(url.pathname)
  return match && isArtefactId(match[1]) ? match[1] : null
}

/** e.g. L1-T2_aadhaar-card.png */
export function printFileName(id: ArtefactId, printTask: TaskId): string {
  return `${printTask.replace(/^L(\d)T(\d)$/, 'L$1-T$2')}_${id}.png`
}

export type ArtefactKind = 'account-type' | 'identity-document' | 'bank-slip' | 'balance-card' | 'document'

export interface Artefact {
  id: ArtefactId
  /** Label printed on the card, and the name of its on-screen tap target. */
  name: string
  kind: ArtefactKind
  /** The task whose screen this card is scanned on; it groups the print files. */
  printTask: TaskId
  qrUrl: string
  printFileName: string
  /** Closing-balance cards only: the amount printed on the card. */
  printedAmount?: number
  /** How the name breaks on the card drawn on screen (\n = line break). Defaults to the name. */
  cardLabel: string
  /** The label under the artefact on its feedback card. Defaults to `cardLabel`. */
  detailLabel: string
}

const ARTEFACT_TABLE: Record<
  ArtefactId,
  { name: string; kind: ArtefactKind; printTask: TaskId; cardLabel?: string; detailLabel?: string }
> = {
  'savings-account': { name: 'Savings Account', kind: 'account-type', printTask: 'L1T1', cardLabel: 'Savings\nAccount' },
  'current-account': { name: 'Current Account', kind: 'account-type', printTask: 'L1T1', cardLabel: 'Current\nAccount' },
  'fixed-deposit-account': {
    name: 'Fixed Deposit Account',
    kind: 'account-type',
    printTask: 'L1T1',
    cardLabel: 'Fixed Deposit\nAccount',
  },
  'recurring-deposit-account': {
    name: 'Recurring Deposit Account',
    kind: 'account-type',
    printTask: 'L1T1',
    cardLabel: 'Recurring\nDeposit Account',
  },
  'expired-passport': {
    name: 'Passport (expired)',
    kind: 'identity-document',
    printTask: 'L1T2',
    cardLabel: 'Passport',
    detailLabel: 'Expired Passport',
  },
  'library-card': { name: 'Library card', kind: 'identity-document', printTask: 'L1T2', cardLabel: 'Library card' },
  'pan-card': { name: 'PAN card', kind: 'identity-document', printTask: 'L1T2', cardLabel: 'PAN Card' },
  'aadhaar-card': { name: 'Aadhaar card', kind: 'identity-document', printTask: 'L1T2', cardLabel: 'Aadhaar Card' },
  'deposit-slip': { name: 'Deposit slip', kind: 'bank-slip', printTask: 'L1T3' },
  'withdrawal-slip': { name: 'Withdrawal slip', kind: 'bank-slip', printTask: 'L1T3' },
  'balance-card-a': { name: 'Closing balance card A', kind: 'balance-card', printTask: 'L2T1' },
  'balance-card-b': { name: 'Closing balance card B', kind: 'balance-card', printTask: 'L2T1' },
  'balance-card-c': { name: 'Closing balance card C', kind: 'balance-card', printTask: 'L2T1' },
  'balance-card-d': { name: 'Closing balance card D', kind: 'balance-card', printTask: 'L2T1' },
  'bank-statement': { name: 'Bank statement', kind: 'document', printTask: 'L3T4' },
  'phishing-message-card': { name: 'Suspicious message card', kind: 'document', printTask: 'L3T4' },
  cheque: { name: 'Cheque', kind: 'document', printTask: 'L3T4' },
}

// ─── Case figures (PLACEHOLDER until the Stage 4 mockups) ────────────────────

/** Marks a statement entry whose amount is the cheque's amount in figures. */
export const CHEQUE_AMOUNT = 'cheque-amount'

export interface CaseTransaction {
  id: string
  /** ISO date. */
  date: string
  description: string
  direction: Direction
  amount: number | typeof CHEQUE_AMOUNT
  /** Exactly one transaction is suspicious: the CAMS TEL "mobile recharge". */
  suspicious?: boolean
  /** The name shown with the amount when the highlighter lands on this row (10b–10j: "NOT SUSPICIOUS: ₹ 350 / Cafe Express"). */
  highlightLabel: string
  /** The note beside the statement when the highlighter lands on this row (Level 2, Task 3). {amount} is this row's amount. */
  highlightFeedback: string
}

export interface ChequeFigures {
  number: string
  /** ISO date. */
  date: string
  payee: string
  drawer: string
  /** How the story refers to the drawer. */
  drawerShortName: string
  bankName: string
  branch: string
  branchAddress: string
  ifsc: string
  accountNumber: string
  amountInFigures: number
  /** The (different) amount written in words. Must end in the same digit as the figures (spec 5, Task 2). */
  amountInWordsValue: number
  /** The other codes printed in the MICR line after the cheque number (09): city-bank-branch code, account ID, transaction code. */
  micr: [string, string, string]
}

/**
 * A closing-balance answer card. The correct card always shows the computed closing balance.
 * Wrong cards are common mistakes, derived from the statement where possible:
 * - `omits`: forgot one transaction
 * - `flips`: added a debit (or subtracted a credit) instead
 * - `fixed`: a near-miss printed as-is; it must not equal the closing balance
 * Feedback copy may use {transactionAmount} (omits/flips) and {openingBalance}.
 */
export type BalanceCardFigure =
  | { id: BalanceCardId; kind: 'correct' }
  | { id: BalanceCardId; kind: 'omits' | 'flips'; transaction: string; feedback: Copy }
  | { id: BalanceCardId; kind: 'fixed'; amount: number; feedback: Copy }

export interface CaseFigures {
  account: { holder: string; type: string; maskedNumber: string; bankName: string; branch: string }
  statementPeriod: { from: string; to: string }
  openingBalance: number
  transactions: CaseTransaction[]
  cheque: ChequeFigures
  /** 3–4 cards, exactly one correct (spec 2). */
  balanceCards: BalanceCardFigure[]
  /** Phishing YES path: what the scammer takes in the simulation. Must be less than the closing balance. */
  simulatedLoss: number
  /** Level 1, Task 3: the withdrawal Ananya tried. More than her balance, which is why it failed (06b). */
  withdrawalAttempt: number
}

export const CASE_FIGURES: CaseFigures = {
  // From mockups 08 and 09 (2026-10-14). The closing balance (₹2,452) is computed, never typed in.
  account: {
    holder: 'Ananya Sharma',
    type: 'Savings Account (Minor)',
    maskedNumber: 'XXXX XXXX 3210',
    bankName: 'First National Bank',
    branch: 'Hitech City Branch',
  },
  statementPeriod: { from: '2026-08-01', to: '2026-08-31' },
  openingBalance: 8200,
  transactions: [
    {
      id: 'pocket-money',
      date: '2026-08-02',
      description: 'Pocket Money (Parent Transfer)',
      direction: 'credit',
      amount: 1000,
      highlightLabel: 'Pocket Money',
      highlightFeedback: 'Ananya gets her pocket money from her parents every month.',
    },
    {
      id: 'cafe-express',
      date: '2026-08-05',
      description: 'Cafe Express',
      direction: 'debit',
      amount: 350,
      highlightLabel: 'Cafe Express',
      highlightFeedback: 'Ananya said she had a latte at the newly opened cafe.',
    },
    {
      id: 'stylehub',
      date: '2026-08-08',
      description: 'Online Shopping – StyleHub',
      direction: 'debit',
      amount: 1200,
      highlightLabel: 'StyleHub',
      highlightFeedback: 'This transaction matches Ananya’s shopping plans.',
    },
    {
      id: 'playzone',
      date: '2026-08-12',
      description: 'Game Top-Up – PlayZone',
      direction: 'debit',
      amount: 499,
      highlightLabel: 'PlayZone',
      highlightFeedback: 'Ananya said she spent money at the arcade.',
    },
    {
      id: 'grandparents-gift',
      date: '2026-08-15',
      description: 'Gift from Grandparents',
      direction: 'credit',
      amount: 2500,
      highlightLabel: 'Grandparents',
      highlightFeedback: 'Ananya recorded receiving money from her grandparents.',
    },
    {
      id: 'cinemax',
      date: '2026-08-18',
      description: 'Movie Tickets – CineMax',
      direction: 'debit',
      amount: 800,
      highlightLabel: 'CineMax',
      highlightFeedback: 'Ananya recorded going out and watching a movie with friends.',
    },
    {
      id: 'quickbite',
      date: '2026-08-22',
      description: 'Food Delivery – QuickBite',
      direction: 'debit',
      amount: 450,
      highlightLabel: 'QuickBite',
      highlightFeedback: 'This transaction matches Ananya’s food order.',
    },
    {
      id: 'cheque-payment',
      date: '2026-08-25',
      description: 'Cheque No. 000123 – Music Class Fees',
      direction: 'debit',
      amount: CHEQUE_AMOUNT,
      highlightLabel: 'Music Class',
      highlightFeedback: 'This is the music class cheque you already checked.',
    },
    {
      id: 'cheque-returned',
      date: '2026-08-28',
      description: 'Cheque No. 000123 – Returned',
      direction: 'credit',
      amount: CHEQUE_AMOUNT,
      highlightLabel: 'Music Class',
      highlightFeedback: 'The bounced cheque matches the earlier music class payment.',
    },
    {
      id: 'cams-tel',
      date: '2026-08-30',
      // Owner decision: CAMS TEL, not the mockup's "FastTel", so it matches the phishing message.
      description: 'Mobile Recharge – CAMS TEL',
      direction: 'debit',
      amount: 5999, // fixed by spec 5, Task 3
      suspicious: true,
      highlightLabel: 'Mobile Recharge – CAMS TEL',
      highlightFeedback:
        "Ananya doesn't remember making this {amount} \"mobile recharge\" to CAMS TEL, and it's far bigger than anything else she spends. That doesn't prove it's fraud, but it's a clue worth investigating.",
    },
    {
      id: 'interest',
      date: '2026-08-31',
      description: 'Interest Credit',
      direction: 'credit',
      amount: 50,
      highlightLabel: 'Interest Credit',
      highlightFeedback: 'Ananya’s weekly log accounts for this.',
    },
  ],
  cheque: {
    number: '000123',
    date: '2026-08-25',
    payee: 'Rhythm Music Academy',
    drawer: 'Ananya Sharma',
    drawerShortName: 'Ananya',
    bankName: 'National Bank',
    branch: 'Hitech City Branch',
    branchAddress: 'Plot No. 12, Hitech City, Hyderabad – 500081',
    ifsc: 'NBIN0001234',
    accountNumber: '1234567890',
    amountInFigures: 1500,
    amountInWordsValue: 1550, // differs from the figures but ends in the same digit
    micr: ['500012345', '123456', '10'],
  },
  balanceCards: [
    {
      id: 'balance-card-a',
      kind: 'flips',
      transaction: 'cheque-payment',
      feedback: {
        title: 'NOT QUITE',
        message: 'This balance is much higher than it\nshould be.',
        detail: 'Check the {transactionAmount} cheque payment carefully.\nIt is a debit — money OUT, so it must be subtracted, not added.',
        cta: 'TRY AGAIN',
      },
    },
    {
      id: 'balance-card-b',
      kind: 'omits',
      transaction: 'interest',
      feedback: {
        title: 'NOT QUITE',
        message: 'Very close. Check the last\ntransaction in the statement.',
        detail: 'Did you include the {transactionAmount} interest credit?',
        cta: 'TRY AGAIN',
      },
    },
    { id: 'balance-card-c', kind: 'correct' },
    {
      id: 'balance-card-d',
      kind: 'fixed',
      amount: 3502,
      feedback: {
        title: 'NOT QUITE',
        message: 'Your calculation is close, but\nsomething is off.',
        detail: 'Start with {openingBalance} → add the credits → subtract the debits',
        cta: 'TRY AGAIN',
      },
    },
  ],
  simulatedLoss: 2000, // owner decision: leaves ₹452 of ₹2,452
  withdrawalAttempt: 3000, // mockup 06
}

// ─── Content types ───────────────────────────────────────────────────────────

export interface Copy {
  /** The stamp on a feedback card (NOT QUITE, VALID…), or a pop-up's title. */
  title?: string
  /** The heading of a feedback card, or a pop-up's main line. */
  message: string
  /** Extra explanation shown under the message. */
  detail?: string
  /** Feedback cards (mockups 04a–06c): paragraphs under the heading, in order. */
  paragraphs?: string[]
  /** A bulleted list after the paragraphs. */
  bullets?: string[]
  /** The card's button label. */
  cta?: string
  /** Measured sizes from the mockup, where the design doesn't follow the text length. */
  layout?: { stampWidth?: number; ctaWidth?: number }
  /** A phone notification shown with the message, e.g. the bank's "money withdrawn" alert. */
  alert?: { sender: string; text: string }
}

export interface CallLine {
  speaker: string
  text: string
}

/** One beat of a phone call: the caller's expression, signal strength and what she says. */
export interface CallStep {
  mood: 'smiling' | 'talking' | 'worried' | 'alarmed'
  signal: 'ok' | 'weak' | 'lost'
  status: string
  text: string
  /** A small "take note" prompt shown with this line. */
  hint?: string
}

export type PhishingChoice = 'no' | 'yes'
export type FakeFieldId = 'card-number' | 'cvv' | 'otp'
export type ChequeAreaId =
  | 'bank'
  | 'date'
  | 'payee'
  | 'amount-words'
  | 'amount-figures'
  | 'account-number'
  | 'signature'
  | 'cheque-number'

export interface EvidenceSlot {
  artefactId: ArtefactId
  label: string
  /** What it shows, under its label (14c). */
  detail?: string
}

interface TaskCommon {
  id: TaskId
  level: LevelId
  /** Short label for the in-level task tracker. */
  label: string
  /** The big question or heading on the task screen. */
  prompt: string
  instruction: string
  /** Escalating hints, one more per wrong answer (the last one repeats). */
  hints: string[]
}

/** A table scene: the player answers by scanning physical cards (spec 2). */
export interface ScanTask extends TaskCommon {
  kind: 'scan'
  /** A story line shown above the question (mockup 06). */
  intro?: string
  /** Statement scenes: how many transaction rows show a running balance (mockup 08). */
  statementBalancesShown?: number
  /** Cards on the table for this task: each can be scanned or tapped on screen. */
  options: ArtefactId[]
  /** All of these must be scanned, in any order, to complete the task. */
  required: ArtefactId[]
  correct: Copy
  /** Wrong answers: explained, and counted towards hints. */
  incorrect: Partial<Record<ArtefactId, Copy>>
  /** Friendly, non-error responses that don't count as mistakes. */
  neutral: Partial<Record<ArtefactId, Copy>>
  /** A case-file artefact that isn't part of this question. */
  notAnOption: Copy
  /** Tasks that collect several artefacts (KYC, evidence): one slot per required artefact. */
  collect?: {
    slots: EvidenceSlot[]
    /** Shown when one required artefact is accepted but others are still missing. */
    accepted: Partial<Record<ArtefactId, Copy>>
    /** Re-scanning an artefact that's already accepted: never an error. */
    already: Copy
    /**
     * `last-card`: the task completes on the last artefact's own card, with the task's `correct.cta`
     * (mockup 05d: the second valid ID says NEXT CLUE). Default: the task's `correct` copy.
     */
    completion?: 'last-card'
  }
}

/** A tappable area of the cheque. Discrepancy areas complete the task with the task's `correct` copy. */
export type ChequeArea =
  | { id: ChequeAreaId; label: string; isDiscrepancy: true }
  | { id: ChequeAreaId; label: string; isDiscrepancy: false; feedback: Copy }

export interface ChequeTask extends TaskCommon {
  kind: 'cheque'
  /** The clue screen before the cheque (09): the statement's two cheque rows. {chequeFigures} is filled in. */
  clue: { heading: string; paragraphs: string[]; question: string; cta: string }
  areas: ChequeArea[]
  correct: Copy
}

export interface HighlightTask extends TaskCommon {
  kind: 'highlight'
  correct: Copy
}

export interface PhishingTask extends TaskCommon {
  kind: 'phishing'
  /** Ananya's second call (mockups 11, 11b): played like the first, then the choice. */
  call: { caller: string; steps: CallStep[] }
  choices: { id: PhishingChoice; label: string }[]
  /** Chose NO. */
  safe: Copy
  fakeSite: {
    title: string
    subtitle: string
    urgency: string
    message: string
    simulationNote: string
    back: string
    /** Fields never accept typing: a tap fills an obviously fictional value (spec 6, Task 1). */
    fields: { id: FakeFieldId; label: string; autofill: string }[]
    submit: string
    incomplete: Copy
  }
  /** Chose YES and entered the details: the loss happens here, not when the link was clicked. */
  consequence: Copy
}

export interface StoryTask extends TaskCommon {
  kind: 'story'
  /** The reveal (mockups 15, 15b, 12c), played as one sequence. */
  reveal: {
    heading: string
    /** "CAM Service Tel" then "could this be?". */
    question: [string, string]
    /** The name as it appears, then as it rearranges. */
    name: string
    unscrambled: string
    /** The newspaper that confirms it (12c). */
    newspaper: { masthead: string; date: string; headline: string; body: string }
  }
  /** Read out with the reveal, for screen readers. */
  beats: string[]
  cta: string
  correct: Copy
}

export interface PasskeyTask extends TaskCommon {
  kind: 'passkey'
  /** The bank's computer (mockups 13, 13b, 16e). */
  screenTitle: string
  screenHint: string
  lockedLabel: string
  clueTitle: string
  clueInstruction: string
  clues: string[]
  correct: Copy
  incorrect: Copy
  invalid: Copy
}

export interface ReportTask extends TaskCommon {
  kind: 'report'
  /** Mockup 15's heading. */
  title: string
  fields: { label: string; value: string }[]
  evidenceTitle: string
  evidence: EvidenceSlot[]
  /** The task whose scans attach the evidence. */
  evidenceTaskId: TaskId
  cta: string
  /** The button on the evidence screen once both are attached (14c). */
  reviewCta: string
  sending: string
  /** What the monitor shows once the report is sent. */
  receipt: { reference: string; checklist: string[] }
  submitted: Copy
  missingEvidence: Copy
  alreadySubmitted: Copy
}

export interface GameTasks {
  L1T1: ScanTask
  L1T2: ScanTask
  L1T3: ScanTask
  L2T1: ScanTask
  L2T2: ChequeTask
  L2T3: HighlightTask
  L3T1: PhishingTask
  L3T2: StoryTask
  L3T3: PasskeyTask
  L3T4: ScanTask
  L3T5: ReportTask
}
export type TaskDef = GameTasks[TaskId]
export type TaskKind = TaskDef['kind']

export interface LevelDef {
  id: LevelId
  number: string
  title: string
  tasks: TaskId[]
  /** The step tracker in the header (mockups): three steps per level, each covering one or more tasks. */
  steps: { label: string; tasks: TaskId[] }[]
  /** The title as it breaks over two lines on the Case Board card (mockup 21). */
  boardLines: [string, string]
  complete: Copy
}

// ─── Content ─────────────────────────────────────────────────────────────────

const EVIDENCE_SLOTS: EvidenceSlot[] = [
  { artefactId: 'bank-statement', label: 'Bank statement' },
  { artefactId: 'phishing-message-card', label: 'Suspicious message' },
]

const KYC_SLOTS: EvidenceSlot[] = [
  { artefactId: 'pan-card', label: 'PAN card' },
  { artefactId: 'aadhaar-card', label: 'Aadhaar' },
]

const LOOKS_CORRECT = 'This looks right.'

/** Builds all game content from the case figures. Tests rebuild it with altered figures. */
export function buildGameContent(figures: CaseFigures = CASE_FIGURES) {
  const { account, cheque } = figures

  // Statement: amounts resolved, running balances and closing balance computed.
  const entries = figures.transactions.map((t) => ({
    ...t,
    amount: t.amount === CHEQUE_AMOUNT ? cheque.amountInFigures : t.amount,
    /** The cheque's own rows: the payment and its return (highlighted on 09). */
    isCheque: t.amount === CHEQUE_AMOUNT,
    suspicious: t.suspicious === true,
  }))
  const ledger = computeLedger(figures.openingBalance, entries)
  const rows = ledger.rows.map((row) => ({
    ...row,
    highlightFeedback: fillTemplate(row.highlightFeedback, { amount: formatRupees(row.amount) }),
  }))
  const suspiciousRows = rows.filter((row) => row.suspicious)
  if (suspiciousRows.length !== 1) throw new Error('The statement needs exactly one suspicious transaction')
  const suspicious = suspiciousRows[0]

  // Closing-balance answer cards: one correct, the rest common mistakes.
  const balanceCards = figures.balanceCards.map((card) => {
    if (card.kind === 'correct') return { id: card.id, amount: ledger.closingBalance, feedback: null }
    const values: Record<string, string> = { openingBalance: formatRupees(ledger.openingBalance) }
    let amount: number
    if (card.kind === 'fixed') {
      amount = card.amount
    } else {
      const row = rows.find((r) => r.id === card.transaction)
      if (!row) throw new Error(`Balance card ${card.id} refers to unknown transaction ${card.transaction}`)
      values.transactionAmount = formatRupees(row.amount)
      // Forgetting a row undoes its effect once; flipping its sign undoes it twice.
      amount = ledger.closingBalance - signedAmount(row) * (card.kind === 'flips' ? 2 : 1)
    }
    const feedback: Copy = {
      layout: { stampWidth: 340, ctaWidth: 321 },
      ...card.feedback,
      message: fillTemplate(card.feedback.message, values),
      ...(card.feedback.detail ? { detail: fillTemplate(card.feedback.detail, values) } : {}),
    }
    return { id: card.id, amount, feedback }
  })
  const correctCards = balanceCards.filter((card) => card.amount === ledger.closingBalance)
  if (correctCards.length !== 1) throw new Error('Exactly one closing-balance card must show the closing balance')
  if (new Set(balanceCards.map((card) => card.amount)).size !== balanceCards.length) {
    throw new Error('Every closing-balance card must show a different amount')
  }

  const passkey = derivePasskey({
    closingBalance: ledger.closingBalance,
    chequeAmountInFigures: cheque.amountInFigures,
    chequeAmountInWords: cheque.amountInWordsValue,
    suspiciousAmount: suspicious.amount,
  })

  const chequeWords = amountInWords(cheque.amountInWordsValue)
  const fill = (template: string) =>
    fillTemplate(template, {
      closingBalance: formatRupees(ledger.closingBalance),
      totalCredits: formatRupees(ledger.totalCredits),
      totalDebits: formatRupees(ledger.totalDebits),
      chequeFigures: formatRupees(cheque.amountInFigures),
      chequeWords,
      chequeWordsAmount: formatRupees(cheque.amountInWordsValue),
      chequeLastDigit: lastDigit(cheque.amountInFigures),
      payee: cheque.payee,
      drawerShortName: cheque.drawerShortName,
      suspiciousAmount: formatRupees(suspicious.amount),
      suspiciousLastDigit: lastDigit(suspicious.amount),
      withdrawalAttempt: formatRupees(figures.withdrawalAttempt),
    })

  const artefacts = Object.fromEntries(
    ARTEFACT_IDS.map((id) => {
      const { name, kind, printTask, cardLabel, detailLabel } = ARTEFACT_TABLE[id]
      const card = balanceCards.find((c) => c.id === id)
      const artefact: Artefact = {
        id,
        name,
        kind,
        printTask,
        cardLabel: cardLabel ?? name,
        detailLabel: detailLabel ?? cardLabel ?? name,
        qrUrl: artefactQrUrl(id),
        printFileName: printFileName(id, printTask),
        ...(card ? { printedAmount: card.amount } : {}),
      }
      return [id, artefact]
    }),
  ) as Record<ArtefactId, Artefact>

  const phishingMessage = {
    sender: 'CAMS TEL',
    time: 'Today · 9:14 AM',
    text: 'Your debit card has been blocked due to suspicious activity.',
    detail: 'To restore access immediately, click the link below to verify your account and unblock your debit card.',
    // No domain ending, so it can never open a real site (owner decision: one safe link everywhere).
    link: 'https://cams-tel-debit/unblock-card',
  }

  if (figures.simulatedLoss <= 0 || figures.simulatedLoss >= ledger.closingBalance) {
    throw new Error('The simulated phishing loss must be more than zero and less than the closing balance')
  }
  const balanceAfterLoss = ledger.closingBalance - figures.simulatedLoss
  if (figures.withdrawalAttempt <= ledger.closingBalance) {
    throw new Error("Ananya's withdrawal must be more than her balance: that's why it failed (mockup 06b)")
  }

  const tasks: GameTasks = {
    L1T1: {
      id: 'L1T1',
      level: 1,
      kind: 'scan',
      label: 'Account type',
      prompt: 'WHAT TYPE OF BANK ACCOUNT DOES ANANYA HAVE?',
      instruction: 'Scan the card in the file',
      hints: ['Think about an account a student would use to save pocket money and still take some out when needed.'],
      options: ['savings-account', 'current-account', 'fixed-deposit-account', 'recurring-deposit-account'],
      required: ['savings-account'],
      // Mockups 04a–04d.
      correct: {
        title: 'ACCOUNT IDENTIFIED',
        layout: { stampWidth: 470, ctaWidth: 294 },
        message: "YES, IT'S A SAVINGS ACCOUNT!",
        paragraphs: ['Ananya uses her account to keep her pocket money.', 'A savings account lets her:'],
        bullets: ['Put money in', 'Keep it safe', 'Take money out when needed'],
        cta: 'NEXT',
      },
      incorrect: {
        'current-account': {
          title: 'NOT QUITE',
          layout: { stampWidth: 370, ctaWidth: 321 },
          message: 'A CURRENT ACCOUNT IS USED WHEN...',
          paragraphs: [
            'You need to make frequent payments and receive money regularly, especially for a business.',
            'Ananya uses her account for pocket money, saving and occasional payments, not frequent business transactions.',
          ],
          cta: 'TRY AGAIN',
        },
        'fixed-deposit-account': {
          title: 'NOT QUITE',
          layout: { stampWidth: 370, ctaWidth: 321 },
          message: 'A FIXED DEPOSIT IS USED...',
          paragraphs: [
            'To keep your lump-sum money locked for a set period of time in exchange for an interest rate.',
            "Ananya needs to access her pocket money when she needs it, so a fixed deposit (FD) doesn't fit her situation.",
          ],
          cta: 'TRY AGAIN',
        },
        'recurring-deposit-account': {
          title: 'NOT QUITE',
          layout: { stampWidth: 370, ctaWidth: 321 },
          message: 'A RECURRING DEPOSIT IS USED WHEN...',
          paragraphs: [
            'You want to save a fixed amount regularly, every month, for a future goal.',
            'Ananya deposits money whenever she receives her pocket money, rather than putting in a fixed amount regularly.',
          ],
          cta: 'TRY AGAIN',
        },
      },
      neutral: {},
      notAnOption: { message: "That's from the case file, but it isn't an account type card. Look for the four account cards." },
    },

    L1T2: {
      id: 'L1T2',
      level: 1,
      kind: 'scan',
      label: 'Verify identity',
      prompt: 'WHICH DOCUMENTS CAN ANANYA USE TO VERIFY HER IDENTITY?',
      instruction:
        "KYC (Know Your Customer) is the process banks use to verify a customer's identity. Scan the documents Ananya likely used for her KYC.",
      hints: ['Look for official, valid identity documents issued by the government. Ananya needs two of them.'],
      options: ['expired-passport', 'library-card', 'pan-card', 'aadhaar-card'],
      required: KYC_SLOTS.map((slot) => slot.artefactId),
      // Completes on the second valid ID's own card (mockup 05d), with this button.
      correct: {
        title: 'IDENTITY VERIFIED',
        message: 'PAN and Aadhaar are official documents banks accept to check who a customer is.',
        cta: 'NEXT CLUE',
        layout: { ctaWidth: 411 },
      },
      // Mockups 05b–05e.
      incorrect: {
        'expired-passport': {
          title: 'NOT QUITE',
          layout: { stampWidth: 370, ctaWidth: 321 },
          message: 'Expired Passport — INVALID',
          paragraphs: [
            'The details match Ananya, but the passport is expired.',
            'Banks need a current, valid document for identity verification.',
          ],
          cta: 'TRY AGAIN',
        },
        'library-card': {
          title: 'NOT QUITE',
          layout: { stampWidth: 370, ctaWidth: 321 },
          message: 'Library Card: Invalid',
          paragraphs: [
            'The bank needs reliable identity details such as her name and date of birth.',
            "Hence it doesn't provide enough information to verify her identity for Ananya's bank account.",
          ],
          cta: 'TRY AGAIN',
        },
      },
      neutral: {},
      notAnOption: { message: "That's from the case file, but it isn't an identity document. Look for the ID cards." },
      collect: {
        slots: KYC_SLOTS,
        accepted: {
          'pan-card': {
            title: 'VALID',
            layout: { stampWidth: 301, ctaWidth: 355 },
            message: 'PAN Card: Valid',
            paragraphs: [
              "The name and date of birth match Ananya's account details.",
              'Banks accept a PAN card for KYC.',
            ],
            cta: 'SCAN NEXT',
          },
          'aadhaar-card': {
            title: 'VALID',
            layout: { stampWidth: 301, ctaWidth: 355 },
            message: 'Aadhaar Card: Valid',
            paragraphs: [
              "The name and date of birth match Ananya's account details.",
              'Banks accept Aadhaar for KYC.',
            ],
            cta: 'SCAN NEXT',
          },
        },
        already: { message: 'Already verified' },
        completion: 'last-card',
      },
    },

    L1T3: {
      id: 'L1T3',
      level: 1,
      kind: 'scan',
      label: 'Withdrawal slip',
      // Mockup 06: the story line above the question.
      intro: fill('Ananya went to the bank to withdraw {withdrawalAttempt}.'),
      prompt: 'Which slip would she need to take the money out?',
      instruction: "Scan a slip in Ananya's case file.",
      hints: ['Ananya wants to take money OUT of her account.'],
      options: ['deposit-slip', 'withdrawal-slip'],
      required: ['withdrawal-slip'],
      // Mockups 06b, 06c.
      correct: {
        title: 'CORRECT',
        layout: { stampWidth: 285, ctaWidth: 426 },
        message: 'Yes, a withdrawal slip is used to\ntake money OUT of a bank account.',
        paragraphs: [
          "But Ananya couldn't withdraw the money\nsince her balance was too low.",
          'Why was her balance lower than expected?',
        ],
        cta: 'CHECK BALANCE',
      },
      incorrect: {
        'deposit-slip': {
          title: 'NOT QUITE',
          layout: { stampWidth: 299, ctaWidth: 449 },
          message: 'A deposit slip is used to\nput money IN a bank account.',
          paragraphs: [
            'If Ananya wanted to put money into her\naccount using a cheque/cash, she would use\na deposit slip and submit the cheque/cash with it.',
            fill('But Ananya wants to take {withdrawalAttempt} OUT.\nScan the other slip.'),
          ],
          cta: 'SCAN OTHER SLIP',
        },
      },
      neutral: {},
      notAnOption: { message: "That's from the case file, but it isn't one of the bank slips." },
    },

    L2T1: {
      id: 'L2T1',
      level: 2,
      kind: 'scan',
      label: 'Closing balance',
      // Mockup 08.
      prompt: 'How Much Money is\nin Ananya’s Account?',
      instruction: 'Check the bank statement and calculate Ananya’s balance.\nScan the card with your answer.',
      /** Mockup 08 prints running balances for the first rows only; the rest are left for the player. */
      statementBalancesShown: 7,
      hints: [
        'Start with the opening balance. Add every credit (money in) and subtract every debit (money out).',
        "Go down the statement one row at a time and don't skip any, not even the returned cheque or payments Ananya doesn't remember.",
        fill('Total credits: {totalCredits}. Total debits: {totalDebits}. Opening balance + credits − debits = closing balance.'),
      ],
      options: balanceCards.map((card) => card.id),
      required: [correctCards[0].id],
      // Mockup 08c.
      correct: {
        title: 'CORRECT',
        message: 'Great job! You read the statement and\nworked out the balance.',
        detail: fill(
          'A bank statement keeps a record of the money moving in and out of an account over a period of time.\nNow, let’s see if everything on Ananya’s statement matches what she actually did.',
        ),
        cta: 'NEXT CLUE',
        layout: { stampWidth: 300, ctaWidth: 366 },
      },
      incorrect: Object.fromEntries(balanceCards.flatMap((card) => (card.feedback ? [[card.id, card.feedback]] : []))),
      neutral: {},
      notAnOption: { message: "That's from the case file, but it isn't a closing-balance card." },
    },

    L2T2: {
      id: 'L2T2',
      level: 2,
      kind: 'cheque',
      label: 'Returned cheque',
      // Mockups 09–09f.
      prompt: 'CAN YOU SPOT WHAT’S WRONG IN HER CHEQUE?',
      instruction: 'Tap on the area you think is wrong.',
      hints: [],
      clue: {
        heading: 'WAIT… LOOK AT THIS.',
        paragraphs: [
          fill('The same cheque number appears twice in Ananya’s statement. **{chequeFigures} went OUT.**\n**Then {chequeFigures} came BACK IN.**'),
        ],
        question: 'Why did the cheque bounce?',
        cta: 'CHECK CHEQUE',
      },
      // Each "looks right" card breaks its lines where 09c, 09d and 09f do.
      areas: [
        { id: 'bank', label: 'Bank name and branch', isDiscrepancy: false, feedback: { message: `The bank name and branch are printed by the bank.\n${LOOKS_CORRECT}`, cta: 'TRY AGAIN' } },
        { id: 'date', label: 'Date', isDiscrepancy: false, feedback: { message: `The date is valid and matches the transaction.\n${LOOKS_CORRECT}`, cta: 'TRY AGAIN' } },
        { id: 'payee', label: 'Pay', isDiscrepancy: false, feedback: { message: fill(`The payee name is correctly written\nas {payee}. ${LOOKS_CORRECT}`), cta: 'TRY AGAIN' } },
        { id: 'amount-words', label: 'Amount in words', isDiscrepancy: true },
        { id: 'amount-figures', label: 'Amount in figures', isDiscrepancy: true },
        { id: 'account-number', label: 'Account number', isDiscrepancy: false, feedback: { message: `The account number is printed by the bank.\n${LOOKS_CORRECT}`, cta: 'TRY AGAIN' } },
        { id: 'signature', label: 'Signature', isDiscrepancy: false, feedback: { message: fill(`The signature matches {drawerShortName}’s bank records.\n${LOOKS_CORRECT}`), cta: 'TRY AGAIN' } },
        { id: 'cheque-number', label: 'Cheque number', isDiscrepancy: false, feedback: { message: `The cheque number matches the one on the statement.\n${LOOKS_CORRECT}`, cta: 'TRY AGAIN' } },
      ],
      correct: {
        title: 'You spotted it:',
        message: "The amounts don't match.",
        cta: 'BANK STATEMENT',
        detail: fill(
          "The cheque says {chequeFigures} in numbers but {chequeWordsAmount} in words. The amounts don't match, so the bank returned the cheque. But that still doesn't explain Ananya's missing money.",
        ),
      },
    },

    L2T3: {
      id: 'L2T3',
      level: 2,
      kind: 'highlight',
      label: 'Suspicious transaction',
      // Mockups 10–10j.
      prompt: 'Something in the statement doesn’t match\nAnanya’s week. Can you find it?',
      instruction: 'Highlight the transaction Ananya doesn’t\nremember making. Drag the highlighter over it.',
      hints: [],
      correct: { title: 'CLUE FOUND', message: suspicious.highlightFeedback, cta: 'INVESTIGATE' },
    },

    L3T1: {
      id: 'L3T1',
      level: 3,
      kind: 'phishing',
      label: 'Spot the phish',
      prompt: 'Should Ananya tap the link in the notification?',
      instruction: 'Decide what Ananya should do.',
      hints: [],
      // Mockups 11, 11b.
      call: {
        caller: 'Ananya',
        steps: [
          { mood: 'worried', signal: 'ok', status: 'Connected', text: "Hello! It's me, Ananya!\nMy debit card has been blocked" },
          {
            mood: 'worried',
            signal: 'ok',
            status: 'Connected',
            text: 'I just got a message saying I\ncan unblock it immediately by\nclicking a link.',
          },
        ],
      },
      choices: [
        { id: 'yes', label: 'YES' },
        { id: 'no', label: 'NO' },
      ],
      // Mockup 11f (the file named "yes-chosen" shows the NO outcome).
      safe: {
        title: 'GOOD CALL',
        message: 'You did the right thing by refusing to\nclick the suspicious link!',
        detail: 'Good job contacting the bank to help',
        cta: 'SECURE',
      },
      // Mockup 14 (the YES path's fake page).
      fakeSite: {
        title: phishingMessage.sender,
        subtitle: 'Tele Services',
        urgency: 'URGENT ACTION REQUIRED',
        message: 'Your debit card has been blocked due to suspicious activity\non your account.',
        simulationNote: 'SIMULATION: This is a pretend website. Nothing here is real.',
        fields: [
          { id: 'card-number', label: 'Debit card number', autofill: 'XXXX-XXXX-XXXX-0000' },
          { id: 'cvv', label: 'CVV', autofill: '000' },
          { id: 'otp', label: 'OTP (one-time password)', autofill: '000000' },
        ],
        back: 'GO BACK',
        submit: 'UNBLOCK CARD',
        incomplete: { message: 'The fake page wants every box filled in. Tap each one to see what scammers try to collect.' },
      },
      // Mockup 11d (the file named "no-correct" shows the YES outcome).
      consequence: {
        title: 'Uh Huh',
        message: 'By clicking the link and sharing the OTP,\nyou may have given the scammer access.',
        detail: 'Ananya’s account has been compromised!\nReport Immediately',
        cta: 'TRY AGAIN',
        alert: {
          sender: account.bankName.toUpperCase(),
          text: `Dear Customer, ${formatRupees(figures.simulatedLoss)} was withdrawn from a/c no. XXXX${account.maskedNumber.slice(-4)}.\nAvailable balance is ${formatRupees(balanceAfterLoss)}.`,
        },
      },
    },

    L3T2: {
      id: 'L3T2',
      level: 3,
      kind: 'story',
      label: 'Uncover the scam',
      prompt: 'THE CAMS TEL CONNECTION',
      instruction: 'Connect the clues.',
      hints: [],
      // Mockups 15, 15b, 12c.
      reveal: {
        heading: 'WAIT... LOOK AT THE NAME!',
        question: ['CAM Service Tel', 'could this be?'],
        name: phishingMessage.sender,
        unscrambled: 'SCAM TEL',
        newspaper: {
          masthead: 'THE DAILY CHRONICLE',
          date: '12 OCT 2026',
          headline: '“SCAM TEL” MASQUERADES\nAS CAM SERVICE TEL',
          body: 'Fraudsters are impersonating the company\nname CAMS TEL to make fake messages\nabout blocked debit cards appear genuine.\nCustomers are tricked into clicking\nsuspicious links and sharing OTPs and\nsensitive banking information.',
        },
      },
      beats: [
        fill('Remember the {suspiciousAmount} "mobile recharge" on Ananya\'s statement? It was paid to CAMS TEL.'),
        `Now look at the message offering to unblock her debit card. Who sent it? ${phishingMessage.sender}.`,
        "The same name turns up in both clues. CAMS TEL doesn't look like a real phone company. It looks like a scam operation that tricks people into handing over their card details.",
        "Nothing is proven yet, Officer, but these clues are strong enough to report.",
      ],
      cta: 'REPORT IT',
      correct: {
        title: 'SCAM UNCOVERED',
        message: 'You linked the CAMS TEL payment to the CAMS TEL message. That connection is the key to this case.',
      },
    },

    L3T3: {
      id: 'L3T3',
      level: 3,
      kind: 'passkey',
      label: 'Unlock evidence',
      prompt: 'EVIDENCE FILE LOCKED',
      instruction: 'Enter the three-digit passkey to unlock the evidence file.',
      // Mockup 13 (its hint line, with the punctuation tidied).
      screenTitle: 'ENTER PASSKEY',
      screenHint: 'Find the last digit of each answer, in the order given, to unlock the case file.\nCLOSING BALANCE ; CHEQUE AMOUNT ; SUSPICIOUS TRANSACTION',
      lockedLabel: 'LOCKED',
      clueTitle: 'THREE CLUES HOLD THE PASSKEY',
      clueInstruction: 'Enter the last digit of each value, in this order:',
      clues: ['The closing balance.', 'The amount on the cheque.', 'The suspicious transaction.'],
      hints: [
        'Check the order: the closing balance first, then the cheque, then the suspicious transaction.',
        'Use only the LAST digit of each amount. For example, ₹1,234 gives 4.',
        fill('The suspicious CAMS TEL transaction was {suspiciousAmount}, so its last digit is {suspiciousLastDigit}.'),
        fill('The cheque amount ends in {chequeLastDigit}, in figures and in words. Now find the last digit of the closing balance.'),
      ],
      correct: {
        title: 'EVIDENCE FILE UNLOCKED',
        message: 'You connected the key clues: the closing balance, the cheque and the suspicious transaction.',
      },
      incorrect: { title: 'ACCESS DENIED', message: "That passkey didn't work. Try again." },
      invalid: { message: 'The passkey has three digits.' },
    },

    L3T4: {
      id: 'L3T4',
      level: 3,
      kind: 'scan',
      label: 'Scan evidence',
      // Mockups 14, 14c.
      prompt: 'SCAN EVIDENCE',
      instruction: 'Scan the evidence that supports Ananya’s case from the file.',
      hints: [],
      options: ['bank-statement', 'phishing-message-card', 'cheque'],
      required: EVIDENCE_SLOTS.map((slot) => slot.artefactId),
      correct: {
        title: 'EVIDENCE COMPLETE',
        message: 'Both pieces of evidence are attached. Time to review the incident report.',
      },
      incorrect: {},
      neutral: {
        cheque: {
          title: 'NOT NEEDED',
          message:
            "The cheque isn't needed for this report. You've already found out why it was returned. Look for evidence about the CAMS TEL transaction.",
        },
      },
      notAnOption: { message: "That's from the case file, but it isn't evidence for this report." },
      collect: {
        slots: EVIDENCE_SLOTS,
        accepted: {
          'bank-statement': {
            title: 'EVIDENCE ATTACHED',
            message: "Bank statement attached. It shows the CAMS TEL transaction Ananya doesn't recognise.",
          },
          'phishing-message-card': {
            title: 'EVIDENCE ATTACHED',
            message: "Suspicious message attached: the link claiming to unblock Ananya's debit card.",
          },
        },
        already: { message: 'Already attached' },
      },
    },

    L3T5: {
      id: 'L3T5',
      level: 3,
      kind: 'report',
      label: 'Submit report',
      prompt: 'REVIEW INCIDENT REPORT',
      instruction: 'Check that both pieces of evidence are attached before submitting.',
      hints: [],
      // Mockup 15. Dates and account follow the statement, not the mockup (review note 3).
      title: 'INCIDENT REPORT',
      fields: [
        { label: 'Customer', value: account.holder },
        { label: 'Account Number', value: `XXXX ${account.maskedNumber.slice(-4)}` },
        { label: 'Transaction Date', value: formatStatementDate(suspicious.date) },
        { label: 'Transaction', value: `${formatRupees(suspicious.amount)} — ${phishingMessage.sender}` },
        { label: 'Concern', value: `Suspected fraud: ${phishingMessage.sender}` },
      ],
      // Mockup 14c: what each piece of evidence shows.
      evidenceTitle: 'EVIDENCE ATTACHED',
      evidence: [
        { artefactId: 'bank-statement', label: 'Bank statement', detail: 'Unrecognised CAMS TEL\ntransaction' },
        { artefactId: 'phishing-message-card', label: 'Suspicious Link', detail: 'Link claiming to unblock\ndebit card' },
      ],
      evidenceTaskId: 'L3T4',
      cta: 'SUBMIT REPORT',
      /** Shown on the progress bar while the report sends. */
      sending: 'SENDING REPORT TO FRAUD TEAM…',
      reviewCta: 'REVIEW INCIDENT REPORT',
      submitted: {
        title: 'REPORT SENT',
        message: "Your incident report is with the bank's fraud team for investigation.",
        detail: "They'll look into the suspected fraud and keep Ananya updated.",
        cta: 'VIEW CERTIFICATE',
      },
      // The confirmation on the monitor after sending (not in 15).
      receipt: {
        reference: `Case reference: NB-${account.maskedNumber.slice(-4)}-${suspicious.date.slice(5).replace('-', '')}`,
        checklist: ['Bank statement attached', 'Suspicious link attached', 'Ananya will be kept updated'],
      },
      missingEvidence: { message: 'Check that both pieces of evidence are attached before submitting.' },
      alreadySubmitted: { message: 'This report has already been submitted for investigation.' },
    },
  }

  const levels: LevelDef[] = [
    {
      id: 1,
      number: '01',
      title: 'Understand the Account',
      boardLines: ['UNDERSTAND', 'THE ACCOUNT'],
      tasks: ['L1T1', 'L1T2', 'L1T3'],
      steps: [
        { label: 'Account', tasks: ['L1T1'] },
        { label: 'KYC', tasks: ['L1T2'] },
        { label: 'Bank Records', tasks: ['L1T3'] },
      ],
      // Mockup 07.
      complete: {
        title: 'LEVEL 1 COMPLETE',
        message: 'Ananya reported something strange about her transactions. Her case file contains two important clues.',
        detail: 'Look at both the documents carefully.',
        cta: 'OPEN DOCS FILE',
      },
    },
    {
      id: 2,
      number: '02',
      title: 'Follow the Money',
      boardLines: ['FOLLOW', 'THE MONEY'],
      tasks: ['L2T1', 'L2T2', 'L2T3'],
      steps: [
        { label: 'Bank Balance', tasks: ['L2T1'] },
        { label: 'Cheque', tasks: ['L2T2'] },
        { label: 'Transactions', tasks: ['L2T3'] },
      ],
      complete: {
        title: 'LEVEL 2 COMPLETE',
        message:
          'You followed the money: you worked out the closing balance, found out why the cheque was returned and spotted a suspicious transaction.',
      },
    },
    {
      id: 3,
      number: '03',
      title: 'Secure & Report',
      boardLines: ['SECURE &', 'REPORT'],
      tasks: ['L3T1', 'L3T2', 'L3T3', 'L3T4', 'L3T5'],
      steps: [
        { label: 'Phishing', tasks: ['L3T1'] },
        { label: 'Uncover', tasks: ['L3T2'] },
        { label: 'Report', tasks: ['L3T3', 'L3T4', 'L3T5'] },
      ],
      complete: {
        title: 'LEVEL 3 COMPLETE',
        message: 'You stayed safe from the phishing link, uncovered the CAMS TEL connection and reported the suspected fraud.',
      },
    },
  ]

  return {
    domain: GAME_DOMAIN,
    artefacts,
    levels,
    tasks,
    /** The answer to Level 3, Task 3. Derived, never typed in. */
    passkey,

    statement: {
      bankName: account.bankName,
      branch: account.branch,
      accountHolder: account.holder,
      accountType: account.type,
      maskedAccountNumber: account.maskedNumber,
      period: figures.statementPeriod,
      openingBalance: ledger.openingBalance,
      /** Each row carries its running balance. Level 2, Task 1 must not show the final one before it's solved. */
      rows,
      totalCredits: ledger.totalCredits,
      totalDebits: ledger.totalDebits,
      closingBalance: ledger.closingBalance,
    },

    cheque: {
      ...cheque,
      amountInWords: `${chequeWords} Rupees Only`,
    },

    phishingMessage,

    start: {
      title: 'SAVE THE SAVINGS ACCOUNT',
      /** How the title breaks on the start screen (mockup 01). */
      titleLines: ['SAVE THE', 'SAVINGS ACCOUNT'],
      /** For screen readers; the badge on the desk says it visually. */
      intro: 'Welcome, Junior Bank Officer. Your first case is waiting.',
      cta: 'START TRAINING',
      resumeCta: 'RESUME CASE',
    },

    /** Ananya's first call (mockups 02–02e). Each step plays after the one before; \n is a forced line break. */
    openingCall: {
      caller: 'Ananya',
      incomingTitle: 'INCOMING CALL..',
      accept: 'ACCEPT',
      steps: [
        {
          mood: 'talking',
          signal: 'ok',
          status: 'Connected',
          text: 'Helloo? My name is Ananya...\nSomething is wrong with my bank account.',
        },
        {
          mood: 'worried',
          signal: 'weak',
          status: 'Connected',
          text: 'I think someone is trying to steal my pocket money....',
          hint: 'Take note of clues',
        },
        { mood: 'worried', signal: 'lost', status: 'Connecting..', text: '... I was checking my account and then-' },
      ] satisfies CallStep[],
      disconnected: 'CONNECTION LOST',
      /** Alternative text for the portraits. */
      portraitAlt: 'Ananya',
    },

    caseAssigned: {
      title: 'NEW CASE ASSIGNED',
      message: 'Ananya needs your help.\nHer case file has everything you need to start investigating.',
      nextStep: "Identify Ananya's account type.",
      cta: 'OPEN CASE FILE',
      caseFileAlt: "Ananya's case file, marked confidential",
    },

    caseBoard: {
      title: 'CASE BOARD',
      /** Stamped on a solved level's card. */
      solved: 'SOLVED',
      /** Shown over a level's card as it unlocks (the transition between levels). */
      unlocked: 'UNLOCKED',
      statusLabels: { locked: 'LOCKED', available: 'AVAILABLE', 'in-progress': 'IN PROGRESS', completed: 'COMPLETED' },
    },

    certificate: {
      title: 'MISSION COMPLETE!',
      // Mockup 16 (line breaks as drawn).
      headline: 'GOOD JOB, OFFICER!',
      notified: 'Ananya has been notified about the report.\nYou didn’t just help Ananya take action to\nprotect her account.',
      message: 'You also learned how a savings account works,\nhow to track money coming in and going out,\nand how to keep your money safe.',
      award: 'Junior Bank Officer',
      caseBoardCta: 'BACK TO CASE BOARD',
      replayCta: 'REPLAY MISSION',
    },

    scanner: {
      holdHint: 'Hold the card up to the scanner',
      unknownQr: { title: 'HMM…', message: "That's not part of the case file, Officer." } satisfies Copy,
      startingMessage: 'Starting the scanner…',
      fallbackTitle: 'SCANNER UNAVAILABLE',
      fallbackMessage: "The camera isn't available, so tap the card on the screen instead.",
      deniedTitle: 'SCANNER BLOCKED',
      deniedMessage:
        "The camera wasn't allowed, so tap the card on the screen instead. To scan cards, allow the camera in your browser settings, then try again.",
      errorTitle: 'SCANNER STOPPED',
      errorMessage: 'Something went wrong with the camera. Try again, or tap the card on the screen.',
      retryCta: 'TRY AGAIN',
    },

    /** The page a normal phone camera opens from a printed QR code. */
    phoneLanding: {
      title: 'SAVE THE SAVINGS ACCOUNT',
      message: 'This card is part of a financial literacy game. Scan it from inside the game to use it in your investigation.',
      cardLabel: 'This card',
    },

    /** Labels shared across screens. */
    ui: {
      continue: 'CONTINUE',
      tryAgain: 'TRY AGAIN',
      ok: 'OK',
      next: 'NEXT TASK',
      back: 'BACK',
      soundOn: 'Turn sound on',
      soundOff: 'Turn sound off',
      caseBoard: 'CASE BOARD',
      resume: 'RESUME CASE',
      viewCertificate: 'VIEW CERTIFICATE',
      hint: 'HINT',
      level: 'LEVEL',
      revisiting: "You've solved this one. Look around as much as you like; your progress is saved.",
      taskStatus: { completed: 'Completed', current: 'Current task', locked: 'Locked' },
      slotWaiting: 'Waiting for scan',
      slotDone: 'Scanned',
      /** "Level 1: Understand the Account" in the header. */
      levelHeading: 'Level',
      statement: {
        title: 'BANK STATEMENT',
        period: 'Statement period',
        date: 'Date',
        description: 'Description',
        credit: 'Credit',
        debit: 'Debit',
        balance: 'Balance',
        openingBalance: 'Opening balance',
        closingBalance: 'Closing balance',
        unknown: '?',
        /** The printed bank statement (mockup 08). */
        printed: {
          subtitle: 'SAVINGS ACCOUNT STATEMENT',
          holder: 'ACCOUNT HOLDER',
          number: 'ACCOUNT NUMBER',
          type: 'ACCOUNT TYPE',
          period: 'STATEMENT PERIOD',
          opening: 'OPENING BALANCE',
          credits: 'TOTAL CREDITS',
          debits: 'TOTAL DEBITS',
          closing: 'CLOSING BALANCE',
          date: 'DATE',
          description: 'DESCRIPTION',
          type_: 'TYPE',
          amount: 'AMOUNT (₹)',
          balance: 'BALANCE (₹)',
          openingRow: 'Opening Balance',
          credit: 'Credit',
          debit: 'Debit',
          none: '--',
        },
      },
      /** The closing-balance answer cards (mockups 08b–08e). */
      balanceCard: 'CLOSING BALANCE',
      cheque: {
        chequeNumber: 'Cheque No.',
        accountNumber: 'A/c No.',
        // Printed on the cheque (09b).
        ifsc: 'IFSC:',
        validity: 'Valid for three months only',
        date: 'DATE',
        pay: 'PAY',
        bearer: 'OR BEARER',
        rupees: 'RUPEES',
        signHere: 'Please sign above',
      },
      highlighter: {
        label: 'HIGHLIGHTER',
        hint: 'Drag the highlighter onto a transaction',
        // 10, 10b–10j.
        dragMe: 'Drag me over\nthe transaction',
        notSuspicious: 'NOT SUSPICIOUS:',
        suspicious: 'SUSPICIOUS:',
        account: `${account.holder.split(' ')[0].toUpperCase()}’S ACCOUNT`,
        period: 'STATEMENT PERIOD',
      },
      clue: 'CLUE',
      passkey: { enter: 'ENTER', clear: 'CLEAR', unlocked: 'UNLOCKED' },
      certificateAwarded: 'AWARDED THE RANK OF',
    },
  }
}

export type GameContent = ReturnType<typeof buildGameContent>

/** The game's content, built from CASE_FIGURES. */
export const GAME: GameContent = buildGameContent()
