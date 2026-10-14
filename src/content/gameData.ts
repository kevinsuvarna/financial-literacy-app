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

function wordsBelowThousand(n: number): string {
  const hundreds = Math.floor(n / 100)
  const rest = n % 100
  return [hundreds ? `${ONES[hundreds]} Hundred` : '', rest ? wordsBelowHundred(rest) : '']
    .filter(Boolean)
    .join(' ')
}

/** Whole rupees in words, Indian numbering: 1225 → "One Thousand Two Hundred Twenty-Five". */
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
  if (amount % 1000) words.push(wordsBelowThousand(amount % 1000))
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
  /** Label printed on the card and used in the simulated-scan list. */
  name: string
  kind: ArtefactKind
  /** The task whose screen this card is scanned on; it groups the print files. */
  printTask: TaskId
  qrUrl: string
  printFileName: string
  /** Closing-balance cards only: the amount printed on the card. */
  printedAmount?: number
}

const ARTEFACT_TABLE: Record<ArtefactId, { name: string; kind: ArtefactKind; printTask: TaskId }> = {
  'savings-account': { name: 'Savings Account', kind: 'account-type', printTask: 'L1T1' },
  'current-account': { name: 'Current Account', kind: 'account-type', printTask: 'L1T1' },
  'fixed-deposit-account': { name: 'Fixed Deposit Account', kind: 'account-type', printTask: 'L1T1' },
  'recurring-deposit-account': { name: 'Recurring Deposit Account', kind: 'account-type', printTask: 'L1T1' },
  'expired-passport': { name: 'Passport (expired)', kind: 'identity-document', printTask: 'L1T2' },
  'library-card': { name: 'Library card', kind: 'identity-document', printTask: 'L1T2' },
  'pan-card': { name: 'PAN card', kind: 'identity-document', printTask: 'L1T2' },
  'aadhaar-card': { name: 'Aadhaar card', kind: 'identity-document', printTask: 'L1T2' },
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
  /** Feedback when the highlighter lands on this row (Level 2, Task 3). {amount} is this row's amount. */
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
  accountNumber: string
  amountInFigures: number
  /** The (different) amount written in words. Must end in the same digit as the figures (spec 5, Task 2). */
  amountInWordsValue: number
}

export interface BalanceCardFigure {
  id: BalanceCardId
  /**
   * The transaction this card "forgets": a common mistake whose amount is derived from the
   * statement. Omit it on the one correct card, which always shows the computed closing balance.
   */
  omits?: string
  /** Wrong-card feedback. {omittedAmount} is the forgotten transaction's amount. */
  feedback?: string
}

export interface CaseFigures {
  account: { holder: string; type: string; maskedNumber: string; bankName: string; branch: string }
  statementPeriod: { from: string; to: string }
  openingBalance: number
  transactions: CaseTransaction[]
  cheque: ChequeFigures
  /** 3–4 cards, exactly one correct (spec 2). */
  balanceCards: BalanceCardFigure[]
}

