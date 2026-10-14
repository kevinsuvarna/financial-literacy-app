# Build a Phygital Financial Literacy Game — Save Ananya's Savings Account

> **How to use this document:** Sections 1–8 define *what* the game does. Section 9 defines *how it looks*. Section 10 defines technical requirements. Section 11 defines testing. Section 12 defines *how we work* and applies to every session. Section 13 maps every mockup image to its route and game state.
>
> Values marked `[FILL]` are optional for the project owner to supply. If one is needed and still empty, make a best guess following Section 12.5. Do not stop to ask.

## 1. Project Overview

Build an interactive, web-based financial literacy game for middle-school children (approximately 12–14 years old). The game combines a digital investigation interface with physical printed artefacts. Players scan QR codes on physical cards and documents to progress through the game.

The player takes on the role of a **Junior Bank Officer** and must help Ananya, a young girl, investigate suspicious activity in her savings account, identify a possible scam, and submit an incident report.

The game should teach children practical banking skills through a story-driven investigation rather than conventional lessons or quizzes.

**Core learning objectives:**
- Understand savings accounts and basic KYC requirements.
- Recognise the purpose of bank withdrawal slips.
- Read bank statements and calculate closing balances.
- Understand why a cheque may be returned.
- Identify suspicious transactions.
- Recognise phishing attempts and respond safely.
- Collect evidence and report suspected fraud.

## 2. Core Interaction Mechanism: Phygital Gameplay

The game runs in a web browser. **The primary device is an iPad in landscape orientation.** Laptops and desktops must also work. The player also receives a physical case file containing printed artefacts.

Physical artefacts include:
- Ananya's case file.
- Bank account type cards (4).
- Identity document cards (4).
- Deposit and withdrawal slips.
- Closing-balance answer cards (3–4 amounts, exactly one correct).
- A cheque.
- A bank statement.
- A phishing message/link card.

Each relevant physical artefact contains a unique QR code. When the player scans a QR code, the application identifies the artefact and evaluates whether it is appropriate for the current task.

The application must:
1. Display a task or question.
2. Prompt the player to scan or interact with the relevant artefact.
3. Identify the scanned QR code.
4. Check whether it is correct for the current task.
5. Display contextual feedback.
6. Allow the player to retry if incorrect.
7. Unlock the next task when the required condition is met.

**Scanning is active only on screens showing the perspective of cards placed on a table.** All other screens use on-screen interactions only (see 10.2).

Not every interaction uses QR scanning. Some tasks use direct touch interactions, such as tapping a cheque to identify an error or dragging an on-screen highlighter over a bank statement.

Implement QR scanning as a working interaction when camera access is available. Provide a fallback for development and testing, such as selecting a simulated artefact from a list. Do not pretend a QR code was scanned when no scan or simulated selection occurred.

**Interaction quality:** every interaction must feel like a game, not a form. Use tactile motion, sound and satisfying feedback, so it feels like handling real objects at a detective's desk. This matters most for:
- the cheque investigation (5, Task 2)
- highlighting the statement / weekly log (5, Task 3)
- entering the passkey on the on-screen computer (6, Task 3)

## 3. Narrative and Starting Screen

### Starting screen — Save the Savings Account

Use the title:

**SAVE THE SAVINGS ACCOUNT**

Introduce the player as a new Junior Bank Officer.

Primary CTA: **START TRAINING**

On clicking the CTA, begin the introductory call from Ananya.

### Opening call

Ananya calls frantically and explains that she thinks her pocket money has been stolen from her bank account. The call becomes disconnected before she can explain everything.

The player receives a new case assignment.

Display a case-assigned screen explaining that Ananya needs help and that her physical case file contains the clues needed to investigate.

Primary CTA: **OPEN CASE FILE**

The first task begins.

## 4. Level 1 — Understand the Account

This level introduces the account, identity verification, and a basic banking process.

### Task 1: Identify the Account

Display:

**WHAT TYPE OF BANK ACCOUNT DOES ANANYA HAVE?**

Show four options represented by physical QR-coded cards:
- Savings Account
- Current Account
- Fixed Deposit Account
- Recurring Deposit Account

The player scans the correct physical card.

Correct answer: Savings Account.

