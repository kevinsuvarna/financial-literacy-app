/**
 * Real camera scanning (spec 10.2), using Chromium's fake webcam: a video file that shows a
 * printed QR card. The game's hidden camera feed decodes it exactly as it would a real card.
 */
import { expect, test } from '@playwright/test'
import QRCode from 'qrcode'
import { writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { GAME } from '../src/content/gameData'
import { AFTER_INTRO, closeDialog, closeToast, dialog, seedProgress, toast } from './helpers'

/** Writes a Y4M video of a card with this QR code, held in front of the camera. */
function writeFakeCamera(text: string, file: string) {
  const width = 640
  const height = 480
  const moduleSize = 8
  const { modules } = QRCode.create(text, { errorCorrectionLevel: 'Q' })
  const left = Math.floor((width - modules.size * moduleSize) / 2)
  const top = Math.floor((height - modules.size * moduleSize) / 2)
  const luma = Buffer.alloc(width * height, 225)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const row = Math.floor((y - top) / moduleSize)
      const col = Math.floor((x - left) / moduleSize)
      if (row >= 0 && col >= 0 && row < modules.size && col < modules.size && modules.get(row, col)) {
        luma[y * width + x] = 16
      }
    }
  }
  const chroma = Buffer.alloc((width / 2) * (height / 2) * 2, 128)
  const frame = Buffer.concat([Buffer.from('FRAME\n'), luma, chroma])
  writeFileSync(file, Buffer.concat([Buffer.from(`YUV4MPEG2 W${width} H${height} F10:1 Ip A1:1 C420jpeg\n`), frame, frame]))
}

const FAKE_CAMERA = path.join(tmpdir(), 'save-the-savings-fake-camera.y4m')
writeFakeCamera(GAME.artefacts['savings-account'].qrUrl, FAKE_CAMERA)

test.use({
  launchOptions: {
    args: [
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream',
      `--use-file-for-fake-video-capture=${FAKE_CAMERA}`,
    ],
  },
})

const scanner = (page: import('@playwright/test').Page) => page.getByTestId('scanner')

test('reads a card held up to the hidden camera, once', async ({ page }) => {
  await seedProgress(page, AFTER_INTRO)
  await page.goto('/level-1/account-type')

  // The camera waits for the in-story explanation and a tap.
  await expect(scanner(page)).toHaveAttribute('data-status', 'off')
  await expect(scanner(page)).toContainText(GAME.scanner.permissionMessage)
  await expect(page.locator('video.camera-feed')).toHaveCount(0)
  await scanner(page).getByRole('button', { name: GAME.scanner.permissionCta }).click()

  // The card in front of the camera is read and checked: Savings Account is the answer.
  await expect(dialog(page).getByRole('heading')).toHaveText(GAME.tasks.L1T1.correct.title!, { timeout: 15_000 })
  await expect(scanner(page)).toHaveAttribute('data-status', 'active')

  // The feed is never shown, but stays in the DOM: tiny, transparent, inline and muted.
  const video = page.locator('video.camera-feed')
  await expect(video).toHaveCount(1)
  const style = await video.evaluate((el: HTMLVideoElement) => {
    const s = getComputedStyle(el)
    return { display: s.display, opacity: s.opacity, width: el.getBoundingClientRect().width, playsInline: el.playsInline, muted: el.muted }
  })
  expect(style.display).not.toBe('none')
  expect(style).toMatchObject({ opacity: '0', width: 2, playsInline: true, muted: true })

  await closeDialog(page)

  // Next table scene: the scanner comes back on by itself, and the card still being held
  // doesn't count again (spec 10.2: repeats within a short window count once).
  await expect(page).toHaveURL(/\/level-1\/verify-identity$/)
  await expect(scanner(page)).toHaveAttribute('data-status', 'active')
  await expect(scanner(page)).toContainText(GAME.scanner.holdHint)
  await page.waitForTimeout(1500)
  await expect(toast(page)).toHaveCount(0)
  await expect(dialog(page)).toHaveCount(0)

  // Off a table scene, the camera stops.
  await page.getByRole('button', { name: GAME.ui.caseBoard }).click()
  await expect
    .poll(() => page.locator('video.camera-feed').evaluate((el: HTMLVideoElement) => el.srcObject === null), { timeout: 5000 })
    .toBe(true)
})

test('falls back to the card list when the camera is blocked', async ({ page }) => {
  await seedProgress(page, AFTER_INTRO)
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = () => Promise.reject(new DOMException('Blocked', 'NotAllowedError'))
  })
  await page.goto('/level-1/account-type')
  await scanner(page).getByRole('button', { name: GAME.scanner.permissionCta }).click()
  await expect(scanner(page)).toHaveAttribute('data-status', 'denied')
  await expect(scanner(page)).toContainText(GAME.scanner.deniedTitle)

  const list = page.getByTestId('simulated-scan')
  await list.getByLabel(GAME.ui.simulatedScan.other).selectOption('library-card')
  await list.getByRole('button', { name: GAME.ui.simulatedScan.scanOther }).click()
  await closeToast(page, GAME.tasks.L1T1.notAnOption.message)
  await page.getByTestId('simulated-scan').getByRole('button', { name: GAME.artefacts['savings-account'].name }).click()
  await closeDialog(page, GAME.tasks.L1T1.correct.title)
})

test('falls back to the card list when there is no camera', async ({ page }) => {
  await seedProgress(page, AFTER_INTRO)
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'mediaDevices', { value: undefined })
  })
  await page.goto('/level-1/account-type')
  await scanner(page).getByRole('button', { name: GAME.scanner.permissionCta }).click()
  await expect(scanner(page)).toHaveAttribute('data-status', 'unavailable')
  await expect(scanner(page)).toContainText(GAME.scanner.fallbackMessage)
  await expect(page.getByTestId('simulated-scan')).toBeVisible()
})
