/* Guides layer (modelled on the Airwallex docs IA: overview → get started → integration options → methods →
   operations → test & go live → troubleshooting). API facts come
   from data.js (the live API docs) so guides and API reference cannot drift apart. */

/* live markets with flag and currency */
const LIVE = [['India', '🇮🇳', 'INR'], ['Pakistan', '🇵🇰', 'PKR'], ['Egypt', '🇪🇬', 'EGP'], ['Nigeria', '🇳🇬', 'NGN'], ['Morocco', '🇲🇦', 'MAD'], ['Philippines', '🇵🇭', 'PHP']];
const liveFlags = () => `<div class="home-flags">${LIVE.map(([n, f, c]) => `<a href="#/methods"><span class="flag" aria-hidden="true">${f}</span>${n} · ${c}</a>`).join('')}</div>`;

/* Payment method specs (assets/product-data.js). */
/* No provider, wallet-brand or bank names on this site: the product sheet's rows are renamed to the method
   names the live API docs (document.paygate10.com) use. Live markets: IN, PK, EG, NG, MA, PH. */
/* limits are set with the local payment networks and banks we work with, and change: say so wherever limits appear */
const LIMITS_NOTE = 'Limits are indicative. They are set with the local payment networks and banks we work with and can change at short notice, so the limits on your MID when you send a request always apply. Check with your integration contact before you rely on a limit.';
/* LPL and LP, defined once and shown on the pages where they matter */
const LPL_LP = `<div class="callout envs"><p><b>LPL (Live Production Limited)</b> is our live system on a MID with low per-transaction limits. There is no sandbox: you build and test on LPL with real accounts and real money, in small amounts. You get LPL credentials in Stage 1.</p>
<p><b>LP (Live Production)</b> is full production after sign-off: a <b>new MID and new credentials</b>, with the limits agreed for your account. Switch your configuration from LPL to LP when we confirm.</p></div>`;
const ext = (href, text) => `<a href="${href}" target="_blank" rel="noopener">${text} ↗</a>`;
const PROVIDER_RE = /fawry|vodafone|orange|etisalat|we ?cash|cashplus|cash plus|mt cash|gcash|maya|nagad|bkash|instapay|ozow|attijari|cih|lbanka|bcp|bank of africa|qr ph/i;
const PD = (() => {
  const raw = typeof PRODUCT_DATA !== 'undefined' ? PRODUCT_DATA : {payinMethods: {}, payinMethodsP2P: {}, payoutSpecsTable: [], collectionsSpecs: {}, remittancePayoutSpecs: {}};
  const LIVE_MARKETS = ['IN', 'PK', 'NG', 'EG', 'MA', 'PH'];
  const NAME = {'Fawry': 'Cash voucher', 'QR PH': 'QR', 'UPI QR': 'UPI QR code', 'Wallets': 'Wallet', 'Mobile Wallet': 'Wallet', 'Nagad': 'Wallet', 'bKash': 'Wallet', 'Bank deposit': 'Bank Deposit'};
  const SUB = {'Cash voucher': 'Pay in cash at a retail outlet', 'Wallet': 'Mobile wallet', 'Bank Transfer': 'Direct from local banks', 'QR': 'Scan to pay from a banking or wallet app'};
  const CHANNEL = {'Cash voucher': 'Retail cash network', 'Wallet': 'Local mobile wallets', 'Bank Transfer': 'Local banks', 'QR': 'QR-enabled banking and wallet apps'};
  const clean = (v, fallback) => v && PROVIDER_RE.test(v) ? fallback : v;
  const method = m => {
    const name = NAME[m.name] || m.name, cap = {...(m.cap || {})};
    cap.channels = clean(cap.channels, CHANNEL[name] || 'Local network');
    cap.speed = cap.speed && cap.speed.replace(/\s*via\s+\w+/i, '');
    cap.fieldsRequired = clean(cap.fieldsRequired, 'Mobile number');
    /* demos and journey videos are kept (approved: they may show brands); our own labels stay generic */
    const journey = (m.journey || []).map((j, i, a) => ({url: j.url, label: j.label && !PROVIDER_RE.test(j.label) ? j.label : a.length > 1 ? `Watch end-to-end journey ${i + 1}` : 'Watch end-to-end journey'}));
    return {name, sub: clean(m.sub, SUB[name] || ''), cap, demoSrc: m.demoSrc, demoTarget: m.demoTarget, journey};
  };
  const list = arr => arr.map(method).filter((m, i, a) => a.findIndex(x => x.name === m.name) === i); /* e.g. two wallet brands → one Wallet row */
  /* India UPI: hosted checkout shows a QR on desktop and a "Pay with App" button (UPI Intent) on mobile.
     The spec data only lists UPI QR. */
  const upiIn = arr => arr.flatMap(m => m.name !== 'UPI QR code' ? [m] : [
    {...m, sub: 'Desktop: scan to pay with any UPI app', cap: {...m.cap, channels: 'Any UPI app, by scanning the QR', fieldsRequired: 'None. The QR is generated for the amount',
      notes: 'Shown on desktop checkout. The QR is valid for 5 minutes.'}},
    {name: 'UPI Intent', sub: "Mobile: pay in the customer's UPI app", cap: {...m.cap, depositLimits: '', integrationType: 'Hosted', channels: "UPI apps installed on the customer's phone", fieldsRequired: 'None',
      notes: 'Shown on mobile checkout: a "Pay with App" button opens the customer\'s UPI app to approve.'}, journey: []},
  ]);
  const pick = o => Object.fromEntries(Object.entries(o || {}).filter(([cc]) => LIVE_MARKETS.includes(cc)).map(([cc, arr]) => [cc, cc === 'IN' ? upiIn(list(arr)) : list(arr)]));
  const PAYOUT = {'Net Banking (Bank Transfer)': 'Net Banking', 'Easypaisa & JazzCash Wallet': 'EasyPaisa / JazzCash wallet'};
  return {...raw, payinMethods: pick(raw.payinMethods), payinMethodsP2P: pick(raw.payinMethodsP2P),
    payoutSpecsTable: (raw.payoutSpecsTable || []).filter(r => LIVE_MARKETS.some(cc => ({IN: 'India', PK: 'Pakistan', NG: 'Nigeria', EG: 'Egypt', MA: 'Morocco', PH: 'Philippines'})[cc] === r.market)).map(r => ({...r, method: PAYOUT[r.method] || (/wallet/i.test(r.method) ? 'Wallet' : r.method)}))};
})();
const ISO = {India: 'IN', Pakistan: 'PK', Egypt: 'EG', Nigeria: 'NG', Morocco: 'MA', Bangladesh: 'BD', Philippines: 'PH', 'South Africa': 'ZA'};
const NAME_OF = Object.fromEntries(Object.entries(ISO).map(([n, c]) => [c, n]));
function specTable(cc, list) {
  return `<table><thead><tr><th>Method</th><th>Channels</th><th>Speed</th><th>Min</th><th>Max</th><th>Settlement</th><th>Integration</th></tr></thead><tbody>${
    list.map(m => { const c = m.cap || {};
      return `<tr><td><b>${esc(m.name)}</b><span class="cond-note">${esc(m.sub || '')}</span></td><td>${esc(c.channels || '—')}</td><td>${esc(c.speed || '—')}</td><td>${esc(c.minTx || '—')}</td><td>${esc(c.maxTx || c.depositLimits || '—')}</td><td>${esc(c.settlement || '—')}</td><td>${esc(c.integrationType || '—')}</td></tr>`; }).join('')
  }</tbody></table>`;
}
const kv = rows => table(['', ''], rows.map(r => [`<b>${esc(r.label)}</b>`, esc(r.value)]));

