/**
 * QR codes and print files for the physical artefacts (spec 10.3). Everything comes from the
 * content module, so codes never have to be matched to cards by hand:
 *   print/artefacts.pdf   A4 sheets: each QR in its card layout, a label, cut marks
 *   print/qr/*.png        one image per card, e.g. L1-T2_aadhaar-card.png
 *   print/PRINTING.md     print settings and which code goes on which card
 */
import fontkit from '@pdf-lib/fontkit'
import { PDFDocument, rgb, type PDFFont, type PDFPage } from 'pdf-lib'
import QRCode from 'qrcode'
import wawoff2 from 'wawoff2'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { ARTEFACT_IDS, GAME, formatRupees, type GameContent } from '../src/content/gameData.ts'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const PRINT_DIR = path.join(ROOT, 'print')
const FONT_DIR = path.join(ROOT, 'design', 'fonts')

/** Points per millimetre. */
const MM = 72 / 25.4
const A4 = { width: 210, height: 297 }
export const CARD_MM = { width: 90, height: 58 }
const GRID = { columns: 2, rows: 4, gutter: 6, top: 30 }
export const CARDS_PER_PAGE = GRID.columns * GRID.rows
/** Printed width of each QR symbol, not counting its white border. */
export const QR_SIZE_MM = 34
/** Spec 10.3: no printed QR smaller than 3 cm. */
export const MIN_QR_SIZE_MM = 30
/** Level Q survives a thumb over part of the code. */
const ERROR_CORRECTION = 'Q'
const PNG_WIDTH_PX = 1200
const PNG_QUIET_ZONE_MODULES = 4

const INK = rgb(0, 0, 0)
const GREY = rgb(0.45, 0.45, 0.45)
const WARNING = rgb(0.75, 0.08, 0.12)

/** True for domains that can't be the real game: QR codes printed with them won't open it. */
export function isPlaceholderDomain(domain: string): boolean {
  return /(^|\.)(example|test|invalid|localhost)$/.test(domain)
}

export interface PrintCard {
  id: string
  name: string
  /** e.g. L1-T2 */
  taskCode: string
  /** e.g. Level 1 · Task 2: Verify identity */
  taskTitle: string
  url: string
  fileName: string
  /** Closing-balance cards: the amount the card must show. */
  amount?: number
  note: string
}

const DOCUMENT_NOTES: Record<string, string> = {
  'bank-statement': 'Put this code on the printed bank statement.',
  'phishing-message-card': 'Put this code on the suspicious message card.',
  cheque:
    'Put this code on the printed cheque. It is not evidence: scanning it on the evidence screen gives friendly "not needed" feedback.',
}

/** One printable card per QR-coded artefact, in content order. */
export function printCards(game: GameContent = GAME): PrintCard[] {
  return ARTEFACT_IDS.map((id) => {
    const artefact = game.artefacts[id]
    const task = game.tasks[artefact.printTask]
    const level = game.levels.find((l) => l.id === task.level)!
    const taskNumber = level.tasks.indexOf(task.id) + 1
    const amount = artefact.printedAmount
    return {
      id,
      name: artefact.name,
      taskCode: `L${level.id}-T${taskNumber}`,
      taskTitle: `Level ${level.id} · Task ${taskNumber}: ${task.label}`,
      url: artefact.qrUrl,
      fileName: artefact.printFileName,
      ...(amount !== undefined ? { amount } : {}),
      note:
        DOCUMENT_NOTES[id] ??
        (amount !== undefined ? `The card must show ${formatRupees(amount)}.` : `Card labelled "${artefact.name}".`),
    }
  })
}

export function qrPng(url: string): Promise<Buffer> {
  return QRCode.toBuffer(url, {
    type: 'png',
    errorCorrectionLevel: ERROR_CORRECTION,
    margin: PNG_QUIET_ZONE_MODULES,
    width: PNG_WIDTH_PX,
  })
}

// ─── PDF ─────────────────────────────────────────────────────────────────────

