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

- **Target viewport (design canvas):** 1512 × 982 `[GUESSED: the Figma frame size; every mockup except 01 is exported at it, and 01-start.png is exactly 4×. Switched from 1280 × 831 in Stage 1]`
- **Scaling:** every screen is built on a fixed 1512 × 982 canvas, scaled proportionally to fit the device (letterboxed with the background colour if the aspect ratio differs). This keeps layouts identical to the mockups on every iPad and laptop.
- **Filled-in typography and colour tokens are exact and locked.** Never substitute or approximate them. A token still marked `[FILL]` is guessed following Section 12.5.
- Components use tokens only, never raw hex values or font names, so replacing a guessed value updates every screen at once.

### 9.2 Colour tokens

| Token | Use | Hex |
|---|---|---|
| `--bg-navy` | Main background | `[GUESSED: #0C253C]` |
| `--bg-grid` | Background grid lines | `[GUESSED: #112C46]` |
| `--paper-cream` | Panels, cards | `[GUESSED: #BEB292]` |
| `--paper-aged` | Aged-paper documents | `[GUESSED: #A6987D]` |
| `--gold` | Antique gold details, borders | `[GUESSED: #DAA158]` |
| `--thread-red` | Investigation thread, clue accents | `[GUESSED: #EF3345]` |
| `--cta-turquoise` | Primary buttons | `[GUESSED: #7CF1EF]` |
| `--cta-turquoise-hover` | Button hover/pressed | `[GUESSED: #53A6A4]` |
| `--ink` | Body text on paper | `[GUESSED: #090D17]` |
| `--text-on-dark` | Text on navy | `[GUESSED: #C0B39B]` |
| `--success` | Correct feedback | `[GUESSED: #2F7D4F]` |
| `--error` | Incorrect feedback | `[GUESSED: #B3202F]` |
| `--desk-wood` | Desk surface in table scenes (added) | `[GUESSED: #8E644F]` |
| `--desk-edge` | Desk top edge (added) | `[GUESSED: #472117]` |
| `--highlighter` | Highlighter pen, clue marks (added) | `[GUESSED: #F5E663]` |

Colour guesses (Stage 0): sampled from flat areas of `01-start.png` at canvas scale. `--paper-cream` is the panel's flat upper area and `--paper-aged` its darker band. `--cta-turquoise` is the button face and `--cta-turquoise-hover` its edge. `--text-on-dark` is the badge lettering. `--success`, `--error` and `--highlighter` don't appear in the mockup and are pure guesses. Tokens live in `src/styles/tokens.css`.

### 9.3 Typography tokens

| Token | Use | Font family | Weights | Sizes |
|---|---|---|---|---|
| `--font-display` | Distressed typewriter headings | `[GUESSED: Special Elite]` | `[GUESSED: 400 + text stroke]` | `[measured, Stage 1: start title 98px, INCOMING CALL 60px, CTAs 45px, speech 35px, case text 38px, stamp 35px]` |
| `--font-body` | Body text, instructions | `[GUESSED: Nunito]` | `[GUESSED: 500, 800 strong]` | `[GUESSED: 19px, 15px small]` |
| `--font-ui` | Buttons, tracker labels | `[GUESSED: Special Elite]` | `[GUESSED: 400]` | `[GUESSED: 20px]` |
| `--font-mono` | Statement figures, terminal | `[GUESSED: Courier Prime]` | `[GUESSED: 400, 700]` | `[GUESSED: 15px]` |

Font guesses (Stage 0): the closest free matches to `01-start.png`, whose heading and button use the same distressed typewriter face. Nunito is a readable body face for 12–14-year-olds; the mockup shows no body text. All three are self-hosted from `/design/fonts/` (Special Elite: Apache 2.0; Nunito, Courier Prime: OFL), latin and latin-ext subsets.

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

- Spacing scale: `[measured, Stage 1: elements are placed at measured canvas positions rather than on a spacing scale; see src/styles/opening.css]`
- Border radii: `[measured, Stage 1: paper panels 26px, glowing CTAs 32px, ACCEPT 30px, speech bubble 32px, status pill 24px]`
- Outlines: `[measured, Stage 1: 6px --ink on panels, 7px on CTAs, roughened with an SVG displacement filter (#rough-edge); 3px on speech bubbles]`
- Shadows: `[GUESSED: panels 0 8px 0 --ink at 45%; CTAs 0 5px 0 --ink]`
- Background grid: `[GUESSED from 02: 1px --bg-grid lines every 42px]`

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
  - Request the camera with `facingMode: "user"`, triggered by a user tap. **Owner decision (2026-10-15):** there is no in-game request or explanation card. Access is asked for on the game's first tap (START TRAINING, or RESUME CASE / OPEN CASE FILE), and every table scene then starts scanning by itself. The browser's own one-time permission prompt still appears.
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
  - `<game-domain>` comes from the single constant `GAME_DOMAIN` in `src/content/gameData.ts`: `financial-literacy-app.vercel.app` (owner, 2026-10-20). If it changes, set the new domain and print again. The scanner only accepts codes for this domain. While it's a placeholder, `npm run print` marks every page and the guide as TEST PRINT.
  - The command is `npm run print` (`scripts/print-artefacts.ts`). Codes use error correction level Q and print 3.4 cm wide on 90 × 58 mm cards, 8 per A4 page.
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