On a correct scan, explain briefly that a savings account lets Ananya keep money in the bank while retaining access to it for suitable withdrawals and payments.

On an incorrect scan, explain the distinction and invite the player to try again.

Unlock Task 2 after the correct answer.

### Task 2: Verify Identity

Display:

**WHICH DOCUMENTS CAN ANANYA USE TO VERIFY HER IDENTITY?**

Provide physical document cards representing:
- Expired passport
- Library card
- PAN card
- Aadhaar

The player must scan both the PAN card and Aadhaar card. Either can be scanned first.

Keep the task incomplete until both required cards have been scanned. Incorrect documents trigger explanatory feedback without advancing the level. Re-scanning an already accepted card shows "Already verified", not an error.

Once both required documents have been scanned, display a successful identity-verification message and unlock Task 3.

### Task 3: Choose the Withdrawal Slip

Display:

**WHICH SLIP WOULD ANANYA NEED TO TAKE MONEY OUT OF HER ACCOUNT?**

Provide two physical artefacts:
- Deposit slip
- Withdrawal slip

The player scans the appropriate slip.

Correct answer: Withdrawal slip.

Explain that a withdrawal slip is used to request money out of an account, whereas a deposit slip is used when putting money into an account.

On success, complete Level 1 and transition to Level 2.

## 5. Level 2 — Follow the Money

This level asks the player to investigate what happened to Ananya's money by examining banking documents.

### Task 1: Calculate the Closing Balance

Display the bank statement and ask:

**HOW MUCH MONEY IS LEFT IN ANANYA'S ACCOUNT?**

The player examines the statement and scans the closing-balance answer card with the correct amount. If the mockup for this screen shows on-screen choices instead, follow the mockup.

Use the values and transaction records from the Figma designs and game artefacts. The opening balance, credits, debits, and closing balance must be arithmetically consistent. The closing balance is computed from the transactions, never typed in separately.

Give hints when the answer is incorrect. On success, explain how money coming into the account increases the balance and money going out decreases it.

### Task 2: Investigate the Returned Cheque

The player notices that the bank statement contains a cheque transaction followed by a returned-cheque entry.

Display:

**WAIT — THE CHEQUE WAS RETURNED. CAN YOU FIND OUT WHY?**

Show the physical cheque on screen as an interactive artefact.

This interaction is touch-based, not QR-based. The player taps different areas of the cheque to investigate the details.

The cheque contains a mismatch between the amount written in numbers and the amount written in words. **Both amounts must end in the same last digit**, so the passkey in 6, Task 3 is unambiguous.

The player must tap the amount field to identify the discrepancy.

On the correct tap:
- Highlight the mismatch.
- Explain that the amount in numbers and words does not match.
- Explain that this can cause a cheque to be returned.
- Allow the player to continue.

Tapping other areas should provide feedback such as "This detail looks correct. Keep investigating."

### Task 3: Find the Suspicious Transaction

Display Ananya's bank statement and prompt:

**ONE TRANSACTION TELLS A DIFFERENT STORY. CAN YOU FIND IT?**

The player must drag an on-screen highlighter onto the suspicious transaction.

Use the existing statement design. The suspicious transaction is the ₹5,999 Mobile Recharge transaction associated with CAMS TEL.

The player should be able to move the highlighter across different transactions and receive feedback for each selection.

When the suspicious transaction is highlighted:
- Mark it as a clue.
- Explain that Ananya does not remember making this transaction.
- Encourage the player to investigate further rather than claiming that the transaction is conclusively fraudulent.

On success, complete Level 2 and begin Level 3.

## 6. Level 3 — Secure and Report

This level introduces phishing, evidence collection, and incident reporting.

### Task 1: Spot the Phish

Ananya calls again.

She explains that her debit card has been blocked and that she has received a message offering to unblock it immediately through a link.

Display the question:

**SHOULD ANANYA CLICK THE LINK?**

Provide two choices:

- **NO — DON'T CLICK THE LINK**
- **YES — CLICK THE LINK**

If the player selects NO:
- Congratulate the player for checking before acting.
- Explain that unexpected, urgent messages can be phishing attempts.
- Advise checking card status through official bank channels.
- Continue the investigation.