interface Fonts {
  display: PDFFont
  mono: PDFFont
  monoBold: PDFFont
  /** ₹ as an outline: none of the static fonts has it, and the variable font that does can't be embedded. */
  rupee: { svgPath: string; unitsPerEm: number; advanceWidth: number }
}

/** A glyph outline as an SVG path. Font outlines are y-up and SVG is y-down, so y is flipped. */
function glyphSvgPath(commands: { command: string; args: number[] }[]): string {
  const letters: Record<string, string> = { moveTo: 'M', lineTo: 'L', quadraticCurveTo: 'Q', bezierCurveTo: 'C', closePath: 'Z' }
  return commands
    .map(({ command, args }) => letters[command] + args.map((value, i) => (i % 2 ? -value : value)).join(' '))
    .join('')
}

async function embedFonts(pdf: PDFDocument): Promise<Fonts> {
  pdf.registerFontkit(fontkit)
  // PDF readers need TrueType data, so the self-hosted woff2 files are decompressed first.
  const load = async (file: string) =>
    pdf.embedFont(await wawoff2.decompress(await readFile(path.join(FONT_DIR, file))), { subset: true })
  const nunito = fontkit.create(await readFile(path.join(FONT_DIR, 'nunito/nunito-latin-ext-wght-normal.woff2')))
  const rupee = nunito.glyphForCodePoint(0x20b9)
  // fontkit's Path has `commands` at runtime; its bundled types leave it out.
  const { commands } = rupee.path as unknown as { commands: { command: string; args: number[] }[] }
  return {
    display: await load('special-elite/special-elite-latin-400-normal.woff2'),
    mono: await load('courier-prime/courier-prime-latin-400-normal.woff2'),
    monoBold: await load('courier-prime/courier-prime-latin-700-normal.woff2'),
    rupee: { svgPath: glyphSvgPath(commands), unitsPerEm: nunito.unitsPerEm, advanceWidth: rupee.advanceWidth },
  }
}

/** Page coordinates: millimetres from the top-left, converted to PDF points from the bottom-left. */
const px = (mm: number) => mm * MM
const py = (mmFromTop: number) => (A4.height - mmFromTop) * MM

function wrap(text: string, font: PDFFont, size: number, widthMm: number): string[] {
  const lines: string[] = []
  let line = ''
  for (const word of text.split(' ')) {
    const next = line ? `${line} ${word}` : word
    if (line && font.widthOfTextAtSize(next, size) > px(widthMm)) {
      lines.push(line)
      line = word
    } else {
      line = next
    }
  }
  if (line) lines.push(line)
  return lines
}

function drawQr(page: PDFPage, url: string, leftMm: number, topMm: number) {
  const { modules } = QRCode.create(url, { errorCorrectionLevel: ERROR_CORRECTION })
  const module = QR_SIZE_MM / modules.size
  for (let row = 0; row < modules.size; row++) {
    let col = 0
    while (col < modules.size) {
      if (!modules.get(row, col)) {
        col++
        continue
      }
      const start = col
      while (col < modules.size && modules.get(row, col)) col++
      // A hair of overlap so no white seams appear between rows.
      page.drawRectangle({
        x: px(leftMm + start * module),
        y: py(topMm + (row + 1) * module + 0.01),
        width: px((col - start) * module),
        height: px(module + 0.02),
        color: INK,
      })
    }
  }
}

function drawCutMarks(page: PDFPage, leftMm: number, topMm: number) {
  const gap = 1
  const length = 2.5
  const xs = [leftMm, leftMm + CARD_MM.width]
  const ys = [topMm, topMm + CARD_MM.height]
  for (const x of xs) {
    for (const y of ys) {
      const outX = x === leftMm ? -1 : 1
      const outY = y === topMm ? -1 : 1
      // Horizontal mark along the card's top/bottom edge, vertical mark along its side.
      page.drawLine({ start: { x: px(x + outX * gap), y: py(y) }, end: { x: px(x + outX * (gap + length)), y: py(y) }, thickness: 0.5, color: INK })
      page.drawLine({ start: { x: px(x), y: py(y + outY * gap) }, end: { x: px(x), y: py(y + outY * (gap + length)) }, thickness: 0.5, color: INK })
    }
  }
}

