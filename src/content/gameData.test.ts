import { describe, expect, it } from 'vitest'
import {
  ARTEFACT_IDS,
  CASE_FIGURES,
  CHEQUE_AMOUNT,
  GAME,
  GAME_DOMAIN,
  TASK_ORDER,
  amountInWords,
  artefactIdFromQr,
  buildGameContent,
  computeLedger,
  derivePasskey,
  lastDigit,
  type CaseFigures,
} from './gameData'

/** Recomputes the closing balance straight from the raw placeholder figures, independently of computeLedger. */
function closingBalanceByHand(figures: CaseFigures): number {
  return figures.transactions.reduce((balance, t) => {
    const amount = t.amount === CHEQUE_AMOUNT ? figures.cheque.amountInFigures : t.amount
    return t.direction === 'credit' ? balance + amount : balance - amount
  }, figures.openingBalance)
}

function withOpeningBalance(delta: number): CaseFigures {
  return { ...CASE_FIGURES, openingBalance: CASE_FIGURES.openingBalance + delta }
}

describe('closing balance', () => {
  const { statement } = GAME

  it('equals opening balance + credits − debits', () => {
    expect(statement.closingBalance).toBe(statement.openingBalance + statement.totalCredits - statement.totalDebits)
    expect(statement.closingBalance).toBe(closingBalanceByHand(CASE_FIGURES))
  })

  it('agrees with every running balance on the statement', () => {
    let balance = statement.openingBalance
    for (const row of statement.rows) {
      balance += row.direction === 'credit' ? row.amount : -row.amount
      expect(row.balanceAfter).toBe(balance)
      expect(row.balanceAfter).toBeGreaterThanOrEqual(0)
    }
    expect(statement.rows.at(-1)?.balanceAfter).toBe(statement.closingBalance)
  })

  it('totals credits and debits from the rows', () => {
    const sum = (direction: string) =>
      statement.rows.filter((r) => r.direction === direction).reduce((s, r) => s + r.amount, 0)
    expect(statement.totalCredits).toBe(sum('credit'))
    expect(statement.totalDebits).toBe(sum('debit'))
  })

  it('follows a changed placeholder amount', () => {
    const changed = buildGameContent(withOpeningBalance(100))
    expect(changed.statement.closingBalance).toBe(GAME.statement.closingBalance + 100)
  })

  it('computeLedger handles an empty statement', () => {
    expect(computeLedger(500, []).closingBalance).toBe(500)
  })
})

describe('closing-balance answer cards (Level 2, Task 1)', () => {
  const cards = ARTEFACT_IDS.filter((id) => GAME.artefacts[id].kind === 'balance-card').map((id) => GAME.artefacts[id])

  it('has 3–4 cards with different amounts, exactly one of them correct', () => {
    expect(cards.length).toBeGreaterThanOrEqual(3)
    expect(cards.length).toBeLessThanOrEqual(4)
    const amounts = cards.map((c) => c.printedAmount)
    expect(new Set(amounts).size).toBe(cards.length)
    expect(amounts.filter((a) => a === GAME.statement.closingBalance)).toHaveLength(1)
  })

  it('accepts only the card that shows the computed closing balance', () => {
    const [answer] = GAME.tasks.L2T1.required
    expect(GAME.tasks.L2T1.required).toHaveLength(1)
    expect(GAME.artefacts[answer].printedAmount).toBe(GAME.statement.closingBalance)
    for (const card of cards.filter((c) => c.id !== answer)) {
      expect(GAME.tasks.L2T1.incorrect[card.id]?.message).toBeTruthy()
    }
  })

  it('derives the wrong cards from common mistakes', () => {
    const { statement } = GAME
    const interest = statement.rows.find((r) => r.id === 'interest')!
    const cheque = statement.rows.find((r) => r.id === 'cheque-payment')!
    // Forgot the interest credit; added the cheque payment instead of subtracting it.
    expect(GAME.artefacts['balance-card-b'].printedAmount).toBe(statement.closingBalance - interest.amount)
    expect(GAME.artefacts['balance-card-a'].printedAmount).toBe(statement.closingBalance + 2 * cheque.amount)
  })

  it('refuses a fixed wrong card that equals the closing balance', () => {
    const closing = GAME.statement.closingBalance
    const cards = CASE_FIGURES.balanceCards.map((card) => (card.kind === 'fixed' ? { ...card, amount: closing } : card))
    expect(() => buildGameContent({ ...CASE_FIGURES, balanceCards: cards })).toThrow()
  })

  it('still has exactly one correct card after a figure changes', () => {
    const changed = buildGameContent(withOpeningBalance(37))
    const [answer] = changed.tasks.L2T1.required
    expect(changed.artefacts[answer].printedAmount).toBe(changed.statement.closingBalance)
  })
})