export const CASE_FIGURES: CaseFigures = {
  account: {
    holder: 'Ananya Sharma',
    type: 'Savings Account',
    maskedNumber: 'XXXXXX4417', // PLACEHOLDER
    bankName: 'Banyan Tree Bank', // PLACEHOLDER (fictional)
    branch: 'Lakeview Branch', // PLACEHOLDER (fictional)
  },
  statementPeriod: { from: '2026-09-01', to: '2026-09-30' }, // PLACEHOLDER
  openingBalance: 8240, // PLACEHOLDER
  transactions: [
    {
      id: 'pocket-money',
      date: '2026-09-03',
      description: 'Pocket money: UPI from Rakesh Sharma',
      direction: 'credit',
      amount: 1500, // PLACEHOLDER
      highlightFeedback: '{amount} of pocket money from Papa: money coming in. Ananya was expecting this one. Keep looking.',
    },
    {
      id: 'cash-withdrawal',
      date: '2026-09-07',
      description: 'Cash withdrawal: withdrawal slip at branch',
      direction: 'debit',
      amount: 600, // PLACEHOLDER
      highlightFeedback: 'Ananya took out {amount} herself using a withdrawal slip. Nothing unusual here.',
    },
    {
      id: 'cheque-deposit',
      date: '2026-09-10',
      description: 'Cheque deposit: Chq No. 004517',
      direction: 'credit',
      amount: CHEQUE_AMOUNT,
      highlightFeedback: "Dadi's birthday cheque for {amount}. You've already investigated this cheque.",
    },
    {
      id: 'cheque-returned',
      date: '2026-09-12',
      description: 'Cheque returned: Chq No. 004517',
      direction: 'debit',
      amount: CHEQUE_AMOUNT,
      highlightFeedback: 'The cheque was returned, so the {amount} was taken back out. You already know why.',
    },
    {
      id: 'book-fair',
      date: '2026-09-15',
      description: 'School book fair: debit card',
      direction: 'debit',
      amount: 450, // PLACEHOLDER
      highlightFeedback: 'Ananya spent {amount} at the school book fair. She remembers buying those books.',
    },
    {
      id: 'birthday-gift',
      date: '2026-09-18',
      description: 'Birthday gift: UPI from Meera Iyer',
      direction: 'credit',
      amount: 2000, // PLACEHOLDER
      highlightFeedback: 'A {amount} birthday gift from Meera Aunty: money coming in. This looks normal.',
    },
    {
      id: 'cams-tel',
      date: '2026-09-22', // PLACEHOLDER
      description: 'Mobile recharge: CAMS TEL',
      direction: 'debit',
      amount: 5999, // fixed by spec 5, Task 3
      suspicious: true,
      highlightFeedback:
        "Ananya doesn't remember making this {amount} \"mobile recharge\" to CAMS TEL, and it's far bigger than anything else she spends. That doesn't prove it's fraud, but it's a clue worth investigating.",
    },
  ],
  cheque: {
    number: '004517', // PLACEHOLDER
    date: '2026-09-08', // PLACEHOLDER
    payee: 'Ananya Sharma',
    drawer: 'Kamla Sharma', // PLACEHOLDER
    drawerShortName: 'Dadi',
    bankName: 'Banyan Tree Bank', // PLACEHOLDER
    branch: 'Lakeview Branch', // PLACEHOLDER
    accountNumber: 'XXXXXX2093', // PLACEHOLDER
    amountInFigures: 1525, // PLACEHOLDER
    amountInWordsValue: 1225, // PLACEHOLDER: differs from the figures but ends in the same digit
  },
  balanceCards: [
    {
      id: 'balance-card-a',
      omits: 'cash-withdrawal',
      feedback:
        'Close! But this amount forgets the {omittedAmount} cash withdrawal. Money Ananya took out with a withdrawal slip lowers her balance too.',
    },
    {
      id: 'balance-card-b',
      omits: 'cams-tel',
      feedback:
        "This amount leaves out the {omittedAmount} payment to CAMS TEL. Even if Ananya doesn't remember it, that money still left her account.",
    },
    { id: 'balance-card-c' },
    {
      id: 'balance-card-d',
      omits: 'cheque-returned',
      feedback:
        'This amount counts the cheque deposit but forgets that the cheque was returned. When a cheque is returned, its {omittedAmount} is taken back out.',
    },
  ],
}

// ─── Content types ───────────────────────────────────────────────────────────

export interface Copy {
  title?: string
  message: string
  /** Extra explanation shown under the message. */
  detail?: string
}

export interface CallLine {
  speaker: string
  text: string
}

export type PhishingChoice = 'no' | 'yes'
export type FakeFieldId = 'card-number' | 'expiry' | 'cvv' | 'otp'
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
  /** Cards on the table for this task; also the simulated-scan list. */
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
  }
}

/** A tappable area of the cheque. Discrepancy areas complete the task with the task's `correct` copy. */
export type ChequeArea =
  | { id: ChequeAreaId; label: string; isDiscrepancy: true }
  | { id: ChequeAreaId; label: string; isDiscrepancy: false; feedback: Copy }

export interface ChequeTask extends TaskCommon {
  kind: 'cheque'
  areas: ChequeArea[]
  correct: Copy
}

export interface HighlightTask extends TaskCommon {
  kind: 'highlight'
  correct: Copy
}