function drawCard(page: PDFPage, fonts: Fonts, card: PrintCard, leftMm: number, topMm: number) {
  drawCutMarks(page, leftMm, topMm)
  const qrLeft = leftMm + 6
  const qrTop = topMm + (CARD_MM.height - QR_SIZE_MM) / 2
  drawQr(page, card.url, qrLeft, qrTop)

  const textLeft = qrLeft + QR_SIZE_MM + 6
  const textWidth = leftMm + CARD_MM.width - 4 - textLeft
  let cursor = topMm + 8

  page.drawText(card.taskCode, { x: px(textLeft), y: py(cursor), size: 8, font: fonts.monoBold, color: GREY })
  cursor += 6.5
  for (const line of wrap(card.name, fonts.display, 13, textWidth)) {
    page.drawText(line, { x: px(textLeft), y: py(cursor), size: 13, font: fonts.display, color: INK })
    cursor += 5.5
  }
  if (card.amount !== undefined) {
    cursor += 3
    const size = 18
    const digits = formatRupees(card.amount).replace('₹', '')
    const scale = size / fonts.rupee.unitsPerEm
    // The variable font's default weight is light: a stroke matches it to the bold digits.
    page.drawSvgPath(fonts.rupee.svgPath, { x: px(textLeft), y: py(cursor), scale, color: INK, borderColor: INK, borderWidth: 0.9 / scale })
    const rupeeWidth = fonts.rupee.advanceWidth * scale
    page.drawText(digits, { x: px(textLeft) + rupeeWidth + 1, y: py(cursor), size, font: fonts.monoBold, color: INK })
    cursor += 4
  }
  cursor += 2
  for (const line of wrap(card.taskTitle, fonts.mono, 7, textWidth)) {
    page.drawText(line, { x: px(textLeft), y: py(cursor), size: 7, font: fonts.mono, color: GREY })
    cursor += 3
  }
  // The code's content, small, so a mismatched card can be spotted by eye. Shrunk to fit one line.
  const address = card.url.replace('https://', '')
  const addressSize = Math.min(5.5, px(textWidth) / fonts.mono.widthOfTextAtSize(address, 1))
  page.drawText(address, { x: px(textLeft), y: py(topMm + CARD_MM.height - 6), size: addressSize, font: fonts.mono, color: GREY })
}

export async function artefactsPdf(cards: PrintCard[], domain: string): Promise<Uint8Array> {
  const pdf = await PDFDocument.create()
  pdf.setTitle('Save the Savings Account: QR artefact cards')
  pdf.setCreator('npm run print')
  // Fixed dates, so re-running with unchanged content gives the same file.
  pdf.setCreationDate(new Date('2026-01-01T00:00:00Z'))
  pdf.setModificationDate(new Date('2026-01-01T00:00:00Z'))
  const fonts = await embedFonts(pdf)
  const pageCount = Math.ceil(cards.length / CARDS_PER_PAGE)
  const gridLeft = (A4.width - (GRID.columns * CARD_MM.width + (GRID.columns - 1) * GRID.gutter)) / 2

  for (let p = 0; p < pageCount; p++) {
    const page = pdf.addPage([px(A4.width), px(A4.height)])
    page.drawText('Save the Savings Account: QR artefact cards', { x: px(gridLeft), y: py(11), size: 13, font: fonts.display })
    page.drawText(`Page ${p + 1} of ${pageCount}`, { x: px(A4.width - gridLeft - 22), y: py(11), size: 8, font: fonts.mono, color: GREY })
    page.drawText(
      `Print at 100% / Actual size. Turn off "Fit to page". Each code should measure ${QR_SIZE_MM / 10} cm across.`,
      { x: px(gridLeft), y: py(17), size: 8, font: fonts.mono },
    )
    if (isPlaceholderDomain(domain)) {
      page.drawText(`TEST PRINT: the game address (${domain}) is a placeholder. Set GAME_DOMAIN before printing for players.`, {
        x: px(gridLeft),
        y: py(23),
        size: 7.5,
        font: fonts.monoBold,
        color: WARNING,
      })
    }
    cards.slice(p * CARDS_PER_PAGE, (p + 1) * CARDS_PER_PAGE).forEach((card, i) => {
      const col = i % GRID.columns
      const row = Math.floor(i / GRID.columns)
      drawCard(
        page,
        fonts,
        card,
        gridLeft + col * (CARD_MM.width + GRID.gutter),
        GRID.top + row * (CARD_MM.height + GRID.gutter),
      )
    })
  }
  return pdf.save()
}