| # | Image file (in `/design/screens/`) | Friendly name | Spec section | Scene type | Route | Status |
|---|---|---|---|---|---|---|
| 01 | `01-start.png` | Start screen ("Save the Savings Account") | 3 | screen | `/` | Built (Stage 1) |
| 02 | `02-call-ananya-1.png` | Ananya's first phone call | 3 | call | `/call/ananya` | Built (Stage 1) |
| 02b | `02b-call-ananya-1-talking.png` | First call: "Something is wrong with my bank account" | 3 | call | same route, call step 2 | Built (Stage 1) |
| 02c | `02c-call-ananya-1-talking.png` | First call: "someone is trying to steal my pocket money" + "Take note of clues" | 3 | call | same route, call step 3 | Built (Stage 1) |
| 02d | `02d-call-ananya-1-connecting.png` | First call breaking up: "…I was checking my account and then-" | 3 | call | same route, call step 4 | Built (Stage 1) |
| 02e | `02d-call-ananya-1-disconnected.png` | First call: CONNECTION LOST (file is named 02d; rename to 02e-…) | 3 | call | same route, call step 5 | Built (Stage 1) |
| 03 | `03-case-assigned.png` | Case assigned ("Open Case File") | 3 | cinematic | `/case-assigned` | Built (Stage 1) |
| 04 | `04-L1T1-account-type.png` | Account type cards on table | 4, Task 1 | table | `/level-1/account-type` | Built (Stage 2) |
| 04a | `04a-L1T1-account-type-current-wrong.png` | Account type: Current scanned (NOT QUITE) | 4, Task 1 | table | same route, feedback | Built (Stage 2) |
| 04b | `04b-L1T1-account-type-savings-correc.png` | Account type: Savings scanned (ACCOUNT IDENTIFIED) | 4, Task 1 | table | same route, feedback | Built (Stage 2) |
| 04c | `04c-L1T1-account-type-fixed-wrong.png` | Account type: Fixed Deposit scanned (NOT QUITE) | 4, Task 1 | table | same route, feedback | Built (Stage 2) |
| 04d | `04d-L1T1-account-type-recurring-wrong.png` | Account type: Recurring Deposit scanned (NOT QUITE) | 4, Task 1 | table | same route, feedback | Built (Stage 2) |
| 05 | `05-L1T2-verify-identity.png` | Verify Identity (KYC cards on table) | 4, Task 2 | table | `/level-1/verify-identity` | Built (Stage 2) |
| 05b | `05b-L1T2-verify-identity-library-scanned.png` | KYC: Library card scanned (NOT QUITE) | 4, Task 2 | table | same route, feedback | Built (Stage 2) |
| 05c | `05c-L1T2-verify-identity-pan-scanned.png` | KYC: PAN scanned first (VALID, SCAN NEXT) | 4, Task 2 | table | same route, feedback | Built (Stage 2) |
| 05d | `05d-L1T2-verify-identity-aadhaar-scanned.png` | KYC: Aadhaar scanned, both done (VALID, NEXT CLUE) | 4, Task 2 | table | same route, feedback | Built (Stage 2) |
| 05e | `05e-L1T2-verify-identity-passport-scanned.png` | KYC: Expired passport scanned (NOT QUITE) | 4, Task 2 | table | same route, feedback | Built (Stage 2) |
| 06 | `06-L1T3-withdrawal-slip.png` | Deposit vs withdrawal slips on table | 4, Task 3 | table | `/level-1/withdrawal-slip` | Built (Stage 2) |
| 06b | `06b-L1T3-withdrawal-slip-correct.png` | Withdrawal slip scanned (CORRECT, CHECK BALANCE) | 4, Task 3 | table | same route, feedback | Built (Stage 2) |
| 06c | `06c-L1T3-withdrawal-slip-deposit-wrong.png` | Deposit slip scanned (NOT QUITE, SCAN OTHER SLIP) | 4, Task 3 | table | same route, feedback | Built (Stage 2) |
| 07 | `07-L1-complete.png` | Level 1 complete | 4 | cinematic | `/level-1/complete` | Built (Stage 2) |
| 08 | `08-L2T1-closing-balance.png` | Closing balance (statement + answer cards) | 5, Task 1 | table | `/level-2/closing-balance` | Placeholder (Stage 0) |
| 08 (base) | `L3-T4_bank-statement.png` | Closing balance: statement on the desk (misnamed; rename to 08-L2T1-closing-balance.png) | 5, Task 1 | table | same route | Built (Stage 4, part) |
| 08b | `08b-L2T1-closing-balance-statement-wrong.png` | Closing balance: ₹5,452 scanned (NOT QUITE) | 5, Task 1 | table | same route, feedback | Built (Stage 4, part) |
| 08c | `08c-L2T1-closing-balance-statement-right.png` | Closing balance: correct card (CORRECT). Shows ₹3,502, which contradicts the statement; see 13.3 | 5, Task 1 | table | same route, feedback | Built (Stage 4, part) |
| 08d | `08d-L2T1-closing-balance-statement-wrong.png` | Closing balance: ₹2,402 scanned (NOT QUITE, forgot interest) | 5, Task 1 | table | same route, feedback | Built (Stage 4, part) |
| 08e | `08e-L2T1-closing-balance-statement-wrong.png` | Closing balance: ₹3,502 scanned (NOT QUITE). Same amount 08c marks correct | 5, Task 1 | table | same route, feedback | Built (Stage 4, part) |
| 09 | `09-L2T2-cheque.png` | Cheque investigation | 5, Task 2 | screen | `/level-2/cheque` | Built (2026-10-16): see 09b |
| 09 (clue) | `09-L2T2-cheque-clue.png` | "WAIT… LOOK AT THIS": statement with the cheque rows highlighted, CHECK CHEQUE (new screen before the cheque) | 5, Task 2 | screen | `/level-2/cheque-clue` | Built (2026-10-16), score 9.83 |
| 09b | `09b-L2T2-cheque.png` | Cheque investigation: "CAN YOU SPOT WHAT'S WRONG IN HER CHEQUE?" | 5, Task 2 | screen | `/level-2/cheque` | Built (2026-10-16), score 9.95 |
| 09c | `09c-L2T2-cheque-name-tapped.png` | Cheque: payee tapped ("looks right", TRY AGAIN) | 5, Task 2 | screen | same route, feedback | Built (2026-10-16), score 12.43 |
| 09d | `09d-L2T2-cheque-date-tapped.png` | Cheque: date tapped ("looks right", TRY AGAIN) | 5, Task 2 | screen | same route, feedback | Built (2026-10-16), score 11.85 |
| 09e | `09e-L2T2-cheque-amount-mismatch-found.png` | Cheque: amount row tapped (mismatch found, BANK STATEMENT) | 5, Task 2 | screen | same route, feedback | Built (2026-10-16), score 12.48 |
| 09f | `09f-L2T2-cheque-signature.png` | Cheque: signature tapped ("looks right", TRY AGAIN) | 5, Task 2 | screen | same route, feedback | Built (2026-10-16), score 11.81 |
| 10 | `10-L2T3-highlighter.png` | Highlight the suspicious transaction | 5, Task 3 | screen | `/level-2/highlighter` | Built (2026-10-16), score 6.51 (mockup saved from chat) |
| 10b | `10b-L2T3-highlighter-cafe-express.png` | Highlighter: Cafe Express (NOT SUSPICIOUS). Outlier header "Step 2: Bank Statment" and tracker Call/Case/Solve | 5, Task 3 | screen | same route, feedback | Built (2026-10-16), score 7.27 |
| 10c | `10c-L2T3-highlighter-playzone.png` | Highlighter: PlayZone (NOT SUSPICIOUS) | 5, Task 3 | screen | same route, feedback | Built (2026-10-16), score 6.22 |
| 10d | `10d-L2T3-highlighter-stylehub.png` | Highlighter: StyleHub (NOT SUSPICIOUS). Heading says ₹499, should be ₹1,200 | 5, Task 3 | screen | same route, feedback | Built (2026-10-16), score 6.38 |
| 10e | `10e-L2T3-highlighter-cinemax.png` | Highlighter: CineMax (NOT SUSPICIOUS) | 5, Task 3 | screen | same route, feedback | Built (2026-10-16), score 6.11 |
| 10f | `10f-L2T3-highlighter-quickbite.png` | Highlighter: QuickBite (NOT SUSPICIOUS). Heading says "Quick Bites" | 5, Task 3 | screen | same route, feedback | Built (2026-10-16), score 6.59 |
| 10g | `10g-L2T3-highlighter-interest-credit.png` | Highlighter: Interest credit (NOT SUSPICIOUS, "Ananya's weekly log accounts for this") | 5, Task 3 | screen | same route, feedback | Built (2026-10-16), score 6.70 |
| 10h | `10h-L2T3-highlighter-cams-tel-suspicious-found.png` | Highlighter: CAMS TEL row (SUSPICIOUS, INVESTIGATE). Heading says "FastTel", should be CAMS TEL | 5, Task 3 | screen | same route, feedback | Built (2026-10-16), score 6.88 |
| 10i | `10i-L2T3-highlighter-cheque-music-fees.png` | Highlighter: cheque returned row (NOT SUSPICIOUS, "Music Class") | 5, Task 3 | screen | same route, feedback | Built (2026-10-16), score 6.46 |
| 10j | `10j-L2T3-highlighter-grandparents-gift.png` | Highlighter: Gift from Grandparents (NOT SUSPICIOUS) | 5, Task 3 | screen | same route, feedback | Built (2026-10-16), score 6.47 |
| 11 | `11-L2-complete.png` | Level 2 complete | 5 | cinematic | `/level-2/complete` | Placeholder (Stage 0) |
| 12 | `12-call-ananya-2.png` | Ananya's second phone call | 6, Task 1 | call | `/level-3/call-ananya` | Placeholder (Stage 0) |
| 12a | `11-call-ananya-2.png` | Second call: "Hello! It's me, Ananya! My debit card has been blocked" | 6, Task 1 | call | same route, call step 1 | Built (2026-10-17), score 4.44 |
| 12b | `11b-call-ananya-2-talking.png` | Second call: "I just got a message saying I can unblock it immediately by clicking a link." | 6, Task 1 | call | same route, call step 2 | Built (2026-10-17), score 4.86 |
| 13 | `13-L3T1-phishing-choice.png` | Should Ananya click the link? | 6, Task 1 | screen | `/level-3/phishing` | Placeholder (Stage 0) |
| 13a | `11c-call-ananya-2-card-blocked-choice.png` | Phishing choice: CAMS TEL notification + YES / NO ("Should Ananya tap the link in the notification?") | 6, Task 1 | screen | `/level-3/phishing` | Built (2026-10-17), score 5.11 |
| 13b | `11f-L3T1-phishing-choice-yes-chosen.png` | Phishing: **NO** outcome (GOOD CALL, SECURE). File name says "yes-chosen", which is swapped | 6, Task 1 | screen | same route, feedback | Built (2026-10-17), score 6.74 |
| 14 | `14-L3T1-fake-website.png` | Fake bank website (YES path) | 6, Task 1 | screen | `/level-3/fake-website` | Built (2026-10-17), score 3.90 (mockup saved from chat) |
| 14a | `11d-L3T1-phishing-choice-no-correct.png` | Phishing: **YES** outcome ("Uh Huh", simulated ₹3,000 loss, TRY AGAIN). File name says "no-correct", which is swapped. Replaces the fake website: see 13.3 | 6, Task 1 | screen | see 13.3 | Built (2026-10-17), score 6.63 |
| 15 | `15-L3T2-scam-reveal.png` | CAMS TEL scam reveal | 6, Task 2 | cinematic | `/level-3/scam-reveal` | Placeholder (Stage 0) |
| 15a | `15-L3T2-scam-reveal-statement-clue.png` | Scam reveal 1: "WAIT… LOOK AT THE NAME!" notification + statement row, "CAM Service Tel could this be?" | 6, Task 2 | cinematic | same route, step 1 | Built (2026-10-17), score 4.58 |
| 15b | `15b-L3T2-scam-reveal-connection.png` | Scam reveal 2: "CAMS TEL" appears | 6, Task 2 | cinematic | same route, step 2 | Built (2026-10-17), score 5.21 |
| 15c | `12c-L3T2-scam-reveal-scam-exposed.png` | Scam reveal 3: CAMS TEL rearranges to "SCAM TEL", plus the Daily Chronicle article | 6, Task 2 | cinematic | same route, step 3 | Built (2026-10-17), score 12.48 |
| 16 | `16-L3T3-passkey-computer.png` | Passkey on the on-screen computer | 6, Task 3 | screen | `/level-3/passkey` | Placeholder (Stage 0) |
| 16a | `13-L3T3-passkey-computer.png` | Passkey: ENTER PASSKEY on the bank computer, newspaper on the desk | 6, Task 3 | screen | `/level-3/passkey` | Built (2026-10-17), score 7.69 |
| 16b | `13b-L3T3-passkey-computer-typing.png` | Passkey: 2-0-9 typed (matches the derived passkey) | 6, Task 3 | screen | same route | Built (2026-10-17), score 7.66 |
| 16c | `16e-L3T3-passkey-computer-unlocked.png` | Passkey: unlocked (zoomed computer) | 6, Task 3 | screen | same route | Built (2026-10-17), score 4.90 |
| 17 | `17-L3T4-scan-evidence.png` | Scan evidence (statement + phishing card) | 6, Task 4 | table | `/level-3/scan-evidence` | Placeholder (Stage 0) |
| 17a | `14-L3T4-scan-evidence.png` | Scan evidence: two empty slots (statement, CAMS TEL message) on the bank computer | 6, Task 4 | table | `/level-3/scan-evidence` | Built (2026-10-17), score 5.24 |
| 17b | `14-L3T4-scan-evidence-statement-attached.png` | Scan evidence: statement attached (file shares the "14" number with 17a) | 6, Task 4 | table | same route | Built (2026-10-17), score 5.09 |
| 17c | `14c-L3T4-scan-evidence-message-attached.png` | Scan evidence: both attached (EVIDENCE ATTACHED, labels, REVIEW INCIDENT REPORT) | 6, Task 4 | table | same route | Built (2026-10-17), score 5.97 |
| 18 | `18-L3T5-review-report.png` | Review incident report | 6, Task 5 | screen | `/level-3/review-report` | Placeholder (Stage 0) |
| 18a | `15-L3T5-review-report.png` | Incident report: customer, account, date, ₹5,999 — CAMS TEL, concern, SUBMIT REPORT | 6, Task 5 | screen | `/level-3/review-report` | Built (2026-10-17), score 4.58 |
| 19 | `19-report-submitted.png` | Report submitted | 6, Task 5 | cinematic | `/report-submitted` | Placeholder (Stage 0) |
| 20 | `20-certificate.png` | Mission complete certificate | 7 | cinematic | `/certificate` | Placeholder (Stage 0) |
| 20a | `16-certificate.png` | Certificate: MISSION COMPLETE!, badge on the desk. No Case Board / replay buttons | 7 | cinematic | `/certificate` | Built (2026-10-17), score 13.14 |
| 21 | `21-case-board.png` | Case Board (level select) | 8 | screen | `/case-board` | Placeholder (Stage 0) |
| 21a | `21-case-board.png` | Case Board: cork board, three pinned level cards with 3-dot progress, red thread | 8 | screen | `/case-board` | Built (2026-10-16), score 9.07 |
| 22 | `22-feedback-popups.png` | Correct / incorrect feedback pop-ups | 2 | overlay | overlay (no route) | Placeholder (Stage 0) |