export interface PhishingTask extends TaskCommon {
  kind: 'phishing'
  call: { caller: string; lines: CallLine[] }
  choices: { id: PhishingChoice; label: string }[]
  /** Chose NO. */
  safe: Copy
  fakeSite: {
    title: string
    urgency: string
    simulationNote: string
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
  beats: string[]
  cta: string
  correct: Copy
}

export interface PasskeyTask extends TaskCommon {
  kind: 'passkey'
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
  fields: { label: string; value: string }[]
  evidenceTitle: string
  evidence: EvidenceSlot[]
  /** The task whose scans attach the evidence. */
  evidenceTaskId: TaskId
  cta: string
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

const LOOKS_CORRECT = 'This detail looks correct. Keep investigating.'

/** Builds all game content from the case figures. Tests rebuild it with altered figures. */
export function buildGameContent(figures: CaseFigures = CASE_FIGURES) {
  const { account, cheque } = figures

  // Statement: amounts resolved, running balances and closing balance computed.
  const entries = figures.transactions.map((t) => ({
    ...t,
    amount: t.amount === CHEQUE_AMOUNT ? cheque.amountInFigures : t.amount,
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

  // Closing-balance answer cards: one correct, the rest derived from common mistakes.
  const balanceCards = figures.balanceCards.map((card) => {
    if (!card.omits) return { id: card.id, amount: ledger.closingBalance, feedback: null }
    const omitted = rows.find((row) => row.id === card.omits)
    if (!omitted || !card.feedback) throw new Error(`Balance card ${card.id} needs a valid transaction and feedback`)
    return {
      id: card.id,
      amount: ledger.closingBalance - signedAmount(omitted),
      feedback: fillTemplate(card.feedback, { omittedAmount: formatRupees(omitted.amount) }),
    }
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
    })

  const artefacts = Object.fromEntries(
    ARTEFACT_IDS.map((id) => {
      const { name, kind, printTask } = ARTEFACT_TABLE[id]
      const card = balanceCards.find((c) => c.id === id)
      const artefact: Artefact = {
        id,
        name,
        kind,
        printTask,
        qrUrl: artefactQrUrl(id),
        printFileName: printFileName(id, printTask),
        ...(card ? { printedAmount: card.amount } : {}),
      }
      return [id, artefact]
    }),
  ) as Record<ArtefactId, Artefact>

  const phishingMessage = {
    sender: 'CAMS TEL',
    text: 'URGENT: Your debit card has been BLOCKED. Tap the link within 10 minutes to unblock it, or your account will be closed.',
    signOff: 'CAMS TEL Card Services',
    // Reserved .example domain: it can never resolve to a real site.
    link: 'http://camstel-unblock.example/verify',
  }

  const tasks: GameTasks = {
    L1T1: {
      id: 'L1T1',
      level: 1,
      kind: 'scan',
      label: 'Account type',
      prompt: 'WHAT TYPE OF BANK ACCOUNT DOES ANANYA HAVE?',
      instruction: "Scan the card for Ananya's type of account.",
      hints: ['Think about an account a student would use to save pocket money and still take some out when needed.'],
      options: ['savings-account', 'current-account', 'fixed-deposit-account', 'recurring-deposit-account'],
      required: ['savings-account'],
      correct: {
        title: 'CORRECT!',
        message:
          'Ananya has a savings account. It lets her keep her money safe in the bank while still being able to take it out or make payments when she needs to.',
      },
      incorrect: {
        'current-account': {
          title: 'NOT QUITE',
          message:
            'A current account is made for businesses that send and receive lots of payments every day. Ananya is a student saving her pocket money. Try another card!',
        },
        'fixed-deposit-account': {
          title: 'NOT QUITE',
          message:
            "A fixed deposit locks money away for a set time to earn extra interest, so Ananya couldn't take her pocket money out whenever she needed it. Try another card!",
        },
        'recurring-deposit-account': {
          title: 'NOT QUITE',
          message:
            "A recurring deposit means saving the same amount every month for a fixed time. It isn't meant for everyday withdrawals and payments. Try another card!",
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
      instruction: 'Scan both documents the bank will accept.',
      hints: ['Look for official, valid identity documents issued by the government. Ananya needs two of them.'],
      options: ['expired-passport', 'library-card', 'pan-card', 'aadhaar-card'],
      required: KYC_SLOTS.map((slot) => slot.artefactId),
      correct: {
        title: 'IDENTITY VERIFIED',
        message:
          'PAN and Aadhaar are official documents banks accept to check who a customer is. This check is called KYC: Know Your Customer.',
      },
      incorrect: {
        'expired-passport': {
          title: 'NOT ACCEPTED',
          message: "A passport is an official ID, but only while it's valid. This one has expired, so the bank can't accept it.",
        },
        'library-card': {
          title: 'NOT ACCEPTED',
          message: "A library card shows Ananya is a library member, but it isn't an official identity document.",
        },
      },
      neutral: {},
      notAnOption: { message: "That's from the case file, but it isn't an identity document. Look for the ID cards." },
      collect: {
        slots: KYC_SLOTS,
        accepted: {
          'pan-card': { title: 'PAN CARD VERIFIED', message: 'One more document to go.' },
          'aadhaar-card': { title: 'AADHAAR VERIFIED', message: 'One more document to go.' },
        },
        already: { message: 'Already verified' },
      },
    },

    L1T3: {
      id: 'L1T3',
      level: 1,
      kind: 'scan',
      label: 'Withdrawal slip',
      prompt: 'WHICH SLIP WOULD ANANYA NEED TO TAKE MONEY OUT OF HER ACCOUNT?',
      instruction: 'Scan the right slip.',
      hints: ['Ananya wants to take money OUT of her account.'],
      options: ['deposit-slip', 'withdrawal-slip'],
      required: ['withdrawal-slip'],
      correct: {
        title: 'CORRECT!',
        message:
          'A withdrawal slip is used to request money out of an account. A deposit slip is used when putting money into an account.',
      },
      incorrect: {
        'deposit-slip': {
          title: 'NOT QUITE',
          message: "That's a deposit slip. It's used to put money INTO an account, but Ananya wants to take money out. Try the other slip!",
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
      prompt: "HOW MUCH MONEY IS LEFT IN ANANYA'S ACCOUNT?",
      instruction: 'Work through the bank statement, then scan the card with the closing balance.',
      hints: [
        'Start with the opening balance. Add every credit (money in) and subtract every debit (money out).',
        "Go down the statement one row at a time and don't skip any, not even the returned cheque or payments Ananya doesn't remember.",
        fill('Total credits: {totalCredits}. Total debits: {totalDebits}. Opening balance + credits − debits = closing balance.'),
      ],
      options: balanceCards.map((card) => card.id),
      required: [correctCards[0].id],
      correct: {
        title: 'CORRECT!',
        message: fill('Ananya has {closingBalance} left.'),
        detail:
          'Money coming into the account (credits) increases the balance, and money going out (debits) decreases it.',
      },
      incorrect: Object.fromEntries(
        balanceCards.flatMap((card) => (card.feedback ? [[card.id, { title: 'NOT QUITE', message: card.feedback }]] : [])),
      ),
      neutral: {},
      notAnOption: { message: "That's from the case file, but it isn't a closing-balance card." },
    },

    L2T2: {
      id: 'L2T2',
      level: 2,
      kind: 'cheque',
      label: 'Returned cheque',
      prompt: 'WAIT — THE CHEQUE WAS RETURNED. CAN YOU FIND OUT WHY?',
      instruction: 'Tap different parts of the cheque to investigate.',
      hints: [],
      areas: [
        { id: 'bank', label: 'Bank name and branch', isDiscrepancy: false, feedback: { message: `The bank name and branch are printed clearly. ${LOOKS_CORRECT}` } },
        { id: 'date', label: 'Date', isDiscrepancy: false, feedback: { message: `The date is filled in and the cheque isn't out of date. ${LOOKS_CORRECT}` } },
        { id: 'payee', label: 'Pay', isDiscrepancy: false, feedback: { message: fill(`The cheque is made out to {payee}. ${LOOKS_CORRECT}`) } },
        { id: 'amount-words', label: 'Amount in words', isDiscrepancy: true },
        { id: 'amount-figures', label: 'Amount in figures', isDiscrepancy: true },
        { id: 'account-number', label: 'Account number', isDiscrepancy: false, feedback: { message: `The account number is printed by the bank. ${LOOKS_CORRECT}` } },
        { id: 'signature', label: 'Signature', isDiscrepancy: false, feedback: { message: fill(`{drawerShortName} has signed the cheque. ${LOOKS_CORRECT}`) } },
        { id: 'cheque-number', label: 'Cheque number', isDiscrepancy: false, feedback: { message: `The cheque number matches the one on the statement. ${LOOKS_CORRECT}` } },
      ],
      correct: {
        title: 'MISMATCH FOUND!',
        message: fill('The amount in figures says {chequeFigures}, but the amount in words says {chequeWords} ({chequeWordsAmount}).'),
        detail: fill(
          "The amount in numbers and the amount in words don't match, so the bank can't be sure how much to pay. A mismatch like this can cause a cheque to be returned, and that's what happened to {drawerShortName}'s cheque.",
        ),
      },
    },

    L2T3: {
      id: 'L2T3',
      level: 2,
      kind: 'highlight',
      label: 'Suspicious transaction',
      prompt: 'ONE TRANSACTION TELLS A DIFFERENT STORY. CAN YOU FIND IT?',
      instruction: 'Drag the highlighter onto the transaction that looks suspicious.',
      hints: [],
      correct: { title: 'CLUE FOUND', message: suspicious.highlightFeedback },
    },

    L3T1: {
      id: 'L3T1',
      level: 3,
      kind: 'phishing',
      label: 'Spot the phish',
      prompt: 'SHOULD ANANYA CLICK THE LINK?',
      instruction: 'Decide what Ananya should do.',
      hints: [],
      call: {
        caller: 'Ananya',
        lines: [
          { speaker: 'Ananya', text: "Officer, it's Ananya again! My debit card has been blocked." },
          {
            speaker: 'Ananya',
            text: 'I just got a message saying I can unblock it straight away if I click a link. Should I click it?',
          },
        ],
      },
      choices: [
        { id: 'no', label: "NO — DON'T CLICK THE LINK" },
        { id: 'yes', label: 'YES — CLICK THE LINK' },
      ],
      safe: {
        title: 'GOOD CALL, OFFICER!',
        message:
          'You checked before acting. Unexpected, urgent messages like this can be phishing: tricks to steal your details.',
        detail:
          "Ananya should check her card status through official bank channels, like the bank's own app, the helpline number on the back of her card, or her branch.",
      },
      fakeSite: {
        title: 'UNBLOCK YOUR CARD NOW',
        urgency: 'Your card will be closed in 10 minutes!',
        simulationNote: 'SIMULATION: this is a pretend website. Nothing here is real.',
        fields: [
          { id: 'card-number', label: 'Debit card number', autofill: 'XXXX-XXXX-XXXX-0000' },
          { id: 'expiry', label: 'Expiry date', autofill: '00/00' },
          { id: 'cvv', label: 'CVV', autofill: '000' },
          { id: 'otp', label: 'OTP (one-time password)', autofill: '000000' },
        ],
        submit: 'UNBLOCK MY CARD',
        incomplete: { message: 'The fake page wants every box filled in. Tap each one to see what scammers try to collect.' },
      },
      consequence: {
        title: 'IT WAS A FAKE PAGE',
        message:
          "In this simulation, Ananya's card details and OTP were typed into a fake page, so the scammers could now use them to take money from her account. Clicking the link opened the trap; typing in the details is what let the scammers in.",
        detail:
          "Scammers build fake pages that look like a bank's to collect information like this. The safer choice: don't click links in unexpected messages. Check your card through official bank channels, and never share your card number, PIN, password or OTP with anyone.",
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
      beats: [
        fill('Remember the {suspiciousAmount} "mobile recharge" on Ananya\'s statement? It was paid to CAMS TEL.'),
        `Now look at the message offering to unblock her debit card. Who sent it? ${phishingMessage.sender}.`,
        "The same name turns up in both clues. CAMS TEL doesn't look like a real phone company. It looks like a scam operation that tricks people into handing over their card details.",
        "Nothing is proven yet, Officer, but these clues are strong enough to report.",
      ],
      cta: 'CONTINUE',
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
      prompt: 'SCAN EVIDENCE',
      instruction: 'Scan the two pieces of evidence for the incident report.',
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
      fields: [
        { label: 'Customer', value: account.holder },
        { label: 'Transaction', value: formatRupees(suspicious.amount) },
        { label: 'Concern', value: 'Suspected fraud' },
      ],
      evidenceTitle: 'Evidence attached',
      evidence: [
        { artefactId: 'bank-statement', label: 'Bank statement — unrecognised CAMS TEL transaction' },
        { artefactId: 'phishing-message-card', label: 'Suspicious message — link claiming to unblock debit card' },
      ],
      evidenceTaskId: 'L3T4',
      cta: 'SUBMIT INCIDENT REPORT',
      submitted: {
        title: 'REPORT SUBMITTED',
        message: "Your incident report has been sent to the bank's fraud team for investigation.",
        detail: "They'll look into the suspected fraud and keep Ananya updated.",
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
      tasks: ['L1T1', 'L1T2', 'L1T3'],
      complete: {
        title: 'LEVEL 1 COMPLETE',
        message: "You identified Ananya's savings account, verified her identity and chose the right slip to take money out.",
      },
    },
    {
      id: 2,
      number: '02',
      title: 'Follow the Money',
      tasks: ['L2T1', 'L2T2', 'L2T3'],
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
      tasks: ['L3T1', 'L3T2', 'L3T3', 'L3T4', 'L3T5'],
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
      amountInWords: `Rupees ${chequeWords} Only`,
    },

    phishingMessage,

    start: {
      title: 'SAVE THE SAVINGS ACCOUNT',
      intro: 'Welcome, Junior Bank Officer. Your first case is waiting.',
      cta: 'START TRAINING',
      resumeCta: 'RESUME CASE',
    },

    openingCall: {
      caller: 'Ananya',
      // PLACEHOLDER dialogue until the Stage 1 mockup.
      lines: [
        { speaker: 'Ananya', text: 'Hello? Is this the bank? Please help, I think my pocket money has been stolen from my account!' },
        { speaker: 'Ananya', text: "My balance is much lower than it should be and I don't know what happened. I—" },
      ] satisfies CallLine[],
      disconnected: 'CALL DISCONNECTED',
    },

    caseAssigned: {
      title: 'NEW CASE ASSIGNED',
      message: 'Ananya needs your help, Officer. Her case file contains the clues you need to investigate.',
      cta: 'OPEN CASE FILE',
    },

    caseBoard: {
      title: 'CASE BOARD',
      statusLabels: { locked: 'LOCKED', available: 'AVAILABLE', 'in-progress': 'IN PROGRESS', completed: 'COMPLETED' },
    },

    certificate: {
      title: 'MISSION COMPLETE',
      headline: 'GOOD JOB, OFFICER!',
      notified: 'Ananya has been notified about the report.',
      message:
        "You didn't just help Ananya take action to protect her account. You also learned how a savings account works, how to track money coming in and going out, and how to keep your money safe.",
      award: 'Junior Bank Officer',
      caseBoardCta: 'BACK TO CASE BOARD',
      replayCta: 'REPLAY MISSION',
    },

    scanner: {
      permissionTitle: 'SWITCH ON THE CASE SCANNER',
      permissionMessage:
        'Every card in the case file has a code. Hold a card up to the camera and the scanner reads it. The camera picture is never shown or saved.',
      permissionCta: 'TURN ON SCANNER',
      holdHint: 'Hold the card up to the scanner',
      unknownQr: { title: 'HMM…', message: "That's not part of the case file, Officer." } satisfies Copy,
      startingMessage: 'Starting the scanner…',
      fallbackTitle: 'SCANNER UNAVAILABLE',
      fallbackMessage: "The camera isn't available, so choose the card you're holding from the list instead.",
      deniedTitle: 'SCANNER BLOCKED',
      deniedMessage:
        "The camera wasn't allowed, so choose the card you're holding from the list instead. To use the scanner, allow the camera in your browser settings, then try again.",
      errorTitle: 'SCANNER STOPPED',
      errorMessage: 'Something went wrong with the camera. Try again, or choose the card from the list.',
      retryCta: 'TRY AGAIN',
      useListCta: 'USE THE LIST INSTEAD',
      simulatedLabel: 'Simulated scan',
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
      caseBoard: 'CASE BOARD',
      resume: 'RESUME CASE',
      viewCertificate: 'VIEW CERTIFICATE',
      hint: 'HINT',
      level: 'LEVEL',
      revisiting: "You've solved this one. Look around as much as you like; your progress is saved.",
      taskStatus: { completed: 'Completed', current: 'Current task', locked: 'Locked' },
      slotWaiting: 'Waiting for scan',
      slotDone: 'Scanned',
      simulatedScan: {
        title: 'SIMULATED SCAN',
        note: 'For testing without a camera. Choose the card you would hold up to the scanner.',
        onTable: 'Cards for this task',
        other: 'Another case-file card',
        scanOther: 'SCAN',
        unrelated: 'An unrelated QR code',
        /** What the "unrelated QR code" button pretends to read. */
        unrelatedQrText: 'https://example.com/lunch-menu',
      },
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
      },
      cheque: { chequeNumber: 'Cheque No.', accountNumber: 'A/c No.' },
      highlighter: { label: 'HIGHLIGHTER', hint: 'Drag the highlighter onto a transaction' },
      clue: 'CLUE',
      phishingFrom: 'From',
      passkey: { enter: 'ENTER', clear: 'CLEAR', unlocked: 'UNLOCKED' },
      certificateAwarded: 'AWARDED THE RANK OF',
    },
  }
}

export type GameContent = ReturnType<typeof buildGameContent>

/** The game's content, built from CASE_FIGURES. */
export const GAME: GameContent = buildGameContent()
