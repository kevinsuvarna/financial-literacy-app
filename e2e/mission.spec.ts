/**
 * Smoke tests for the placeholder UI: the whole mission with simulated scans, and leaving and
 * resuming from the Case Board. Answers come from the content module, never typed in here.
 */
import { expect, test, type Page } from '@playwright/test'
import { GAME, formatRupees, type ArtefactId } from '../src/content/gameData'
import { STORAGE_KEY, STORAGE_VERSION } from '../src/state/gameStore'
import { closeDialog, closeToast, dialog, seedProgress } from './helpers'

/** Taps the artefact on screen: counts exactly like scanning it. */
async function scan(page: Page, id: ArtefactId) {
  await page.locator(`[data-artefact="${id}"]`).click()
}

/** Plays the opening: start, answer Ananya's call, tap through it, open the case file. */
async function startCase(page: Page) {
  await page.goto('/')
  await page.getByRole('button', { name: GAME.start.cta }).click()
  await page.getByRole('button', { name: GAME.openingCall.accept }).click()
  const call = page.getByTestId('call')
  // Each tap finishes the line being typed, or moves on to the next one.
  for (let i = 0; i < GAME.openingCall.steps.length * 2; i++) {
    if ((await call.getAttribute('data-phase')) === 'lost') break
    await call.click({ position: { x: 1300, y: 150 } })
  }
  await expect(page.getByText(GAME.openingCall.disconnected)).toBeVisible()
  await call.click({ position: { x: 1300, y: 150 } })
  await page.getByRole('button', { name: GAME.caseAssigned.cta }).click()
}

