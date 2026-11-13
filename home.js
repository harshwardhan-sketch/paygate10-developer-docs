/* Docs home + "Payment flows" explainers (pay-in flows, payout flows).
   Loaded last: overrides docsHome() and adds a "Payment flows" nav group. */

/* ---------- sequence diagram (inline SVG, theme-aware) ---------- */
let seqN = 0;
function seq(lanes, msgs, title) {
  const id = 'arw' + (++seqN), W = 760, top = 64, step = 46;
  const x = i => 70 + i * ((W - 140) / (lanes.length - 1));
  const H = top + msgs.length * step + 24;
  const rows = msgs.map(([a, b, label, kind], i) => {
    const y = top + 26 + i * step;
    if (a === b) return `<rect class="seq-note" x="${x(a) - 92}" y="${y - 15}" width="184" height="26" rx="6"/><text class="seq-t" x="${x(a)}" y="${y + 3}" text-anchor="middle">${label}</text>`;
    const x1 = x(a), x2 = x(b), mid = (x1 + x2) / 2;
    return `<line class="seq-msg ${kind || ''}" x1="${x1}" y1="${y}" x2="${x2 + (x2 > x1 ? -6 : 6)}" y2="${y}" marker-end="url(#${id})"/>
      <text class="seq-t" x="${mid}" y="${y - 7}" text-anchor="middle">${i + 1}. ${label}</text>`;
  }).join('');
  return `<svg class="flowsvg seq" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(title || 'Sequence diagram')}">
  <defs><marker id="${id}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="seq-head" d="M0 0L10 5L0 10z"/></marker></defs>
  ${lanes.map((l, i) => `<rect class="${i === 1 ? 'acc' : 'box'}" x="${x(i) - 70}" y="8" width="140" height="36" rx="9"/><text x="${x(i)}" y="31" text-anchor="middle">${l}</text>
  <line class="seq-life" x1="${x(i)}" y1="44" x2="${x(i)}" y2="${H - 8}"/>`).join('')}
  ${rows}</svg>`;
}

const ERR = re => { const e = errorBy('legacy', re); return e ? `<code>${e.ErrorCode}</code> ${esc(e.ErrorMessage)}` : ''; };

