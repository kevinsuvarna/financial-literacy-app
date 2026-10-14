import jsQR from 'jsqr'
import { PDFDocument } from 'pdf-lib'
import { PNG } from 'pngjs'
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { ARTEFACT_IDS, GAME } from '../src/content/gameData.ts'
import { CARDS_PER_PAGE, MIN_QR_SIZE_MM, QR_SIZE_MM, isPlaceholderDomain, printCards, writePrintFiles } from './printArtefacts.ts'

let outDir: string

beforeAll(async () => {
  outDir = await mkdtemp(path.join(tmpdir(), 'print-'))
  await writePrintFiles(outDir)
}, 60_000)

afterAll(() => rm(outDir, { recursive: true, force: true }))

describe('npm run print (spec 10.3)', () => {
  it('writes one PNG per artefact, named <level>-<task>_<artefact-name>.png', async () => {
    const files = (await readdir(path.join(outDir, 'qr'))).sort()
    expect(files).toHaveLength(ARTEFACT_IDS.length)
    expect(files).toContain('L1-T2_aadhaar-card.png')
    for (const file of files) expect(file).toMatch(/^L[1-3]-T[1-5]_[a-z0-9-]+\.png$/)
  })

  it('encodes https://<game-domain>/a/<artefact-id> in every PNG', async () => {
    for (const card of printCards()) {
      const png = PNG.sync.read(await readFile(path.join(outDir, 'qr', card.fileName)))
      const code = jsQR(new Uint8ClampedArray(png.data), png.width, png.height)
      expect(code?.data).toBe(`https://${GAME.domain}/a/${card.id}`)
    }
  })

  it('lays every card out on A4 pages', async () => {
    const pdf = await PDFDocument.load(await readFile(path.join(outDir, 'artefacts.pdf')))
    expect(pdf.getPageCount()).toBe(Math.ceil(ARTEFACT_IDS.length / CARDS_PER_PAGE))
    const { width, height } = pdf.getPage(0).getSize()
    expect(Math.round((width / 72) * 25.4)).toBe(210)
    expect(Math.round((height / 72) * 25.4)).toBe(297)
  })

  it('prints codes at least 3 cm wide', () => {
    expect(QR_SIZE_MM).toBeGreaterThanOrEqual(MIN_QR_SIZE_MM)
    expect(MIN_QR_SIZE_MM).toBe(30)
  })

  it('writes a printing guide with settings and a row for every card', async () => {
    const guide = await readFile(path.join(outDir, 'PRINTING.md'), 'utf8')
    expect(guide).toContain('100% / Actual size')
    expect(guide).toContain('Fit to page')
    expect(guide).toContain('3 cm')
    for (const card of printCards()) expect(guide).toContain(`qr/${card.fileName}`)
  })

  it('shows the amount on each closing-balance card', () => {
    for (const card of printCards().filter((c) => c.id.startsWith('balance-card'))) {
      expect(card.amount).toBe(GAME.artefacts[card.id as keyof typeof GAME.artefacts].printedAmount)
    }
  })

  it('flags placeholder domains', async () => {
    expect(isPlaceholderDomain('save-the-savings.example')).toBe(true)
    expect(isPlaceholderDomain('localhost')).toBe(true)
    expect(isPlaceholderDomain('savethesavings.in')).toBe(false)
    const guide = await readFile(path.join(outDir, 'PRINTING.md'), 'utf8')
    expect(guide.includes('TEST PRINT')).toBe(isPlaceholderDomain(GAME.domain))
  })
})