const GUIDE_NAV = [
  ['Overview', [['about', 'About'], ['how-it-works', 'How payments work'], ['choose', 'Choose your integration']]],
  ['Get started', [['onboarding', 'Integration journey'], ['before-you-start', 'Stage 1 · Before you start'], ['quickstart-payin', 'Quickstart: first payin'], ['quickstart-payout', 'Quickstart: first payout']]],
  ['Integration options', [['build-rules', 'Stage 2 · Build rules'], ['hosted', 'Hosted checkout'], ['seamless', 'Seamless (server-to-server)'], ['payouts', 'Payouts & prefunding']]],
  ['Payment methods', [['methods', 'Methods by country']]],
  ['Payment operations', [['callbacks', 'Callbacks & status updates'], ['refunds', 'Refunds'], ['reconciliation', 'Balance & reconciliation']]],
  ['Test and go live', [['testing', 'Stage 3 · Test cases'], ['go-live', 'Stage 4 · Readiness & sign-off'], ['production', 'Stage 5 · Moving to production'], ['after-go-live', 'After go-live']]],
  ['Troubleshooting', [['hash-help', 'Fixing hash errors'], ['faq', 'FAQ'], ['support', 'Support & raising issues']]],
];

/* ---------- facts derived from data.js ---------- */
const FLAGS = {India: '🇮🇳', Pakistan: '🇵🇰', Egypt: '🇪🇬', Nigeria: '🇳🇬', Morocco: '🇲🇦', Bangladesh: '🇧🇩', Philippines: '🇵🇭'};
const CCY = {India: 'INR', Pakistan: 'PKR', Egypt: 'EGP', Nigeria: 'NGN', Morocco: 'MAD', Bangladesh: 'BDT', Philippines: 'PHP'};