If the player selects YES:
- Show a simulated suspicious webpage asking for banking information.
- Its fields must not accept typed input. Tapping a field auto-fills obviously fictional values (e.g. "XXXX-0000").
- Explain that scammers may try to collect sensitive information through fake pages.
- If the game demonstrates a resulting fraudulent transaction, make it clear that the loss occurs in the simulation after information is entered, not merely because a link was clicked.
- Explain the safer action and let the player continue.

The game should teach safe behaviour without collecting any real personal, card, PIN, password, or OTP information.

### Task 2: Uncover the Scam

Show a short narrative screen using the CAMS TEL scam backstory and visual assets from the Figma file.

Connect the CAMS TEL name appearing in the suspicious bank statement transaction with the name appearing in the phishing message.

The player should recognise the connection between these clues and identify the suspected scam operation.

Keep this as a story-driven discovery rather than introducing an unrelated quiz.

### Task 3: Unlock the Evidence File

Display a locked file on an on-screen computer, requiring a three-digit passkey.

Show this hint:

**THREE CLUES HOLD THE PASSKEY**

Enter the last digit of each value, in this order:

1. The closing balance.
2. The amount on the cheque.
3. The suspicious transaction.

The passkey is derived from the game data, never hardcoded. Validate the entered code against the derived three-digit passkey.

On success, unlock the evidence file and explain that the player has connected the key clues.

If incorrect, allow another attempt. Give increasingly useful hints without revealing the full passkey.

### Task 4: Scan Evidence

Display a **SCAN EVIDENCE** screen.

The player must scan the two relevant physical artefacts:
- Bank statement, containing the suspicious CAMS TEL transaction.
- Phishing-link/message card, representing the message offering to unblock Ananya's debit card.

Show a separate evidence slot for each artefact. Mark each slot as complete after the corresponding QR code has been recognised.

The task cannot proceed until both pieces of evidence are attached.

The cheque is not required as evidence for this incident report, because its returned-payment issue has already been explained separately. Scanning it shows friendly feedback saying so.

### Task 5: Review and Submit Incident Report

Display an incident-report review screen containing:

**REVIEW INCIDENT REPORT**

**Customer:** Ananya Sharma  
**Transaction:** ₹5,999  
**Concern:** Suspected fraud

**Evidence attached**
- Bank statement — unrecognised CAMS TEL transaction
- Suspicious message — link claiming to unblock debit card

Include the instruction:

"Check that both pieces of evidence are attached before submitting."

Primary CTA: **SUBMIT INCIDENT REPORT**

When clicked, validate that all required evidence is attached, then show a successful report-submission screen. Describe the report as submitted for investigation, without assuming the suspected fraud has been proven.

## 7. Mission Complete — Certificate Screen

After successful submission, display a certificate-style completion screen in the same visual style as the game.

Suggested copy:

**MISSION COMPLETE**

**GOOD JOB, OFFICER!**

Ananya has been notified about the report.

You didn't just help Ananya take action to protect her account. You also learned how a savings account works, how to track money coming in and going out, and how to keep your money safe.

Award the player a **Junior Bank Officer** certificate or badge.

Provide a clear CTA to return to the Case Board or replay the mission.

## 8. Navigation and Progress Tracking

The interface has two persistent navigation elements.

### Top progress tracker

Display the three main levels:
1. Understand the Account
2. Follow the Money
3. Secure & Report

The current level should be highlighted. Completed levels should show a checkmark. Future levels should appear locked until unlocked.

Within each level, display a smaller task tracker showing:
- Completed tasks.
- Current task.
- Remaining tasks.

### Case Board

Provide a Case Board icon that opens a pin-up-board-style level selection screen.

Display three pinned level cards:
- **01 — Understand the Account**
- **02 — Follow the Money**
- **03 — Secure & Report**

The board should show each level's status: locked, available, in progress, or completed.

Players should be able to revisit completed tasks and resume their current unlocked task. Revisiting a completed task never changes progress. Preserve progress when navigating away from a task or returning to the Case Board.

Do not allow the player to skip required tasks or access locked future levels.

## 9. Visual Design

### 9.1 Design reference

The mockups in `/design/screens/` are the source of truth for all visuals and override any previously built screens. Section 13 maps each mockup to its route and game state.