/* ---------- Pay-in flows ---------- */
G['payin-flows'] = () => `<h1>Pay-in flows</h1>
<p class="lead">A pay-in collects money from your customer into your balance. You send one <code>PAYIN</code> request; how the customer completes it depends on the flow you choose and the payment method.</p>
<div class="grid2">
  <a class="tile" href="#pf-hosted" data-jump="pf-hosted"><span class="tag">PG_H</span><b>Hosted checkout</b><span>We host the payment page. One request, one redirect — fastest to build, works for every market.</span></a>
  <a class="tile" href="#pf-seamless" data-jump="pf-seamless"><span class="tag">S</span><b>Seamless (server-to-server)</b><span>You collect the details in your own UI. The customer completes the payment in their wallet, bank or card flow.</span></a>
</div>

<h2 id="pf-hosted">Hosted checkout flow</h2>
<p>Send <code>integrationType: "PG_H"</code>. We return a <code>checkout_url</code>; the customer chooses a method on our page and pays. You never handle card or wallet details.</p>
${seq(['Customer', 'Your server', 'Paygate10', 'Bank / wallet'], [
  [0, 1, 'Clicks “Pay”'],
  [1, 2, 'PAYIN (PG_H) + hash'],
  [2, 1, 'checkout_url, status INITIATED', 'res'],
  [1, 0, 'Redirect to checkout_url', 'res'],
  [0, 2, 'Picks method and pays'],
  [2, 3, 'Process payment'],
  [3, 2, 'Result', 'res'],
  [2, 0, 'Redirect to your returnUrl', 'res'],
  [2, 1, 'Callback: APPROVED / DECLINED', 'res'],
], 'Hosted pay-in sequence')}
<ul>
<li><b>Required:</b> <code>returnUrl</code> and <code>notificationUrl</code> in <code>merchantUrl</code>.</li>
<li><b>Hash:</b> one recipe for every hosted pay-in — <code>SHA256(midcode~merchantrefno~amount~currency~midsecret)</code>.</li>
<li><b>The return is not proof of payment.</b> Fulfil only on the callback (or a <code>GetStatus</code> that says <code>APPROVED</code>).</li>
<li>Create a new checkout link for each attempt — don't reuse old links.</li>
</ul>

<h2 id="pf-seamless">Seamless flows</h2>
<p>Send <code>integrationType: "S"</code> with a <code>paymentMethod</code> code and <code>paymMethodFields</code>. What happens next depends on the method:</p>
${seq(['Customer', 'Your server', 'Paygate10', 'Bank / wallet'], [
  [0, 1, 'Enters wallet / UPI / card details'],
  [1, 2, 'PAYIN (S) + method fields + hash'],
  [2, 3, 'Request payment'],
  [2, 1, 'status PENDING (+ instructions)', 'res'],
  [3, 0, 'Approval prompt / OTP / QR', 'res'],
  [0, 3, 'Approves in app or bank'],
  [3, 2, 'Result', 'res'],
  [2, 1, 'Callback: APPROVED / DECLINED', 'res'],
], 'Seamless pay-in sequence')}
${table(['Flow', 'Where', 'Code', 'What you send', 'What the customer does', 'What you show'], [
  ['<b>Wallet push</b>', '🇵🇰 Pakistan · 🇪🇬 Egypt · 🇲🇦 Morocco', '<code>EP</code> Easypaisa, <code>JC</code> JazzCash, <code>WT</code> wallet', 'Wallet number (PK: 11 digits, 03…; EG: 010/011/012/015…)', 'Approves the request in their wallet app', '“Approve the payment in your wallet app”'],
  ['<b>UPI</b>', '🇮🇳 India', 'UPI / UPIQRCode', 'VPA (UPI ID) — or nothing for a QR', 'Approves in any UPI app, or scans the QR', 'The QR from <code>checkout_html</code>, or a waiting screen'],
  ['<b>Card</b>', '🇳🇬 Nigeria', '<code>CARD</code>', 'Card type, holder, number, expiry, CVV', 'May enter a PIN / OTP or complete 3-D Secure', 'Follow <code>authMode</code>: <a href="#/legacy/op-verify-pin">VerifyPin</a>, <a href="#/legacy/op-verify-otp">VerifyOtp</a>, …'],
  ['<b>Bank deposit</b>', '🇳🇬 Nigeria', '<code>BD</code>', 'Payer details', 'Transfers to the account you show, before it expires', 'Account details from <code>detailData</code> (number, name, bank, amount, expiry)'],
  ['<b>Bank transfer</b>', '🇲🇦 Morocco', '<code>BT</code>', 'Account number (24 digits), bank code (MOBTD…), name', 'Pays from their bank', 'Payment instructions; <code>customField2</code> must carry a Base64 proof image'],
])}
<div class="callout warn"><p><b>Cards:</b> sending card data to your servers puts you in PCI DSS scope. If you are not PCI compliant, use hosted checkout.</p></div>

<h2>Statuses you will see</h2>
${LIFECYCLE_SVG}
${table(['Status', 'Meaning', 'Your action'], [
  ['<code>INITIATED</code>', 'Created; customer has not paid yet', 'Wait'],
  ['<code>PENDING</code>', 'With the bank / wallet, or awaiting the customer', 'Wait for the callback; poll <code>GetStatus</code> if it is late'],
  ['<code>APPROVED</code>', 'Paid — final', 'Fulfil the order'],
  ['<code>DECLINED</code>', 'Failed, cancelled or expired — final', 'Show the reason; let the customer retry with a new <code>merchantRefNo</code>'],
])}

<h2>After the pay-in</h2>
<div class="grid3">
  <a class="tile" href="#/guide/callbacks"><b>Callbacks →</b><span>Verify the hash, reply HTTP 200, handle duplicates.</span></a>
  <a class="tile" href="#/guide/reconciliation"><b>Settlement &amp; reconciliation →</b><span>Net settlement to your balance (e.g. INR T+5, PKR T+1, NGN T+3).</span></a>
</div>
<h2>Build it</h2>
<div class="grid3">
  <a class="tile" href="#/guide/quickstart-payin"><span class="tag">Start</span><b>Quickstart: first pay-in →</b><span>Hosted, five steps.</span></a>
  <a class="tile" href="#/methods"><span class="tag">Methods</span><b>Payment methods →</b><span>Limits, settlement, demos and videos.</span></a>
  <a class="tile" href="#/legacy/payin"><span class="tag">API</span><b>Payin reference →</b><span>Every field and real example.</span></a>
</div>`;

/* nav: "Payment flows" group right after Overview */
(() => {
  const i = GUIDE_NAV.findIndex(g => g[0] === 'Overview');
  GUIDE_NAV.splice(i + 1, 0, ['Payment flows', [['payin-flows', 'Pay-in flows'], ['payout-flows', 'Payout flows']]]);
})();

