/**
 * The physical case-file kit (owner, 2026-11-10): one print-ready HTML file of A4 sheets with every
 * label, seal, card and prop to make, at real size in mm, with cut guides. Values and QR codes come
 * from the game data, so the kit always matches the game.
 *
 *   npm run print:kit      → print/case-file-kit.html (open in a browser, print at 100%)
 */
import QRCode from 'qrcode'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { ARTEFACT_IDS, GAME, formatRupees, type ArtefactId } from '../src/content/gameData.ts'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(ROOT, 'print', 'case-file-kit.html')

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

async function image(file: string): Promise<string> {
  const data = await readFile(path.join(ROOT, file))
  return `data:image/png;base64,${data.toString('base64')}`
}

/** A QR code as inline SVG, error correction Q, with its 4-module white border. */
async function qr(id: ArtefactId): Promise<string> {
  return QRCode.toString(GAME.artefacts[id].qrUrl, { type: 'svg', errorCorrectionLevel: 'Q', margin: 4, color: { dark: '#10253f', light: '#ffffff' } })
}

const { artefacts, phishingMessage: sms, cheque } = GAME

/** Ananya's journal (owner-approved content, 2026-11-10): one entry per statement line, except CAMS TEL. */
const JOURNAL: { day: string; text: string }[] = [
  { day: 'Sat, 2 Aug', text: 'Mum and Papa sent my pocket money today: <b>₹1,000</b>! Straight into my savings account. Keyboard fund, here I come.' },
  { day: 'Tue, 5 Aug', text: 'The new café near school finally opened! Riya and I tried it after class. I had a latte (fancy!). <b>₹350</b>. Only once a month.' },
  { day: 'Fri, 8 Aug', text: 'Bought my new school bag online from StyleHub. <b>₹1,200</b>. My old one had a hole in it, so this was a NEED, not a want.' },
  { day: 'Tue, 12 Aug', text: 'Topped up my PlayZone game card at the arcade. <b>₹499</b>. Beat Arjun’s high score!!' },
  { day: 'Fri, 15 Aug', text: 'Independence Day + Nani and Nana visited! They gave me <b>₹2,500</b> as a gift. Most of it is going to the keyboard fund.' },
  { day: 'Mon, 18 Aug', text: 'Movie with friends at CineMax. <b>₹800</b> for the tickets. Popcorn was too expensive, so I skipped it (proud of myself).' },
  { day: 'Fri, 22 Aug', text: 'Too much homework to go out, so I ordered dinner from QuickBite. <b>₹450</b>. Paneer rolls. 10/10.' },
  { day: 'Mon, 25 Aug', text: 'Gave a cheque to Rhythm Music Academy for my music class fees: <b>₹1,500</b>. First time writing a cheque by myself!' },
  { day: 'Thu, 28 Aug', text: 'WHAT?! The bank sent the music class cheque back. The money came back, but I still have to pay the fees. Why did it bounce?? I’ll ask at the bank.' },
  { day: 'Sat, 30 Aug', text: 'Quiet day. Practised on Riya’s keyboard and did my science project. Didn’t spend anything today!<br><i>(P.S. Papa always recharges my phone himself, every month on the 1st.)</i>' },
  { day: 'Sun, 31 Aug', text: 'The bank added <b>₹50 interest</b> to my savings! Free money just for saving. Savings accounts PAY you.' },
]

/** Where everything goes: the 5-pocket folder, front to back. */
const POCKETS = [
  { tab: 'START HERE', colour: '#c9a76a', items: ['Account Holder Profile (your Frame 10)', 'Case Brief (your Frame 11)', 'C6 envelope “OPEN & SCAN THE ACCOUNT TYPE”: the 4 account type cards'] },
  { tab: 'LEVEL 1', colour: '#9b7fd4', items: ['C6 envelope “IDENTITY DOCUMENTS”: passport, library card, PAN, Aadhaar', 'DL envelope “BANK SLIPS”: deposit slip, withdrawal slip'] },
  { tab: 'LEVEL 2', colour: '#e58fae', items: ['Seal: OPEN AT LEVEL 2', 'Bank statement, folded, with a paper clip', 'Coin envelope “CLOSING BALANCE”: the 4 balance cards', 'Returned cheque + cheque return memo', 'Ananya’s journal'] },
  { tab: 'LEVEL 3', colour: '#4caf7d', items: ['Seal: OPEN AT LEVEL 3', 'Evidence bag “DO NOT CLICK”: the phone message card', 'Daily Chronicle clipping (optional)'] },
  { tab: 'EVIDENCE VAULT', colour: '#3d7fc4', items: ['C5 envelope “OPEN ONLY WITH THE PASSKEY”, closed with a 3-digit lock set to ' + GAME.passkey, 'Inside: certificate and officer badge'] },
]