- **Target viewport (design canvas):** 1280 × 831 `[FILL: confirm this matches the Figma frame size]`
- **Scaling:** every screen is built on a fixed 1280 × 831 canvas, scaled proportionally to fit the device (letterboxed with the background colour if the aspect ratio differs). This keeps layouts identical to the mockups on every iPad and laptop.
- **Filled-in typography and colour tokens are exact and locked.** Never substitute or approximate them. A token still marked `[FILL]` is guessed following Section 12.5.
- Components use tokens only, never raw hex values or font names, so replacing a guessed value updates every screen at once.

### 9.2 Colour tokens

| Token | Use | Hex |
|---|---|---|
| `--bg-navy` | Main background | `[FILL]` |
| `--bg-grid` | Background grid lines | `[FILL]` |
| `--paper-cream` | Panels, cards | `[FILL]` |
| `--paper-aged` | Aged-paper documents | `[FILL]` |
| `--gold` | Antique gold details, borders | `[FILL]` |
| `--thread-red` | Investigation thread, clue accents | `[FILL]` |
| `--cta-turquoise` | Primary buttons | `[FILL]` |
| `--cta-turquoise-hover` | Button hover/pressed | `[FILL]` |
| `--ink` | Body text on paper | `[FILL]` |
| `--text-on-dark` | Text on navy | `[FILL]` |
| `--success` | Correct feedback | `[FILL]` |
| `--error` | Incorrect feedback | `[FILL]` |

### 9.3 Typography tokens

| Token | Use | Font family | Weights | Sizes |
|---|---|---|---|---|
| `--font-display` | Distressed typewriter headings | `[FILL]` | `[FILL]` | `[FILL]` |
| `--font-body` | Body text, instructions | `[FILL]` | `[FILL]` | `[FILL]` |
| `--font-ui` | Buttons, tracker labels | `[FILL]` | `[FILL]` | `[FILL]` |
| `--font-mono` | Statement figures, terminal | `[FILL]` | `[FILL]` | `[FILL]` |

Font files are stored in `/design/fonts/` and self-hosted (no runtime font CDN, so offline play works).

### 9.4 Style direction

The visual style is a playful detective investigation:
- Deep navy-blue background with a subtle grid.
- Warm cream and aged-paper panels.
- Antique gold details.
- Red investigation thread and clue accents.
- Slightly distressed, typewriter-inspired headings.
- Rounded turquoise CTAs.
- Textured physical documents, pins, case files, and evidence cards.
- Clear, readable body text suitable for middle-school students.

Do not replace the design with a generic financial dashboard or conventional educational website. The digital environment should feel like a detective's desk and investigation interface. Physical artefacts should visually match the corresponding digital screens.

### 9.5 Per-screen measurements

When a screen is built, record its measured values here (or in its Section 13 row) so later screens stay consistent: layout grid, spacing scale, border radii, shadows.

- Spacing scale: `[to be recorded from first mockup]`
- Border radii: `[to be recorded]`
- Shadows: `[to be recorded]`

## 10. Functional and Technical Requirements

### 10.1 Core requirements

Build the experience as a browser-based application. The application must support:
- Sequential level and task progression.
- QR-code recognition for physical artefacts.
- Simulated artefact selection when camera scanning is unavailable.
- Touch-based cheque investigation.
- Drag-and-drop highlighting of statement transactions.
- Correct and incorrect answer feedback.
- Multi-document completion requirements for KYC and evidence collection.
- Passkey validation.
- Incident-report submission state.
- Persistent progress and resume functionality.
- Case Board navigation.
- Mission-completion certificate.

Keep game state centralised, so the tracker, Case Board, and task screens always reflect the same progress.

Keep all game content (text, amounts, answers, artefact IDs, feedback, hints) in one data module. Components must not contain answers.

Represent artefacts using unique identifiers mapped to their QR codes. Do not advance the game merely because the player presses a generic Continue button when an artefact scan or interaction is required.

Use fictional banking data throughout. Do not collect real banking credentials or sensitive personal information. Store no personally identifiable information about players.

### 10.2 Camera and scanning