function parseReq(raw) { try { const r = JSON.parse(raw); return r.data || r.Data || {}; } catch (_) { return {}; } }
function methodMatrix() {
  const C = {};
  const add = (country, kind, flow, entry) => {
    const c = C[country] ||= {payin: {}, payout: {}};
    const k = entry.mode + '|' + entry.name;
    (c[kind][k] ||= {...entry, flows: new Set()}).flows.add(flow);
  };
  for (const flow of Object.keys(D)) {
    for (const [p, kind] of [['index', 'payin'], ['payout', 'payout']]) {
      for (const ex of page(flow, p).examples || []) {
        const m = ex.title.match(/^(Hosted|Seamless)\s+(.+?)\s*\(([^)]+)\)\s*$/);
        if (!m) continue;
        const d = parseReq(ex.request);
        const code = d.paymentMethod || d.PaymentMethod || '';
        m[3].split(/\s*,\s*/).forEach(country => add(country, kind, flow, {mode: m[1], name: m[2], code, title: ex.title}));
      }
    }
  }
  return C;
}
const COUNTRIES = () => Object.keys(methodMatrix()).sort();
const errorBy = (flow, re) => D[flow].errors.find(e => re.test(e.ErrorMessage || ''));
const recipeIdx = (flow, re) => D[flow].recipes.findIndex(r => re.test(r.label));

/* status lifecycle diagram (theme-aware via CSS classes) */
const LIFECYCLE_SVG = `<svg class="flowsvg" viewBox="0 0 760 190" role="img" aria-label="Transaction status lifecycle">
  <rect class="acc" x="10" y="70" width="130" height="50" rx="10"/><text x="75" y="92" text-anchor="middle">Your request</text><text class="sub" x="75" y="109" text-anchor="middle">PAYIN / PAYOUT</text>
  <rect class="box" x="190" y="70" width="130" height="50" rx="10"/><text x="255" y="92" text-anchor="middle">INITIATED</text><text class="sub" x="255" y="109" text-anchor="middle">created</text>
  <rect class="box" x="370" y="70" width="130" height="50" rx="10"/><text x="435" y="92" text-anchor="middle">PENDING</text><text class="sub" x="435" y="109" text-anchor="middle">with the network</text>
  <rect class="ok" x="560" y="20" width="180" height="50" rx="10"/><text x="650" y="42" text-anchor="middle">APPROVED</text><text class="sub" x="650" y="59" text-anchor="middle">final · callback sent</text>
  <rect class="bad" x="560" y="120" width="180" height="50" rx="10"/><text x="650" y="142" text-anchor="middle">DECLINED</text><text class="sub" x="650" y="159" text-anchor="middle">final · callback sent</text>
  <line x1="140" y1="95" x2="190" y2="95"/><line x1="320" y1="95" x2="370" y2="95"/>
  <path d="M500 88 C530 88 530 45 560 45"/><path d="M500 102 C530 102 530 145 560 145"/>
</svg>`;

/* ---------- pages ---------- */
const G = {};

