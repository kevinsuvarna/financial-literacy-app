# CLAUDE.md

Guidance for any agent (human or AI) working in this repository.

## Spec

The source of truth for product behaviour is [docs/SPEC.md](docs/SPEC.md). When a requirement is
unclear or seems to conflict with code, the spec wins — update the code, or raise the conflict,
rather than silently diverging.

## Rules

1. **Content lives in `packages/content`.** All content — text, amounts, answers, artefact IDs,
   feedback, hints — lives in `packages/content`, never hardcoded in components. Components read
   content; they don't author it.
2. **Progress changes only via XState events.** Game progress changes only through XState events.
   Components render state and send events — they never mutate progress directly.
3. **Artefact input goes through `ScanSource`.** All artefact input goes through a `ScanSource`
   emitting `ARTEFACT_SCANNED{id}`. Never advance via a generic Continue button when a scan or
   interaction is required.
4. **Scene types.** Scenes are one of `call | table | screen | cinematic`. Camera decoding runs
   only in `table` scenes.
5. **Fictional data only.** No input may accept real credentials. All banking data in the game is
   fictional.
6. **Accessibility.** Respect `prefers-reduced-motion`. Every drag/tap interaction has a keyboard
   alternative.
7. **Placeholder UI.** Until the Figma phase, styling only goes through theme tokens and
   `components/ui` primitives — no one-off hardcoded styles in feature components.
8. **Verify before committing.** After each task: typecheck, lint, test, then commit using
   Conventional Commits.
