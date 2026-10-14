/**
 * Smoke tests for the placeholder UI: the whole mission with simulated scans, and leaving and
 * resuming from the Case Board. Answers come from the content module, never typed in here.
 */
import { expect, test, type Page } from '@playwright/test'
import { GAME, formatRupees, type ArtefactId } from '../src/content/gameData'
import { closeDialog, closeToast, dialog, seedProgress } from './helpers'

async function scan(page: Page, id: ArtefactId) {
  await page
    .getByTestId('simulated-scan')
    .getByRole('button', { name: GAME.artefacts[id].name, exact: true })
    .click()
}

async function startCase(page: Page) {
  await page.goto('/')
  await page.getByRole('button', { name: GAME.start.cta }).click()
  await expect(page.getByText(GAME.openingCall.disconnected)).toBeVisible()
  await page.getByRole('button', { name: GAME.ui.continue }).click()
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

  // Task 2: both KYC documents, Aadhaar first; a re-scan is "Already verified".
  await expect(page).toHaveURL(/\/level-1\/verify-identity$/)
  await scan(page, 'aadhaar-card')
  await closeDialog(page, tasks.L1T2.collect!.accepted['aadhaar-card']!.title)
  await expect(page.locator('[data-slot="aadhaar-card"]')).toHaveClass(/is-done/)
  await scan(page, 'aadhaar-card')
  await closeToast(page, 'Already verified')
  await scan(page, 'pan-card')
  await closeDialog(page, tasks.L1T2.correct.title)

  // Task 3
  await scan(page, 'deposit-slip')
  await closeDialog(page, tasks.L1T3.incorrect['deposit-slip']!.title)
  await scan(page, 'withdrawal-slip')
  await closeDialog(page, tasks.L1T3.correct.title)
  await expect(page.getByRole('heading', { name: GAME.levels[0].complete.title })).toBeVisible()
  await page.getByRole('button', { name: GAME.ui.continue }).click()

  // Level 2, Task 1: the statement hides the closing balance until it's solved.
  await expect(page).toHaveURL(/\/level-2\/closing-balance$/)
  await expect(page.locator('.statement-opening')).toContainText(formatRupees(GAME.statement.openingBalance))
  await expect(page.getByTestId('closing-balance')).toHaveText(GAME.ui.statement.unknown)
  const [balanceAnswer] = tasks.L2T1.required
  const wrongCard = tasks.L2T1.options.find((id) => id !== balanceAnswer)!
  await scan(page, wrongCard)
  await expect(dialog(page)).toContainText(tasks.L2T1.hints[0])
  await closeDialog(page)
  await scan(page, balanceAnswer)
  await closeDialog(page, tasks.L2T1.correct.title)

  // Task 2: the cheque is tapped, not scanned.
  await expect(page).toHaveURL(/\/level-2\/cheque$/)
  const dateArea = tasks.L2T2.areas.find((a) => a.id === 'date')!
  await page.locator('[data-area="date"]').click()
  if (!dateArea.isDiscrepancy) await closeToast(page, dateArea.feedback.message)
  await page.locator('[data-area="amount-words"]').click()
  await closeDialog(page, tasks.L2T2.correct.title)

  // Task 3: drag the highlighter onto a normal row, then onto the suspicious one.
  await expect(page).toHaveURL(/\/level-2\/highlighter$/)
  const highlighter = page.getByTestId('highlighter')
  const ordinaryRow = GAME.statement.rows.find((row) => !row.suspicious)!
  await highlighter.dragTo(page.locator(`[data-row-id="${ordinaryRow.id}"]`))
  await closeToast(page, ordinaryRow.highlightFeedback)
  await highlighter.dragTo(page.locator('[data-row-id="cams-tel"]'))
  await closeDialog(page, tasks.L2T3.correct.title)
  await expect(page.getByRole('heading', { name: GAME.levels[1].complete.title })).toBeVisible()
  await page.getByRole('button', { name: GAME.ui.continue }).click()

  // Level 3, Task 1: Ananya's call, then the YES path through the fake page.
  await expect(page).toHaveURL(/\/level-3\/call-ananya$/)
  await page.getByRole('button', { name: GAME.ui.continue }).click()
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
  await expect(dialog(page)).toContainText(tasks.L3T1.consequence.alert!.text)
  await closeDialog(page, tasks.L3T1.consequence.title)
  // YES never completes the task: back at the choice, only NO continues.
  await expect(page).toHaveURL(/\/level-3\/phishing$/)
  await page.getByRole('button', { name: tasks.L3T1.choices.find((c) => c.id === 'no')!.label, exact: true }).click()
  await closeDialog(page, tasks.L3T1.safe.title)

  // Task 2
  await expect(page).toHaveURL(/\/level-3\/scam-reveal$/)
  await page.getByRole('button', { name: tasks.L3T2.cta }).click()
  await closeDialog(page, tasks.L3T2.correct.title)

  // Task 3: a wrong passkey on the keypad, then the derived one on the keyboard.
  await expect(page).toHaveURL(/\/level-3\/passkey$/)
  const wrongCode = GAME.passkey === '000' ? '111' : '000'
  for (const digit of wrongCode) await page.locator('.keypad').getByRole('button', { name: digit, exact: true }).click()
  await page.getByRole('button', { name: GAME.ui.passkey.enter }).click()
  await expect(dialog(page)).toContainText(tasks.L3T3.hints[0])
  await closeDialog(page, tasks.L3T3.incorrect.title)
  await page.keyboard.type(GAME.passkey)
  await page.keyboard.press('Enter')
  await closeDialog(page, tasks.L3T3.correct.title)

  // Task 4: the report stays locked until both pieces of evidence are attached.
  await expect(page).toHaveURL(/\/level-3\/scan-evidence$/)
  await scan(page, 'bank-statement')
  await closeDialog(page, tasks.L3T4.collect!.accepted['bank-statement']!.title)
  await scan(page, 'cheque')
  await closeToast(page, tasks.L3T4.neutral.cheque!.message)
  await page.goto('/level-3/review-report')
  await expect(page).toHaveURL(/\/level-3\/scan-evidence$/)
  await expect(page.locator('[data-slot="bank-statement"]')).toHaveClass(/is-done/)
  await scan(page, 'phishing-message-card')
  await closeDialog(page, tasks.L3T4.correct.title)

  // Task 5
  await expect(page).toHaveURL(/\/level-3\/review-report$/)
  await expect(page.locator('.report-evidence .is-attached')).toHaveCount(2)
  await page.getByRole('button', { name: tasks.L3T5.cta }).click()
  await expect(page).toHaveURL(/\/report-submitted$/)
  await page.getByRole('button', { name: GAME.ui.continue }).click()

  // Certificate
  await expect(page).toHaveURL(/\/certificate$/)
  await expect(page.getByText(GAME.certificate.headline)).toBeVisible()
  await expect(page.getByTestId('badge')).toContainText(GAME.certificate.award)
})

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
  await expect(page.getByRole('button', { name: new RegExp(GAME.tasks.L2T1.label) })).toBeDisabled()

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
  await page.getByRole('button', { name: new RegExp(GAME.tasks.L1T1.label) }).click()
  await expect(page).toHaveURL(/\/level-1\/account-type$/)
  await expect(page.getByText(GAME.ui.revisiting)).toBeVisible()
  await scan(page, 'current-account')
  await closeDialog(page)
  await page.getByRole('button', { name: GAME.ui.next }).click()

  // Resume where we left off: PAN still verified, Aadhaar finishes the task.
  await expect(page).toHaveURL(/\/level-1\/verify-identity$/)
  await expect(page.locator('[data-slot="pan-card"]')).toHaveClass(/is-done/)
  await expect(page.locator('[data-slot="aadhaar-card"]')).not.toHaveClass(/is-done/)
  await page.getByRole('button', { name: GAME.ui.caseBoard }).click()
  await page.getByRole('button', { name: GAME.ui.resume }).click()
  await expect(page).toHaveURL(/\/level-1\/verify-identity$/)
  await scan(page, 'aadhaar-card')
  await closeDialog(page, GAME.tasks.L1T2.correct.title)
  await expect(page).toHaveURL(/\/level-1\/withdrawal-slip$/)
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

test('a phone camera opens a friendly page, not the game', async ({ page }) => {
  await page.goto('/a/pan-card')
  await expect(page.getByRole('heading', { name: GAME.phoneLanding.title })).toBeVisible()
  await expect(page.getByText(GAME.artefacts['pan-card'].name)).toBeVisible()
  await page.goto('/a/not-a-card')
  await expect(page.getByText(GAME.phoneLanding.message)).toBeVisible()
})