test('plays the whole mission with simulated scans', async ({ page }) => {
  const { tasks } = GAME
  await startCase(page)

  // Level 1, Task 1: a wrong card is explained, then the right one.
  await expect(page).toHaveURL(/\/level-1\/account-type$/)
  await scan(page, 'current-account')
  await closeDialog(page, tasks.L1T1.incorrect['current-account']!.title)
  await scan(page, 'savings-account')
  await closeDialog(page, tasks.L1T1.correct.title)

  // Task 2: both KYC documents, Aadhaar first; a scanned document is marked and can't be tapped again.
  await expect(page).toHaveURL(/\/level-1\/verify-identity$/)
  await scan(page, 'aadhaar-card')
  await expect(dialog(page)).toContainText(tasks.L1T2.collect!.accepted['aadhaar-card']!.cta!)
  await closeDialog(page, tasks.L1T2.collect!.accepted['aadhaar-card']!.title)
  await expect(page.locator('[data-artefact="aadhaar-card"]')).toBeDisabled()
  await expect(page.locator('[data-artefact="aadhaar-card"] .scanned-tag')).toHaveText(GAME.ui.slotDone)
  await scan(page, 'pan-card')
  // KYC completes on the second ID's own card, with NEXT CLUE (mockup 05d).
  await expect(dialog(page)).toContainText(tasks.L1T2.collect!.accepted['pan-card']!.message)
  await closeDialog(page, tasks.L1T2.correct.cta)

  // Task 3
  await scan(page, 'deposit-slip')
  await closeDialog(page, tasks.L1T3.incorrect['deposit-slip']!.title)
  await scan(page, 'withdrawal-slip')
  await closeDialog(page, tasks.L1T3.correct.title)
  await expect(page.getByRole('heading', { name: GAME.levels[0].complete.title })).toBeVisible()
  await page.getByRole('button', { name: GAME.levels[0].complete.cta }).click()

  // Level 2, Task 1: the statement hides the closing balance until it's solved.
  await expect(page).toHaveURL(/\/level-2\/closing-balance$/)
  // The printed statement shows the opening balance; the closing balance reads "????".
  await expect(page.locator('.st-summary')).toContainText(formatRupees(GAME.statement.openingBalance).replace('₹', '₹ '))
  await expect(page.locator('.st-closing .st-figure')).toHaveText(GAME.ui.statement.printed.unknown)
  const [balanceAnswer] = tasks.L2T1.required
  const wrongCard = tasks.L2T1.options.find((id) => id !== balanceAnswer)!
  await scan(page, wrongCard)
  // Each wrong card gets its own hint (mockups 08b, 08d, 08e).
  await expect(dialog(page)).toContainText(tasks.L2T1.incorrect[wrongCard]!.detail!.split('\n')[0])
  await closeDialog(page)
  await scan(page, balanceAnswer)
  await closeDialog(page, tasks.L2T1.correct.title)

  // Task 2 opens on the clue (09): the cheque rows highlighted on the statement, now with its closing balance.
  await expect(page).toHaveURL(/\/level-2\/cheque-clue$/)
  await expect(page.locator('.st-closing .st-figure')).toHaveText(formatRupees(GAME.statement.closingBalance).replace('₹', '₹ '))
  await expect(page.locator('.st-row.is-highlighted')).toHaveCount(2)
  await page.getByRole('button', { name: tasks.L2T2.clue.cta }).click()

  // The cheque is tapped, not scanned. A part that's fine is lifted out with "This looks right." (09d).
  await expect(page).toHaveURL(/\/level-2\/cheque$/)
  const dateArea = tasks.L2T2.areas.find((a) => a.id === 'date')!
  await page.locator('[data-area="date"]').click()
  if (!dateArea.isDiscrepancy) {
    await expect(dialog(page)).toContainText(dateArea.feedback.message.split('\n')[0])
    await expect(page.locator('.cheque-zoom')).toBeVisible()
    await closeDialog(page)
  }
  // The amount row is the mismatch (09e).
  await page.locator('[data-area="amount-words"]').click()
  await expect(page.locator('.cheque-zoom--right')).toBeVisible()
  await closeDialog(page, tasks.L2T2.correct.title)

  // Task 3: drag the highlighter's tip onto a normal row (10b–10j: NOT SUSPICIOUS, TRY AGAIN),
  // then onto the CAMS TEL row (10h: SUSPICIOUS, INVESTIGATE).
  await expect(page).toHaveURL(/\/level-2\/highlighter$/)
  const ordinaryRow = GAME.statement.rows.find((row) => !row.suspicious)!
  await dragHighlighter(page, ordinaryRow.id)
  await expect(dialog(page)).toContainText(ordinaryRow.highlightLabel)
  await expect(dialog(page)).toContainText(ordinaryRow.highlightFeedback)
  await expect(page.locator(`.hl-feedback [data-row-id="${ordinaryRow.id}"]`)).toHaveClass(/is-highlighted/)
  await closeDialog(page, GAME.ui.highlighter.notSuspicious)
  await dragHighlighter(page, 'cams-tel')
  await closeDialog(page, GAME.ui.highlighter.suspicious)

  // Level 2 done: straight on through the Case Board transition to Ananya's second call (11, 11b),
  // which plays by itself and hands over to the choice (11c).
  await expect(page).toHaveURL(/\/level-3\/call-ananya$/)
  await expect(page.locator('.level-intro')).toContainText(`${GAME.ui.levelHeading} 3 ${GAME.caseBoard.unlocked}`)
  await expect(page.locator('.speech-bubble-text')).toHaveText(tasks.L3T1.call.steps[0].text.replace('\n', ' '), { timeout: 10_000 })
  await expect(page).toHaveURL(/\/level-3\/phishing$/, { timeout: 15_000 })

  // Level 3, Task 1: the YES path through the fake page.
  await page.getByRole('button', { name: tasks.L3T1.choices.find((c) => c.id === 'yes')!.label, exact: true }).click()
  await expect(page).toHaveURL(/\/level-3\/fake-website$/)
  await page.getByRole('button', { name: tasks.L3T1.fakeSite.submit }).click()
  await closeToast(page, tasks.L3T1.fakeSite.incomplete.message)
  for (const field of tasks.L3T1.fakeSite.fields) {
    const box = page.locator(`[data-field="${field.id}"]`)
    await box.click()
    await expect(box).toHaveText(field.autofill)
  }
  await page.getByRole('button', { name: tasks.L3T1.fakeSite.submit }).click()
  // The loss is shown back on the choice screen (11d).
  await expect(page).toHaveURL(/\/level-3\/phishing$/)
  await expect(dialog(page)).toContainText(tasks.L3T1.consequence.alert!.text.split('\n')[0])
  await closeDialog(page, tasks.L3T1.consequence.title)
  // YES never completes the task: back at the choice, only NO continues.
  await expect(page).toHaveURL(/\/level-3\/phishing$/)
  await page.getByRole('button', { name: tasks.L3T1.choices.find((c) => c.id === 'no')!.label, exact: true }).click()
  await closeDialog(page, tasks.L3T1.safe.title)

  // Task 2: the reveal plays (15, 15b, 12c); taps skip ahead. CAMS TEL rearranges to SCAM TEL.
  await expect(page).toHaveURL(/\/level-3\/scam-reveal$/)
  await expect(page.getByText(tasks.L3T2.reveal.heading)).toBeVisible()
  for (let i = 0; i < 4; i++) await page.locator('.reveal').click({ position: { x: 1400, y: 950 } })
  await expect(page.getByLabel(tasks.L3T2.reveal.unscrambled)).toBeVisible()
  await page.getByRole('button', { name: tasks.L3T2.cta }).click()

  // Task 3 (13 → 16e): a wrong passkey on the desk's keyboard is shown on the monitor; the right
  // one, typed on a physical keyboard, unlocks it and the view zooms in, then on to the evidence.
  await expect(page).toHaveURL(/\/level-3\/passkey$/)
  const wrongCode = GAME.passkey === '000' ? '111' : '000'
  for (const digit of wrongCode) await page.locator('.pk-keyboard').getByRole('button', { name: digit, exact: true }).click()
  await expect(page.locator('.pc-denied')).toContainText(tasks.L3T3.incorrect.title!)
  await expect(page.locator('.pc-denied')).toBeHidden({ timeout: 6000 })
  await page.keyboard.type(GAME.passkey)
  await expect(page.locator('.pk-unlocked')).toBeVisible()

  // Task 4 (14 → 14c): the report stays locked until both pieces of evidence are attached.
  await expect(page).toHaveURL(/\/level-3\/scan-evidence$/, { timeout: 8000 })
  await scan(page, 'bank-statement')
  await expect(page.locator('[data-slot="bank-statement"]')).toHaveClass(/is-attached/)
  await page.goto('/level-3/review-report')
  await expect(page).toHaveURL(/\/level-3\/scan-evidence$/)
  await expect(page.locator('[data-slot="bank-statement"]')).toHaveClass(/is-attached/)
  await scan(page, 'phishing-message-card')
  await expect(page.getByText(tasks.L3T5.evidenceTitle)).toBeVisible()
  await page.getByRole('button', { name: tasks.L3T5.reviewCta }).click()

  // Task 5 (15): submit, the stamp lands, then the certificate (16).
  await expect(page).toHaveURL(/\/level-3\/review-report$/)
  for (const field of tasks.L3T5.fields) await expect(page.getByText(field.value, { exact: true })).toBeVisible()
  await page.getByRole('button', { name: tasks.L3T5.cta }).click()
  // The monitor confirms what was sent, with a case reference; VIEW CERTIFICATE moves on.
  const sent = page.getByRole('status').filter({ hasText: tasks.L3T5.submitted.title! })
  await expect(sent).toContainText(tasks.L3T5.receipt.reference)
  await sent.getByRole('button', { name: tasks.L3T5.submitted.cta! }).click()

  // Certificate
  await expect(page).toHaveURL(/\/certificate$/, { timeout: 8000 })
  await expect(page.getByText(GAME.certificate.headline)).toBeVisible()
  await expect(page.getByTestId('badge')).toContainText(GAME.certificate.award)
})