- **When it runs:** the camera decodes only on screens showing the perspective of cards placed on a table. On all other screens, decoding is off.
- **Hidden feed:** scanning runs in the background. The live camera feed is never shown. Show scanning feedback in the game's style instead: an animated reticle, a "hold the card up to the scanner" hint, and a chime or flash on a successful scan.
- **iPad (primary):**
  - In landscape, players hold cards up to the front camera (centred on the long edge on newer iPads).
  - Safari, served over HTTPS (also required for LAN testing).
  - Request the camera with `facingMode: "user"`, triggered by a user tap, after an in-story explanation.
  - The video element must be `playsinline` and `muted`, and kept in the DOM (tiny and transparent, never `display: none`).
  - Must work in both Safari tabs and Home Screen mode.
  - Recover automatically when the app returns from the background or the tab becomes visible again.
- **Laptop/desktop:** use the built-in webcam the same way. If no camera is available or permission is denied, fall back to simulated artefact selection.
- **Robustness:**
  - The same artefact detected repeatedly within a short window counts once.
  - Input is locked while feedback animates.
  - An unrelated QR code gets friendly in-game feedback ("That's not part of the case file, Officer"), never an error.

### 10.3 QR codes and printing

QR generation and validation are fully automated. The project owner must never need to match codes to cards by hand.

- Each QR encodes `https://<game-domain>/a/<artefact-id>`. If scanned with a normal phone camera, it opens a friendly page rather than gibberish.
  - `<game-domain>` comes from the single constant `GAME_DOMAIN` in `src/content/gameData.ts`: `[GUESSED: save-the-savings.example]`. Set the real domain before printing. The scanner only accepts codes for this domain.
- Validation (does this artefact answer the current task?) happens in the game logic, using the central content data.
- One command produces:
  1. `print/artefacts.pdf`: print-ready A4 sheets with each QR placed inside its card layout, a clear label, and cut marks.
  2. `print/qr/<level>-<task>_<artefact-name>.png` (e.g. `L1-T2_aadhaar-card.png`): individual images for anyone placing codes in their own card designs.
  3. `print/PRINTING.md`: print settings (100% scale, no "fit to page"), minimum printed QR size (3 cm), and a table of which code goes on which card.

## 11. Build Approach and Testing

Build in stages (Section 12.1). Game flow and interaction logic may be built ahead of visuals. Visuals are built only for the current stage's mockups.

Before considering the game complete, test:
- Correct and incorrect QR scans.
- Scanning the two KYC documents in either order.
- Attempting to continue before all required evidence is scanned.
- The cheque's touch interaction.
- Dragging the highlighter onto correct and incorrect transactions.
- Both YES and NO phishing choices.
- Correct and incorrect passkey entries.
- Incident-report submission.
- Leaving a level and resuming from the Case Board.
- Real-camera scanning on an iPad in landscape, in both a Safari tab and Home Screen mode.
- Scanning with no camera or with permission denied (fallback works).

The finished experience should feel like a cohesive, interactive investigation in which children learn practical banking skills by handling physical artefacts, interpreting evidence, making decisions, and seeing the consequences of their actions.

## 12. Working Rules (apply to every session)

### 12.1 Working in stages
- Work one stage at a time. Stages and the screens each one covers are defined in Section 13.2.
- Do not build, style or stub visuals for screens from future stages.
- A stage ends when the project owner confirms it. Then move to the next.

### 12.2 Design images
- Every screen has a fixed file name in Section 13.1. The project owner exports each Figma frame as a PNG with that exact name and places it in `/design/screens/` before running the prompt that needs it.
- Every Claude Code prompt in the build plan must begin with an **"Images needed"** block that lists, for that prompt only:
  - each file name from Section 13.1, with its friendly name (e.g. `05-L1T2-verify-identity.png` — "Verify Identity (KYC cards on table)");
  - or `Images needed: none` if the prompt is functionality-only.
- A prompt must never refer to an image that isn't in its "Images needed" block.
- When a prompt starts, first check that every listed image exists in `/design/screens/`. If one is missing, stop and tell the project owner which file to add. Don't build the screen from memory or from another screen's image.
- Variants of a screen (e.g. one card scanned, wrong-answer state) use the same number plus a letter: `05b-L1T2-verify-identity-one-scanned.png`. Add a row to Section 13.1 for each variant.
- If the Figma file has no design for a screen in the map, its status is "No mockup". Build it in the established style from earlier screens, and say so.
- For a given screen, use only that screen's image(s).