describe('figures match mockups 08 and 09 (owner decision: closing balance ₹2,452)', () => {
  it('reproduces the statement, the answer cards and the passkey', () => {
    const { statement } = GAME
    expect(statement.openingBalance).toBe(8200)
    expect(statement.totalCredits).toBe(5050)
    expect(statement.totalDebits).toBe(10798)
    expect(statement.closingBalance).toBe(2452)
    // The running balances printed in the mockup's Balance column.
    expect(statement.rows.slice(0, 7).map((r) => r.balanceAfter)).toEqual([9200, 8850, 7650, 7151, 9651, 8851, 8401])
    const amounts = ARTEFACT_IDS.flatMap((id) => GAME.artefacts[id].printedAmount ?? [])
    expect(amounts.sort((a, b) => a - b)).toEqual([2402, 2452, 3502, 5452])
    expect(GAME.cheque).toMatchObject({ amountInFigures: 1500, amountInWordsValue: 1550, number: '000123' })
    expect(GAME.passkey).toBe('209')
  })
})

describe('cheque (Level 2, Task 2)', () => {
  const { cheque, statement } = GAME

  it('has different amounts in figures and words that end in the same digit', () => {
    expect(cheque.amountInWordsValue).not.toBe(cheque.amountInFigures)
    expect(lastDigit(cheque.amountInWordsValue)).toBe(lastDigit(cheque.amountInFigures))
  })

  it('writes the words amount from its value', () => {
    expect(cheque.amountInWords).toBe(`${amountInWords(cheque.amountInWordsValue)} Rupees Only`)
  })

  it("appears on the statement as Ananya's payment followed by its return, for the amount in figures", () => {
    const payment = statement.rows.findIndex((r) => r.id === 'cheque-payment')
    const returned = statement.rows.findIndex((r) => r.id === 'cheque-returned')
    expect(payment).toBeGreaterThanOrEqual(0)
    expect(returned).toBeGreaterThan(payment)
    expect(statement.rows[payment]).toMatchObject({ direction: 'debit', amount: cheque.amountInFigures })
    expect(statement.rows[returned]).toMatchObject({ direction: 'credit', amount: cheque.amountInFigures })
    expect(statement.rows[payment].description).toContain(cheque.number)
  })

  it('has the mismatch in the amount areas only', () => {
    const discrepancies = GAME.tasks.L2T2.areas.filter((a) => a.isDiscrepancy).map((a) => a.id)
    expect(discrepancies.sort()).toEqual(['amount-figures', 'amount-words'])
  })
})

describe('amountInWords', () => {
  it.each([
    [0, 'Zero'],
    [7, 'Seven'],
    [15, 'Fifteen'],
    [40, 'Forty'],
    [99, 'Ninety-Nine'],
    [100, 'One Hundred'],
    [105, 'One Hundred and Five'],
    [1225, 'One Thousand Two Hundred and Twenty-Five'],
    [1550, 'One Thousand Five Hundred and Fifty'],
    [2050, 'Two Thousand and Fifty'],
    [5999, 'Five Thousand Nine Hundred and Ninety-Nine'],
    [100000, 'One Lakh'],
    [12345678, 'One Crore Twenty-Three Lakh Forty-Five Thousand Six Hundred and Seventy-Eight'],
  ])('%i → %s', (amount, words) => {
    expect(amountInWords(amount)).toBe(words)
  })

  it('rejects fractions and negatives', () => {
    expect(() => amountInWords(12.5)).toThrow()
    expect(() => amountInWords(-1)).toThrow()
  })
})

describe('suspicious transaction (Level 2, Task 3)', () => {
  it('is the single ₹5,999 CAMS TEL mobile recharge', () => {
    const suspicious = GAME.statement.rows.filter((r) => r.suspicious)
    expect(suspicious).toHaveLength(1)
    expect(suspicious[0]).toMatchObject({ amount: 5999, direction: 'debit' })
    expect(suspicious[0].description).toContain('CAMS TEL')
    expect(suspicious[0].description).toContain('Mobile Recharge')
  })

  it('has highlight feedback for every row', () => {
    for (const row of GAME.statement.rows) expect(row.highlightFeedback.length).toBeGreaterThan(0)
  })
})

describe('passkey (Level 3, Task 3)', () => {
  const clues = {
    closingBalance: GAME.statement.closingBalance,
    chequeAmountInFigures: GAME.cheque.amountInFigures,
    chequeAmountInWords: GAME.cheque.amountInWordsValue,
    suspiciousAmount: 5999,
  }

  it('is the last digits of the closing balance, cheque amount and suspicious transaction, in order', () => {
    const expected = `${lastDigit(GAME.statement.closingBalance)}${lastDigit(GAME.cheque.amountInFigures)}9`
    expect(GAME.passkey).toBe(expected)
    expect(GAME.passkey).toBe(derivePasskey(clues))
    expect(GAME.passkey).toMatch(/^\d{3}$/)
  })

  it('changes when the closing balance placeholder changes', () => {
    const changed = buildGameContent(withOpeningBalance(3))
    expect(changed.passkey).not.toBe(GAME.passkey)
    expect(changed.passkey[0]).toBe(String(lastDigit(GAME.statement.closingBalance + 3)))
    expect(changed.passkey.slice(1)).toBe(GAME.passkey.slice(1))
  })

  it('changes when the cheque placeholder changes', () => {
    const changed = buildGameContent({
      ...CASE_FIGURES,
      cheque: {
        ...CASE_FIGURES.cheque,
        amountInFigures: CASE_FIGURES.cheque.amountInFigures + 2,
        amountInWordsValue: CASE_FIGURES.cheque.amountInWordsValue + 2,
      },
    })
    // The cheque is deposited and returned, so the closing balance is unchanged.
    expect(changed.statement.closingBalance).toBe(GAME.statement.closingBalance)
    expect(changed.passkey).not.toBe(GAME.passkey)
    expect(changed.passkey[1]).toBe(String(lastDigit(CASE_FIGURES.cheque.amountInFigures + 2)))
  })

  it('refuses a cheque whose figures and words end in different digits', () => {
    expect(() => derivePasskey({ ...clues, chequeAmountInWords: clues.chequeAmountInFigures + 1 })).toThrow()
    expect(() =>
      buildGameContent({ ...CASE_FIGURES, cheque: { ...CASE_FIGURES.cheque, amountInWordsValue: 1224 } }),
    ).toThrow()
  })

  it('never reveals the full passkey in a hint', () => {
    for (const hint of GAME.tasks.L3T3.hints) expect(hint).not.toContain(GAME.passkey)
  })
})