G['how-it-works'] = () => `<h1>How payments work</h1>
<p class="lead">Everything you send to Paygate10 goes to one endpoint. You tell it what to do with <code>requestType</code>, prove it is you with a signature (a header or a <code>hash</code> field), and we tell you the outcome in the response and in a callback.</p>
${LIFECYCLE_SVG}
<h2>Key concepts</h2>
${table(['Concept', 'What it is'], [
  ['<b>MID</b> · <code>midCode</code>', 'Your merchant account for one product / currency / country. You may have several MIDs.'],
  ['<b>MID secret</b>', 'Issued with each MID. Used only to compute hashes — never sent in a request, never exposed in a browser or app.'],
  ['<code>requestType</code>', 'The operation: <code>PAYIN</code>, <code>PAYOUT</code>, <code>GetStatus</code>, <code>GetBalance</code> …'],
  ['<code>integrationType</code>', '<code>PG_H</code> = hosted checkout, <code>S</code> = seamless (you collect the details).'],
  ['<code>merchantRefNo</code>', 'Your unique reference for the transaction. Reusing one is rejected — which makes retries safe.'],
  ['<code>transaction_id</code>', 'Our ID, returned in the response (e.g. <code>INVWED1757498791747</code>). Store it next to your reference.'],
  ['<b>Signature</b>', 'Proves a request is yours. Either sign the whole body with HMAC-SHA256 in the <code>X-Callback-Signature</code> header, or send a <code>hash</code> field: SHA-256 over specific fields + your secret. Responses and callbacks carry a <code>hash</code> too. See <a href="#/legacy/signing">Signing</a>.'],
  ['<code>notificationUrl</code>', 'Your server endpoint that receives the callback with the final status.'],
  ['<code>returnUrl</code>', 'Where the customer is sent back to after a hosted checkout.'],
])}
<h2>A payin, end to end</h2>
<ol class="steps">
<li><b>Your server sends <code>PAYIN</code></b>Signed with your MID secret, to the Paygate10 endpoint.</li>
<li><b>We respond</b><code>success</code>, <code>transaction_id</code>, a provisional <code>status</code> (usually <code>INITIATED</code> or <code>PENDING</code>) and, for hosted, a <code>checkout_url</code>.</li>
<li><b>The customer pays</b>On the hosted page, or by approving in their wallet / bank app (seamless).</li>
<li><b>We call your <code>notificationUrl</code></b>With the final <code>APPROVED</code> or <code>DECLINED</code>. Verify the callback hash, update your order, reply HTTP 200.</li>
<li><b>Not sure? Ask</b><code>GetStatus</code> returns the current status at any time.</li>
</ol>
<div class="callout warn"><p><b>Only <code>APPROVED</code> and <code>DECLINED</code> are final.</b> Never fulfil an order on <code>INITIATED</code> or <code>PENDING</code>.</p></div>
<h2>Responses always look the same</h2>
${code(`{
  "success": true,
  "midCode": "123",
  "requestType": "PAYIN",
  "merchantRefNo": "ORDER-1001",
  "error": [],
  "data": { "transaction_id": "INV…", "status": "INITIATED", "hash": "…" }
}`)}
<p>When <code>success</code> is <code>false</code>, read <code>error[]</code> — each entry has an <code>errorCode</code> and <code>errorMessage</code>. See <a href="#/legacy/errors">error codes</a>.</p>`;

G.seamless = () => `<h1>Seamless (server-to-server)</h1>
<p class="lead">Collect the payment details in your own UI and send them with <code>integrationType: "S"</code>, a <code>paymentMethod</code> code and <code>paymMethodFields</code>.</p>
<h2>How it works</h2>
<ol class="steps">
<li><b>Choose the method</b>Use the <code>paymentMethod</code> code for the country — see <a href="#/guide/methods">Payment methods</a>.</li>
<li><b>Send method fields</b>For example a wallet number for Easypaisa / JazzCash, a VPA for UPI, card fields for cards.</li>
<li><b>Use the method's hash recipe</b>Seamless recipes differ per method and country — copy the exact one from the API reference.</li>
<li><b>Complete any verification</b>Some flows return an <code>authMode</code>; continue with <code>VerifyPin</code>, <code>VerifyOtp</code>, <code>VerifyPhone</code> or <code>VerifyAddress</code> (see the Others section of the API reference).</li>
<li><b>Show instructions when needed</b>Bank deposit flows return <code>detailData</code> (account number, name, expiry) for the customer to pay into.</li>
<li><b>Wait for the callback</b>As with hosted, only the callback / <code>GetStatus</code> gives the final status.</li>
</ol>
<div class="callout warn"><p><b>Cards:</b> sending card numbers to your servers puts you in PCI DSS scope. Prefer hosted checkout unless you are PCI compliant.</p></div>`;

G.callbacks = () => {
  const cb = (f, p) => { const s = page(f, p).sections.find(x => x.id === 'callback-body'); return s ? renderBlocks(f, s.blocks) : ''; };
  return `<h1>Callbacks &amp; status updates</h1>
<p class="lead">We tell your server about the final status by calling the <code>notificationUrl</code> you sent in the request.</p>
<h2>Rules for your callback endpoint</h2>
<ul>
<li>Accept <code>POST</code> with <code>Content-Type: application/x-www-form-urlencoded</code>.</li>
<li><b>Verify the hash</b> before trusting anything: <code>SHA256(midcode + transactionid + amount + midsecret)</code>, values concatenated with <b>no separator</b>.</li>
<li>Reply <b>HTTP 200</b> once you have stored the update.</li>
<li>Be idempotent — if we don't get your acknowledgement we retry, so the same callback may arrive more than once.</li>
<li>If a callback has not arrived in your expected window, poll <a href="#/legacy/op-get-status">Get Status</a>.</li>
</ul>
<h2>Callback fields</h2>
${tabs([['Payin', cb('legacy', 'index')], ['Payout', cb('legacy', 'payout')]])}`;
};

