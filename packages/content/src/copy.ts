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

  openingCall: {
    caller: 'Ananya',
    lines: [
      'Hello? Is this the bank? Please, I need help!',
      'I think my pocket money has been stolen from my bank account. There is a payment I never made, and then I got this message, and —',
    ],
    disconnected: 'The call has been disconnected.',
    cta: 'SEE YOUR ASSIGNMENT',
  },

  caseAssigned: {
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
    nextTask: 'NEXT TASK',
    viewCertificate: 'VIEW CERTIFICATE',
  },

  scanner: {
    heading: 'Scan a card',
    picker: 'Simulated scanner',
    cameraUnavailable:
      'Camera scanning isn’t available here. Choose the card you would scan from your case file.',
    slotEmpty: 'Waiting for a scan',
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
    highlighter: 'Highlighter',
    highlightShort: 'Highlight',
    highlight: (description: string) => `Highlight ${description}`,
    clue: 'Clue',
  },

  cheque: {
    heading: 'Cheque',
    zone: (label: string, value: string) => `${label}: ${value}`,
  },

  phishing: {
    heading: 'Message on Ananya’s phone',
    from: 'From',
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