/** Picks the highlighter up by its tip and puts the tip down on a statement row. */
async function dragHighlighter(page: Page, rowId: string) {
  const tip = (await page.getByTestId('highlighter-tip').boundingBox())!
  const row = (await page.locator(`.screen--highlighter [data-row-id="${rowId}"] .st-col-desc`).boundingBox())!
  await page.mouse.move(tip.x + tip.width / 2, tip.y + tip.height / 2)
  await page.mouse.down()
  await page.mouse.move(row.x + row.width / 2, row.y + row.height / 2, { steps: 10 })
  await page.mouse.up()
}

/** A level's card on the Case Board, and a step dot on it. */
const levelCard = (id: 1 | 2 | 3) => `${GAME.ui.levelHeading} ${id}: ${GAME.levels[id - 1].title}`
const stepDot = (label: string) => new RegExp(`^${label} \\(`)

test('leaves a level and resumes it from the Case Board', async ({ page }) => {
  await startCase(page)
  await scan(page, 'savings-account')
  await closeDialog(page)
  await scan(page, 'pan-card')
  await closeDialog(page)

  await page.getByRole('button', { name: GAME.ui.caseBoard }).click()
  await expect(page).toHaveURL(/\/case-board$/)
  await expect(page.getByTestId('level-1-status')).toContainText(GAME.caseBoard.statusLabels['in-progress'])
  await expect(page.getByTestId('level-2-status')).toContainText(GAME.caseBoard.statusLabels.locked)
  await expect(page.getByRole('button', { name: levelCard(2) })).toBeDisabled()
  await expect(page.getByRole('button', { name: stepDot(GAME.levels[1].steps[0].label) })).toBeDisabled()

  // Locked screens stay locked, even by URL.
  for (const path of ['/level-1/withdrawal-slip', '/level-2/cheque', '/level-1/complete', '/certificate']) {
    await page.goto(path)
    await expect(page).toHaveURL(/\/level-1\/verify-identity$/)
  }

  // Progress survives a reload.
  await page.goto('/case-board')
  await page.reload()
  await expect(page.getByTestId('level-1-status')).toContainText(GAME.caseBoard.statusLabels['in-progress'])

  // Revisiting a solved task changes nothing.
  await page.getByRole('button', { name: stepDot(GAME.levels[0].steps[0].label) }).click()
  await expect(page).toHaveURL(/\/level-1\/account-type$/)
  await expect(page.getByText(GAME.ui.revisiting)).toBeVisible()
  await scan(page, 'current-account')
  await closeDialog(page)
  await page.getByRole('button', { name: GAME.ui.next }).click()

  // Resume where we left off: PAN still verified, Aadhaar finishes the task.
  await expect(page).toHaveURL(/\/level-1\/verify-identity$/)
  await expect(page.locator('[data-artefact="pan-card"]')).toBeDisabled()
  await page.getByRole('button', { name: GAME.ui.caseBoard }).click()
  // BACK on the board returns to the task it was opened from.
  await page.getByRole('button', { name: GAME.ui.back }).click()
  await expect(page).toHaveURL(/\/level-1\/verify-identity$/)
  await page.getByRole('button', { name: GAME.ui.caseBoard }).click()
  // Tapping the current level's card resumes it.
  await page.getByRole('button', { name: levelCard(1) }).click()
  await expect(page).toHaveURL(/\/level-1\/verify-identity$/)
  await scan(page, 'aadhaar-card')
  await closeDialog(page, GAME.tasks.L1T2.correct.cta)
  await expect(page).toHaveURL(/\/level-1\/withdrawal-slip$/)
})