G.reconciliation = () => `<h1>Balance &amp; reconciliation</h1>
<h2>Balance</h2>
<p><code>GetBalance</code> returns <code>available_balance</code>, <code>running_balance</code>, <code>available_instant_payout_balance</code> and <code>currency</code> for the MID. Hash: <code>SHA256(midcode~midsecret)</code>.</p>
<h2>Transaction list</h2>
<p><code>GetTransactionList</code> pages through deposits, withdrawals, refunds or chargebacks for a date range — use it for daily reconciliation instead of calling <code>GetStatus</code> per transaction.</p>
<ul><li>Up to 100 records per call (<code>skip</code> / <code>take</code>).</li><li>Dates are read as <b>IST for merchants registered in India</b> and UTC for everyone else.</li><li>Filter by status, transaction ID, your reference or payment method.</li><li>Signature: <code>SHA256(midcode~midsecret)</code> — it does not cover the filters.</li></ul>
<p>Reference: <a href="#/legacy/op-get-transaction-list">Get Transaction List</a></p>`;

G['hash-help'] = () => `<h1>Fixing hash errors</h1>
<p class="lead">“hash does not match” is the most common integration error. It almost always comes from one of the causes below.</p>
<div class="callout ok"><p><b>Fastest fix:</b> paste your hash into the <a href="#/playground">hash playground</a>. Its hash detective tries every cause below and tells you which one it is.</p></div>
${table(['Cause', 'How to spot it', 'Fix'], [
  ['<b>Wrong recipe</b>', 'You used the hosted recipe for a seamless request, or another method\'s recipe.', 'Recipes differ per request type, mode, method and country. Copy the exact one from your platform\'s API reference.'],
  ['<b>Fields in the wrong order</b>', 'Same fields, different order.', 'Follow the recipe order exactly — e.g. some recipes place <code>midsecret</code> in the middle.'],
  ['<b>Amount format</b>', 'You sent <code>10</code> or <code>10.0</code>.', 'Use two decimals in the hash: <code>10.00</code>. (Pakistan payouts: whole amounts in the request.)'],
  ['<b>Secret case</b>', 'Secret contains capitals.', 'Use the MID secret in lower case.'],
  ['<b>Separator</b>', 'Used <code>|</code>, spaces or nothing.', 'Requests and responses join with <code>~</code>. Callbacks concatenate with <b>no separator</b>.'],
  ['<b>Hash reused</b>', 'The same hash value appears on different requests.', 'Compute the hash for each request from that request\'s own values.'],
  ['<b>Value mismatch</b>', 'Hashed one value, sent another (trimmed name, different account).', 'Build the hash from exactly the strings you put in the JSON.'],
  ['<b>Wrong secret</b>', 'Nothing matches.', 'Test and production MIDs have different secrets; each MID has its own.'],
])}
<h2>Using the signature header?</h2>
<p>If you sign with <code>X-Callback-Signature</code> (HMAC), a wrong header gives <code>11031</code> even when the body <code>hash</code> is right. Check these:</p>
${table(['Cause', 'Fix'], [
  ['<b>Body changed after signing</b>', 'Serialise the JSON once, sign that string and send the same string. Don\'t let your HTTP library re-serialise it (spaces and key order matter).'],
  ['<b>Wrong key</b>', 'The key is your MID secret in lower case.'],
  ['<b>Wrong algorithm</b>', 'HMAC-SHA256 with the secret as the key, not SHA-256 of body + secret.'],
  ['<b>Header format</b>', 'Send <code>X-Callback-Signature: sha256=&lt;hex&gt;</code>.'],
])}
<h2>Check your hash in seconds</h2>
<div class="grid2"><a class="tile" href="#/playground"><b>Hash playground →</b><span>Every recipe, computed in your browser, with a detective for mismatches.</span></a><a class="tile" href="#/legacy/errors"><b>Error codes →</b><span>Search for 11031 and related codes.</span></a></div>
<p>Use a <b>test</b> secret only. Nothing you type is sent anywhere.</p>
<h2>Still stuck?</h2>
<p>Post your <b>pre-hash string with the secret removed</b> in your integration channel, e.g. <code>123~REF001~100.00~PKR~***</code>, together with the request and the error. That is the fastest way for us to spot the difference. Never post the secret itself. See <a href="#/guide/support">How to raise an issue</a>.</p>`;

/* ==========================================================================
   Integration journey — from the integration and go-live checklist
   (the five stages, LPL / LP, contacts, test cases, raising issues).
   These definitions replace the earlier generic onboarding/testing/go-live/support pages.
   ========================================================================== */