const CHECKLIST = [
  '4 account type cards',
  'Passport, library card, PAN card, Aadhaar card',
  'Deposit slip, withdrawal slip',
  'Bank statement',
  '4 closing balance cards',
  'Returned cheque + return memo',
  'Ananya’s journal',
  'Phone message card (in its evidence bag)',
  'Passkey slip (blank)',
  'Magnifier, highlighter, red pencil',
  `Vault lock reset to ${GAME.passkey}, certificate + badge inside`,
  'Seal sticker and level seals replaced',
]

async function build() {
  const art = {
    'savings-account': await image('src/assets/interim/art-savings.png'),
    'current-account': await image('src/assets/interim/art-current.png'),
    'fixed-deposit-account': await image('src/assets/interim/art-fixed-deposit.png'),
    'recurring-deposit-account': await image('src/assets/interim/art-recurring-deposit.png'),
  } as Record<string, string>
  const photo = await image('src/assets/art/ananya-smiling.png')
  const codes = Object.fromEntries(await Promise.all(ARTEFACT_IDS.map(async (id) => [id, await qr(id)] as const))) as Record<ArtefactId, string>

  const accountIds = ['savings-account', 'current-account', 'fixed-deposit-account', 'recurring-deposit-account'] as const
  const balanceIds = ['balance-card-a', 'balance-card-b', 'balance-card-c', 'balance-card-d'] as const

  const sheet = (title: string, body: string, note = '') =>
    `<section class="sheet"><header class="sheet-head"><h2>${title}</h2>${note ? `<p>${note}</p>` : ''}</header>${body}</section>`

  // ── Sheet 1: how to make each case file ────────────────────────────────────
  const guide = sheet(
    'Save the Savings Account · Case File Kit',
    `<div class="guide">
      <p class="lead">Everything to print for one 5-pocket case file. Print on A4 at <b>100% / Actual size</b> (no “fit to page”). Cut along the dashed lines.</p>
      <ol class="pockets">${POCKETS.map((p, i) => `<li><span class="pocket-tab" style="background:${p.colour}">${i + 1} · ${p.tab}</span><ul>${p.items.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></li>`).join('')}</ol>
      <h3>Outside the folder</h3>
      <ul><li>Your case-file cover (Frame 9) on the front.</li><li>Red seal sticker over the snap button; evidence tag tied to it.</li><li>Front sleeve: magnifying glass, yellow highlighter, red pencil, passkey slip.</li><li>Reset checklist inside the back flap.</li></ul>
      <h3>Paper and finish</h3>
      <ul><li><b>300 gsm card, laminated:</b> account cards, ID cards, balance cards, phone card.</li><li><b>100–120 gsm paper, aged:</b> statement, cheque, slips, journal, memo. Brush cold tea on the edges, dry flat, crumple lightly, ink the edges brown.</li><li><b>Sticker paper:</b> seals, labels, QR stickers.</li></ul>
      <h3>QR codes</h3>
      <p>Every code opens <code>${esc(GAME.domain)}</code>. Stick each QR sticker (sheet 3) on the <b>back</b> of its artefact. Keep the white border, and check each one scans in the game before use.</p>
      <h3>Buy</h3>
      <p>2 × C6 envelopes · 1 × DL · 1 × coin envelope · 1 × C5 · 1 small zip bag (10 × 15 cm) · 3-digit luggage lock · magnifier · highlighter · red pencil.</p>
    </div>`,
  )

  // ── Sheet 2: seals and labels ──────────────────────────────────────────────
  const tabs = POCKETS.map((p) => `<div class="cut tab-label" style="background:${p.colour}">${p.tab}</div>`).join('')
  const seals = Array.from({ length: 4 }, () => `<div class="cut seal"><span>CASE FILE</span><b>SEALED</b><span>No. 1</span></div>`).join('')
  const levelSeals = ['2', '2', '3', '3'].map((n) => `<div class="cut level-seal"><span>OPEN AT</span><b>LEVEL ${n}</b></div>`).join('')
  const envLabels = ['OPEN &amp; SCAN THE ACCOUNT TYPE', 'IDENTITY DOCUMENTS', 'BANK SLIPS', 'CLOSING BALANCE · choose one', 'OPEN ONLY WITH THE PASSKEY']
    .map((t, i) => `<div class="cut env-label${i === 4 ? ' env-label--vault' : ''}"><small>ANANYA’S CASE FILE</small><b>${t}</b></div>`)
    .join('')
  const labels = sheet(
    'Seals and labels',
    `<div class="row">${tabs}</div>
     <div class="row">${seals}${levelSeals}</div>
     <div class="row">
       <div class="cut evidence-tag"><span class="hole"></span><small>NATIONAL BANK · FRAUD DESK</small><b>CASE No. 1</b><p>Account holder: Ananya S</p><p>Officer:</p><p class="line"></p><p>Opened on:</p><p class="line"></p></div>
       <div class="cut bag-label"><b>EVIDENCE</b><span>DO NOT CLICK</span><small>Case No. 1 · Item: suspicious message</small></div>
       <div class="cut passkey"><small>EVIDENCE FILE</small><b>PASSKEY</b><div class="boxes"><span></span><span></span><span></span></div><p>closing balance · cheque · suspicious transaction<br><i>last digit of each</i></p></div>
     </div>`,
    'Print on sticker paper (the tag on card). Seals 30 mm and 25 mm round, tabs 40 × 15 mm, tag 50 × 100 mm, bag label 60 × 30 mm, passkey slip 90 × 50 mm.',
  )

  // ── Sheet 3: QR stickers for every artefact ───────────────────────────────
  const stickers = sheet(
    'QR stickers',
    `<div class="qr-grid">${ARTEFACT_IDS.map((id) => `<div class="cut qr-sticker">${codes[id]}<span>${esc(artefacts[id].name)}</span></div>`).join('')}</div>`,
    'Stick on the back of each artefact. The code is 34 mm wide (never print below 30 mm). PAN, Aadhaar and library card art already carry theirs.',
  )

  // ── Sheet 4: account type cards and balance cards ─────────────────────────
  const accountCards = accountIds
    .map((id) => `<div class="cut account-card"><small>ACCOUNT TYPE</small><img src="${art[id]}" alt=""><b>${esc(artefacts[id].cardLabel).replace('\n', '<br>')}</b></div>`)
    .join('')
  const balanceCards = balanceIds
    .map((id) => `<div class="cut balance-card"><small>CLOSING BALANCE</small><div class="balance-window">${formatRupees(artefacts[id].printedAmount ?? 0)}</div></div>`)
    .join('')
  const cards =
    sheet('Account type cards', `<div class="grid-2">${accountCards}</div>`, 'Account cards 63 × 88 mm (playing-card size). Put each card’s own QR sticker on its back.') +
    sheet(
      'Closing balance cards',
      `<div class="grid-2">${balanceCards}</div>`,
      'Balance cards 90 × 58 mm. Put each card’s own QR sticker on its back: the ₹2,452 card must carry “Closing balance card C”.',
    )

  // ── Sheet 5: phone card, passport page, return memo ───────────────────────
  const props = sheet(
    'Phone message card, passport page, cheque return memo',
    `<div class="row">
      <div class="cut phone"><div class="phone-screen"><div class="phone-bar"><span>9:14</span><span>▮▮▮ 4G</span></div><p class="phone-app">Messages</p>
        <div class="sms"><b>${esc(sms.sender)}</b><small>${esc(sms.time)}</small><p>${esc(sms.text)}</p><p>${esc(sms.detail)}</p><p class="sms-link">${esc(sms.link)}</p></div>
        <p class="phone-warn">Never click links in messages like this!</p></div></div>
      <div class="cut passport-page"><small>GOVT OF NATION · PASSPORT</small>
        <div class="pp-body"><img src="${photo}" alt=""><dl><dt>Type</dt><dd>P</dd><dt>Passport No.</dt><dd>N0123456</dd><dt>Surname</dt><dd>S</dd><dt>Given name</dt><dd>ANANYA</dd><dt>Date of birth</dt><dd>26/07/2013</dd><dt>Date of issue</dt><dd>13/01/2020</dd><dt>Date of expiry</dt><dd>12/01/2025</dd></dl></div>
        <div class="pp-stamp">EXPIRED</div><div class="pp-qr">${codes['expired-passport']}<span>OPEN TO SCAN</span></div></div>
    </div>
    <div class="row">
      <div class="cut memo"><small>NATIONAL BANK · ${esc(cheque.branch)}</small><b>CHEQUE RETURN MEMO</b>
        <p>Date: 28/08/2026 &nbsp;·&nbsp; Cheque No. ${esc(cheque.number)} &nbsp;·&nbsp; Amount: ${formatRupees(cheque.amountInFigures)}</p>
        <p>Payee: ${esc(cheque.payee)} &nbsp;·&nbsp; Drawer: ${esc(cheque.drawer)}</p>
        <p>This cheque is returned <strong>unpaid</strong>. Reason (for the officer to find):</p><p class="line"></p><span class="memo-stamp">RETURNED</span></div>
    </div>`,
    'Phone card 70 × 140 mm (round the corners, laminate). Passport page 88 × 125 mm: glue inside a navy folded card. Memo 150 × 70 mm: staple to the cheque. The memo leaves the reason blank on purpose, so it doesn’t give away the cheque puzzle.',
  )

  // ── Sheets 6–7: Ananya's journal (A6 pages, 4 per sheet) ───────────────────
  const pages: string[] = [
    `<div class="jr-cover" data-cover><b>ANANYA’S<br>JOURNAL</b><span>Private! (Unless you’re a bank officer helping me)</span><small>August 2026</small></div>`,
    `<div class="jr-rules"><b>My money rules</b><ol><li>Save first, spend later.</li><li>Write down every rupee in and out.</li><li>Saving for: a digital keyboard (₹6,000!)</li></ol></div>`,
  ]
  for (let i = 0; i < JOURNAL.length; i += 2) {
    pages.push(JOURNAL.slice(i, i + 2).map((e) => `<div class="jr-entry"><b>${e.day}</b><p>${e.text}</p></div>`).join(''))
  }
  pages.push(`<div class="jr-entry"><b>August so far</b><p>Money IN: pocket money, gift from Nani &amp; Nana, music fee came back, interest.</p><p>Money OUT: café, bag, arcade, movie, dinner, music fees.</p><p>I tried to check my balance but it looks lower than I thought…</p></div>`)
  while (pages.length % 4) pages.push('')
  const journalSheets: string[] = []
  for (let i = 0; i < pages.length; i += 4) {
    journalSheets.push(
      sheet(
        `Ananya’s journal · pages ${i + 1}–${i + 4}`,
        `<div class="jr-grid">${pages.slice(i, i + 4).map((p) => `<div class="cut jr-page${p.includes('data-cover') ? ' jr-page--cover' : ''}">${p}</div>`).join('')}</div>`,
        'A6 pages (105 × 148 mm). Cut, stack in order and staple on the left. Age with tea.',
      ),
    )
  }

  // ── Sheet: reset checklist ─────────────────────────────────────────────────
  const reset = sheet(
    'Envelope labels and reset checklist',
    `<div class="row"><div class="cut checklist"><b>BEFORE THE NEXT OFFICER</b><small>Return everything to its pocket</small><ul>${CHECKLIST.map((c) => `<li><span></span>${esc(c)}</li>`).join('')}</ul></div>
     <div class="stack">${envLabels}</div></div>`,
    'Envelope labels 70 × 35 mm (sticker paper). Checklist A6: stick it inside the folder’s back flap.',
  )

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Case File Kit</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Special+Elite&family=Courier+Prime:wght@400;700&family=Edu+VIC+WA+NT+Beginner:wght@400;600&family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
<style>${CSS}</style></head>
<body><main>${guide}${labels}${stickers}${cards}${props}${journalSheets.join('')}${reset}</main></body></html>`
  await mkdir(path.dirname(OUT), { recursive: true })
  await writeFile(OUT, html)
  console.log(`Wrote ${path.relative(ROOT, OUT)} (${Math.round(html.length / 1024)} KB)`)
}

const CSS = `
:root { --navy:#10253f; --cream:#f6ecd4; --paper:#efe2c2; --ink:#2a2118; --red:#b8322a; --cut:#9a9a9a; }
* { box-sizing:border-box; }
html,body { margin:0; background:#5b6470; color:var(--ink); font-family:'Courier Prime',monospace; }
main { display:flex; flex-direction:column; align-items:center; gap:10mm; padding:10mm 0; }
.sheet { width:210mm; height:297mm; padding:10mm; background:#fff; box-shadow:0 2mm 6mm rgba(0,0,0,.35); overflow:hidden; display:flex; flex-direction:column; gap:5mm; }
.sheet-head h2 { margin:0; font-family:'Special Elite',serif; font-size:16pt; color:var(--navy); }
.sheet-head p { margin:1mm 0 0; font-size:8.5pt; color:#555; }
.row { display:flex; flex-wrap:wrap; gap:4mm; align-items:flex-start; }
.grid-2 { display:grid; grid-template-columns:repeat(2, max-content); gap:6mm; }
.stack { display:flex; flex-direction:column; gap:4mm; }
.cut { outline:0.25mm dashed var(--cut); outline-offset:1.5mm; }
b { font-weight:700; }
/* guide */
.guide { font-size:9.5pt; line-height:1.4; }
.guide h3 { font-family:'Special Elite',serif; color:var(--navy); margin:4mm 0 1mm; font-size:12pt; }
.guide ul { margin:0; padding-left:5mm; }
.lead { margin:0 0 3mm; }
.pockets { margin:0; padding-left:0; list-style:none; display:grid; gap:2mm; }
.pocket-tab { display:inline-block; padding:0.6mm 3mm; border-radius:1.5mm 1.5mm 0 0; color:#fff; font-weight:700; font-size:9pt; }
.pockets > li > ul { border-left:1mm solid #ddd; padding-left:4mm; margin-top:0.5mm; }
code { font-size:8.5pt; }
/* tabs, seals, labels */
.tab-label { width:40mm; height:15mm; display:grid; place-items:center; color:#fff; font-weight:700; font-size:9pt; letter-spacing:.3mm; border-radius:2mm 2mm 0 0; }
.seal { width:30mm; height:30mm; border-radius:50%; background:radial-gradient(circle,#d94a3e,#9e2a22); color:#fde9df; display:flex; flex-direction:column; align-items:center; justify-content:center; font-size:6.5pt; box-shadow:inset 0 0 0 1.2mm #b8322a, inset 0 0 0 1.6mm #f3c3b8; }
.seal b { font-family:'Special Elite',serif; font-size:11pt; }
.level-seal { width:25mm; height:25mm; border-radius:50%; background:var(--navy); color:var(--cream); display:flex; flex-direction:column; align-items:center; justify-content:center; font-size:6pt; box-shadow:inset 0 0 0 1mm #2d4a70; }
.level-seal b { font-family:'Special Elite',serif; font-size:10pt; }
.env-label { width:70mm; height:35mm; border:0.6mm solid var(--navy); background:var(--cream); display:flex; flex-direction:column; justify-content:center; padding:3mm 4mm; background-image:repeating-linear-gradient(transparent 0 6.6mm, rgba(16,37,63,.18) 6.6mm 6.8mm); }
.env-label small { font-size:6.5pt; letter-spacing:.4mm; }
.env-label b { font-family:'Special Elite',serif; font-size:12pt; color:var(--navy); line-height:1.15; }
.env-label--vault { background-color:#f3dcd7; border-color:var(--red); }
.env-label--vault b { color:var(--red); }
.evidence-tag { width:50mm; height:100mm; background:#d9bd8c; border-radius:6mm 6mm 2mm 2mm; padding:12mm 4mm 4mm; position:relative; font-size:8pt; }
.evidence-tag .hole { position:absolute; top:4mm; left:50%; width:5mm; height:5mm; margin-left:-2.5mm; border-radius:50%; background:#fff; box-shadow:0 0 0 1mm #b5975e; }
.evidence-tag b { display:block; font-family:'Special Elite',serif; font-size:15pt; margin:2mm 0; }
.evidence-tag p { margin:2mm 0 0; }
.line { border-bottom:0.3mm solid var(--ink); height:5mm; margin:0 !important; }
.bag-label { width:60mm; height:30mm; background:#fff; border:0.8mm solid var(--red); display:flex; flex-direction:column; justify-content:center; align-items:center; text-align:center; }
.bag-label b { font-family:'Special Elite',serif; font-size:16pt; color:var(--red); }
.bag-label span { font-weight:700; font-size:9pt; letter-spacing:.6mm; }
.bag-label small { font-size:6.5pt; margin-top:1mm; }
.passkey { width:90mm; height:50mm; background:var(--navy); color:var(--cream); padding:4mm 5mm; display:flex; flex-direction:column; align-items:center; text-align:center; }
.passkey small { font-size:7pt; letter-spacing:.5mm; }
.passkey b { font-family:'Special Elite',serif; font-size:16pt; }
.passkey .boxes { display:flex; gap:4mm; margin:2mm 0; }
.passkey .boxes span { width:12mm; height:13mm; border:0.6mm solid #e6c46a; border-radius:1mm; background:#183558; }
.passkey p { margin:0; font-size:7pt; }
/* QR stickers */
.qr-grid { display:grid; grid-template-columns:repeat(4, 42mm); gap:5mm 4mm; }
.qr-sticker { width:42mm; height:47mm; display:flex; flex-direction:column; align-items:center; gap:0.5mm; font-size:6.5pt; text-align:center; }
.qr-sticker svg { width:42mm; height:42mm; }
/* account and balance cards */
.account-card { width:63mm; height:88mm; border-radius:3mm; background:linear-gradient(#fbf4e3,#efe1bf); border:0.4mm solid #cdb98e; display:flex; flex-direction:column; align-items:center; justify-content:space-between; padding:4mm 3mm 5mm; text-align:center; }
.account-card small { font-size:6.5pt; letter-spacing:.5mm; color:#7a6440; }
.account-card img { width:44mm; height:auto; }
.account-card b { font-family:'Special Elite',serif; font-size:14pt; line-height:1.1; color:var(--ink); }
.balance-card { width:90mm; height:58mm; border-radius:2mm; background:#e9d8b4; border:0.4mm solid #c8ad7a; padding:4mm; display:flex; flex-direction:column; align-items:center; gap:3mm; }
.balance-card small { font-family:'Special Elite',serif; font-size:9pt; letter-spacing:.4mm; color:#6b5532; }
.balance-window { flex:1; width:100%; background:#fffaf0; border:0.4mm solid #c8ad7a; display:grid; place-items:center; font-family:'Edu VIC WA NT Beginner',cursive; font-size:24pt; font-weight:600; color:var(--navy); }
/* phone card */
.phone { width:70mm; height:140mm; border-radius:9mm; background:#111; padding:4mm 3mm; }
.phone-screen { height:100%; border-radius:6mm; background:#f2f4f7; padding:3mm; font-family:'Inter',sans-serif; display:flex; flex-direction:column; gap:2mm; }
.phone-bar { display:flex; justify-content:space-between; font-size:6.5pt; font-weight:600; }
.phone-app { margin:1mm 0 0; font-weight:700; font-size:10pt; }
.sms { background:#fff; border-radius:3mm; padding:3mm; box-shadow:0 0.5mm 1.5mm rgba(0,0,0,.15); font-size:7.5pt; line-height:1.35; }
.sms b { font-size:8.5pt; } .sms small { float:right; color:#777; font-size:6pt; }
.sms p { margin:1.5mm 0 0; } .sms-link { color:#1a5fd0; text-decoration:underline; word-break:break-all; }
.phone-warn { margin-top:auto; font-size:6.5pt; color:var(--red); text-align:center; font-weight:600; }
/* passport page */
.passport-page { width:88mm; height:125mm; background:linear-gradient(#f3eef6,#e6ddef); border:0.4mm solid #b9a8cc; padding:4mm; position:relative; font-family:'Inter',sans-serif; }
.passport-page > small { display:block; text-align:center; font-size:6.5pt; letter-spacing:.4mm; color:#4b3c63; }
.pp-body { display:flex; gap:3mm; margin-top:3mm; }
.pp-body img { width:28mm; height:34mm; object-fit:cover; background:#f6ead0; border:0.3mm solid #999; }
.pp-body dl { margin:0; font-size:6pt; display:grid; grid-template-columns:auto 1fr; gap:0.6mm 2mm; }
.pp-body dt { color:#6b5f7a; } .pp-body dd { margin:0; font-weight:600; }
.pp-stamp { position:absolute; left:8mm; top:48mm; padding:1mm 4mm; border:0.8mm solid var(--red); color:var(--red); font-family:'Special Elite',serif; font-size:16pt; rotate:-14deg; opacity:.85; }
.pp-qr { position:absolute; left:50%; bottom:5mm; translate:-50% 0; display:flex; flex-direction:column; align-items:center; font-size:6pt; font-weight:600; }
.pp-qr svg { width:36mm; height:36mm; }
/* cheque return memo */
.memo { width:150mm; height:70mm; background:#f7f0dc; border:0.4mm solid #c8ad7a; padding:5mm 6mm; position:relative; font-size:8.5pt; }
.memo small { font-size:7pt; letter-spacing:.3mm; } .memo > b { display:block; font-family:'Special Elite',serif; font-size:14pt; margin:1mm 0 2mm; color:var(--navy); }
.memo p { margin:1.2mm 0; }
.memo-stamp { position:absolute; right:8mm; top:8mm; padding:1mm 3mm; border:0.8mm solid var(--red); color:var(--red); font-family:'Special Elite',serif; font-size:13pt; rotate:8deg; }
/* journal */
.jr-grid { display:grid; grid-template-columns:repeat(2, 87mm); gap:6mm 8mm; }
.jr-page { width:87mm; height:122mm; background:#fbf6ea; background-image:repeating-linear-gradient(transparent 0 6.4mm, rgba(70,110,170,.25) 6.4mm 6.6mm); padding:6mm 5mm; font-family:'Edu VIC WA NT Beginner',cursive; font-size:10pt; line-height:6.5mm; color:#23324a; }
.jr-page--cover { background:#7c4a2d; background-image:none; }
.jr-cover { height:100%; color:#f6e3c4; padding:20mm 1mm; display:flex; flex-direction:column; align-items:center; text-align:center; gap:8mm; }
.jr-cover b { font-family:'Special Elite',serif; font-size:20pt; line-height:1.2; }
.jr-cover span { font-size:9pt; } .jr-cover small { font-family:'Special Elite',serif; font-size:11pt; }
.jr-rules b, .jr-entry b { font-family:'Special Elite',serif; font-size:10pt; color:#7c4a2d; }
.jr-rules ol { padding-left:5mm; margin:1mm 0; }
.jr-entry { margin-bottom:3mm; } .jr-entry p { margin:0; } .jr-entry p b { font-family:inherit; color:inherit; }
/* reset checklist */
.checklist { width:105mm; height:148mm; border:0.5mm solid var(--navy); padding:6mm; background:#fffdf6; }
.checklist b { font-family:'Special Elite',serif; font-size:13pt; color:var(--navy); display:block; }
.checklist small { font-size:7.5pt; }
.checklist ul { list-style:none; margin:4mm 0 0; padding:0; font-size:8.5pt; display:grid; gap:2.6mm; }
.checklist li { display:flex; gap:2mm; align-items:flex-start; } .checklist li span { flex:none; width:3.6mm; height:3.6mm; border:0.4mm solid var(--navy); margin-top:0.5mm; }
@page { size:A4; margin:0; }
@media print { html,body { background:#fff; } main { padding:0; gap:0; } .sheet { box-shadow:none; page-break-after:always; break-after:page; } }
`

await build()