describe('artefacts and QR codes (spec 10.3)', () => {
  it('has a unique ID, QR URL and print file for every artefact', () => {
    const artefacts = ARTEFACT_IDS.map((id) => GAME.artefacts[id])
    expect(new Set(artefacts.map((a) => a.qrUrl)).size).toBe(artefacts.length)
    expect(new Set(artefacts.map((a) => a.printFileName)).size).toBe(artefacts.length)
    for (const a of artefacts) expect(a.qrUrl).toBe(`https://${GAME_DOMAIN}/a/${a.id}`)
  })

  it('names print files <level>-<task>_<artefact-name>.png', () => {
    expect(GAME.artefacts['aadhaar-card'].printFileName).toBe('L1-T2_aadhaar-card.png')
    expect(GAME.artefacts['withdrawal-slip'].printFileName).toBe('L1-T3_withdrawal-slip.png')
  })

  it('reads every artefact back from its own QR URL', () => {
    for (const id of ARTEFACT_IDS) expect(artefactIdFromQr(GAME.artefacts[id].qrUrl)).toBe(id)
    expect(artefactIdFromQr(`  https://${GAME_DOMAIN.toUpperCase()}/a/pan-card/ `)).toBe('pan-card')
  })

  it.each([
    'hello',
    '',
    `https://${GAME_DOMAIN}/a/not-a-card`,
    `https://${GAME_DOMAIN}/b/pan-card`,
    'https://elsewhere.example/a/pan-card',
    `ftp://${GAME_DOMAIN}/a/pan-card`,
  ])('rejects %j as not part of the case file', (text) => {
    expect(artefactIdFromQr(text)).toBeNull()
  })
})

describe('task definitions', () => {
  it('assigns every task to exactly one level, in play order', () => {
    expect(GAME.levels.flatMap((l) => l.tasks)).toEqual([...TASK_ORDER])
    for (const level of GAME.levels) for (const id of level.tasks) expect(GAME.tasks[id].level).toBe(level.id)
  })

  it('gives every scan task an answer for each card on the table', () => {
    for (const id of TASK_ORDER) {
      const task = GAME.tasks[id]
      if (task.kind !== 'scan') continue
      for (const required of task.required) expect(task.options).toContain(required)
      const answered = [...task.required, ...Object.keys(task.incorrect), ...Object.keys(task.neutral)]
      expect([...task.options].sort()).toEqual([...answered].sort())
      if (task.collect) {
        expect(task.collect.slots.map((s) => s.artefactId)).toEqual(task.required)
        for (const required of task.required) expect(task.collect.accepted[required]).toBeDefined()
      }
    }
  })

  it('needs both KYC documents and both pieces of evidence', () => {
    expect([...GAME.tasks.L1T2.required].sort()).toEqual(['aadhaar-card', 'pan-card'])
    expect([...GAME.tasks.L3T4.required].sort()).toEqual(['bank-statement', 'phishing-message-card'])
    expect(GAME.tasks.L3T4.neutral.cheque).toBeDefined()
  })

  it('reports the evidence the evidence task collects, and the suspicious amount', () => {
    const report = GAME.tasks.L3T5
    const evidenceTask = GAME.tasks[report.evidenceTaskId]
    expect(evidenceTask.kind).toBe('scan')
    if (evidenceTask.kind === 'scan') expect(report.evidence.map((e) => e.artefactId)).toEqual(evidenceTask.required)
    expect(report.fields).toEqual([
      { label: 'Customer', value: 'Ananya Sharma' },
      { label: 'Transaction', value: '₹5,999' },
      { label: 'Concern', value: 'Suspected fraud' },
    ])
  })

  it('autofills the fake phishing page with obviously fictional values only', () => {
    for (const field of GAME.tasks.L3T1.fakeSite.fields) expect(field.autofill).toMatch(/^[X0\-/]+$/)
  })

  it('has no unfilled {template} tokens anywhere', () => {
    expect(JSON.stringify(GAME)).not.toMatch(/\{\w+\}/)
  })
})
