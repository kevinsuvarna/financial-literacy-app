/**
 * Every player-facing string that isn't tied to one task, artefact or document. Wording is
 * placeholder-quality where SPEC.md doesn't dictate it; the capitalised CTAs and headings are
 * taken from the spec verbatim.
 */
export const copy = {
  appTitle: 'Save the Savings Account',

  start: {
    title: 'SAVE THE SAVINGS ACCOUNT',
    intro:
      'Welcome, Junior Bank Officer. Your training starts today — and your first case is already calling.',
    cta: 'START TRAINING',
    resume: 'RESUME CASE',
  },

  incomingCall: {
    heading: 'Incoming call',
    caller: 'Ananya',
    callerDetail: 'Savings account customer',
    swipe: 'Swipe to answer',
    answer: 'Answer the call',
  },

  openingCall: {
    caller: 'Ananya',
    connected: 'On the line',
    skip: 'SKIP',
    lines: [
      'Hello? Is this the bank? Please, I need help!',
      'I think my pocket money has been stolen from my bank account. There is a payment I never made, and then I got this message, and —',
    ],
    disconnected: 'The call has been disconnected.',
    cta: 'SEE YOUR ASSIGNMENT',
  },

  caseAssigned: {
    stamp: 'NEW CASE',
    heading: 'NEW CASE ASSIGNED',
    body: 'Ananya needs your help. Her physical case file holds the clues you need to investigate what happened to her savings account.',
    cta: 'OPEN CASE FILE',
  },

  scenes: {
    call: 'Phone call',
    table: 'Case table',
    screen: 'Investigation screen',
    cinematic: 'Case story',
  },

  status: {
    locked: 'Locked',
    available: 'Available',
    inProgress: 'In progress',
    completed: 'Completed',
  },

  nav: {
    caseBoard: 'Case Board',
    tracker: 'Mission progress',
  },

  tracker: {
    task: (levelLabel: string, taskNumber: number, taskCount: number, status: string) =>
      `${levelLabel}, task ${taskNumber} of ${taskCount} — ${status}`,
  },

  play: {
    position: (levelLabel: string, taskNumber: number, taskCount: number) =>
      `${levelLabel} · Task ${taskNumber} of ${taskCount}`,
    reviewBanner:
      'You have already solved this task. You are reviewing it — nothing here changes your progress.',
    hint: 'Hint',
    hintCount: (hintNumber: number, hintTotal: number) => `Hint ${hintNumber} of ${hintTotal}`,
    stamp: 'CORRECT',
    nextTask: 'NEXT TASK',
    finishLevel: 'FINISH LEVEL',
    viewCertificate: 'VIEW CERTIFICATE',
  },

  levelComplete: {
    heading: (levelNumber: number) => `LEVEL ${levelNumber} COMPLETE`,
    stamp: 'LEVEL CLEARED',
    next: (levelNumber: number, label: string) => `START LEVEL ${levelNumber}: ${label}`,
  },

  sound: {
    mute: 'Mute sound',
    on: 'Sound on',
    off: 'Sound off',
  },

  scanner: {
    heading: 'Scan a card',
    picker: 'Simulated scanner',
    cameraUnavailable:
      'Camera scanning isn’t available here. Choose the card you would scan from your case file.',
    slot: (slotNumber: number) => `Document ${slotNumber}`,
    slotEmpty: 'Waiting for a scan',
    verified: 'VERIFIED',
    answer: 'Your answer',
    progress: (scanned: number, required: number) => `${scanned} of ${required} verified`,

    permissionHeading: 'Switch on the evidence scanner?',
    permissionBody:
      'The scanner uses this device’s camera to read the codes on the cards in your case file. Nothing is recorded or saved. Your browser will ask you to allow the camera.',
    enable: 'TURN ON SCANNER',
    decline: 'CHOOSE CARDS FROM A LIST',
    starting: 'Starting the scanner…',
    active: 'Scanner active',
    hint: 'Hold a card up to the scanner',
    switchCamera: 'Switch camera',
    useList: 'Can’t scan? Choose from a list',
    tryScanner: 'Try the scanner',
    unknownCode: 'That code is not part of the case file. Try a card from Ananya’s file.',
    offTask: 'That card is not one of the choices for this question.',
    errors: {
      denied:
        'The scanner was not allowed to use the camera. Choose your card from the list instead.',
      'no-camera': 'No camera was found on this device. Choose your card from the list instead.',
      'in-use': 'The camera is busy in another app or tab. Choose your card from the list instead.',
      decoder: 'The scanner could not start. Choose your card from the list instead.',
      unknown: 'The scanner could not start. Choose your card from the list instead.',
    },
  },

  statement: {
    heading: 'Bank statement',
    accountHolder: 'Account holder: Ananya Sharma',
    date: 'Date',
    description: 'Description',
    credit: 'Money in',
    debit: 'Money out',
    openingBalance: 'Opening balance',
    highlighter: 'HIGHLIGHTER',
    highlighterHelp:
      'Drag the highlighter onto a transaction and let go to mark it. With a keyboard, use the arrow keys to move between transactions and press Enter to mark one.',
    clue: 'CLUE',
    working: {
      heading: 'How the balance adds up',
      opening: 'Opening balance',
      moneyIn: 'Money in',
      moneyInNote: 'adds to the balance',
      moneyOut: 'Money out',
      moneyOutNote: 'takes away from the balance',
      closing: 'Closing balance',
    },
    evidenceTray: 'Evidence tray',
    evidenceTrayEmpty: 'No clues filed yet.',
  },

  cheque: {
    heading: 'Cheque',
    bank: 'LOTUS VALLEY BANK',
    zone: (label: string, value: string) => `${label}: ${value}`,
    loupeHelp:
      'Drag the magnifying glass over the cheque for a closer look, then tap the detail that looks wrong. With a keyboard, press Tab to move between the details and Enter to inspect one.',
    checked: 'Checked',
    mismatchStamp: 'MISMATCH',
    glowHint: 'Hint: take another look at the amount.',
  },

  phishing: {
    heading: 'Message on Ananya’s phone',
    from: 'From',
    app: 'Messages',
    now: 'now',
    youChose: 'You chose',
    fieldName: (label: string, value: string) => `${label}: ${value}`,
    lossTaken: (amount: string) => `− ${amount}`,
    lossAnnouncement: (amount: string) =>
      `Simulation: ${amount} was taken from Ananya’s savings after the details were entered.`,
  },

  corkboard: {
    board: 'Case corkboard',
    help: 'Drag the red string from the pin on the statement clue and drop it on the pin where the same name appears. With a keyboard, press Tab to move between the pins and Enter to tie the string to one.',
    clueCard: 'Statement clue',
    messageCard: 'Message on Ananya’s phone',
    chequeCard: 'Returned cheque',
    chequeNote: 'Returned: the amounts did not match.',
    payee: 'Pay',
    tieTo: (target: string) => `Tie the string to ${target}`,
    revealStamp: 'CONNECTED',
    revealHeading: 'ONE NAME BEHIND BOTH',
  },

  passkey: {
    input: 'Three-digit passkey',
    submit: 'UNLOCK',
  },

  report: {
    customer: 'Customer',
    transaction: 'Transaction',
    concern: 'Concern',
    evidence: 'Evidence attached',
    attached: 'Attached',
    missing: 'Missing',
    submit: 'SUBMIT INCIDENT REPORT',
  },

  caseBoard: {
    heading: 'CASE BOARD',
    intro: 'Pick up where you left off, or revisit a level you have already solved.',
    card: (levelNumber: number, label: string) =>
      `${String(levelNumber).padStart(2, '0')} — ${label}`,
    actions: {
      locked: 'LOCKED',
      available: 'START',
      inProgress: 'RESUME',
      completed: 'REPLAY',
    },
    actionLabel: (action: string, label: string) => `${action}: ${label}`,
    tasksSolved: (solved: number, total: number) => `${solved} of ${total} tasks solved`,
    viewCertificate: 'VIEW CERTIFICATE',
  },

  certificate: {
    heading: 'MISSION COMPLETE',
    subheading: 'GOOD JOB, OFFICER!',
    lines: [
      'Ananya has been notified about the report.',
      'You didn’t just help Ananya take action to protect her account. You also learned how a savings account works, how to track money coming in and going out, and how to keep your money safe.',
    ],
    awardedTo: 'This certifies that you are now a',
    badge: 'Junior Bank Officer',
    backToBoard: 'BACK TO CASE BOARD',
    replay: 'REPLAY MISSION',
  },
} as const;