/* tickable checklists, remembered per browser */
function checklist(key, items) {
  return `<ul class="check ticks">${items.map((t, i) => `<li><label><input type="checkbox" data-ck="${key}-${i}"> <span>${t}</span></label></li>`).join('')}</ul>`;
}
function restoreTicks() {
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem('pf-ticks') || '{}'); } catch (_) {}
  document.querySelectorAll('[data-ck]').forEach(cb => { cb.checked = !!saved[cb.dataset.ck]; });
}
document.addEventListener('change', e => {
  const cb = e.target.closest && e.target.closest('[data-ck]');
  if (!cb) return;
  try {
    const saved = JSON.parse(localStorage.getItem('pf-ticks') || '{}');
    saved[cb.dataset.ck] = cb.checked;
    localStorage.setItem('pf-ticks', JSON.stringify(saved));
  } catch (_) {}
});
window.addEventListener('hashchange', () => setTimeout(restoreTicks, 0));
window.addEventListener('DOMContentLoaded', () => setTimeout(restoreTicks, 0));

const doneWhen = t => `<div class="callout ok"><p><b>Done when:</b> ${t}</p></div>`;
const SUPPORT = [
  ['Integration channel', 'API questions, testing, accounts and back office', 'The channel agreed at onboarding'],
  ['Account manager', 'Commercials, priorities', 'Named in your integration channel'],
  ['Integration owner', 'Your day-to-day integration contact', 'Named in your integration channel'],
];

G['before-you-start'] = () => `<h1>Stage 1 · Before you start</h1>
<p class="lead">We exchange details, documents and credentials. Tick items off as you go — your ticks are saved in this browser.</p>
${LPL_LP}
<h2>Your integration details</h2>
${table(['Field', 'Why we ask'], [
  ['Company name', 'Your account and MIDs'],
  ['Countries and currencies', 'Which MIDs and rails to set up'],
  ['Payment methods (deposits / payouts)', 'Which payment methods we enable on your MIDs'],
  ['Integration type', 'Hosted checkout or seamless (server-to-server)'],
  ['Expected monthly volume and typical transaction size', 'Capacity and limits'],
  ['Largest single transaction you expect', 'Some payment rails have minimum or maximum amounts'],
  ['Technical contact (name, Telegram)', 'Shares request and response logs during testing'],
  ['Operations / finance contact', 'Back office, balances and reconciliation'],
  ['Target dates to start testing and to go live', 'Planning on both sides'],
])}
<h2>What we need from you</h2>
${checklist('s1-need', [
  'Signed agreement.',
  'Your integration details (the table above), including the largest single transaction you expect.',
  'Your <b>server IP addresses</b>, for both production and test. We whitelist these before you start; requests from other IPs are blocked.',
  'Your <b>callback (notification) URL</b>.',
  'Confirmation that your server allows our callback IP addresses (we send them to you).',
  'A technical contact who can share request and response logs during testing.',
])}
<h2>Already on this site</h2>
<p>Everything you need to build is in these docs, always up to date. Use them instead of a separate document:</p>
<ul class="link-list">
  <li><a href="#/legacy/api-overview">API overview</a>: the endpoint and the <code>api-version</code> (<code>2.0</code>) to use.</li>
  <li><a href="#/legacy/payin">Payin</a> and <a href="#/legacy/payout">Payout</a>: pick your country and method to see which fields are required or optional, phone and wallet number formats, and an example for every field.</li>
  <li><a href="#/legacy/build-rules">Build rules</a>: amounts with two decimals, upper-case country and currency codes, unique references.</li>
  <li><a href="#/legacy/payin-flows">Pay-in flows</a> and <a href="#/legacy/payout-flows">Payout flows</a>: the transaction statuses you will see.</li>
  <li><a href="#/legacy/errors">Error codes</a>: every code, with how to fix it.</li>
  <li><a href="#/legacy/signing">Signing &amp; hashes</a>: the hash recipe for every request (pay-in, payout, status, balance, callbacks), with worked examples. Check yours in the <a href="#/playground">Hash playground</a>.</li>
  <li><a href="#/legacy/api-callbacks">Callbacks</a>: the fields we send, how to verify the hash, and the reply your server must return.</li>
  <li><a href="#/legacy/op-get-bank-list">Get Bank List</a>: the bank and wallet codes for your countries.</li>
  <li><a href="#/methods">Payment methods</a>: methods, standard limits and demos per country.</li>
</ul>
${doneWhen('we have everything above, and your first API request receives a response (not a timeout or a blocked page).')}`;

