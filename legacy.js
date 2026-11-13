/* The product guide and its API reference, under #/legacy/…
   Data from document.paygate10.com (data.js),
   commercial specs from the Gaming / Forex / P2P product offering, and the Go-Live Checklist.
   Generic guide pages are reused through relink(), which points their links at this section. */

const LF = 'legacy';
const LG = {};

/* guide page id → page id in this section */
const TO_LEGACY = {
  'how-it-works': 'how-it-works', 'payin-flows': 'payin-flows', 'payout-flows': 'payout-flows',
  onboarding: 'journey', 'before-you-start': 'stage-1', 'quickstart-payin': 'quickstart-payin', 'quickstart-payout': 'quickstart-payout',
  'build-rules': 'build-rules', hosted: 'hosted', seamless: 'seamless', payouts: 'payouts-guide', 
  callbacks: 'callbacks', refunds: 'refunds', reconciliation: 'reconciliation', testing: 'testing', 'go-live': 'go-live',
  production: 'production', 'after-go-live': 'after-go-live', 'hash-help': 'hash-help', faq: 'faq', support: 'support', choose: 'start',
};
const relink = html => html
  .replace(/#\/guide\/([a-z0-9-]+)/g, (m, id) => TO_LEGACY[id] ? `#/legacy/${TO_LEGACY[id]}` : m)
  .replace(/#\/legacy\/overview\b/g, '#/legacy/start')
  .replace(/#\/(guide|legacy)\/(methods|products|legacy-products)\b/g, '#/methods');
const reuse = id => () => relink(G[id]());

const LEGACY_MARKETS = () => Object.entries(methodMatrix())
  .filter(([, v]) => [...Object.values(v.payin), ...Object.values(v.payout)].some(x => x.flows.has(LF)))
  .map(([c]) => c).sort();
const legacyOnly = o => Object.values(o).filter(x => x.flows.has(LF));

/* ---------- Welcome ---------- */
LG.start = () => `<div class="pf-banner"><div class="pf-banner-text"><h1>Paygate10 Gateway</h1><p>Integration guide and API reference for merchants connecting directly to the Paygate10 Gateway.</p></div></div>
<p class="lead">Accept local payments and send payouts across ${LIVE.length} live markets through one endpoint. Built for gaming, forex and P2P merchants.</p>
<h2>Live markets</h2>
${liveFlags()}
<p>Methods, limits, demos and videos for each market are in <a href="#/methods">Payment methods</a>.</p>
<h2>Connection details</h2>
${table(['Setting', 'Value'], [
  ['Production endpoint', `<code>${esc(prodUrl(LF) || '')}</code>`],
  ['Method', '<code>POST</code>, <code>Content-Type: application/json</code>'],
  ['Version header', '<code>api-version: 2.0</code>'],
  ['Test environment', 'LPL — live with small limits (see <a href="#/legacy/journey">Integration journey</a>)'],
  ['Signing', 'HMAC-SHA256 <code>X-Callback-Signature</code> header, or a SHA-256 <code>hash</code> per request. See <a href="#/legacy/signing">Signing &amp; hashes</a>'],
])}
<h2>Before you start</h2>
<p>Read <a href="#/legacy/how-it-works">How payments work</a> for the core ideas, then follow the <a href="#/legacy/journey">integration journey</a>. Every page ends with a link to the next one.</p>
<p class="src">New merchants integrate with API v2 (these pages). Merchants migrating from PG10 use API v1, which stays compatible; see <a href="#/legacy/pg10">v1 and v2 compatibility</a>.</p>`;

/* ---------- Reused generic pages (relinked to this section) ---------- */
['how-it-works', 'payin-flows', 'build-rules', 'seamless', 'callbacks', 'reconciliation', 'go-live', 'production', 'after-go-live']
  .forEach(id => { LG[id] = reuse(id); });
LG['stage-1'] = reuse('before-you-start');

/* ---------- section pages ---------- */
LG.journey = () => `<h1>Integration journey</h1>
<p class="lead">Every integration moves through five stages, from kickoff to live processing. Your integration channel, on Telegram or the platform agreed at onboarding, is where both teams track progress.</p>
${table(['Stage', 'What happens', 'Environment', 'You move on when'], [
  ['<a href="#/legacy/stage-1">1. Before you start</a>', 'We exchange details, documents and credentials', '—', 'You have everything in Stage 1, and your first API call works'],
  ['<a href="#/legacy/build-rules">2. Build</a>', 'You connect to the Gateway API', 'LPL', 'Requests and callbacks work end to end'],
  ['<a href="#/legacy/testing">3. Test</a>', 'You run the required test cases', 'LPL: live, real transactions within small limits', 'All test cases pass'],
  ['<a href="#/legacy/go-live">4. Sign-off</a>', 'Both teams review the results and sign off', 'LPL', 'Sign-off is complete'],
  ['<a href="#/legacy/production">5. Production</a>', 'New production credentials and a final check', 'LP: live production', 'First live transactions and callbacks confirmed'],
])}
${LPL_LP}
<p>Commercial onboarding comes first: complete the compliance review and sign the agreement. Our team then opens your integration channel and Stage 1 starts.</p>`;

LG['quickstart-payin'] = () => {
  const hostedIdx = recipeIdx(LF, /^Payin · Request Hash · All Hosted/), cbIdx = recipeIdx(LF, /^Payin · Callback Hash/);
  return `<h1>Quickstart: your first pay-in</h1>
<p class="lead">Accept a payment with hosted checkout in five steps — one request, one redirect, one callback.</p>
<h2>1. Have these ready</h2>
<ul><li>An LPL <code>midCode</code> and MID secret for the currency you will charge.</li><li>Your server IP whitelisted.</li><li>An HTTPS <code>notificationUrl</code> and a <code>returnUrl</code> result page.</li></ul>
<h2>2. Compute the hash</h2>
<div class="formula"><span>SHA256(midcode~merchantrefno~amount~currency~midsecret)</span>${hostedIdx >= 0 ? `<a href="#/playground/${hostedIdx}">Try it →</a>` : ''}</div>
<ul><li>Amount with two decimals: <code>100.00</code>.</li><li>MID secret in lower case.</li><li>A new hash for every request, unless you sign with the <code>X-Callback-Signature</code> header instead (see <a href="#/legacy/signing">Signing &amp; hashes</a>).</li></ul>
${tabs([
  ['Node.js', code(`const crypto = require('crypto');
const mid = '123', ref = 'ORDER-1001', amount = '100.00', currency = 'PKR';
const hash = crypto.createHash('sha256')
  .update([mid, ref, amount, currency, process.env.MID_SECRET.toLowerCase()].join('~'))
  .digest('hex');`, 'js')],
  ['Python', code(`import hashlib, os
mid, ref, amount, currency = "123", "ORDER-1001", "100.00", "PKR"
hash_ = hashlib.sha256("~".join([mid, ref, amount, currency, os.environ["MID_SECRET"].lower()]).encode()).hexdigest()`, 'python')],
])}
<h2>3. Send the request</h2>
${code(`curl -X POST '${prodUrl(LF)}' \\
  -H 'Content-Type: application/json' \\
  -H 'api-version: 2.0' \\
  -d '{
  "requestType": "PAYIN",
  "data": {
    "midCode": "123",
    "integrationType": "PG_H",
    "amount": 100.00,
    "currency": "PKR",
    "country": "PK",
    "merchantRefNo": "ORDER-1001",
    "merchantUrl": {
      "notificationUrl": "https://yourshop.example/notify",
      "returnUrl": "https://yourshop.example/checkout/done"
    },
    "userInfo": { "firstName": "Test", "lastName": "User", "email": "test@example.com", "phone": "03001234567" },
    "riskData": { "user_category": "Default", "device_fingerprint": "abc123" },
    "hash": "<from step 2>"
  }
}'`, 'bash')}
<p>Required <code>userInfo</code> fields vary by country and method. Pick yours on the <a href="#/legacy/payin">Payin</a> page: each field shows whether it is required, and an example.</p>
<h2>4. Redirect the customer</h2>
<p>Send the customer to <code>data.checkout_url</code>. They return to your <code>returnUrl</code> when done — <b>the return is not proof of payment</b>.</p>
<h2>5. Handle the callback</h2>
<p>We POST <code>application/x-www-form-urlencoded</code> to your <code>notificationUrl</code>. Verify the hash, update the order, reply HTTP 200.</p>
<div class="formula"><span>SHA256(midcode + transactionid + amount + midsecret) — no separator</span>${cbIdx >= 0 ? `<a href="#/playground/${cbIdx}">Try it →</a>` : ''}</div>
${code(`app.post('/pf/notify', express.urlencoded({ extended: false }), (req, res) => {
  const { sid, txid, amount, status, Ref1, hash } = req.body;
  const expected = crypto.createHash('sha256')
    .update(sid + txid + amount + process.env.MID_SECRET.toLowerCase()).digest('hex');
  if (expected !== hash) return res.status(400).end();
  markOrder(Ref1, status);            // idempotent: the same callback may arrive twice
  res.sendStatus(200);
});`, 'js')}
<div class="callout ok"><p><b>Done.</b> Next: <a href="#/legacy/seamless">seamless pay-ins</a>, <a href="#/legacy/quickstart-payout">your first payout</a>, or the <a href="#/legacy/testing">test cases</a>.</p></div>`;
};

LG['quickstart-payout'] = () => {
  const btIdx = recipeIdx(LF, /^Payout · Request Hash · Seamless Bank Transfer \(Pakistan\)/);
  return `<h1>Quickstart: your first payout</h1>
<p class="lead">Send a bank transfer payout in Pakistan. Every payout method follows the same pattern — only the beneficiary fields and the hash recipe change.</p>
<h2>1. Check your balance</h2>
<p>Payouts are paid from your balance. Call <a href="#/legacy/balance">GetBalance</a> (hash <code>SHA256(midcode~midsecret)</code>) and check <code>available_instant_payout_balance</code>.</p>
<h2>2. Get the bank code</h2>
<p>Call <a href="#/legacy/op-get-bank-list">GetBankList</a> with <code>transaction_type</code> <code>withdrawal</code>. Use the returned <code>processor_bankcode</code> as <code>bank_code</code>.</p>
<h2>3. Compute the hash</h2>
<div class="formula"><span>SHA256(midcode~account_name~account_number~bank_code~amount~currency~midsecret)</span>${btIdx >= 0 ? `<a href="#/playground/${btIdx}">Try it →</a>` : ''}</div>
<h2>4. Send the payout</h2>
${code(`{
  "requestType": "PAYOUT",
  "data": {
    "midCode": "123",
    "integrationType": "S",
    "amount": 5000.00,
    "currency": "PKR",
    "country": "PK",
    "merchantRefNo": "PO-1001",
    "merchantUrl": { "notificationUrl": "https://yourshop.example/notify" },
    "paymentMethod": "BT",
    "paymMethodFields": {
      "account_number": "<account number or IBAN>",
      "account_name": "<account holder name>",
      "bank_code": "<processor_bankcode from GetBankList>"
    },
    "hash": "<from step 3>"
  }
}`)}
<p>Use the test accounts agreed for LPL. Whether your method accepts decimals is in the <a href="#/legacy/build-rules">build rules</a> and your method's page in the API reference.</p>
<h2>5. Wait for the final status</h2>
<p>The response is usually <code>PENDING</code>. The final result arrives on your <code>notificationUrl</code> with <code>key</code>, <code>payoutid</code>, <code>reference1</code>, <code>amount</code>, <code>status</code>, <code>utrnumber</code> and <code>hash</code> (<code>SHA256(midcode + transactionid + amount + midsecret)</code>, no separator). If it is late, poll <a href="#/legacy/op-get-status">Get Status</a> with <code>transaction_type</code> <code>payout</code>.</p>`;
};

LG.hosted = () => {
  const M = methodMatrix();
  const rows = Object.entries(M).filter(([c]) => LIVE.some(l => l[0] === c)).map(([c, v]) => [`${FLAGS[c] || ''} ${c}`, legacyOnly(v.payin).filter(x => x.mode === 'Hosted').map(x => esc(x.name)).join('<br>')]).filter(r => r[1]);
  return `<h1>Hosted checkout</h1>
<p class="lead">Send one <code>PAYIN</code> with <code>integrationType: "PG_H"</code>; we return a <code>checkout_url</code> where the customer picks a method and pays.</p>
<h2>When to use it</h2><ul><li>The fastest integration.</li><li>No card or wallet details touch your systems.</li><li>We show the methods available in the customer's country.</li></ul>
<h2>Rules</h2>
<ul><li><code>returnUrl</code> is required.</li><li>No <code>paymentMethod</code> / <code>paymMethodFields</code> needed.</li><li>One request hash for every hosted pay-in: <code>SHA256(midcode~merchantrefno~amount~currency~midsecret)</code>.</li><li>The response hash includes the checkout URL: <code>…~txnstatus~amount~checkouturl~midsecret</code>.</li><li>Some responses return <code>checkout_html</code> (for example a QR code) to embed instead of redirecting.</li><li>Create a new link for each attempt; handle expired links.</li></ul>
<h2>Hosted methods by country</h2>
${table(['Country', 'Methods on the hosted page'], rows)}
<p>Field tables and examples: <a href="#/legacy/payin">Payin reference</a>.</p>`;
};

LG['payout-flows'] = () => `<h1>Payout flows</h1>
<p class="lead">A payout sends money from your balance to a bank account or wallet. Payouts are always server-to-server: you send the beneficiary details, we validate, check your balance, and pay through the local rail.</p>
${seq(['Your server', 'Paygate10', 'Bank / wallet', 'Beneficiary'], [
  [0, 0, 'Check balance (GetBalance)'],
  [0, 1, 'PAYOUT (S) + beneficiary + hash'],
  [1, 1, 'Validate fields, hash, balance'],
  [1, 0, 'status PENDING', 'res'],
  [1, 2, 'Submit to local rail'],
  [2, 3, 'Credit account / wallet'],
  [2, 1, 'Result + UTR / reference', 'res'],
  [1, 0, 'Callback: APPROVED / DECLINED + utrnumber', 'res'],
], 'Payout sequence')}
<h2>Payout types</h2>
${table(['Type', 'Where', 'Code', 'Beneficiary details'], [
  ['<b>Bank transfer</b>', '🇳🇬 Nigeria · 🇵🇰 Pakistan · 🇪🇬 Egypt · 🇲🇦 Morocco', '<code>BT</code>', 'Account number, account name, bank code (MA: 24-digit account, code starting MOBT)'],
  ['<b>Net banking</b>', '🇮🇳 India', '<code>NB</code>', 'Account number, name, bank name, IFSC, <code>payout_type</code> Individual / Corporate'],
  ['<b>Mobile wallet</b>', '🇵🇰 Easypaisa / JazzCash · 🇪🇬 · 🇲🇦 · 🇧🇩 · 🇵🇭', '<code>EP</code> / <code>JC</code> / <code>MWALLET</code> / <code>WT</code>', 'Wallet number; PK also a 13-digit CNIC in <code>document_id</code>; MA / BD / PH a bank code'],
  ['<b>Bank deposit</b>', '🇵🇰 Pakistan · 🇪🇬 Egypt', '<code>BD</code>', 'Account details as listed for the method'],
])}
<h2>How payouts are funded</h2>
<p>Approved pay-ins settle, net of fees, refunds and chargebacks, into your balance. Payouts draw on <code>available_instant_payout_balance</code>. You can also withdraw your available balance to your settlement account from the back office.</p>
<h2>Statuses you will see</h2>
${table(['Status', 'Meaning', 'Your action'], [
  ['<code>PENDING</code>', 'Accepted, queued for the rail', 'Wait'],
  ['<code>IN-PROCESS</code>', 'With the bank / wallet', 'Wait; do not resend'],
  ['<code>APPROVED</code>', 'Paid — final; <code>utrnumber</code> is the bank reference', 'Mark paid'],
  ['<code>DECLINED</code>', 'Rejected — final; see <code>remark</code> / <code>errorcode</code>', 'Fix the details; send a new payout with a new reference'],
])}
<p>The callback also tells you <code>payoutby</code>: <b>Instant</b> or <b>Batch</b>.</p>
<h2>Common reasons a payout is rejected</h2>
<ul>
<li>Not enough balance — ${ERR(/insufficient wallet balance/i) || 'insufficient balance'}.</li>
<li>Wrong hash — ${ERR(/hash does not match/i)}. Payout recipes include the beneficiary fields.</li>
<li>Amount outside your limits sheet, or decimals where the method doesn't accept them.</li>
<li>Account or wallet number in the wrong format for the country.</li>
</ul>
<h2>Build it</h2>
<div class="grid3">
  <a class="tile" href="#/legacy/quickstart-payout"><span class="tag">Start</span><b>Quickstart: first payout →</b><span>Balance, bank code, payout, callback.</span></a>
  <a class="tile" href="#/legacy/payouts-guide"><span class="tag">Rules</span><b>Payouts &amp; funding →</b><span>Country rules and limits.</span></a>
  <a class="tile" href="#/legacy/payout"><span class="tag">API</span><b>Payout reference →</b><span>Every field and real example.</span></a>
</div>`;

LG['payouts-guide'] = () => `<h1>Payouts &amp; funding</h1>
<p class="lead">Payouts are paid from your balance, built up from your settled pay-ins.</p>
<h2>Instant and batch</h2>
<p>The callback's <code>payoutby</code> tells you whether a payout was processed <b>Instant</b> or in a <b>Batch</b>. <code>GetBalance</code> returns <code>available_instant_payout_balance</code> separately from <code>available_balance</code>.</p>
<h2>Country rules</h2>
${table(['Country', 'Method', 'Rules'], [
  ['🇮🇳 India', 'Net banking', 'Account number, name, bank name, IFSC; <code>payout_type</code> Individual / Corporate; branch and address optional'],
  ['🇳🇬 Nigeria', 'Bank transfer', '10-digit account number, bank code, account name'],
  ['🇵🇰 Pakistan', 'Easypaisa / JazzCash', '11-digit wallet number starting 03; 13-digit CNIC in <code>document_id</code>'],
  ['🇵🇰 Pakistan', 'Bank transfer / deposit', 'Account number or IBAN, account name, bank code'],
  ['🇪🇬 Egypt', 'Mobile wallet', '11-digit number starting 010, 011, 012 or 015; account name'],
  ['🇪🇬 Egypt', 'Bank transfer / deposit', 'Account number (up to 24), account name, bank code'],
  ['🇲🇦 Morocco', 'Bank transfer', '24-digit account number; bank code starting MOBT; account name'],
  ['🇲🇦 Morocco', 'Wallet', '10-digit number starting 06 or 07; bank code starting MOW; account name'],
  ['🇵🇭 Philippines', 'Wallet', '11-digit number starting 09; bank code; account name'],
])}
<h2>Limits and settlement</h2>
<p>Payout limits and settlement times per market are in <a href="#/methods">Payment methods → Payouts</a>.</p>
<div class="callout warn"><p><b>Limits can change.</b> ${LIMITS_NOTE}</p></div>`;


LG.testing = reuse('testing');

LG['hash-help'] = reuse('hash-help');

LG.faq = () => {
  const q = (t, a) => `<details class="faq"><summary>${t}</summary>${a}</details>`;
  return `<h1>FAQ</h1>
${q('I get an HTML page / 403 instead of JSON.', '<p>Your server IP is not whitelisted, so the request is blocked before it reaches the Gateway. Send your public server IPs (test and production) to your integration channel.</p>')}
${q('Where do I get my midCode and MID secret?', '<p>We issue them: LPL credentials in Stage 1, and a new LP MID and credentials after sign-off. Each MID has its own secret.</p>')}
${q('What are LPL and LP?', LPL_LP)}
${q('I get “hash does not match”.', '<p>See <a href="#/legacy/hash-help">Fixing hash errors</a> and check your hash in the <a href="#/playground">Hash playground</a>. Still stuck: post your pre-hash string with the secret replaced by <code>***</code> in your integration channel.</p>')}
${q('Is returnUrl required for seamless?', '<p>Required for all hosted transactions and for seamless bank transfer / bank deposit. We recommend always sending it.</p>')}
${q('I did not receive a callback.', '<p>Check that your <code>notificationUrl</code> is public HTTPS, allows our callback IPs and returns 200. Then call <a href="#/legacy/op-get-status">Get Status</a>.</p>')}
${q('What value goes in transaction_type for GetStatus?', '<p>Lower case: <code>payin</code> or <code>payout</code> — in the request and in the hash.</p>')}
${q('Can I send decimal amounts?', '<p>Send amounts with two decimals (e.g. <code>100.00</code>), but check your method\'s page in the API reference: some methods only accept whole amounts.</p>')}
${q('How do I find bank codes for payouts?', '<p>Call <a href="#/legacy/op-get-bank-list">Get Bank List</a> with <code>transaction_type</code> <code>withdrawal</code>; use <code>processor_bankcode</code>.</p>')}
${q('Which statuses are final?', '<p>Only <code>APPROVED</code> and <code>DECLINED</code>. Everything else means “still in progress”.</p>')}
${q('Which time zone do transaction list dates use?', '<p>IST for merchants registered in India, UTC for everyone else.</p>')}
${q('I am migrating from PG10. Do I have to move to v2?', '<p>No. Merchants migrating from PG10 use API v1, which stays compatible. New merchants integrate with API v2. If you choose to move to v2, <a href="#/legacy/pg10">v1 and v2 compatibility</a> has the field-by-field mapping.</p>')}`;
};

LG.support = reuse('support');

/* ---------- navigation (guide first, then API reference) ---------- */
const LEGACY_GUIDE_NAV = [
  ['Overview', [['start', 'Welcome'], ['how-it-works', 'How payments work']]],
  ['Payment flows', [['payin-flows', 'Pay-in flows'], ['payout-flows', 'Payout flows']]],
  ['Get started', [['journey', 'Integration journey'], ['stage-1', 'Stage 1 · Before you start'], ['quickstart-payin', 'Quickstart: first pay-in'], ['quickstart-payout', 'Quickstart: first payout']]],
  ['Build', [['build-rules', 'Stage 2 · Build rules'], ['hosted', 'Hosted checkout'], ['seamless', 'Seamless'], ['payouts-guide', 'Payouts & funding'], ['signing', 'Signing & hashes']]],
  ['Operations', [['callbacks', 'Callbacks'], ['reconciliation', 'Balance & reconciliation']]],
  ['Test and go live', [['testing', 'Stage 3 · Test cases'], ['go-live', 'Stage 4 · Sign-off'], ['production', 'Stage 5 · Production'], ['after-go-live', 'After go-live']]],
  ['Troubleshooting', [['hash-help', 'Fixing hash errors'], ['errors', 'Error codes'], ['faq', 'FAQ'], ['support', 'Support']]],
];
const _nav = nav, _resolve = resolve;
nav = function (flow) {
  if (flow !== LF) return _nav(flow);
  const ops = otherOps(LF).map(s => ['op-' + s.id, s.title]).filter(([id]) => !HIDDEN.has(id));
  /* API reference: signing, hashes and callbacks come before the requests, since every request needs its hash and notificationUrl */
  return LEGACY_GUIDE_NAV.concat([
    ['API reference · Get started', [['api-overview', 'Overview']]],
    ['API reference · Before your first request', [['signing', 'Signing & hashes'], ['api-callbacks', 'Callbacks']]],
    ['API reference · Requests', [['payin', 'Payin'], ['payout', 'Payout']]],
    ['API reference · Utilities', [['balance', 'Get Balance'], ...ops]],
    ['API reference · Reference', [['errors', 'Error codes'], ['pg10', 'v1 and v2 compatibility']]],
  ]);
};
/* every operation (Payin, Payout, Get Balance, utilities) uses the parameters + code panel layout (apiref2.js) */
const API2_ROUTES = {signing: arg => API2.signingPage(LF, arg ? dec(arg) : ''), 'api-callbacks': () => API2.callbacksPage(LF)};
Object.keys(API_PAGES).filter(k => !HIDDEN.has(k)).forEach(k => { API2_ROUTES[k] = arg => API2.render(LF, k, arg ? dec(arg) : ''); INIT[k] = arg => API2.init(k, arg); });
otherOps(LF).filter(s => !HIDDEN.has('op-' + s.id)).forEach(s => { const id = 'op-' + s.id; API2_ROUTES[id] = arg => API2.renderOp(LF, s.id, arg ? dec(arg) : ''); INIT[id] = arg => API2.init(id, arg); });
INIT.signing = arg => { const el = arg && document.getElementById(arg === 'hmac' ? 'hmac' : 'body-hash'); if (el) el.scrollIntoView({block: 'start'}); };
resolve = function (flow, id) {
  if (flow === LF && API2_ROUTES[id]) return API2_ROUTES[id];
  if (flow === LF && LG[id]) return () => LG[id]();
  return _resolve(flow, id);
};

/* ---------- API reference overview ---------- */
LG['api-overview'] = () => {
  const op = (href, rt, name, what) => `<a class="op-card" href="${href}"><span class="method post">POST</span><span class="op-n"><b>${name}</b><code>${rt}</code></span><span class="op-w">${what}</span></a>`;
  const step = (n, href, t, d) => `<a class="seq" href="${href}"><span class="seq-n">${n}</span><span><b>${t}</b><small>${d}</small></span></a>`;
  return `<h1>API overview</h1>
<p class="lead">One endpoint for everything you do in code: accept pay-ins, send payouts, check your balance and a transaction's status, and pull your transactions for reconciliation. Every transaction also gets a callback.</p>
<div class="ep2"><span class="method post">POST</span><code>${esc(API_URL)}</code><button type="button" class="ep2-copy" data-copy-text="${esc(API_URL)}" aria-label="Copy endpoint">Copy</button></div>
<div class="ep2-h"><span>Headers</span> <code>Content-Type: application/json</code> <code>api-version: 2.0</code> <span>· the operation is chosen by <code>requestType</code> in the body</span></div>
<h2>Build in this order</h2>
<div class="seqs">
  ${step(1, '#/legacy/stage-1', 'Before you start', 'MID and secret, IP whitelisting, callback URL')}
  ${step(2, '#/legacy/signing', 'Signing & hashes', 'Signature header or body hash, and the recipe for each request')}
  ${step(3, '#/legacy/api-callbacks', 'Callbacks', 'What we send to your notificationUrl')}
  ${step(4, '#/legacy/payin', 'Payin or Payout', 'Your first request')}
  ${step(5, '#/legacy/op-get-status', 'Get Status and Get Balance', 'Check results and funds')}
</div>
<h2>Operations</h2>
<p>Every call is <code>POST</code> to the same URL. The <code>requestType</code> picks the operation:</p>
<div class="op-cards">
  ${op('#/legacy/payin', 'PAYIN', 'Payin', 'Collect a payment.')}
  ${op('#/legacy/payout', 'PAYOUT', 'Payout', 'Send money to a bank account or wallet.')}
  ${op('#/legacy/balance', 'GetBalance', 'Get Balance', 'Your available balance.')}
  ${op('#/legacy/op-get-status', 'GetStatus', 'Get Status', 'The status of one transaction.')}
  ${op('#/legacy/op-get-transaction-list', 'GetTransactionList', 'Get Transaction List', 'Your transactions, for reconciliation.')}
</div>
<h2>Request and response shape</h2>
${code(`{
  "requestType": "PAYIN",
  "data": { "midCode": "<your MID>", "...": "..." }
}`)}
<p>Read <code>success</code> and <code>error[]</code> in every response; each error code is explained, with how to fix it, in <a href="#/legacy/errors">Error codes</a>.</p>
${sourceLink(LF)}`;
};

/* no company pages on this site */
GUIDE_NAV.length = 0;

/* home: route remaining generic guide links to this guide */
(() => { const h = docsHome; docsHome = () => relink(h()); })();