### 12.3 Before writing code for a screen
1. Describe every visual element in the mockup: layout grid, spacing, border radii, shadows, font sizes and weights, and colours (cross-checked against Section 9).
2. Proceed with reasonable guesses for anything unclear, and list each guess at the end.
3. Stop and ask only if a guess would change game logic or interaction behaviour.
4. Update this spec (Section 9.5 and the Section 13 row) with the measured values.

### 12.4 Visual verification loop
1. Use Playwright to open the screen at exactly 1280 × 831, with fonts loaded and animations paused, and take a screenshot.
2. Compare it with the mockup. List every difference, largest first, and fix them.
3. Repeat until the only remaining differences are:
   - items that need assets not yet provided, or
   - sub-pixel font-rendering noise.
4. Stop after 8 iterations at most.
5. Finish by listing the missing assets needed from the project owner.

### 12.5 Guessing missing values
When a `[FILL]` value is needed and still empty:
- **Colours:** sample them from the mockup PNG with a script, using flat areas only (not gradients, textures or shadows). Reuse one value per token across all screens.
- **Fonts:** choose the closest free match (e.g. from Google Fonts) and self-host it in `/design/fonts/`.
- **Viewport or other values:** use the mockup's pixel dimensions or measurements.
- **Record the guess:** replace `[FILL]` with `[GUESSED: <value>]` in this spec, and list every new guess at the end of the response.
- **Owner values win:** if the owner later provides a real value, replace the guess in the token only, then re-run the verification loop (12.4) on screens already built.

## 13. Screen Map

### 13.1 Screens and image file names

Export each Figma frame with the file name below. The friendly name is what prompts and conversations use.

| # | Image file (in `/design/screens/`) | Friendly name | Spec section | Scene type | Status |
|---|---|---|---|---|---|
| 01 | `01-start.png` | Start screen ("Save the Savings Account") | 3 | screen | Not started |
| 02 | `02-call-ananya-1.png` | Ananya's first phone call | 3 | call | Not started |
| 03 | `03-case-assigned.png` | Case assigned ("Open Case File") | 3 | cinematic | Not started |
| 04 | `04-L1T1-account-type.png` | Account type cards on table | 4, Task 1 | table | Not started |
| 05 | `05-L1T2-verify-identity.png` | Verify Identity (KYC cards on table) | 4, Task 2 | table | Not started |
| 06 | `06-L1T3-withdrawal-slip.png` | Deposit vs withdrawal slips on table | 4, Task 3 | table | Not started |
| 07 | `07-L1-complete.png` | Level 1 complete | 4 | cinematic | Not started |
| 08 | `08-L2T1-closing-balance.png` | Closing balance (statement + answer cards) | 5, Task 1 | table | Not started |
| 09 | `09-L2T2-cheque.png` | Cheque investigation | 5, Task 2 | screen | Not started |
| 10 | `10-L2T3-highlighter.png` | Highlight the suspicious transaction | 5, Task 3 | screen | Not started |
| 11 | `11-L2-complete.png` | Level 2 complete | 5 | cinematic | Not started |
| 12 | `12-call-ananya-2.png` | Ananya's second phone call | 6, Task 1 | call | Not started |
| 13 | `13-L3T1-phishing-choice.png` | Should Ananya click the link? | 6, Task 1 | screen | Not started |
| 14 | `14-L3T1-fake-website.png` | Fake bank website (YES path) | 6, Task 1 | screen | Not started |
| 15 | `15-L3T2-scam-reveal.png` | CAMS TEL scam reveal | 6, Task 2 | cinematic | Not started |
| 16 | `16-L3T3-passkey-computer.png` | Passkey on the on-screen computer | 6, Task 3 | screen | Not started |
| 17 | `17-L3T4-scan-evidence.png` | Scan evidence (statement + phishing card) | 6, Task 4 | table | Not started |
| 18 | `18-L3T5-review-report.png` | Review incident report | 6, Task 5 | screen | Not started |
| 19 | `19-report-submitted.png` | Report submitted | 6, Task 5 | cinematic | Not started |
| 20 | `20-certificate.png` | Mission complete certificate | 7 | cinematic | Not started |
| 21 | `21-case-board.png` | Case Board (level select) | 8 | screen | Not started |
| 22 | `22-feedback-popups.png` | Correct / incorrect feedback pop-ups | 2 | overlay | Not started |