Routes are defined in `src/app/screens.ts`. A phone camera opening a printed QR code lands on `/a/<artefact-id>`, a friendly page outside the game canvas (10.3).

The top progress tracker (Section 8) appears inside task screens, so it is built from the first task screen it appears in (04) and checked on later ones.

Scene types: `call` (phone call), `table` (cards on a table: camera active), `screen` (on-screen interaction), `cinematic` (narrative), `overlay` (appears over other screens).

### 13.2 Stages

| Stage | What gets built | Images needed | Status |
|---|---|---|---|
| 0 | Full game logic, scanning, QR printing, placeholder UI for every screen | `01-start.png` (overall theme and mood only, not layout) | Built, awaiting owner confirmation (see 13.3). Real-iPad camera checks (Section 11) still to be done by the owner. |
| 1 | Opening sequence | `01-start.png`, `02-call-ananya-1.png`, `03-case-assigned.png` | Built, awaiting owner confirmation (see 13.3) |
| 2 | Level 1 + progress tracker + feedback pop-ups | `04` to `07`, `22-feedback-popups.png` | Built, awaiting owner confirmation: Level 1 (04–07 and all their feedback cards) matched to the mockups (see 13.3). No separate 22 mockup: Level 1's feedback is the full-screen card design. |
| 3 | Case Board | `21-case-board.png` | Done (2026-10-16) |
| 4 | Level 2 | `08` to `11` | Not started |
| 5 | Level 3, part 1 | `12` to `15` | Not started |
| 6 | Level 3, part 2 | `16` to `19` | Not started |
| 7 | Certificate + final polish | `20-certificate.png` | Not started |

The owner may reorder stages, or split a stage into more prompts, but each prompt still lists its own images (Section 12.2).

### 13.3 Build log

**Stage 0, prompt 1 (2026-10-14): scaffold, content data module, game state core.**

- Stack: Vite 8, React 19, TypeScript 6, react-router, zustand (persist), motion, howler, vitest, Playwright (config at 1280 × 831; Chromium installed), `@vitejs/plugin-basic-ssl` (dev server on HTTPS and the LAN).
- `src/content/gameData.ts` holds all content. `buildGameContent(CASE_FIGURES)` derives running balances, the closing balance, answer-card amounts, the cheque amount in words, the passkey and every figure-dependent line of copy.
- `src/state/gameStore.ts` holds all progress and answer checking. Persisted under the localStorage key `save-the-savings-account` (progress only, no player data). Stored progress is sanitised on load, so edited storage can't skip locked tasks.
- Tests: `npm test` (74 passing).

Case figures: **replaced with mockup 08/09 values on 2026-10-14** (see the mockups entry below). Everything else re-derives:

| Item | Value |
|---|---|
| Opening balance | ₹8,200 |
| Credits / debits (derived) | ₹5,050 / ₹10,798 |
| Closing balance (derived) | ₹2,452 (owner decision) |
| Cheque | No. 000123, Ananya → Rhythm Music Academy, ₹1,500 in figures, "One Thousand Five Hundred and Fifty Rupees Only" (₹1,550) in words |
| Answer cards (derived) | A ₹5,452 (cheque payment added instead of subtracted) · B ₹2,402 (forgot the ₹50 interest) · C ₹2,452 (correct) · D ₹3,502 (fixed near-miss from the mockup) |
| Passkey (derived) | 209 |

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

**Stage 0, prompt 2 (2026-10-14): placeholder UI and routing.** Images used: `01-start.png` (theme and mood only).

- A route for every screen in 13.1 (Route column), on the fixed 1280 × 831 canvas scaled to fit and letterboxed (`src/app/Stage.tsx`). Placeholder styling uses tokens only (9.2, 9.3, 9.5 guesses above).
- Route guards (`src/app/navigation.ts`): locked task screens, level-complete screens, the fake website, report-submitted and the certificate redirect to the player's current task, even when typed as a URL. The URL decides which task is active in the store, so scans and taps are checked against the screen on show.
- Table scenes (04, 05, 06, 08, 17) show the cards on the desk, evidence slots where several cards are needed, and a clearly labelled SIMULATED SCAN panel. That panel offers the task's cards, any other case-file card, and an unrelated QR code.
- Progress tracker, Case Board (revisit and resume), feedback pop-ups and toasts (screen 22), and the `/a/:artefactId` phone landing page.
- All UI copy moved into `GAME.ui` in the content module. Components contain no answers or copy.
- Tests: `npm test` (87 unit tests), `npm run test:e2e` (4 Playwright tests: the whole mission with simulated scans, leave-and-resume from the Case Board with locked URLs, the phishing NO path, the phone landing page).

More game-logic guesses (confirm or correct):

10. Level 3, Task 1 opens with Ananya's second call (12), including when resumed or revisited from the Case Board.
11. Correct, incorrect and progress feedback is a pop-up the player closes. Neutral notes ("looks correct", "not needed", "Already verified", not an option, unknown QR) are a toast that closes itself after 2.8 s. Scans stay locked while either is showing.
12. On the closing-balance statement (08), the opening balance shows and the running balances are blank. The closing balance shows "?" until the task is solved. The highlighter statement (10) shows every balance.
13. The fake website (14) stays open under the consequence pop-up. It closes when the player leaves Level 3, Task 1, and reloading on it returns to the phishing choice (13).
14. A successful report submission goes straight to Report submitted (19), with no pop-up.
15. The Case Board can be opened at any time. Before OPEN CASE FILE, every level shows as locked. The start screen adds RESUME CASE for returning players, and REPLAY MISSION clears all progress.

**Stage 0, prompt 3 (2026-10-14): camera scanning and QR printing.** Images used: none.

- Camera scanner (`src/scanner/`), active only on table scenes. It starts after the in-story explanation and a TURN ON SCANNER tap, using `facingMode: "user"`. The `<video>` is hidden but kept in the DOM (2 × 2 px, transparent, `playsinline`, `muted`), and decoding uses jsQR on frames scaled to 640 px, about 8 times a second.
  - It recovers on `visibilitychange`, `pageshow`, `focus` and a camera track ending.
  - It falls back to the card list when the camera is blocked or missing, and plays a chime and a flash on each read the game accepts.
  - The jsQR decoder loads only once the scanner starts.
- Home Screen mode: `public/manifest.webmanifest` (standalone, landscape) and the Apple meta tags in `index.html`.
- `npm run print` writes `print/artefacts.pdf`, `print/qr/<L>-<T>_<artefact>.png` (17 codes) and `print/PRINTING.md`. The `print/` folder is generated and git-ignored.
- Tests: `npm test` (101 unit, including decoding generated QR images and reading every printed PNG back), `npm run test:e2e` (7 Playwright).
  - The camera tests feed Chromium a fake webcam video of a printed card. They check that it's read once, that the feed stays hidden, that the scanner restarts on the next table scene and stops off them, and the blocked-camera and no-camera fallbacks.
- Not testable here: real-camera scanning on an iPad in a Safari tab and in Home Screen mode (Section 11). That needs the owner's device, over the LAN HTTPS address printed by `npm run dev`.

More guesses: 16–20 confirmed by the owner (2026-10-14).

16. Superseded by the 2026-10-15 owner decision in 10.2: the camera is asked for on the game's first tap, and every table scene scans by itself. The camera stays on for 1.5 s between back-to-back table scenes and is off everywhere else.
17. A card held in view counts once, and counts again after 2 s out of view. A card read while a pop-up is open counts as soon as the pop-up closes.
18. The chime and flash play on every read the game accepts, right or wrong; correctness is shown by the pop-up.
19. In production, the card list appears only when the camera is blocked or missing, or after USE THE LIST INSTEAD. In development it's always shown, for testing.
20. Printed cards: 90 × 58 mm, QR 3.4 cm at error correction level Q. The cards show the card name, the task, the amount (closing-balance cards) and the code's address in small print. Owner-designed cards can use the PNGs instead.

Missing assets: a real chime sound (the current one is synthesised), a Home Screen app icon (`apple-touch-icon`, 180 × 180 PNG), and the real `GAME_DOMAIN`.

**Mockups received (2026-10-14): 02–05, 08, 09 and their variants. Guesses checked against them:**

- Guess 1 (Level 1 opens after OPEN CASE FILE): consistent with 03, which hands straight to "Identify Ananya's account type".
- Guess 2 (either amount area finds the mismatch): **confirmed** by 09e. The highlighted area is the whole RUPEES row, words and figures together.
- Guess 3 (KYC completes on the last card): **confirmed** by 05c/05d. There's no separate "identity verified" screen. The last valid card's feedback has NEXT CLUE; the first has SCAN NEXT.
- Guesses 4 and 11 (pop-up vs toast): **revised.** Every outcome, including neutral cheque taps ("This looks right"), is a full feedback card that replaces the scene, with TRY AGAIN, SCAN NEXT, NEXT, NEXT CLUE or BANK STATEMENT. There are no toasts, and scans stay locked while a card is showing.
- Guess 9 (a different explanation per wrong balance card): **confirmed** in principle by 08b/08d/08e, each with its own message. The amounts themselves conflict; see below.
- Guess 12 (closing-balance statement): 08 shows running balances for the first rows, then blank, with the closing balance left empty.
- Guesses 5–8, 10 and 13–15: no mockups yet.

