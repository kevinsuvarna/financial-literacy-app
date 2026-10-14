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

- **Target viewport (design canvas):** 1280 × 831 `[GUESSED, now contradicted: the Figma frames are 1512 × 982. Every screen except 01 is exported at that size, and 01-start.png (6048 × 3928) is exactly 4 × 1512 × 982. Same aspect ratio, so only the canvas constant changes. Switch to 1512 × 982 when Stage 1 starts matching mockups.]`
- **Scaling:** every screen is built on a fixed 1280 × 831 canvas, scaled proportionally to fit the device (letterboxed with the background colour if the aspect ratio differs). This keeps layouts identical to the mockups on every iPad and laptop.
- **Filled-in typography and colour tokens are exact and locked.** Never substitute or approximate them. A token still marked `[FILL]` is guessed following Section 12.5.
- Components use tokens only, never raw hex values or font names, so replacing a guessed value updates every screen at once.

### 9.2 Colour tokens

| Token | Use | Hex |
|---|---|---|
| `--bg-navy` | Main background | `[GUESSED: #052039]` |
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
| `--font-display` | Distressed typewriter headings | `[GUESSED: Special Elite]` | `[GUESSED: 400]` | `[GUESSED: 64px title, 30px task headings]` |
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

- Spacing scale: `[to be recorded from first mockup]`
- Border radii: `[GUESSED from 01-start.png: panels 18px, CTAs 24px]`
- Outlines: `[GUESSED from 01-start.png: 4px --ink on panels and CTAs]`
- Shadows: `[GUESSED: panels 0 8px 0 --ink at 45%; CTAs 0 5px 0 --ink]`
- Background grid: `[GUESSED from 01-start.png: 1px --bg-grid lines every 37px]`

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
  - `<game-domain>` comes from the single constant `GAME_DOMAIN` in `src/content/gameData.ts`: `[GUESSED: save-the-savings.example]`. Set the real domain before printing. The scanner only accepts codes for this domain. While it's a placeholder, `npm run print` marks every page and the guide as TEST PRINT.
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
| 01 | `01-start.png` | Start screen ("Save the Savings Account") | 3 | screen | `/` | Placeholder (Stage 0) |
| 02 | `02-call-ananya-1.png` | Ananya's first phone call | 3 | call | `/call/ananya` | Placeholder (Stage 0) |
| 02b | `02b-call-ananya-1-talking.png` | First call: "Something is wrong with my bank account" | 3 | call | same route, call step 2 | Mockup received |
| 02c | `02c-call-ananya-1-talking.png` | First call: "someone is trying to steal my pocket money" + "Take note of clues" | 3 | call | same route, call step 3 | Mockup received |
| 02d | `02d-call-ananya-1-connecting.png` | First call breaking up: "…I was checking my account and then-" | 3 | call | same route, call step 4 | Mockup received |
| 02e | `02d-call-ananya-1-disconnected.png` | First call: CONNECTION LOST (file is named 02d; rename to 02e-…) | 3 | call | same route, call step 5 | Mockup received |
| 03 | `03-case-assigned.png` | Case assigned ("Open Case File") | 3 | cinematic | `/case-assigned` | Placeholder (Stage 0) |
| 04 | `04-L1T1-account-type.png` | Account type cards on table | 4, Task 1 | table | `/level-1/account-type` | Placeholder (Stage 0) |
| 04a | `04a-L1T1-account-type-current-wrong.png` | Account type: Current scanned (NOT QUITE) | 4, Task 1 | table | same route, feedback | Mockup received |
| 04b | `04b-L1T1-account-type-savings-correc.png` | Account type: Savings scanned (ACCOUNT IDENTIFIED) | 4, Task 1 | table | same route, feedback | Mockup received |
| 04c | `04c-L1T1-account-type-fixed-wrong.png` | Account type: Fixed Deposit scanned (NOT QUITE) | 4, Task 1 | table | same route, feedback | Mockup received |
| 04d | `04d-L1T1-account-type-recurring-wrong.png` | Account type: Recurring Deposit scanned (NOT QUITE) | 4, Task 1 | table | same route, feedback | Mockup received |
| 05 | `05-L1T2-verify-identity.png` | Verify Identity (KYC cards on table) | 4, Task 2 | table | `/level-1/verify-identity` | Placeholder (Stage 0) |
| 05b | `05b-L1T2-verify-identity-library-scanned.png` | KYC: Library card scanned (NOT QUITE) | 4, Task 2 | table | same route, feedback | Mockup received |
| 05c | `05c-L1T2-verify-identity-pan-scanned.png` | KYC: PAN scanned first (VALID, SCAN NEXT) | 4, Task 2 | table | same route, feedback | Mockup received |
| 05d | `05d-L1T2-verify-identity-aadhaar-scanned.png` | KYC: Aadhaar scanned, both done (VALID, NEXT CLUE) | 4, Task 2 | table | same route, feedback | Mockup received |
| 05e | `05e-L1T2-verify-identity-passport-scanned.png` | KYC: Expired passport scanned (NOT QUITE) | 4, Task 2 | table | same route, feedback | Mockup received |
| 06 | `06-L1T3-withdrawal-slip.png` | Deposit vs withdrawal slips on table | 4, Task 3 | table | `/level-1/withdrawal-slip` | Placeholder (Stage 0) |
| 07 | `07-L1-complete.png` | Level 1 complete | 4 | cinematic | `/level-1/complete` | Placeholder (Stage 0) |
| 08 | `08-L2T1-closing-balance.png` | Closing balance (statement + answer cards) | 5, Task 1 | table | `/level-2/closing-balance` | Placeholder (Stage 0) |
| 08 (base) | `L3-T4_bank-statement.png` | Closing balance: statement on the desk (misnamed; rename to 08-L2T1-closing-balance.png) | 5, Task 1 | table | same route | Mockup received |
| 08b | `08b-L2T1-closing-balance-statement-wrong.png` | Closing balance: ₹5,452 scanned (NOT QUITE) | 5, Task 1 | table | same route, feedback | Mockup received |
| 08c | `08c-L2T1-closing-balance-statement-right.png` | Closing balance: correct card (CORRECT). Shows ₹3,502, which contradicts the statement; see 13.3 | 5, Task 1 | table | same route, feedback | Mockup received |
| 08d | `08d-L2T1-closing-balance-statement-wrong.png` | Closing balance: ₹2,402 scanned (NOT QUITE, forgot interest) | 5, Task 1 | table | same route, feedback | Mockup received |
| 08e | `08e-L2T1-closing-balance-statement-wrong.png` | Closing balance: ₹3,502 scanned (NOT QUITE). Same amount 08c marks correct | 5, Task 1 | table | same route, feedback | Mockup received |
| 09 | `09-L2T2-cheque.png` | Cheque investigation | 5, Task 2 | screen | `/level-2/cheque` | Placeholder (Stage 0) |
| 09 (clue) | `09-L2T2-cheque-clue.png` | "WAIT… LOOK AT THIS": statement with the cheque rows highlighted, CHECK CHEQUE (new screen before the cheque) | 5, Task 2 | screen | new route needed | Mockup received |
| 09b | `09b-L2T2-cheque.png` | Cheque investigation: "CAN YOU SPOT WHAT'S WRONG IN HER CHEQUE?" | 5, Task 2 | screen | `/level-2/cheque` | Mockup received |
| 09c | `09c-L2T2-cheque-name-tapped.png` | Cheque: payee tapped ("looks right", TRY AGAIN) | 5, Task 2 | screen | same route, feedback | Mockup received |
| 09d | `09d-L2T2-cheque-date-tapped.png` | Cheque: date tapped ("looks right", TRY AGAIN) | 5, Task 2 | screen | same route, feedback | Mockup received |
| 09e | `09e-L2T2-cheque-amount-mismatch-found.png` | Cheque: amount row tapped (mismatch found, BANK STATEMENT) | 5, Task 2 | screen | same route, feedback | Mockup received |
| 09f | `09f-L2T2-cheque-signature.png` | Cheque: signature tapped ("looks right", TRY AGAIN) | 5, Task 2 | screen | same route, feedback | Mockup received |
| 10 | `10-L2T3-highlighter.png` | Highlight the suspicious transaction | 5, Task 3 | screen | `/level-2/highlighter` | Placeholder (Stage 0) |
| 10b | `10b-L2T3-highlighter-cafe-express.png` | Highlighter: Cafe Express (NOT SUSPICIOUS). Outlier header "Step 2: Bank Statment" and tracker Call/Case/Solve | 5, Task 3 | screen | same route, feedback | Mockup received |
| 10c | `10c-L2T3-highlighter-playzone.png` | Highlighter: PlayZone (NOT SUSPICIOUS) | 5, Task 3 | screen | same route, feedback | Mockup received |
| 10d | `10d-L2T3-highlighter-stylehub.png` | Highlighter: StyleHub (NOT SUSPICIOUS). Heading says ₹499, should be ₹1,200 | 5, Task 3 | screen | same route, feedback | Mockup received |
| 10e | `10e-L2T3-highlighter-cinemax.png` | Highlighter: CineMax (NOT SUSPICIOUS) | 5, Task 3 | screen | same route, feedback | Mockup received |
| 10f | `10f-L2T3-highlighter-quickbite.png` | Highlighter: QuickBite (NOT SUSPICIOUS). Heading says "Quick Bites" | 5, Task 3 | screen | same route, feedback | Mockup received |
| 10g | `10g-L2T3-highlighter-interest-credit.png` | Highlighter: Interest credit (NOT SUSPICIOUS, "Ananya's weekly log accounts for this") | 5, Task 3 | screen | same route, feedback | Mockup received |
| 10h | `10h-L2T3-highlighter-cams-tel-suspicious-found.png` | Highlighter: CAMS TEL row (SUSPICIOUS, INVESTIGATE). Heading says "FastTel", should be CAMS TEL | 5, Task 3 | screen | same route, feedback | Mockup received |
| 10i | `10i-L2T3-highlighter-cheque-music-fees.png` | Highlighter: cheque returned row (NOT SUSPICIOUS, "Music Class") | 5, Task 3 | screen | same route, feedback | Mockup received |
| 10j | `10j-L2T3-highlighter-grandparents-gift.png` | Highlighter: Gift from Grandparents (NOT SUSPICIOUS) | 5, Task 3 | screen | same route, feedback | Mockup received |
| 11 | `11-L2-complete.png` | Level 2 complete | 5 | cinematic | `/level-2/complete` | Placeholder (Stage 0) |
| 12 | `12-call-ananya-2.png` | Ananya's second phone call | 6, Task 1 | call | `/level-3/call-ananya` | Placeholder (Stage 0) |
| 12a | `11-call-ananya-2.png` | Second call: "Hello! It's me, Ananya! My debit card has been blocked" | 6, Task 1 | call | same route, call step 1 | Mockup received |
| 12b | `11b-call-ananya-2-talking.png` | Second call: "I just got a message saying I can unblock it immediately by clicking a link." | 6, Task 1 | call | same route, call step 2 | Mockup received |
| 13 | `13-L3T1-phishing-choice.png` | Should Ananya click the link? | 6, Task 1 | screen | `/level-3/phishing` | Placeholder (Stage 0) |
| 13a | `11c-call-ananya-2-card-blocked-choice.png` | Phishing choice: CAMS TEL notification + YES / NO ("Should Ananya tap the link in the notification?") | 6, Task 1 | screen | `/level-3/phishing` | Mockup received |
| 13b | `11f-L3T1-phishing-choice-yes-chosen.png` | Phishing: **NO** outcome (GOOD CALL, SECURE). File name says "yes-chosen", which is swapped | 6, Task 1 | screen | same route, feedback | Mockup received |
| 14 | `14-L3T1-fake-website.png` | Fake bank website (YES path) | 6, Task 1 | screen | `/level-3/fake-website` | Placeholder (Stage 0) |
| 14a | `11d-L3T1-phishing-choice-no-correct.png` | Phishing: **YES** outcome ("Uh Huh", simulated ₹3,000 loss, TRY AGAIN). File name says "no-correct", which is swapped. Replaces the fake website: see 13.3 | 6, Task 1 | screen | see 13.3 | Mockup received |
| 15 | `15-L3T2-scam-reveal.png` | CAMS TEL scam reveal | 6, Task 2 | cinematic | `/level-3/scam-reveal` | Placeholder (Stage 0) |
| 15a | `15-L3T2-scam-reveal-statement-clue.png` | Scam reveal 1: "WAIT… LOOK AT THE NAME!" notification + statement row, "CAM Service Tel could this be?" | 6, Task 2 | cinematic | same route, step 1 | Mockup received |
| 15b | `15b-L3T2-scam-reveal-connection.png` | Scam reveal 2: "CAMS TEL" appears | 6, Task 2 | cinematic | same route, step 2 | Mockup received |
| 15c | `12c-L3T2-scam-reveal-scam-exposed.png` | Scam reveal 3: CAMS TEL rearranges to "SCAM TEL", plus the Daily Chronicle article | 6, Task 2 | cinematic | same route, step 3 | Mockup received |
| 16 | `16-L3T3-passkey-computer.png` | Passkey on the on-screen computer | 6, Task 3 | screen | `/level-3/passkey` | Placeholder (Stage 0) |
| 16a | `13-L3T3-passkey-computer.png` | Passkey: ENTER PASSKEY on the bank computer, newspaper on the desk | 6, Task 3 | screen | `/level-3/passkey` | Mockup received |
| 16b | `13b-L3T3-passkey-computer-typing.png` | Passkey: 2-0-9 typed (matches the derived passkey) | 6, Task 3 | screen | same route | Mockup received |
| 16c | `16e-L3T3-passkey-computer-unlocked.png` | Passkey: unlocked (zoomed computer) | 6, Task 3 | screen | same route | Mockup received |
| 17 | `17-L3T4-scan-evidence.png` | Scan evidence (statement + phishing card) | 6, Task 4 | table | `/level-3/scan-evidence` | Placeholder (Stage 0) |
| 17a | `14-L3T4-scan-evidence.png` | Scan evidence: two empty slots (statement, CAMS TEL message) on the bank computer | 6, Task 4 | table | `/level-3/scan-evidence` | Mockup received |
| 17b | `14-L3T4-scan-evidence-statement-attached.png` | Scan evidence: statement attached (file shares the "14" number with 17a) | 6, Task 4 | table | same route | Mockup received |
| 17c | `14c-L3T4-scan-evidence-message-attached.png` | Scan evidence: both attached (EVIDENCE ATTACHED, labels, REVIEW INCIDENT REPORT) | 6, Task 4 | table | same route | Mockup received |
| 18 | `18-L3T5-review-report.png` | Review incident report | 6, Task 5 | screen | `/level-3/review-report` | Placeholder (Stage 0) |
| 18a | `15-L3T5-review-report.png` | Incident report: customer, account, date, ₹5,999 — CAMS TEL, concern, SUBMIT REPORT | 6, Task 5 | screen | `/level-3/review-report` | Mockup received |
| 19 | `19-report-submitted.png` | Report submitted | 6, Task 5 | cinematic | `/report-submitted` | Placeholder (Stage 0) |
| 20 | `20-certificate.png` | Mission complete certificate | 7 | cinematic | `/certificate` | Placeholder (Stage 0) |
| 20a | `16-certificate.png` | Certificate: MISSION COMPLETE!, badge on the desk. No Case Board / replay buttons | 7 | cinematic | `/certificate` | Mockup received |
| 21 | `21-case-board.png` | Case Board (level select) | 8 | screen | `/case-board` | Placeholder (Stage 0) |
| 21a | `21-case-board.png` | Case Board: cork board, three pinned level cards with 3-dot progress, red thread | 8 | screen | `/case-board` | Mockup received |
| 22 | `22-feedback-popups.png` | Correct / incorrect feedback pop-ups | 2 | overlay | overlay (no route) | Placeholder (Stage 0) |

Routes are defined in `src/app/screens.ts`. A phone camera opening a printed QR code lands on `/a/<artefact-id>`, a friendly page outside the game canvas (10.3).

The top progress tracker (Section 8) appears inside task screens, so it is built from the first task screen it appears in (04) and checked on later ones.

Scene types: `call` (phone call), `table` (cards on a table: camera active), `screen` (on-screen interaction), `cinematic` (narrative), `overlay` (appears over other screens).

### 13.2 Stages

| Stage | What gets built | Images needed | Status |
|---|---|---|---|
| 0 | Full game logic, scanning, QR printing, placeholder UI for every screen | `01-start.png` (overall theme and mood only, not layout) | Built, awaiting owner confirmation (see 13.3). Real-iPad camera checks (Section 11) still to be done by the owner. |
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

16. After the first TURN ON SCANNER tap, later table scenes switch the scanner on by themselves until the page is reloaded. The camera stays on for 1.5 s between back-to-back table scenes and is off everywhere else.
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