G['build-rules'] = () => `<h1>Stage 2 · Build rules</h1>
<p class="lead">These rules prevent the integration errors we see most often. Check each one before you start testing.</p>
<h2>Requests</h2>
${checklist('s2-req', [
  'Send every request to the endpoint and <code>api-version</code> given in your documentation link.',
  'Use uppercase ISO codes for country (<code>PK</code>, <code>EG</code>, <code>IN</code>) and currency (<code>PKR</code>, <code>EGP</code>, <code>INR</code>).',
  'Send IDs such as <code>midCode</code> as strings.',
  'Send <b>only the fields listed for your method</b>. Extra or misspelled fields can make a request fail. Field names are case-sensitive.',
  'Use the <code>paymentMethod</code> value for your MID, as given in your MID list.',
  'Format phone and wallet numbers exactly as your method\'s page in the <a href="#/legacy/payin">API reference</a> shows.',
  'Send amounts with two decimal places (e.g. <code>100.00</code>), and check whether your method accepts decimals.',
  'Use a unique <code>merchantRefNo</code> for every transaction.',
  'Use the correct <code>integrationType</code> for each request (hosted or seamless).',
])}
<h2>Hash (signature)</h2>
${checklist('s2-hash', [
  'Choose how you sign: the <code>X-Callback-Signature</code> header (HMAC of the whole body, same for every request) or the body <code>hash</code>. See <a href="#/legacy/signing">Signing</a>.',
  'If you use the body hash, build it with the formula for that exact request type — deposit, payout, status check, balance and callbacks each use different fields.',
  'Use the same amount format in the hash as in the request (e.g. <code>100.00</code>).',
  'For status checks, send <code>transaction_type</code> in lowercase (<code>payin</code> / <code>payout</code>).',
  'If you get “hash does not match”, share the <b>pre-hash string with the secret removed</b> in your integration channel — the fastest way for us to help. See <a href="#/guide/hash-help">Fixing hash errors</a>.',
])}
<h2>Callbacks</h2>
${checklist('s2-cb', [
  'Your callback URL accepts the documented callback format, from our IP addresses.',
  'Your server verifies the callback signature, using the callback formula.',
  'Your server returns the documented acknowledgement. Otherwise we retry the callback.',
  'Your system handles every status: <code>PENDING</code>, <code>IN-PROCESS</code>, <code>APPROVED</code> and <code>DECLINED</code>. Only <code>APPROVED</code> and <code>DECLINED</code> are final.',
  'If a callback doesn\'t arrive, use the status-check request before treating a transaction as failed.',
])}
<h2>Payouts</h2>
${checklist('s2-po', [
  'Check your payout balance before sending payouts (balance request or back office).',
  'Respect the per-beneficiary and daily limits in your limits sheet.',
])}
<h2>Hosted checkout</h2>
${checklist('s2-hosted', [
  'Set a <code>returnUrl</code>, and show the customer a clear result page.',
  'Create a new payment link for each attempt. Don\'t reuse old links.',
])}
${doneWhen('a deposit (and a payout, if applicable) completes end to end, and you receive and verify the callback.')}`;

G.testing = () => {
  const T = [
    ['Deposit approved (once for each payment method)', 'Deposits', 'Status APPROVED; callback received and signature verified'],
    ['Deposit declined or cancelled by the customer', 'Deposits', 'Status DECLINED with a reason; callback received'],
    ['Deposit left unpaid until it expires', 'Deposits', 'Final status and callback received'],
    ['Payout approved (once for each payment method)', 'Payouts', 'Status APPROVED; callback verified; balance reduced'],
    ['Payout to an invalid account', 'Payouts', 'Status DECLINED with a reason'],
    ['Payout in process', 'Payouts', 'IN-PROCESS handled; final callback received'],
    ['Status check for a deposit and a payout', 'All', 'Correct status returned'],
    ['Balance check', 'Payouts', 'Correct balance and currency'],
    ['Amount below the minimum and above the maximum', 'All', 'Request rejected with the limit error'],
    ['Amount with decimals (e.g. 100.67)', 'All', 'Processed exactly, or rejected, as the <a href="#/legacy/build-rules">build rules</a> and your method\'s page in the API reference say'],
    ['Repeated <code>merchantRefNo</code>', 'All', 'Request rejected as a duplicate'],
    ['Hosted page, return to your site, and an expired link', 'Hosted', 'Page loads; customer returns to your result page; expired link is handled'],
    ['Callback received a second time', 'All', 'Your system doesn\'t credit or pay twice'],
    ['INR payout type and amount rules (Individual / Corporate)', 'INR payouts', 'Each payout is accepted or rejected as your limits sheet says'],
  ];
  return `<h1>Stage 3 · Test cases</h1>
<p class="lead">Run each test that applies to your integration on LPL, within your test limits. Record the transaction ID and result, then post them in your integration channel — we check each result on our side.</p>
${LPL_LP}
<table><thead><tr><th>#</th><th>Test</th><th>Applies to</th><th>Expected result</th><th>Passed</th></tr></thead><tbody>${
  T.map((r, i) => `<tr><td>${i + 1}</td><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td><input type="checkbox" data-ck="s3-${i}" aria-label="Test ${i + 1} passed"></td></tr>`).join('')
}</tbody></table>
<p>Error codes you should see: duplicate reference <code>${(errorBy('legacy', /duplicate merchantRefNo/i) || {}).ErrorCode || '—'}</code>, wrong hash <code>${(errorBy('legacy', /hash does not match/i) || {}).ErrorCode || '—'}</code> — full list in <a href="#/legacy/errors">Error codes</a>.</p>
${doneWhen('every test that applies shows a pass, and every question you raised has been answered.')}`;
};