**Owner decisions (2026-10-14):** the closing balance is **₹2,452**, computed from the statement rows (08c, the summary totals and the printed answer cards need fixing), and the scam name stays **CAMS TEL** (the statement row becomes "Mobile Recharge – CAMS TEL").

**Conflicts in the mockups (items 1 and 3 decided above):**

1. The statement doesn't add up. Its rows give a closing balance of **₹2,452**: ₹8,200 + credits ₹5,050 − debits ₹10,798. But 08c marks ₹3,502 as correct while 08e marks ₹3,502 as wrong. The summary box shows total debits ₹7,850 (the rows sum to ₹10,798) and, in one copy, total credits ₹4,500 (the rows sum to ₹5,050). 08d's hint ("Did you include the ₹50 interest credit?") only works if the answer is ₹2,452. The passkey is unaffected: every candidate ends in 2, so it's 2-0-9 either way.
2. 08b's hint for ₹5,452 ("Mobile Recharge… must be subtracted, not added") doesn't match that amount. Adding the ₹5,999 instead of subtracting gives ₹14,450. ₹5,452 is what you get by adding the ₹1,500 cheque payment instead of subtracting it.
3. The suspicious row reads "Mobile Recharge – **FastTel**", but the spec (5, Task 3; 6, Task 2) and the 01-start newspaper use **CAMS TEL**. Level 3 depends on that name matching the phishing message.
4. In `L3-T4_bank-statement.png`, the Type/Amount columns are shifted one row down from the descriptions; the 09 copy is aligned. The bank is "First National Bank" on the statement but "National Bank" on the cheque. The statement account is XXXX XXXX 3210 but the cheque's A/c No. is 1234567890.
5. Copy typos to fix in the mockups and printed cards: "Reccuring" (the account card), "Aadhar" (the official spelling is Aadhaar), "YES ; IT'S", "To keeps your lump-sum money… for a interest rate", "A FIXED DEPOSIT IS USED.", "as an document", "Helloo?" (if not intended).
6. File names: two files start with 02d, and the 08 base screen is named like a QR print file (`L3-T4_bank-statement.png`).

**Real figures from the mockups (replace CASE_FIGURES in Stage 4 once item 1 is settled):** First National Bank, Ananya Sharma, Savings Account (Minor), XXXX XXXX 3210, 01–31 Aug 2026. Opening ₹8,200. Rows:
- 02 Aug Pocket Money (Parent Transfer) +1,000
- 05 Aug Cafe Express −350
- 08 Aug Online Shopping – StyleHub −1,200
- 12 Aug Game Top-Up – PlayZone −499
- 15 Aug Gift from Grandparents +2,500
- 18 Aug Movie Tickets – CineMax −800
- 22 Aug Food Delivery – QuickBite −450
- 25 Aug Cheque No. 000123 – Music Class Fees −1,500
- 28 Aug Cheque No. 000123 – Returned +1,500
- 30 Aug Mobile Recharge −5,999
- 31 Aug Interest Credit +50

Cheque: National Bank, Hitech City Branch, IFSC NBIN0001234, dated 25-08-2026, pay Rhythm Music Academy, ₹1,500.00 in figures, "One Thousand Five Hundred and Fifty Rupees Only" (₹1,550) in words, signed Ananya Sharma, cheque no. 000123. So the returned cheque is one **Ananya wrote**, not the placeholder's birthday cheque from Dadi.

**Task tracker labels from the mockups:** Level 1: Account, KYC, Bank Records. Level 2: Bank Balance, Cheque, Transactions. The tracker shows the level title and its own three steps; the folder icon is presumably the Case Board.

**Figures applied to the game data (2026-10-14):**

- `CASE_FIGURES` now holds the mockup statement and cheque.
- The answer cards have three kinds of wrong card:
  - `omits`: forgot a transaction;
  - `flips`: added a debit instead of subtracting it;
  - `fixed`: a printed near-miss. The data refuses a fixed card equal to the closing balance.
- Amounts in words use the cheque style "… Hundred and Fifty", with "Rupees Only" after the words.
- Copy taken from the mockups:
  - 08b–08e card feedback. 08b's hint names the cheque payment rather than the mobile recharge, since that's what produces ₹5,452.
  - The 08c success text. I kept the spec's "credits increase, debits decrease" explanation in it, because 08c doesn't cover it.
  - The 09c–09f cheque lines. "This looks right." replaces the spec's "This detail looks correct. Keep investigating."
- A test pins the statement, the cards and the passkey to the mockup values.

**Second mockup review (2026-10-14): 10b–10j, the second call, phishing, scam reveal, passkey, evidence, report, certificate, Case Board.** The owner's file numbers don't follow 13.1. The rows above map each file to its 13.1 screen.

Matches the game:
- Passkey 2-0-9 (16b).
- Both pieces of evidence, with the same labels as 6, Task 4 (17c).
- CAMS TEL in the phishing message, the scam reveal and the report.
- Certificate copy is Section 7 word for word.
- Highlighter feedback on every row except pocket money and the cheque payment.

**Owner decisions (2026-10-14):**
- **YES path:** YES → fake website (needs a new mockup for 14) → submitting it shows the 14a "Uh Huh" money-withdrawn screen → TRY AGAIN returns to the choice. Only NO completes Level 3, Task 1. This replaces guess 5.
- **Simulated loss:** ₹2,000, computed from the balance, so the SMS reads "₹2,000 was withdrawn… available balance is ₹452".

Needs a decision or a mockup fix (item 1 decided above):
1. **Phishing YES path (14a) leaves out the fake website** that spec 6, Task 1 requires, where fields auto-fill fictional values and the loss happens only after details are entered. It jumps straight to a bank SMS ("Rs 3000 was withdrawn… available balance is Rs 502") with TRY AGAIN, so choosing YES never completes the task. "Rs 502" assumes a ₹3,502 balance, which contradicts the decided ₹2,452. The sender is "FIRST BANK".
2. **The YES and NO outcome files are swapped:** `11d-…-no-correct` shows the YES outcome and `11f-…-yes-chosen` shows the NO outcome.
3. **Dates and accounts disagree:**
   - The report (18a) says transaction date 12 Oct 2026 and account XXXX 7812, and the evidence thumbnail (17a) says 12 Oct 26. The statement says 30 Aug 2026.
   - There are now three account numbers: statement XXXX 3210, cheque 1234567890, report XXXX 7812.
   - The game will show the statement's values unless told otherwise.
4. **Bank name:** "First National Bank" on the L2T1 statement, "National Bank" on the cheque, highlighter, computer and report, "FIRST BANK" in the SMS.
5. **Level 3 tracker** has 3 steps (Phishing / Uncover / Report) for 5 tasks. Mapping assumed: Phishing = T1, Uncover = T2, Report = T3–T5. The passkey screen is mid-way: 16a shows step 3 open, 16b shows it filled.
6. **Case Board (21a)** shows progress dots but not the spec 8 statuses (locked / available / in progress / completed), and has no resume control.
7. **Certificate (20a)** has no CTA back to the Case Board or to replay, which Section 7 requires.
8. **The newspaper's phishing link is "http://cams-tel.in"**, a real-looking domain that may exist and that children could type. The 13a message uses "https://cams-tel-debit/unblock-card", which has no domain ending and can't resolve. Use one safe address everywhere.
9. **Missing screens:**
   - 06 (withdrawal slip), 07 (Level 1 complete), 10 base and the 10 pocket-money / cheque-payment variants, 11 (Level 2 complete), 19 (report submitted);
   - wrong passkey, the cheque scanned as evidence, and the incoming-call screen for the second call (if wanted).
10. **"Ananya's weekly log" (10g)** and "Ananya said/recorded…" notes suggest a weekly log in the case file. Spec 2 mentions one, but it isn't an artefact. Is it a printed document?
11. **Typos:** "Bank Statment" (10b), "Quick Bites" (10f), "Unocover" (tracker on 13b, file `11f`), "CLOSING BALANCE ; CHEQUE AMOUNT:" (16a hint).


**YES path applied (2026-10-14):**
- Store: `submitFakeForm()` shows the simulated loss as a wrong answer and closes the fake page. The player is back at the choice, and only NO completes Level 3, Task 1. This replaces guess 5.
- The loss is `CASE_FIGURES.simulatedLoss` (₹2,000). The bank alert, "₹2,000 was withdrawn from a/c no. XXXX3210. Available balance is ₹452.", is worked out from the closing balance and account number. The data refuses a loss the balance can't cover.
- Level 3, Task 1 copy taken from mockups 12a/12b, 13a, 13b and 14a:
  - the second call's lines;
  - the CAMS TEL notification and the "Should Ananya tap the link in the notification?" YES / NO choice;
  - GOOD CALL (NO), keeping the spec's "check through official bank channels" advice;
  - "Uh Huh" (YES), plus a line making clear the money went only after details were typed in.
- The message link is `https://cams-tel-debit/unblock-card`, which has no domain ending and can't open a real site. CAMS TEL is kept everywhere.

**Stage 1 (2026-10-14): opening sequence.** Images used: `01-start.png`, `02-call-ananya-1.png`, `02b-call-ananya-1-talking.png`, `02c-call-ananya-1-talking.png`, `02d-call-ananya-1-connecting.png`, `02d-call-ananya-1-disconnected.png`, `03-case-assigned.png`.

- Canvas switched to 1512 × 982, the Figma frame size. `--bg-navy` is #0C253C, the value in every 1512-px export; the 4× start screen reads darker. Stage 1 tokens were added in `src/styles/tokens.css`.
- 01 Start: tilted paper panel with an alert badge, bank icon, two-line title, glowing START TRAINING, laurels, newspaper and badge on the desk. RESUME CASE appears for returning players, small and underlined, since the mockup has no resume control.
- 02–02e Ananya's call (`OpeningCallScreen`):
  - INCOMING CALL with pulsing rings, a ring tone and ACCEPT.
  - Then three typed-out lines in a speech bubble, with a running call timer and a signal dot (green, amber, red).
  - "Take note of clues" appears on the second line. The breaking-up line has a pink bubble, glitch bars and an alert, then CONNECTION LOST with falling beeps, then Case Assigned.
  - Owner decision: it plays by itself, and a tap finishes the current line or moves on.
