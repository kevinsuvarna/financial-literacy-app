/** `npm run print`: writes print/artefacts.pdf, print/qr/*.png and print/PRINTING.md (spec 10.3). */
import path from 'node:path'
import { GAME } from '../src/content/gameData.ts'
import { PRINT_DIR, isPlaceholderDomain, writePrintFiles } from './printArtefacts.ts'

const written = await writePrintFiles(PRINT_DIR)
const relative = path.relative(process.cwd(), PRINT_DIR) || '.'
console.log(`Wrote ${written.length} files to ${relative}/:`)
for (const file of written) console.log(`  ${file}`)
if (isPlaceholderDomain(GAME.domain)) {
  console.warn(
    `\n⚠ TEST PRINT: GAME_DOMAIN is "${GAME.domain}", a placeholder. Set the real domain in src/content/gameData.ts and run npm run print again before printing for players.`,
  )
}