// ─── Guide ───────────────────────────────────────────────────────────────────

export function printingGuide(cards: PrintCard[], domain: string): string {
  const warning = isPlaceholderDomain(domain)
    ? `> **TEST PRINT.** The game address \`${domain}\` is a placeholder, so these codes won't open the real game. Set \`GAME_DOMAIN\` in \`src/content/gameData.ts\`, then run \`npm run print\` again before printing for players.\n\n`
    : ''
  const rows = cards
    .map((c) => `| \`qr/${c.fileName}\` | ${c.name} | ${c.taskTitle} | ${c.note} | \`${c.url}\` |`)
    .join('\n')
  return `# Printing the QR artefact cards

Generated by \`npm run print\` from \`src/content/gameData.ts\`. Don't edit these files by hand: change the content and run the command again.

${warning}## Print settings

- Paper: **A4, portrait**. Plain white paper or matte card. Avoid glossy paper: glare stops the scanner.
- Scale: **100% / Actual size**. Turn **off** "Fit to page", "Shrink to fit" and "Scale to fit".
- Colour or black and white both work.
- **Minimum printed QR size: 3 cm** across, not counting the white border. \`artefacts.pdf\` prints each code at ${QR_SIZE_MM / 10} cm. Measure one with a ruler before cutting; if it's smaller, the scale setting is wrong.
- Keep the white border around every code. Don't trim into it, and don't put artwork on it.
- Cut along the cut marks.

## Files

- \`artefacts.pdf\`: ${Math.ceil(cards.length / CARDS_PER_PAGE)} A4 pages, ${CARDS_PER_PAGE} cards per page. Each card has its QR code, label and cut marks.
- \`qr/\`: one ${PNG_WIDTH_PX} px PNG per card, for placing codes in your own card designs. Print each at least 3 cm wide and keep its white border.

## Which code goes on which card

| Image | Card | Used in | Notes | QR content |
|---|---|---|---|---|
${rows}

## Checking the printed cards

1. Scan a few cards with a normal phone camera. Each should open the friendly "This card is part of a game" page.
2. In the game, open a table screen, tap **TURN ON SCANNER** and hold each card up to the camera. A card from another task gets friendly feedback, never an error.
`
}

// ─── Files ───────────────────────────────────────────────────────────────────

/** Writes the PDF, PNGs and guide. Returns the paths written, relative to `outDir`. */
export async function writePrintFiles(outDir: string = PRINT_DIR, game: GameContent = GAME): Promise<string[]> {
  if (QR_SIZE_MM < MIN_QR_SIZE_MM) throw new Error(`QR codes must print at least ${MIN_QR_SIZE_MM} mm wide`)
  const cards = printCards(game)
  const qrDir = path.join(outDir, 'qr')
  await rm(qrDir, { recursive: true, force: true })
  await mkdir(qrDir, { recursive: true })

  const written: string[] = []
  for (const card of cards) {
    await writeFile(path.join(qrDir, card.fileName), await qrPng(card.url))
    written.push(path.join('qr', card.fileName))
  }
  await writeFile(path.join(outDir, 'artefacts.pdf'), await artefactsPdf(cards, game.domain))
  await writeFile(path.join(outDir, 'PRINTING.md'), printingGuide(cards, game.domain))
  written.push('artefacts.pdf', 'PRINTING.md')
  return written
}