/* ---------- docs home ---------- */
docsHome = function () {
  return `
<section class="home-hero">
  <div class="home-hero-text">
    <span class="home-kicker">Paygate10 Developer Docs</span>
    <h1>Payments for emerging markets, through one API</h1>
    <p>Accept local payment methods and send payouts across South Asia, Africa, the Middle East and South-East Asia with the Paygate10 Gateway — with guides, real examples and tools for every step.</p>
    <div class="home-ctas">
      <a class="btn btn-yellow" href="#/legacy/start">Start integrating</a>
      <a class="btn btn-ghost" href="#/legacy/api-overview">API reference</a>
    </div>
    <ul class="hero-facts">
      <li>One API for pay-ins, payouts, status and balance</li>
      <li>A callback with the final status of every transaction</li>
      <li>Every error code explained, with how to fix it</li>
    </ul>
  </div>
  <div class="hero-flow" aria-label="How a payment flows"><span class="hero-flow-t">How a payment flows</span>
    <div class="hf-tabs" role="tablist" aria-label="Flow"><button type="button" role="tab" class="on" aria-selected="true" data-hf="in">Pay-in</button><button type="button" role="tab" aria-selected="false" data-hf="out">Payout</button></div>
    <ol data-hf-pane="in"><li><span class="hf-n">1</span><span><b>You send a pay-in request</b><small>Amount, customer and method, signed with your MID secret</small></span></li><li><span class="hf-n">2</span><span><b>The customer pays</b><small>On our hosted page, or in your own flow (wallet, UPI, bank or card)</small></span></li><li><span class="hf-n">3</span><span><b>We confirm the payment</b><small>With the local payment network</small></span></li><li class="done"><span class="hf-n">✓</span><span><b>You get the final status</b><small>In a callback; the amount reaches your balance</small></span></li></ol>
    <ol data-hf-pane="out" hidden><li><span class="hf-n">1</span><span><b>Your balance is funded</b><small>From your settled pay-ins</small></span></li><li><span class="hf-n">2</span><span><b>You send a payout request</b><small>Beneficiary bank account or wallet, signed with your MID secret</small></span></li><li><span class="hf-n">3</span><span><b>We pay the beneficiary</b><small>Through the local payment network</small></span></li><li class="done"><span class="hf-n">✓</span><span><b>You get the final status</b><small>In a callback to your notificationUrl</small></span></li></ol></div>
</section>

<section class="home-sec">
  <h2>Accept and send payments</h2>
  <p class="home-sub">Start with the flow — each page explains how it works, what you send, what your customer sees and what you get back.</p>
  <div class="home-do">
    <a class="home-do-card" href="#/legacy/payin-flows"><div><span class="tag">Pay-ins</span><b>Collect payments</b><span>Hosted checkout or seamless: wallets, UPI, cards, bank transfer and deposits — and how each flow completes.</span><em>Explore pay-in flows →</em></div></a>
    <a class="home-do-card" href="#/legacy/payout-flows"><div><span class="tag">Payouts</span><b>Send payouts</b><span>Bank, net banking and wallet payouts from your balance — statuses and why payouts get rejected.</span><em>Explore payout flows →</em></div></a>
  </div>
</section>

<section class="home-sec">
  <h2>From kickoff to live in five stages</h2>
  <div class="home-stages">${[
    ['1', 'Before you start', 'Details, IP whitelisting, credentials', 'stage-1'],
    ['2', 'Build', 'Requests, hashes, callbacks', 'build-rules'],
    ['3', 'Test', '14 test cases on LPL', 'testing'],
    ['4', 'Sign-off', 'QA, finance and both teams', 'go-live'],
    ['5', 'Go live', 'New LP MID, first live payment', 'production'],
  ].map(([n, t, d, id]) => `<a href="#/legacy/${id}"><span class="home-num">${n}</span><b>${t}</b><span>${d}</span></a>`).join('')}</div>
</section>


<section class="home-sec">
  <h2>Live markets</h2>
  <p class="home-sub">Pick a market for its payment methods, limits, a live checkout demo and an end-to-end video.</p>
  ${liveFlags()}
  <p class="home-sub"><a href="#/methods">Explore payment methods →</a></p>
</section>

<section class="home-sec">
  <h2>Jump into the API reference</h2>
  <div class="ql-grid"><a class="ql" href="#/legacy/payin"><b>Payin</b><span>Collect a payment</span></a><a class="ql" href="#/legacy/payout"><b>Payout</b><span>Send money to a bank account or wallet</span></a><a class="ql" href="#/legacy/signing"><b>Signing &amp; hashes</b><span>How to sign, and the recipe for every request</span></a><a class="ql" href="#/legacy/api-callbacks"><b>Callbacks</b><span>What we send to your notificationUrl</span></a><a class="ql" href="#/legacy/op-get-status"><b>Get Status</b><span>Check one transaction</span></a><a class="ql" href="#/legacy/balance"><b>Get Balance</b><span>Your available balance</span></a><a class="ql" href="#/legacy/errors"><b>Error codes</b><span>Each one with how to fix it</span></a><a class="ql" href="#/playground"><b>Hash playground</b><span>Find out why a hash does not match</span></a></div>
</section>

<section class="home-help">
  <div><h2>Need help?</h2><p>Reach out to us on your integration channel, on the platform agreed at onboarding.</p></div>
  <a class="btn btn-yellow help-cta" href="#/legacy/support">Contact Support</a>
</section>
<footer class="home-foot"><span>Paygate10 Developer Docs</span></footer>`;
};

/* home: switch the "How a payment flows" card between pay-in and payout */
document.addEventListener('click', e => {
  const b = e.target.closest('[data-hf]'); if (!b) return;
  const card = b.closest('.hero-flow');
  card.querySelectorAll('[data-hf]').forEach(x => { const on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-selected', on); });
  card.querySelectorAll('[data-hf-pane]').forEach(p => { p.hidden = p.dataset.hfPane !== b.dataset.hf; });
});
