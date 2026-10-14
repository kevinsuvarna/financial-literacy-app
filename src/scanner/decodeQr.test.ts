import QRCode from 'qrcode'
import { describe, expect, it } from 'vitest'
import { GAME } from '../content/gameData'
import { decodeQr } from './decodeQr'

/** Renders a QR code into an RGBA frame, like a camera frame with the card somewhere in it. */
function frameWithQr(text: string, { width = 640, height = 480, moduleSize = 6, left = 200, top = 100 } = {}) {
  const { modules } = QRCode.create(text, { errorCorrectionLevel: 'Q' })
  const rgba = new Uint8ClampedArray(width * height * 4).fill(235)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const row = Math.floor((y - top) / moduleSize)
      const col = Math.floor((x - left) / moduleSize)
      const dark = row >= 0 && col >= 0 && row < modules.size && col < modules.size && modules.get(row, col)
      const i = (y * width + x) * 4
      if (dark) rgba.fill(20, i, i + 3)
      rgba[i + 3] = 255
    }
  }
  return { rgba, width, height }
}

describe('decodeQr', () => {
  it('reads an artefact code from a camera-sized frame', () => {
    const url = GAME.artefacts['aadhaar-card'].qrUrl
    const { rgba, width, height } = frameWithQr(url)
    expect(decodeQr(rgba, width, height)).toBe(url)
  })

  it('reads a small, off-centre code', () => {
    const url = GAME.artefacts['recurring-deposit-account'].qrUrl
    const { rgba, width, height } = frameWithQr(url, { moduleSize: 3, left: 20, top: 300 })
    expect(decodeQr(rgba, width, height)).toBe(url)
  })

  it('returns null when there is no code', () => {
    const rgba = new Uint8ClampedArray(320 * 240 * 4).fill(200)
    expect(decodeQr(rgba, 320, 240)).toBeNull()
  })
})
