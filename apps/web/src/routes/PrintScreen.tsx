import { artefacts, copy, type Artefact } from '@app/content';
import { Button, ButtonLink, CutCard, Heading, PrintSheet, Text } from '../components/ui';

/** Two across and four down: what fits on A4 at the card size in the theme. */
const CARDS_PER_SHEET = 8;

function sheetsOf(cards: readonly Artefact[]): Artefact[][] {
  const sheets: Artefact[][] = [];
  for (let start = 0; start < cards.length; start += CARDS_PER_SHEET) {
    sheets.push(cards.slice(start, start + CARDS_PER_SHEET));
  }
  return sheets;
}

/**
 * The physical half of the game, ready to print: every artefact in the registry as a card with
 * its QR code, laid out on A4 sheets to be cut along the crop marks.
 *
 * The codes are the SVGs that `pnpm qr` generates from the same registry (public/qr), and the
 * cards carry only what the registry says — so a new artefact appears here by itself once its
 * code has been generated. The card faces are placeholders until the Figma artwork exists.
 *
 * This screen stands outside the game: it has no tracker, needs no game in progress, and
 * changes nothing.
 */
export function PrintScreen() {
  const sheets = sheetsOf(artefacts);

  return (
    <main className="flex flex-col items-center gap-6 px-4 py-6 print:block print:p-0">
      <header className="flex max-w-prose flex-col items-center gap-3 text-center print:hidden">
        <Heading level={1} size="display">
          {copy.print.heading}
        </Heading>
        <Text>{copy.print.intro}</Text>
        <Text size="sm" tone="muted">
          {copy.print.sizeNote}
        </Text>
        <div className="flex flex-wrap justify-center gap-3">
          <Button onClick={() => window.print()}>{copy.print.print}</Button>
          <ButtonLink to="/" variant="secondary">
            {copy.print.back}
          </ButtonLink>
        </div>
      </header>

      {/* A sheet is a fixed 210 mm wide: on a narrow screen it scrolls rather than shrinks. */}
      <div className="flex max-w-full flex-col gap-6 overflow-x-auto print:block print:overflow-visible">
        {sheets.map((cards, index) => (
          <PrintSheet
            key={cards[0]?.id ?? index}
            data-sheet={index + 1}
            aria-label={copy.print.sheet(index + 1, sheets.length)}
            footer={`${copy.appTitle} · ${copy.print.sheet(index + 1, sheets.length)} · ${copy.print.sheetNote}`}
          >
            <div className="grid grid-cols-2 gap-x-card-gap-x gap-y-card-gap-y">
              {cards.map((artefact) => (
                <CutCard
                  key={artefact.id}
                  data-artefact={artefact.id}
                  className="flex items-center gap-3 p-3"
                >
                  <img
                    src={`${import.meta.env.BASE_URL}qr/${artefact.id}.svg`}
                    alt={copy.print.qrAlt(artefact.label)}
                    className="size-qr shrink-0"
                  />
                  <div className="flex min-w-0 flex-col gap-1.5">
                    <Text size="sm" tone="muted" className="tracking-widest uppercase">
                      {copy.print.kinds[artefact.kind]}
                    </Text>
                    <Heading level={2} size="section" className="leading-tight">
                      {artefact.label}
                    </Heading>
                    <Text as="span" className="font-display text-xs text-ink-muted">
                      {artefact.id}
                    </Text>
                  </div>
                </CutCard>
              ))}
            </div>
          </PrintSheet>
        ))}
      </div>
    </main>
  );
}