G['go-live'] = () => `<h1>Stage 4 · Go-live readiness &amp; sign-off</h1>
${checklist('s4', [
  'All applicable test cases in <a href="#/guide/testing">Stage 3</a> have passed.',
  'Our QA team has completed an end-to-end check of the payment journey on your website.',
  'Your finance team can reconcile transactions from the back-office reports — balances, payouts and, if applicable, prefunding.',
  'Your payment page shows the correct method names and payment instructions for customers.',
  'Your team knows how to view transactions and balances in the back office, and <a href="#/guide/support">how to raise an issue</a>.',
  'Any open questions are answered or have an agreed date.',
])}
<h2>Sign-off</h2>
<p>Both teams sign off before production credentials are issued:</p>
${table(['Party', 'Signs off'], [
  ['Merchant — technical', 'Integration and test results'],
  ['Merchant — business / operations', 'Payment journey, reconciliation'],
  ['Paygate10 — Tech Integration', 'Test results verified on our side'],
  ['Paygate10 — Customer Success', 'Accounts and back office ready'],
  ['Paygate10 — Account manager', 'Commercial readiness'],
])}`;

G.production = () => `<h1>Stage 5 · Moving to production</h1>
${checklist('s5', [
  'You receive your <b>LP MID and new credentials</b> through a secure channel. Confirm you have received every part.',
  'Your production server IPs are whitelisted for the LP MID.',
  'Your configuration uses the LP MID, the secret and the endpoint. LPL credentials are kept for testing only.',
  'You can log in to the production back office and see the LP MID and its balance.',
  'For payouts: your production payout balance is funded and shows in the back office.',
  'A small live deposit (and a payout, if applicable) has run on the LP MID.',
  'The <b>first live callback</b> arrived and its signature verified.',
  'You told us in your integration channel when you started sending production traffic.',
])}
${doneWhen('your first live transactions and callbacks are confirmed on the LP MID.')}`;

G['after-go-live'] = () => `<h1>After go-live</h1>
<ul>
<li>For the first <b>90 days</b>, we monitor your approval rate and processing times, and contact you if we see a problem.</li>
<li>We notify you in advance, in your integration channel, of any change that affects you: payment methods, limits, API fields, endpoints or credentials.</li>
<li>Keep your callback endpoint and IP whitelist up to date. Tell us before you change your server IPs or callback URL.</li>
<li>Contact us before rotating credentials or adding new countries or methods.</li>
</ul>
<p>Day-to-day: reconcile with <a href="#/guide/reconciliation">balance &amp; transaction list</a>, and use <a href="#/guide/support">Support &amp; raising issues</a> when something looks wrong.</p>`;

G.support = () => `<h1>Support &amp; raising issues</h1>
<h2>Who to contact</h2>
${table(['Team', 'For', 'Contact'], SUPPORT)}
<p>Reach out to us on your <b>integration channel</b>: the group we set up with you at onboarding, on Telegram or the platform we agreed. Both teams see the same status there.</p>
<h2>How to raise an issue</h2>
<p>Post in your integration channel with these details, so we can find the transaction and answer the first time:</p>
${table(['Include', 'Example'], [
  ['Environment and MID', 'LP, MID 123'],
  ['Our transaction ID, or your <code>merchantRefNo</code>', 'INV… / your reference'],
  ['Date and time, with time zone', '2026-10-19 14:05 UTC'],
  ['What you expected, and what happened', '“Expected APPROVED callback, received none”'],
  ['Request and response (<b>remove your MID secret</b>)', 'JSON'],
  ['Error code and message, if any', '<code>11031 hash does not match</code>'],
  ['For hash errors: your pre-hash string with the secret removed', '<code>123~REF001~100.00~PKR~***</code>'],
])}
<div class="callout warn"><p>Please don't post passwords, MID secrets or customers' personal data in the group. Our team will never ask for your passwords in chat.</p></div>`;



