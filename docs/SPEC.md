# Build a Phygital Financial Literacy Game — Save Ananya’s Savings Account

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

The game runs in a web browser on a computer or tablet. The player also receives a physical case file containing printed artefacts.

Physical artefacts include:
- Ananya’s case file.
- Bank account type cards.
- Identity document cards.
- Deposit and withdrawal slips.
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

Not every interaction uses QR scanning. Some tasks use direct touch interactions, such as tapping a cheque to identify an error or dragging an on-screen highlighter over a bank statement.

Implement QR scanning as a working interaction if camera access is available. Provide a fallback for development and testing, such as selecting a simulated artefact from a list. Do not pretend a QR code was scanned when no scan or simulated selection occurred.

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

Maintain the task as incomplete until both required cards have been scanned. Incorrect documents should trigger explanatory feedback without advancing the level.

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

This level asks the player to investigate what happened to Ananya’s money by examining banking documents.

### Task 1: Calculate the Closing Balance

Display the bank statement and ask:

**HOW MUCH MONEY IS LEFT IN ANANYA’S ACCOUNT?**

The player examines the statement and selects or scans the card containing the correct closing balance.

Use the values and transaction records from the existing Figma designs and game artefacts. Ensure the opening balance, credits, debits, and closing balance are arithmetically consistent.

Give hints when the answer is incorrect. On success, explain how money coming into the account increases the balance and money going out decreases it.

### Task 2: Investigate the Returned Cheque

The player notices that the bank statement contains a cheque transaction followed by a returned-cheque entry.

Display:

**WAIT — THE CHEQUE WAS RETURNED. CAN YOU FIND OUT WHY?**

Show the physical cheque on screen as an interactive artefact.

This interaction is touch-based, not QR-based. The player taps different areas of the cheque to investigate the details.

The cheque contains a mismatch between the amount written in numbers and the amount written in words.

The player must tap the amount field to identify the discrepancy.

On the correct tap:
- Highlight the mismatch.
- Explain that the amount in numbers and words does not match.
- Explain that this can cause a cheque to be returned.
- Allow the player to continue.

Tapping other areas should provide feedback such as “This detail looks correct. Keep investigating.”

### Task 3: Find the Suspicious Transaction

Display Ananya’s bank statement and prompt:

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

- **NO — DON’T CLICK THE LINK**
- **YES — CLICK THE LINK**

If the player selects NO:
- Congratulate the player for checking before acting.
- Explain that unexpected, urgent messages can be phishing attempts.
- Advise checking card status through official bank channels.
- Continue the investigation.

If the player selects YES:
- Show a simulated suspicious webpage asking for banking information.
- Explain that scammers may try to collect sensitive information through fake pages.
- If the game demonstrates a resulting fraudulent transaction, make it clear that the loss occurs in the simulation after information is entered, not merely because a link was clicked.
- Explain the safer action and let the player continue.

The game should teach safe behaviour without collecting any real personal, card, PIN, password, or OTP information.

### Task 2: Uncover the Scam

Show a short narrative screen using the CAMS TEL scam backstory and visual assets from the existing Figma file.

Connect the CAMS TEL name appearing in the suspicious bank statement transaction with the name appearing in the phishing message.

The player should recognise the connection between these clues and identify the suspected scam operation.

Keep this as a story-driven discovery rather than introducing an unrelated quiz.

### Task 3: Unlock the Evidence File

Display a locked file requiring a three-digit passkey.

Show this hint:

**THREE CLUES HOLD THE PASSKEY**

Enter the last digit of each value, in this order:

1. The closing balance.
2. The amount on the cheque.
3. The suspicious transaction.

Use the exact values displayed in the existing game artefacts. Validate the entered code against the expected three-digit passkey.

On success, unlock the evidence file and explain that the player has connected the key clues.

If incorrect, allow another attempt and provide a useful hint without revealing the full passkey immediately.

### Task 4: Scan Evidence

Display an **SCAN EVIDENCE** screen.

The player must scan the two relevant physical artefacts:
- Bank statement, containing the suspicious CAMS TEL transaction.
- Phishing-link/message card, representing the message offering to unblock Ananya’s debit card.

Show a separate evidence slot for each artefact. Mark each slot as complete after the corresponding QR code has been recognised.

The task cannot proceed until both pieces of evidence are attached.

The cheque is not required as evidence for this incident report because its returned-payment issue has already been explained separately.

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

“Check that both pieces of evidence are attached before submitting.”

Primary CTA: **SUBMIT INCIDENT REPORT**

When clicked, validate that all required evidence is attached and then show a successful report-submission screen. The report should be described as submitted for investigation, without assuming that the suspected fraud has already been proven.

## 7. Mission Complete — Certificate Screen

After successful submission, display a certificate-style completion screen in the same visual style as the game.

Suggested copy:

**MISSION COMPLETE**

**GOOD JOB, OFFICER!**

Ananya has been notified about the report.

You didn’t just help Ananya take action to protect her account. You also learned how a savings account works, how to track money coming in and going out, and how to keep your money safe.

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

The board should show each level’s status: locked, available, in progress, or completed.

Players should be able to revisit completed tasks and resume their current unlocked task. Preserve progress when navigating away from a task or returning to the Case Board.

Do not allow the player to skip required tasks or access locked future levels.

## 9. Visual Design

Follow the existing Figma screens as the primary visual reference. Do not replace the design with a generic financial dashboard or conventional educational website.

The visual style is a playful detective investigation:
- Deep navy-blue background with a subtle grid.
- Warm cream and aged-paper panels.
- Antique gold details.
- Red investigation thread and clue accents.
- Slightly distressed, typewriter-inspired headings.
- Rounded turquoise CTAs.
- Textured physical documents, pins, case files, and evidence cards.
- Clear, readable body text suitable for middle-school students.

The digital environment should feel like a detective’s desk and investigation interface. Physical artefacts should visually match the corresponding digital screens.

Use the existing Figma designs for layout, typography, colour, characters, bank statements, message designs, and case-board visuals wherever available.

## 10. Functional and Technical Requirements

Build the experience as a responsive browser-based application.

The application must support:
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

Keep game state centralised so the tracker, Case Board, and task screens always reflect the same progress.

Represent artefacts using unique identifiers mapped to their QR codes. Do not advance the game merely because the player presses a generic Continue button when an artefact scan or interaction is required.

Use fictional banking data throughout. Do not collect real banking credentials or sensitive personal information.

## 11. Build Approach

First implement the complete game flow and interaction logic. Then apply the existing Figma visual language to each screen.

Before considering the game complete, test:
- Correct and incorrect QR scans.
- Scanning the two KYC documents in either order.
- Attempting to continue before all required evidence is scanned.
- The cheque’s touch interaction.
- Dragging the highlighter onto correct and incorrect transactions.
- Both YES and NO phishing choices.
- Correct and incorrect passkey entries.
- Incident-report submission.
- Leaving a level and resuming from the Case Board.

The finished experience should feel like a cohesive, interactive investigation in which children learn practical banking skills by handling physical artefacts, interpreting evidence, making decisions, and seeing the consequences of their actions.