- 03 Case assigned: stamp drops in, paper panel with the mockup copy, case file on the desk, OPEN CASE FILE.
- Copy is from the mockups, word for word, including "Helloo?". `GAME.openingCall` now has steps (mood, signal, status, text, hint).
- Sounds: the ring, line blip and disconnect beeps are synthesised in `src/audio/sounds.ts`, like the scanner chime.
- Verification loop (12.4): 5 iterations at 1512 × 982, diffed against each mockup. Remaining differences: letter shapes (the heading font is a guess), the badge, newspaper and case-file art being cut from mockups, and sub-pixel noise.
- Tests: 110 unit, 8 Playwright. The new test checks that the opening call plays by itself to Case Assigned.

Guesses (confirm or correct):

21. The heading font stays Special Elite, the closest free match. The mockups' face is a heavier, more distressed typewriter font. If you know its name, I'll self-host it.
22. Timing: lines type at 38 ms per character and stay 2.2 s once typed, and CONNECTION LOST shows for 2.8 s.
23. RESUME CASE (returning players) is a small underlined link under START TRAINING.
24. With reduced motion turned on, the text appears at once, and the pulsing rings and entrance motion are off.

Assets received (2026-10-14): `face smile.png`, `face talk.png`, `face worried.png`, `Badge.png`, `Newspaper.png`. They're copied to `src/assets/art/` and placed at positions fitted to the mockups. The talking and worried faces are 1:1, clipped by the portrait circle, with a cream paper disc drawn behind them because those exports are transparent.

Missing assets (interim versions are cut from the mockups into `src/assets/interim/`):
- Ananya's alarmed portrait (02e, CONNECTION LOST), as a PNG like the others.
- The case file (03), as a PNG with a transparent background.
- The heading font file, if licensed.
- Real call sounds (ring, blip, disconnect) and the scanner chime.

**Stage 2, screen 04 (2026-10-15): account type cards on the table, and the level header.** Image used: `04-L1T1-account-type.png`.

- **Level header** (`ProgressTracker`, used on every task screen):
  - the folder icon, which opens the Case Board;
  - "Level N: title" in Special Elite 20px;
  - the three-step tracker from the mockups. The steps are in `GAME.levels[].steps`: Level 3's "Report" step covers Tasks 3–5.
  - Step labels are Titillium Web 15px `[GUESSED]`, self-hosted, which fits all three labels.
  - Reached steps are filled turquoise; later steps are navy with a white ring. The lines are medium then dim, and all bright once the level's last step is reached (04, 05, 09b, 10h).
- **Table scene:**
  - The desk and the desk lamp are drawn in CSS/SVG, with the lamp head and light fitted to the mockup.
  - The paper mat is laid out flat (1200 × 614) and projected onto the desk with a fitted homography (`matrix3d`). Its aspect ratio comes from the round "i" icon.
  - The title (Special Elite 50px), the four cards (measured positions, sizes and tilts), their labels (32px) and the hint (20px) all sit in flat mat coordinates, so they take on the mockup's perspective.
  - Card illustrations are lifted from the un-warped mockup as interim art.
- **Scanner on scene screens:**
  - It starts by itself (see the owner decision in 10.2), with no request card.
  - While scanning, the desk lamp's light pulses (guess 25). This is the in-world scanning signal, since the mockup has no reticle.
  - If the camera is blocked, missing or stops, a small note under the mat explains and offers TRY AGAIN, and the simulated card list opens by itself.
  - In development, the list is a drawer tab at the bottom right.
- **Verification (12.4):** 5 iterations at 1512 × 982. Each text block was aligned to the mockup in un-warped mat space, ending within 0–3 px. Mean absolute difference: 7.5 → 6.0 per channel. The rest is glyph anti-aliasing, paper grain and the deliberate spelling fix below.
- **Mockup copy kept:** "Scan the card in the file". **Not kept:** "Reccuring", which is spelled Recurring on screen.
- **Tests:** 110 unit and 8 Playwright, all passing. The Playwright timeout is now 90 s for the full-mission journeys. Two bugs found and fixed: the revisit bar and the simulated-scan drawer covered other controls on scene screens.

Missing assets (interim cuts in `src/assets/interim/`):
- the four account-card illustrations (piggy bank, briefcase, padlock with coins, calendar with coins), as transparent PNGs;
- the folder icon.

**Stage 2, Level 1 completed (2026-10-15).** Images used: `04a`–`04d`, `05`, `05b`–`05e`, `06`, `06b`, `06c`, and `07-L1-complete.png` (attached in chat and saved to `design/screens/`).

- **Feedback cards** (`FeedbackScene`), replacing the pop-up on scene screens. Each card has:
  - the feedback desk, and a paper panel tilted −0.95° (three measured sizes: card, slip, story);
  - a rubber stamp tilted −10° (red NOT QUITE, green VALID / ACCOUNT IDENTIFIED / CORRECT);
  - the scanned artefact: the pinned account card, the ID with its label, or the slip;
  - the heading, paragraphs and bullets, and one glowing button: TRY AGAIN, NEXT, SCAN NEXT, NEXT CLUE, CHECK BALANCE or SCAN OTHER SLIP.