The top progress tracker (Section 8) appears inside task screens, so it is built from the first task screen it appears in (04) and checked on later ones.

Scene types: `call` (phone call), `table` (cards on a table: camera active), `screen` (on-screen interaction), `cinematic` (narrative), `overlay` (appears over other screens).

### 13.2 Stages

| Stage | What gets built | Images needed | Status |
|---|---|---|---|
| 0 | Full game logic, scanning, QR printing, placeholder UI for every screen | `01-start.png` (overall theme and mood only, not layout) | In progress: scaffold, content data module, game state core and tests done (see 13.3). Scanning, QR printing and placeholder UI to do. |
| 1 | Opening sequence | `01-start.png`, `02-call-ananya-1.png`, `03-case-assigned.png` | Not started |
| 2 | Level 1 + progress tracker + feedback pop-ups | `04` to `07`, `22-feedback-popups.png` | Not started |
| 3 | Case Board | `21-case-board.png` | Not started |
| 4 | Level 2 | `08` to `11` | Not started |
| 5 | Level 3, part 1 | `12` to `15` | Not started |
| 6 | Level 3, part 2 | `16` to `19` | Not started |
| 7 | Certificate + final polish | `20-certificate.png` | Not started |

The owner may reorder stages, or split a stage into more prompts, but each prompt still lists its own images (Section 12.2).

### 13.3 Build log

**Stage 0, prompt 1 (2026-10-14): scaffold, content data module, game state core.**

- Stack: Vite 8, React 19, TypeScript 6, react-router, zustand (persist), motion, howler, vitest, Playwright (config at 1280 × 831; browsers not yet installed: `npx playwright install chromium`), `@vitejs/plugin-basic-ssl` (dev server on HTTPS and the LAN).
- `src/content/gameData.ts` holds all content. `buildGameContent(CASE_FIGURES)` derives running balances, the closing balance, answer-card amounts, the cheque amount in words, the passkey and every figure-dependent line of copy.
- `src/state/gameStore.ts` holds all progress and answer checking. Persisted under the localStorage key `save-the-savings-account` (progress only, no player data). Stored progress is sanitised on load, so edited storage can't skip locked tasks.
- Tests: `npm test` (74 passing).

PLACEHOLDER case figures (replace with Stage 4 mockup values; everything else re-derives):

| Item | Value |
|---|---|
| Opening balance | ₹8,240 |
| Transactions | +₹1,500 pocket money · −₹600 cash withdrawal · +₹1,525 cheque deposit · −₹1,525 cheque returned · −₹450 book fair · +₹2,000 birthday gift · −₹5,999 CAMS TEL mobile recharge |
| Closing balance (derived) | ₹4,691 |
| Cheque | ₹1,525 in figures, "One Thousand Two Hundred Twenty-Five" (₹1,225) in words: a birthday cheque from Dadi that Ananya deposited and that was returned |
| Answer cards (derived) | A ₹5,291 (forgot the withdrawal) · B ₹10,690 (forgot CAMS TEL) · C ₹4,691 (correct) · D ₹6,216 (forgot the cheque return) |
| Passkey (derived) | 159 |

Game-logic guesses (confirm or correct):

1. Level 1, Task 1 unlocks only after OPEN CASE FILE. Before that, every level shows as locked.
2. Cheque (5, Task 2): tapping either the amount in figures or the amount in words counts as finding the mismatch.
3. KYC and evidence complete automatically when the last required card is scanned.
4. Scans are ignored while a feedback pop-up is showing; the UI dismisses it when its animation ends. Touch interactions (cheque, highlighter, passkey) aren't locked.
5. Phishing YES path: the task completes once every fake field has been tapped and the fake form submitted (the simulated loss is shown at that point). A player who backs out can still choose NO.
6. Scam reveal (6, Task 2) completes with its CONTINUE button; no scan is needed.
7. Case Board: a level is "in progress" once any task in it is completed or attempted, and "available" if it's unlocked but untouched.
8. Revisiting a completed task replays the explanations. Wrong answers there show feedback but aren't counted.
9. Wrong closing-balance cards come from common mistakes (each forgets one transaction) and get a matching explanation, plus a general hint that grows with each wrong card.