test('tapping the link in the message opens the pretend page, like YES', async ({ page }) => {
  await seedProgress(page, {
    introCompleted: true,
    completedTasks: ['L1T1', 'L1T2', 'L1T3', 'L2T1', 'L2T2', 'L2T3'],
    accepted: {},
    wrongAttempts: {},
    phishingChoice: null,
  })
  await page.goto('/level-3/phishing')
  await page.getByTestId('phish-link').click()
  await expect(page).toHaveURL(/\/level-3\/fake-website$/)
  await expect(page.getByText(GAME.tasks.L3T1.fakeSite.simulationNote)).toBeVisible()
})

test('phishing NO path continues the investigation', async ({ page }) => {
  await seedProgress(page, {
    introCompleted: true,
    completedTasks: ['L1T1', 'L1T2', 'L1T3', 'L2T1', 'L2T2', 'L2T3'],
    accepted: {},
    wrongAttempts: {},
    phishingChoice: null,
  })
  await page.goto('/level-3/fake-website')
  await expect(page).toHaveURL(/\/level-3\/phishing$/)
  await page.getByRole('button', { name: GAME.tasks.L3T1.choices.find((c) => c.id === 'no')!.label, exact: true }).click()
  await closeDialog(page, GAME.tasks.L3T1.safe.title)
  await expect(page).toHaveURL(/\/level-3\/scam-reveal$/)
})

test('the opening call plays by itself', async ({ page }) => {
  await page.goto('/call/ananya')
  await expect(page.getByText(GAME.openingCall.incomingTitle)).toBeVisible()
  await page.getByRole('button', { name: GAME.openingCall.accept }).click()
  // No taps: every line types out and the call moves on, ending at Case Assigned.
  for (const step of GAME.openingCall.steps) {
    await expect(page.locator('.speech-bubble-text')).toHaveText(step.text.replace('\n', ' '), { timeout: 10_000 })
  }
  await expect(page.getByText(GAME.openingCall.disconnected)).toBeVisible({ timeout: 10_000 })
  await expect(page).toHaveURL(/\/case-assigned$/, { timeout: 10_000 })
  await expect(page.getByText(GAME.caseAssigned.nextStep)).toBeVisible()
})