- Neutral notes (Already verified, not part of this task, unknown QR) stay a small toast over the table. No mockup shows them.
- **Content model:** feedback copy now has `paragraphs`, `bullets`, `cta`, and `layout` (stamp and button widths measured from each mockup, since they don't follow text length). Scans record which artefact they were about.
- **KYC** completes on the second valid ID's own card with NEXT CLUE (05d); the first valid ID says SCAN NEXT (05c).
- **Level header:** steps are filled up to the step on screen (04b still shows only step 1). The lines are all bright when step 3 is on screen.
- **05:** a second mat homography (1200 × 671, aspect calibrated against 04). The lamp is 04's, at `translate(32.2 30.8) scale(0.876)`.
- **06:** the story line and question on the navy, the folder of slips (interim art), and the hint.
- **07:** the alert badge, the story text, and OPEN DOCS FILE into Level 2.
- **Case figure added:** `withdrawalAttempt` ₹3,000. It must exceed the closing balance (₹2,452), which is why the withdrawal failed (06b).
- **Verification (12.4):** 9 rounds over 14 states at 1512 × 982, with each region aligned to 0–3 px. Final mean difference per channel:
  - 04: 6.0; 04a–04d: 7.0–8.1;
  - 05: 5.5; 05b–05e: 6.4–7.3;
  - 06: 3.2; 06b: 7.4; 06c: 8.8; 07: 7.8.
  - The rest is glyph shapes, since the heading font is a guess, plus paper grain and the copy fixes below.
- **Tests:** 110 unit and 8 Playwright, passing twice in a row.

**Copy fixes vs the mockups:**
- "YES ; IT'S" → "YES, IT'S".
- "A FIXED DEPOSIT IS USED." → "A FIXED DEPOSIT IS USED...", "To keeps … for a interest rate" → "To keep … for an interest rate".
- "regularly ; every month for" → "regularly, every month, for".
- "payments not frequent" → "payments, not frequent".
- "Aadhar" → "Aadhaar".
- "as an document" → "as a document".
- "Yes, A withdrawal" → "Yes, a withdrawal".
- "put money In  a bank" → "put money IN a bank".
- "Scan the other slip" gains a full stop.
- "Reccuring" → "Recurring".

**Guesses (confirm or correct):**

26. Feedback for neutral events (re-scan, wrong task, unknown QR) is a toast, not a full card.
27. Stamps on 05b/05e use the same NOT QUITE size as 04a.

**Missing assets** (interim cuts in `src/assets/interim/`):
- the pin;
- the four ID document illustrations (passport, library card, PAN, Aadhaar), flat;
- both slips, flat;
- the bank docs folder, including its tab label;
- the four account-card illustrations, in a crisp version.

**Owner decisions (2026-10-15): tap or scan, no list, fresh start.**
- Every artefact on a table screen (cards, IDs, slips; the placeholder tables for Levels 2–3 too) is a tap target. Tapping counts exactly like scanning it. Scanning stays the main way to play.
- The simulated-scan list is removed everywhere, in development too. Tapping is the fallback when the camera can't be used (spec 10.1 "simulated artefact selection"). The camera-failure note says to tap the card.
- START TRAINING starts a new game from Level 1, Task 1 (account → KYC → slips) and clears saved progress. RESUME CASE continues where the player left off.
- Tests: 110 unit and 9 Playwright. The e2e journeys now tap artefacts, and a new test checks that START TRAINING starts fresh. The Level 1 screens' mockup scores are unchanged.

**Level 2, Task 1 built, and a back button added (2026-10-15).** Images used: `08-L2T1-closing-balance.png` (copied from `L3-T4_bank-statement.png`), `08b`–`08e` (also attached in chat; same designs).

- **Back button:** a "← BACK" pill under the folder icon on every task screen, in the level header. It goes to the previous screen in play order: the previous task, the level-complete screen between levels, or Case Assigned from the first task. Level 1 complete goes back to the slips. Not in the mockups (owner request).
- **08:**
  - The desk has no outline here and a darker front edge.
  - The mat is a homography (1200 × 425); its aspect comes from the title's glyph proportions, calibrated on 04, because the "i" icon method fails at this shallow angle.
  - The printed statement is built from case data in flat coordinates (1000 × 650) and projected onto the mockup's top-sheet corners, over two warm sheets underneath. Fonts: Ubuntu Mono for the body, Roboto Slab 800 for the bank name (`[GUESSED]`, self-hosted).
  - Statement values follow the owner decisions, not the mockup: CAMS TEL (not FastTel); totals worked out as ₹5,050 / ₹10,798 (not ₹4,500 / ₹7,850). Running balances show for the first 7 rows (`statementBalancesShown`), as in the mockup, and the closing balance stays blank.
  - Four closing-balance answer cards sit on the mat as tap targets, a neutral colour so they don't hint (guess 28). Not in the mockup, which assumes physical cards only.
- **08b–08e:** a balance feedback layout. No desk; a tilted panel; NOT QUITE / CORRECT stamps; heading and hint; and the closing-balance card in red (wrong) or green (right) with a ₹ watermark, at each mockup's measured position; TRY AGAIN / NEXT CLUE.
  - Copy from the mockups, except: the ₹5,452 hint names the cheque payment (owner decision), the correct card shows ₹2,452 (owner decision), and the correct card adds the spec's line "Money coming in (credits) increases the balance; money going out (debits) decreases it."
- **Verification (12.4):** 8 rounds. 08 is at 10.4 (the extra answer cards and the statement totals and name changes account for most of it). 08b 6.5, 08c 7.8, 08d 6.6, 08e 6.5. Text blocks are aligned to 0–3 px; statement text sizes matched by measured ink widths.
- **Tests:** 110 unit and 10 Playwright, including a new BACK test across the level boundary. The full mission passes twice in a row.

Guess 28: the answer cards on the 08 mat (for tapping) use neutral paper colours, so red and green appear only on the feedback cards.

Level header title: the mockups write "Follow the money"; the game keeps the spec's "Follow the Money" (8, Case Board).

**Owner requests (2026-10-16): back button and level transition.**
- Back button: a round button in the top bar's left corner, styled like the tracker's step circles (navy with a white ring; turquoise on hover). The folder icon and level title move right to make room (folder x 86, title x 164), departing from the mockups' header by owner request. BACK first closes a feedback card if one is showing, then goes to the previous screen actually visited (browser history). With nothing visited yet in this page load, it goes to the screen before in play order.
- Level transition: Level 1 complete (07) plays a rising fanfare. Continuing (OPEN DOCS FILE) shows a full-screen "LEVEL 2 · FOLLOW THE MONEY" card: the title stamps in, the three steps pop up, then it lifts away (2.6 s; a tap skips it) with an upward-sweep chime. The same transition is used going into Level 3. No mockup (guess 29); both sounds are synthesised in `src/audio/sounds.ts`.
- Tests: 110 unit and 11 Playwright (new: BACK closes a card, then steps back through history; the Level 1 → 2 transition).

**Case Board and the board transition (2026-10-16).** Image used: `21-case-board.png` (also attached in chat; same design).
- **Case Board (21):** built to the mockup. The wall, a wooden frame with a dotted cork board, three hand-cut level cards (bank, statement-and-magnifier and shield icons; titles as on 21), green / blue / red pins, the red thread (two beziers fitted to the mockup), and the desk with the blurred newspaper and badge. Colours are sampled tokens (`--wood-*`, `--cork-*`, `--board-*`, `--pin-*`, `--thread`).
- **Statuses (spec 8; 21 has none, review note 6):**
  - Each card's three dots are its tracker steps: filled when solved or current, with the current one pulsing.
  - The current level's card glows turquoise.
  - Locked levels are greyed, with a padlock disc in the corner.
  - Solved levels get a green SOLVED stamp.
  - The status words stay as hidden text for screen readers and tests.
- **Access:**
  - Tapping a card resumes its current task, or revisits a solved level from its first task.
  - Tapping a dot opens that step.
  - Locked cards and dots are disabled.
  - The round BACK button (shared with the task header) sits in the top-left corner. It goes back to the screen the board was opened from, or to the resume point.
  - This replaces the old RESUME CASE button and the task list.
- **Level transition (replaces guess 29's title card):** continuing from a level-complete screen plays the Case Board itself, about 3.6 s (a tap skips it):
  1. The board settles in.
  2. SOLVED stamps onto the finished level (thud).
  3. A glowing trace runs along the thread to the next pin.
  4. The next card's padlock drops off, its pin pushes in, and a "LEVEL 2 UNLOCKED" tag pops up (chime).
  5. The view zooms into the new card and fades onto its first task (whoosh). Level 2 → 3 uses the same transition.
  The sounds are synthesised placeholders.
- **Verification (12.4):** 2 rounds against 21, with locks and pulses hidden because 21 shows no statuses: 15.9 → 9.07. Regions align within 0–3 px (icons, titles, dots, pins, newspaper heading). Transition frames were checked at 0.3, 0.9, 1.5, 2.3, 3.0, 3.4 and 4.2 s.
- **Tests:** 110 unit and 11 Playwright. The Case Board test now uses the cards and dots and covers BACK; the transition test checks the UNLOCKED tag and the SOLVED stamp.

Guess 30: the Case Board statuses (glow, padlock, SOLVED stamp, pulsing dot) and the board-based level transition are not in any mockup.

**Owner request (2026-10-16): step names on the Case Board.** Each card now shows its three step names under the dots (the same labels as the top-bar tracker: Account / KYC / Bank Records, Bank Balance / Cheque / Transactions, Phishing / Uncover / Report; Titillium Web 15 px bold, dimmed while locked). To fit them, the dots are 82 px apart (50 in 21) and 7–13 px higher. The status marks moved beside each card's icon so they don't cover the names: a padlock disc for locked levels, and a green tick disc (replacing the SOLVED stamp) for solved ones. During the level transition the tick stamps in and the padlock drops off.

**Owner decisions (2026-10-16): scanned state, shorter copy, BACK.**
- **Scanned documents:** once a document is accepted (KYC IDs; evidence on the placeholder scan tables), it is greyed out with a green "SCANNED ✓" tag and can't be tapped again. Its printed label dims too. Scanning the physical card again still gives the "Already verified" toast.
- **KYC VALID cards (05c/05d):** the second line is shortened to "Banks accept a PAN card for KYC." / "Banks accept Aadhaar for KYC." (it was "… subject to the applicable requirements").
- **Bank balance, correct answer (08c):** the line "Money coming in (credits) increases the balance; money going out (debits) decreases it." is removed (owner decision; this overrides the spec 5, Task 1 explanation noted under 08b–08e).
- **BACK:** always goes to the previous screen visited, even with a feedback card open (the card closes as the task is left). It no longer closes the card first.
- **Tests:** 110 unit and 11 Playwright. The e2e tests check that scanned IDs are disabled and marked, and that BACK leaves a screen while its card is open.

**Owner request (2026-10-16): scanned look on every scan screen.** Account cards (04), ID documents (05), slips (06) and closing-balance cards (08) all show what's been scanned. A scanned card is greyed out with a grey wash (on the slips, only the part above the pocket) and a SCANNED tag, and it can't be tapped again.
- Right answers (KYC IDs as they're collected; the answer of a solved task when revisiting) get a green tag with a tick.
- Wrong answers already tried get a navy tag with no tick, so they never read as right.
- Wrong answers are remembered for the session only (store `tried`, not saved), so a reload clears them. Physical cards can still be scanned again and get their usual feedback.
- Tests: 111 unit (new: tried cards are remembered and cleared on a new game) and 11 Playwright.

**Level 2, Task 2 built: the cheque (2026-10-16).** Images used: `09-L2T2-cheque-clue.png`, `09b-L2T2-cheque.png`, `09c`–`09f` (also attached in chat; same designs).
- **Flow:** NEXT CLUE on the closing balance → **09 clue** (`/level-2/cheque-clue`, the task's new entry screen) → CHECK CHEQUE → **09b cheque** (`/level-2/cheque`). Tap a part:
  - parts that are fine lift out enlarged with a red outline and their "This looks right." line, with TRY AGAIN (09c, 09d, 09f);
  - the amount row (words and figures, one tap target) lifts out in green with "You spotted it: The amounts don't match." and BANK STATEMENT (09e), which moves on to the highlighter.
  - BACK on the cheque falls back to the clue.
- **09 clue:**
  - The tan panel with WAIT… LOOK AT THIS. and the clue copy, built from the case figures (₹1,500 went OUT / came BACK IN).
  - The 08 statement, re-posed (the sheet's corners fitted from 09: a 2.8° turn at 0.758 scale) with its own 09 layout, measured on the un-warped sheet. 09 is sharp where 08 was blurred, so this one uses Inter and typed column heads.
  - The two cheque rows are highlighted (`isCheque` on the statement rows).
  - The closing balance is now printed (₹2,452), since Level 2, Task 1 is solved.
  - A highlighter pen drawn in SVG (it will also serve Level 2, Task 3).
- **Cheque (09b–09f):** built in HTML/CSS at 1195 × 431 from the case data, flat at (150, 197) on the feedback screens and tilted in 09b (homography from the measured corners; about 5.2°). Each tappable part has its area on the cheque and its enlarged box on the canvas, measured from 09c (payee), 09d (date), 09e (amount row) and 09f (signature). The bank, account number and MICR line use the same two zoom sizes (guess 32). The zoom outlines are semi-transparent (red rgb(231 82 64) / green rgb(89 156 114) at 54%), worked out from how they read over paper and over navy.
- **Fonts (self-hosted in `design/fonts`):** Inter for the printed text (single-storey "g", as in "sign" and "Aug" on 09); Edu VIC WA NT Beginner (500) for the handwriting (guess 31). The MICR line is drawn as simplified E-13B glyphs in SVG, since there's no free MICR font (guess 33).
- **Copy (from 09–09f):**
  - prompt "CAN YOU SPOT WHAT'S WRONG IN HER CHEQUE?", hint "Tap on the area you think is wrong.";
  - each "looks right" line breaks where the mockups do;
  - success heading "You spotted it: The amounts don't match.", CTA BANK STATEMENT.
  - The MICR codes (500012345, 123456, 10) are now case figures.
- **Departures from the mockups:**
  - 09b's blank patch over the date is an editing artifact, so the date shows;
  - the 09 statement shows the decided figures (CAMS TEL, ₹10,798 debits, ₹2,452 closing), not the mockup's FastTel / ₹7,850 / ₹3,502;
  - the header has the round BACK button (owner request), so the folder and title sit further right;
  - the handwriting is a font, not the illustrator's lettering.
- **Verification (12.4):** 8 rounds. 09: 17.3 → 9.83; 09b: 15.8 → 9.95; 09c: 17.4 → 12.43; 09d: 17.0 → 11.85; 09e: 18.2 → 12.48; 09f: 16.9 → 11.81. Text blocks align to within 0–5 px. What remains is mostly the handwriting glyph shapes, the security strip's texture and the header shift.
- **Tests:** 111 unit (the cheque feedback records the tapped area; resume opens the clue) and 11 Playwright (the mission now goes through the clue: highlighted rows, the printed closing balance, a "looks right" zoom, then the green mismatch).

Guess 31: the cheque handwriting is Edu VIC WA NT Beginner, the closest free match. Guess 32: the zoom boxes for the bank block, account number and MICR line (no mockups) follow the 09d/09f size. Guess 33: MICR digits are drawn shapes, not a font. Guess 34: the clue screen shows the closing balance, since 09 prints one.

**Level 2, Task 3 built: the highlighter (2026-10-16).** Images used: `10-L2T3-highlighter.png` (attached in chat; saved to `design/screens`), `10b`–`10j` (also attached; same as the files).
- **Interaction:** the player drags the highlighter pen from the desk and puts its **tip** on a row. The row under the tip on release is the answer; a drop that misses glides the pen back. Then:
  - an ordinary row turns the screen into 10b–10j: the row is highlighted, the pen lies on it, the heading reads "NOT SUSPICIOUS: ₹ amount / name", the note beside the statement explains it, and TRY AGAIN puts the pen back;
  - the CAMS TEL row gives 10h: "SUSPICIOUS:" in red, INVESTIGATE moves on to Level 2 complete.
  - Every one of the 11 rows works this way.
- **Layout:**
  - The desk (a new `highlighter` variant) and its gradient are measured from 10.
  - The statement is laid out flat at 900 × 720 and projected onto the sheet's corners in 10. Rows sit every 47.85 flat px, so the perspective spacing matches the mockup.
  - The pen tip's resting point on each row is computed from the same projection.
  - Text is Special Elite throughout (title 45 px, notes and hint 20 px, all fitted from ink widths).
  - The pen is redrawn in SVG and shared with the 09 clue screen.
- **Copy (from 10b–10j):**
  - The question, hint and "Drag me over the transaction" come from 10.
  - Each row has a short name for the heading (`highlightLabel`) and the mockup's note (`highlightFeedback`).
  - Pocket Money and the cheque payment have no mockup, so their notes are written to match (guess 35).
- **Departures from the mockups:**
  - 10b's outlier header ("Step 2: Bank Statment", Call/Case/Solve) uses the normal Level 2 header.
  - 10d says "₹ 499" for StyleHub; the game shows its real ₹1,200.
  - "FastTel" / "Cams tel" become CAMS TEL; "Quick Bites" becomes QuickBite.
  - Amounts keep their decimals (+50.00).
  - 10h shows no note, so the CAMS TEL explanation is read to screen readers only.
  - The note on 10g sits at x 1043 in the mockup; the game keeps every note at x 958.
  - The header has the round BACK button.
- **Verification (12.4):** 7 rounds. 10: 12.15 → 6.51. 10b–10j: 11.2–12.2 → 6.11–7.27. Regions align to 0–5 px. The last big gain came from the desk gradient (dark to y 480, near colour by y 760) and its right edge (1360,349)–(1512,958).
- **Tests:** 111 unit (the highlight feedback records its row; every row has a label) and 11 Playwright. The mission now drags the pen by its tip onto an ordinary row (checks the label, note and highlighted row), then onto CAMS TEL. Fixed along the way: the pen glided home after a hit too, so a quick second drag missed; it now glides only after a miss.

Guess 35: notes for the two rows without mockups (Pocket Money: "Ananya gets her pocket money from her parents every month."; the cheque payment: "This is the music class cheque you already checked.").

**Level 3 opening built: second call, phishing choice, scam reveal (2026-10-17).** Images used: `11`, `11b`, `11c`, `11d` (YES outcome), `11f` (NO outcome), `15`, `15b`, `12c` (also attached in chat; same designs).
- **Flow (owner request):**
  1. INVESTIGATE on the CAMS TEL row goes straight to the Case Board transition (Level 2 ticked, thread to Level 3, padlock off).
  2. Then Ananya's second call (11, 11b): already connected, it plays by itself (a tap skips), starting once the transition lifts.
  3. Then the choice (11c).
  - The old "Level 2 complete" placeholder is skipped (`levelIntroAfter` / `STRAIGHT_ON` in navigation.ts). Level 1 keeps its 07 screen.
- **Choice (11c):** Ananya's worried portrait and running call timer, the CAMS TEL notification (the link is text only), YES / NO.
  - NO → 11f: GOOD CALL stamp, Ananya smiling, the mockup copy; SECURE moves on.
  - YES → the fake website (owner decision 2026-10-14, still an unstyled placeholder: no mockup) → submitting it brings the player back to the choice with 11d: "Uh Huh" stamp, the bank's withdrawal alert, the mockup copy, TRY AGAIN. Only NO completes the task.
- **Reveal (15 → 15b → 12c)**, played as one sequence (a tap skips a beat):
  1. WAIT... LOOK AT THE NAME! with the CAMS TEL notification and the highlighted statement row, then "CAM Service Tel could this be?".
  2. CAMS TEL appears.
  3. Its letters slide into SCAM TEL, a red circle is drawn round it, and The Daily Chronicle slides up.
  - The newspaper is HTML, flat 1060 × 720, projected onto the corners measured in 12c.
  - A REPORT IT button then moves on (not in 12c, guess 36).
- **Copy:** from the mockups, with these exceptions:
  - The alert uses the decided figures: ₹2,000 withdrawn, ₹452 left, sender FIRST NATIONAL BANK (11d shows Rs 3000 / Rs 502 / FIRST BANK).
  - The newspaper's link is the same unusable address as the message (`https://cams-tel-debit/unblock-card`), not "http://cams-tel.in" (review note 8).
  - GOOD CALL and Uh Huh now carry only the mockup lines. The earlier extra advice (official bank channels; card details never shared) is dropped to match 11d/11f.
- **Verification (12.4):** 5 rounds. 11: 4.44; 11b: 4.86; 11c: 5.11; 11d: 6.63; 11f: 6.74; 15: 4.58; 15b: 5.21; 12c: 15.1 → 12.48 (the masthead, emblem and torn edges are illustrated in the mockup). The rough-edge filter now sits on a background layer so it never distorts text.
- **Tests:** 111 unit (Level 2 goes straight on with the board transition) and 11 Playwright. The mission now checks the LEVEL 3 UNLOCKED transition and the call playing by itself into the choice, the loss shown back on the choice screen, and the reveal reaching SCAM TEL.

Guess 36: the REPORT IT button after the reveal (12c has none). Guess 37: the call timer runs on from the call into the choice screens (11c–11f show 00:05).


**Owner request (2026-10-17): the SCAM TEL reveal, and button / chat spacing.**
- **Reveal animation:** the unscramble is now its own beat (the reveal has 5 beats). In about 1.3 s:
  1. The letters of CAMS TEL shiver.
  2. The S glows red and lifts out of the word (whoosh), while the other letters slide right to make room.
  3. The S slams down at the front with a thud: the word jolts, a red flash bursts behind it, and the desk shakes.
  4. A moment later the clue cards clear, the words rise, the circle is drawn, the S turns back to cream, and the newspaper slides in.
  - Taps still skip ahead. When revisiting a solved reveal, it opens on the end state with no animation.
- **Chat bubble (11b):** the text box was 3 px narrower than the mockup's line, so "by" wrapped alone and the text overflowed the bubble. It is now 570 px wide, and the second call's lines sit in the middle of the bubble.
- **Buttons:**
  - YES / NO now share the notification's width evenly (309 px each, 40 px apart, 40 px below it).
  - TRY AGAIN and SECURE are 350 × 88 with even inner padding and never wrap. They sit 56 px in from the panel's right edge and overlap its bottom edge by about 40 px.
  - The outcome text has 56 px padding on both sides.
  - These are departures from the mockups' slightly uneven positions (11c 5.11 → 7.09, 11d 6.63 → 8.61, 11f 6.74 → 8.04).

**Fix (2026-10-17): revisiting a solved task.** When a player revisited a solved task (e.g. Level 3, Task 1 after an earlier session), a right answer's button (SECURE, NEXT CLUE…) only closed the card. It now moves on to the next task, as it does the first time; progress is unchanged. The scam reveal also always plays its animation, revisiting too (it used to open on the last frame); taps still skip ahead.

**Fake website built (2026-10-17).** Image used: `14-L3T1-fake-website.png` (attached in chat; saved to `design/screens`).
- YES on the choice screen opens it. Ananya stays on the call beside it (portrait and timer). The page has:
  - a CAMS TEL / Tele Services header with a cube logo and an URGENT ACTION REQUIRED pill;
  - the blocked-card message;
  - three boxes: debit card number, CVV, OTP. The expiry date is dropped to match 14.
  - GO BACK, UNBLOCK CARD, and the red SIMULATION note.
- Nothing can be typed. Tapping a box fills an obviously fictional value. UNBLOCK CARD with empty boxes gives the "fill every box" note; with all three filled it shows the loss (11d) back on the choice screen. GO BACK returns to the choice.
- Verification: 2 rounds, 4.54 → 3.90. 11 Playwright tests pass (the mission fills all three boxes).


**Owner request (2026-10-17):** the link in the CAMS TEL message (11c) is tappable and does exactly what YES does: it opens the pretend page (14) inside the game, never a real site. Test added (12 Playwright).

**Level 3 finale built: passkey, evidence, report, certificate (2026-10-17).** Images used: `13`, `13b`, `16e`, `14`, `14` (statement attached), `14c`, `15`, `16` (also attached in chat; same designs).
- **One computer for every screen:** the bank's computer (`BankComputer`) is laid out at its zoomed size (16e–15: bezel 202–1315 × 165–848). On the desk (13, 13b) the same layout is scaled 0.726 × 0.716 onto the desk's monitor. Its text keeps its size, as in the mockup.
- **Passkey (13 → 13b → 16e):**
  - The desk carries the monitor, a keyboard and the Daily Chronicle (the 12c newspaper projected onto the corners measured in 13).
  - The keyboard's top row types digits 1–0, and its last key deletes. These labels are not in 13, which has blank keys (guess 38). A physical keyboard also works.
  - The third digit is checked straight away (no ENTER key).
  - A wrong code shakes the boxes, turns them red and shows ACCESS DENIED with the next hint on the monitor, then clears.
  - The right code zooms the view into the monitor (16e: keyboard and newspaper slide away, chime), then goes on to the evidence.
  - Fixed: the passkey was submitted twice under React's development double-render.
- **Evidence (14 → 14c):** two dashed slots with a statement thumbnail (the CAMS TEL row, 30 Aug 26) and the CAMS TEL message.
  - Scanning or tapping one fills its slot grey-teal with a tick (no pop-up).
  - The hint shows only before anything is attached.
  - With both attached the title becomes EVIDENCE ATTACHED, notes appear on the right, and REVIEW INCIDENT REPORT shows.
  - The cheque, scanned here, still gets the "not needed" note.
- **Report (15):**
  - Ananya's portrait and the five fields: Customer, Account Number XXXX 3210, Transaction Date 30 Aug 2026, ₹5,999 — CAMS TEL, Suspected fraud: CAMS TEL. Account and date follow the statement, not the mockup's 7812 / 12 Oct (review note 3).
  - SUBMIT REPORT stamps REPORT SUBMITTED on the monitor (fanfare), then goes to the certificate.
  - The old report-submitted screen (19) is no longer in the flow (`LEVEL_COMPLETE[3]` is now the certificate).
- **Certificate (16):** built in HTML/CSS: navy frame with gold lines, corner stars, bank emblem with laurels, a MISSION COMPLETE! banner, the mockup copy and line breaks, a star divider and faint leaves. The blurred newspaper and badge sit on the desk; the card drops in and the badge pops.
  - BACK TO CASE BOARD and REPLAY MISSION sit below it. They are not in 16, but spec 7 needs them (review note 7).
- **Tracker (Level 3's Report step covers three tasks):** it shows "3" un-reached on the passkey until it's solved, then a solid dot with no number (13b, 14, 15).
- **Verification (12.4):** 5 rounds. 13: 8.32 → 7.69; 13b: 7.66; 16e: 4.90; 14: 5.24; 14 attached: 5.09; 14c: 5.97; 15: 5.19; 16: 15.88 → 13.14 (illustrated certificate details and the blurred props).
- **Tests:** 111 unit and 12 Playwright. The mission now covers the desk keyboard (wrong code on the monitor), the zoom, attaching evidence, REVIEW INCIDENT REPORT, the report fields, the submit stamp and the certificate.

Guess 38: digit labels on the desk keyboard's top row (needed to type on an iPad). Guess 39: the solid tracker dot for Level 3's Report step once reached.


**Owner requests (2026-10-17): BACK, centred buttons, the certificate title, music.**
- **BACK** always goes to the screen before the current one in the game's order (`SCREEN_FLOW` / `previousScreenPath` in navigation.ts), whatever was tapped or opened before. This replaces browser-history back.
  - Side screens go back to where they open from (fake website → phishing choice).
  - Only the Case Board, which is off the main line, still returns to where it was opened from.
- **Buttons:** every button's words sit exactly in its middle. The arrow hangs off the side of the label without taking space, and earlier per-mockup paddings are overridden (`polish.css`).
  - Arrows are 10 px shorter and closer to the words so they stay inside.
  - The narrow TRY AGAIN cards (04a–05e) are at least 360 px wide.
  - This covers the glowing buttons, the computer's buttons and the fake site's buttons.
- **MISSION COMPLETE!** is centred in the banner's navy band: the glyphs' middle is at y 342, against the band's 341 (it was 331).
- **Sound:**
  - A background music loop (A minor detective tune, 96 bpm, 20 s; synthesised, 89 ms to build) starts on the first tap.
  - Every button clicks. Right answers get a rising arpeggio, wrong answers a soft "uh-oh", and progress (an ID or evidence accepted) the chime. These come from one `SoundDirector`.
  - Screens keep their own moments (ring, stamps, reveal, fanfare).
  - A speaker button in the top-right corner mutes everything; the choice is remembered on the device.
  - The real sound design still replaces all of this later.
- **Tests:** 113 unit (2 new for the BACK order) and 12 Playwright.

**Owner request (2026-10-17): updated 07, BACK to the start.**
- `07-L1-complete.png` is replaced by the owner's update, which adds a magnifying glass on the panel's lower-right corner. It is cut from the mockup by differencing the two versions (`src/assets/interim/magnifier.png`, interim until exported). It sits at (1095, 490) and slides in. Score 8.52 (the centred button text accounts for most of the difference).
- BACK reaches the start screen: Case Assigned and the opening call now have the round BACK button too, and go back to the start, where RESUME CASE carries on. The chain from any task therefore runs all the way home. Tests: unit (case/call → start) and the e2e BACK journey ending on the start screen with RESUME CASE.

**Owner request (2026-10-17): equal padding on every button.** Each button is now as wide as its words (plus arrow) with the same padding on both sides: 44 px on the glowing buttons, 32 px on the certificate's and the fake site's. The label and arrow are centred together. Measured on 16 screens: start, case, 04a, 04b, 06c, 07, 08b, 09, 09c, 09e, 11c, 11f, fake site, 15, 16; left and right padding match within 1 px.
- YES / NO stay an equal-width pair (309 px).
- The full-width computer button keeps its width, with the group centred.
- Buttons that line up with a panel edge are anchored to it: the phishing outcomes, 56 px in from the panel's right; the feedback cards, as before.
- These are departures from the mockups' fixed button widths (`polish.css`).

**Owner request (2026-10-17): BACK on every screen.** The second call (12), the certificate (16) and the two side screens only reachable by URL (Level 2 complete, report submitted) now have the round BACK button too. Every screen except the start (home) has one.
- BACK sits above the level transition (z 45), so it also works while that plays.
- On the second call it doesn't count as a tap on the call.
- Test added: BACK from the certificate, the second call, the reveal, the cheque clue and the first call each land on the screen before; the start has none (13 Playwright).

**Owner request (2026-10-17): a more relevant report step.**
- ~~The button now says SEND TO FRAUD TEAM~~: reverted by the owner the same day; it stays **SUBMIT REPORT** (15).
- After sending, the monitor shows a confirmation in place of the report, instead of the two-second stamp:
  - a tick and REPORT SENT;
  - "Your incident report is with the bank's fraud team for investigation.";
  - a case reference built from the case data (NB-3210-0830: account ending, transaction date);
  - a checklist: bank statement attached, suspicious link attached, Ananya will be kept updated.
  - VIEW CERTIFICATE moves on when the player is ready. It no longer auto-advances.
- Not in any mockup (guess 40). The wording keeps the spec's "for investigation; nothing proven".

**Owner request (2026-10-17): sending the report as a screen animation.** SUBMIT REPORT stays. Pressing it plays on the monitor (about 2.3 s):
1. The button becomes a progress bar ("SENDING REPORT TO FRAUD TEAM…"), filling over 1.6 s, while each of the five fields gets a tick (whoosh).
2. A bright scan line wipes down the screen (thud), revealing the REPORT SENT confirmation: the reference and checklist from before (fanfare).
3. VIEW CERTIFICATE then fades in over the full bar.


**Owner requests (2026-10-19): Ananya's voice, and the scanner note by the lamp.**
- **Voice-over (interim):** Ananya speaks every line of both calls using the device's own speech (Web Speech API; offline on iPad, no recordings).
  - Voice choice: an Indian-English female voice first (Veena, Isha, Heera, Aditi…), then any female English voice. Pitch 1.4 (1.25 and a touch slower when she's worried).
  - Each line types and is spoken together; the call moves on 0.7 s after she finishes (2.2 s when there is no voice).
  - A tap skips (and stops) the line. The music dips while she talks, and mute silences her too.
  - Speech is unlocked on the first tap, as iPad Safari requires.
  - Checked with a stand-in speech engine: it picks Veena over Rishi and says all three opening lines in order, waiting for each.
  - A recorded voice-over can replace this later (`src/audio/voice.ts`).
- **Scanner note:** on 04 and 05, the "scanner blocked / unavailable" note sits beside the desk lamp, pointing at its light, and the lamp's light goes dim while the camera can't be used. Screens without a lamp (08, the evidence monitor) keep it along the bottom.
- Tests: 113 unit and 13 Playwright pass.

**Owner request (2026-10-19): a young girl in distress.** Ananya's voice is now pitched 1.8 at rate 1.12 (worried lines 1.95 at 1.18; the Web Speech maximum pitch is 2). Each line is broken at its pauses into short fragments, each with a small pitch wobble, so she sounds breathless and shaky. Still the device voice (Indian-English female first); a recorded child actor would sound far more natural and can replace it in `src/audio/voice.ts`.

**Owner request (2026-10-19): ElevenLabs voice "Noor" for Ananya.**
- **Recorded lines:** made with ElevenLabs `eleven_v4`, with the tags [childlike voice] [nervous] [breathless] [trembling voice]. They live in `src/assets/voice/` as mono mp3s at 128 kbps:
  - `ananya-call1-1.mp3` (6.2 s)
  - `ananya-call1-2.mp3` (4.0 s)
  - `ananya-call1-3.mp3` (3.2 s)
  - `ananya-call2-1.mp3` (5.8 s)
- **How they play:** `useAnanyaVoice` matches a line's text to its recording and plays it through Howler. While she speaks the music ducks. The clip respects mute and stops when the line changes. The call moves on 0.7 s after the clip ends.
- **Missing line:** call 2, line 2 ("I just got a message saying I can unblock it immediately by clicking a link.") failed. ElevenLabs disabled Free Tier access on the account and asks for a paid plan. That line falls back to the device voice until it is regenerated; to add it, drop in `ananya-call2-2.mp3` and add it to `RECORDINGS`.
- **Measured:** 113 unit and 13 Playwright tests pass; the build bundles the 4 mp3s (381 kB).