test('START TRAINING begins a fresh case from the first task', async ({ page }) => {
  // Saved progress from an earlier game (set once, not on every page load).
  await page.goto('/')
  await page.evaluate(
    ([key, value]) => localStorage.setItem(key, value),
    [
      STORAGE_KEY,
      JSON.stringify({
        version: STORAGE_VERSION,
        state: { introCompleted: true, completedTasks: ['L1T1', 'L1T2'], accepted: {}, wrongAttempts: {}, phishingChoice: null },
      }),
    ] as const,
  )
  await startCase(page)
  await expect(page).toHaveURL(/\/level-1\/account-type$/)
  // RESUME CASE would have continued; a fresh start keeps nothing.
  await page.goto('/level-1/withdrawal-slip')
  await expect(page).toHaveURL(/\/level-1\/account-type$/)
})

test('BACK returns to the screen you came from, even with a feedback card open', async ({ page }) => {
  await seedProgress(page, {
    introCompleted: true,
    completedTasks: ['L1T1', 'L1T2'],
    accepted: {},
    wrongAttempts: {},
    phishingChoice: null,
  })
  const back = page.getByRole('button', { name: GAME.ui.back, exact: true })
  await page.goto('/level-1/account-type')
  await page.getByRole('button', { name: GAME.ui.next }).click()
  await expect(page).toHaveURL(/\/level-1\/verify-identity$/)
  await page.getByRole('button', { name: GAME.ui.next }).click()
  await expect(page).toHaveURL(/\/level-1\/withdrawal-slip$/)

  // A wrong slip's feedback card is open: BACK still goes to the previous screen, and the card goes.
  await scan(page, 'deposit-slip')
  await expect(dialog(page)).toBeVisible()
  await back.click()
  await expect(page).toHaveURL(/\/level-1\/verify-identity$/)
  await expect(dialog(page)).toBeHidden()

  // Then on back through the screens actually visited.
  await back.click()
  await expect(page).toHaveURL(/\/level-1\/account-type$/)
  // Nothing visited before this page load: falls back to the screen before in play order.
  await back.click()
  await expect(page).toHaveURL(/\/case-assigned$/)
  // From the case, all the way home: the start screen, with RESUME CASE.
  await back.click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('button', { name: GAME.start.resumeCta })).toBeVisible()
})

test('every screen but the start has a BACK that goes to the screen before it', async ({ page }) => {
  await seedProgress(page, {
    introCompleted: true,
    completedTasks: ['L1T1', 'L1T2', 'L1T3', 'L2T1', 'L2T2', 'L2T3', 'L3T1', 'L3T2', 'L3T3', 'L3T4', 'L3T5'],
    accepted: {},
    wrongAttempts: {},
    phishingChoice: 'no',
  })
  const back = page.getByRole('button', { name: GAME.ui.back, exact: true })
  const steps: [string, RegExp][] = [
    ['/certificate', /\/level-3\/review-report$/],
    ['/level-3/call-ananya', /\/level-2\/highlighter$/],
    ['/level-3/scam-reveal', /\/level-3\/phishing$/],
    ['/level-2/cheque-clue', /\/level-2\/closing-balance$/],
    ['/call/ananya', /\/$/],
  ]
  for (const [from, to] of steps) {
    await page.goto(from)
    await back.first().click()
    await expect(page).toHaveURL(to)
  }
  await expect(back).toHaveCount(0)
})

test('finishing Level 1 plays a transition into Level 2', async ({ page }) => {
  await seedProgress(page, {
    introCompleted: true,
    completedTasks: ['L1T1', 'L1T2', 'L1T3'],
    accepted: {},
    wrongAttempts: {},
    phishingChoice: null,
  })
  await page.goto('/level-1/complete')
  await page.getByRole('button', { name: GAME.levels[0].complete.cta }).click()
  const intro = page.locator('.level-intro')
  await expect(intro).toBeVisible()
  await expect(intro).toContainText(`${GAME.ui.levelHeading} 2 ${GAME.caseBoard.unlocked}`)
  await expect(intro.locator('.cork-card[data-level="1"] .cork-stamp')).toBeVisible()
  await expect(page).toHaveURL(/\/level-2\/closing-balance$/)
  await expect(intro).toBeHidden({ timeout: 6000 })
})

test('a phone camera opens a friendly page, not the game', async ({ page }) => {
  await page.goto('/a/pan-card')
  await expect(page.getByRole('heading', { name: GAME.phoneLanding.title })).toBeVisible()
  await expect(page.getByText(GAME.artefacts['pan-card'].name)).toBeVisible()
  await page.goto('/a/not-a-card')
  await expect(page.getByText(GAME.phoneLanding.message)).toBeVisible()
})
