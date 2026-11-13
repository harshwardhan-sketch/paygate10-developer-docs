/* Payment methods tab (#/methods): Gaming / Forex / P2P. Industry → stage (pay-ins, payouts,
   settlements) → country → method, with specs, a live checkout demo (demos/) and end-to-end videos.
   Specs come from PD (assets/product-data.js, cleaned in guide.js). */
const PM = (() => {
  const COUNTRY = {IN: ['India', '🇮🇳', 'INR'], PK: ['Pakistan', '🇵🇰', 'PKR'], EG: ['Egypt', '🇪🇬', 'EGP'], NG: ['Nigeria', '🇳🇬', 'NGN'], MA: ['Morocco', '🇲🇦', 'MAD'], PH: ['Philippines', '🇵🇭', 'PHP']};
  const ORDER = ['IN', 'PK', 'EG', 'NG', 'MA', 'PH'];
  /* Egypt: not offered for Gaming; India: not offered for Forex; P2P: Egypt only */
  const INDUSTRY = {
    Gaming: {blurb: 'Deposits and withdrawals for gaming and betting platforms.', countries: ORDER.filter(c => c !== 'EG')},
    Forex: {blurb: 'Funding and withdrawals for forex and trading platforms.', countries: ORDER.filter(c => c !== 'IN')},
    P2P: {blurb: 'Peer-to-peer collection with proof-of-payment upload.', countries: ['EG'], p2p: true},
  };
  /* seamless paymentMethod codes from the live API docs (document.paygate10.com) */
  const CODE = {'PK|Easypaisa': 'EP', 'PK|JazzCash': 'JC', 'EG|Wallet': 'WT', 'NG|Bank Deposit': 'BD', 'MA|Wallet': 'WT', 'MA|Bank Transfer': 'BT'};
  const STAGES = [
    ['payins', 'Stage 01 · Accept', 'Pay-ins', 'Accept payments across emerging markets using local payment methods your customers already trust.'],
    ['payouts', 'Stage 02 · Disburse', 'Payouts', 'Send fast, secure, localised payouts to customers, sellers, partners and vendors across emerging markets.'],
    ['settlements', 'Stage 03 · Repatriate', 'Settlements', 'Withdraw your available balance.'],
  ];
  const PAYOUT_STEPS = [
    ['Payout request', 'You submit a payout request through the Payout API with the mandatory fields.'],
    ['Validation and processing', 'We validate the request and prepare it for the local payout network.'],
    ['Submission', 'The payout is securely forwarded to the local network for processing.'],
    ['Processing and result', 'Once processed, we receive the payout status and relevant details.'],
    ['Your notification', 'We send the final payout status to your callback URL, so you get real-time updates.'],
  ];
  const SETTLE_STEPS = [
    ['Transaction approval', 'Once a pay-in is approved, applicable fees, refunds and chargebacks are deducted to calculate the net settlement amount.'],
    ['Balance aggregation', 'The net amount is reflected in your available balance in near real time.'],
    ['Withdrawal request', 'You view your available balance and request a transfer to your settlement account from the back office.'],
    ['Processing', 'The settlement request is processed, with funds typically available within minutes, depending on the market.'],
    ['Confirmation and reporting', 'A record of every settlement is available in real time, with balance and transaction history on demand.'],
  ];
  const st = {ind: 'Gaming', stage: 'payins', cc: 'IN', open: 0, demo: false};

  const methodsFor = (cc, ind) => (INDUSTRY[ind].p2p && PD.payinMethodsP2P[cc]) || PD.payinMethods[cc] || [];
  const steps = list => `<ol class="pm-steps">${list.map(([t, d], i) => `<li><span class="pm-num">${i + 1}</span><div><b>${t}</b> · ${d}</div></li>`).join('')}</ol>`;
  const demoSrc = (cc, m) => m.demoSrc ? 'demos/' + m.demoSrc : m.demoTarget ? `demos/checkout-flow/index.html?country=${cc}&method=${m.demoTarget}` : '';

  function card(cc, m, i) {
    const c = m.cap || {}, open = st.open === i, code = CODE[cc + '|' + m.name];
    const rows = [['Speed', c.speed], ['Currency', c.currency], ['Integration', c.integrationType], ['Channels', c.channels], ['Fields required', c.fieldsRequired],
      ['Deposit limits', c.depositLimits], ['Min per transaction', c.minTx], ['Max per transaction', c.maxTx], ['Settlement', c.settlement], ['Fees', c.fees], ['FX', c.fx], ['Highlights', c.notes]].filter(r => r[1]);
    const src = demoSrc(cc, m);
    return `<div class="pm-m${open ? ' open' : ''}">
  <button type="button" class="pm-mh" data-m="${i}" aria-expanded="${open}"><span><b>${esc(m.name)}</b><small>${esc(m.sub || '')}</small></span><span class="pm-chev" aria-hidden="true"></span></button>
  ${open ? `<div class="pm-mb">
    <dl class="pm-cap">${rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
    <p class="pm-limit">${LIMITS_NOTE}</p>
    <p class="pm-dev"><b>For developers:</b> ${code ? `seamless <code>paymentMethod: "${code}"</code>, or hosted checkout with no code.` : 'use hosted checkout; the customer picks this method on the payment page.'} <a href="#/legacy/payin">Payin API →</a></p>
    ${m.journey && m.journey.length ? `<div class="pm-vids">${m.journey.map(j => `<a class="pm-vid" href="${j.url}" target="_blank" rel="noopener"><span class="pm-play" aria-hidden="true">▶</span>${esc(j.label)}</a>`).join('')}</div>` : ''}
    ${src ? (st.demo ? `<div class="pm-demo"><iframe src="${src}" title="Payment demo: ${esc(m.name)}" loading="lazy"></iframe></div>` : `<button type="button" class="btn btn-yellow pm-show">Show demo</button>`) : '<p class="src">A live demo is not available for this method yet.</p>'}
  </div>` : ''}
</div>`;
  }

  function payins() {
    const I = INDUSTRY[st.ind];
    if (!I.countries.includes(st.cc)) st.cc = I.countries[0];
    const list = methodsFor(st.cc, st.ind);
    return `<div class="pm-cc" role="group" aria-label="Country">${I.countries.map(cc => `<button type="button" class="chip${cc === st.cc ? ' on' : ''}" data-cc="${cc}">${COUNTRY[cc][1]} ${COUNTRY[cc][0]}</button>`).join('')}</div>
<div class="pm-list">${list.map((m, i) => card(st.cc, m, i)).join('')}</div>
${st.cc === 'IN' ? `<div class="callout pm-upi"><p><b>One request covers both.</b> Hosted checkout shows the QR on desktop and the <i>Pay with App</i> button on mobile, chosen from the customer's device. Open the checkout link on the device the customer pays with.</p></div>` : ''}`;
  }
  function payouts() {
    const names = INDUSTRY[st.ind].countries.map(c => COUNTRY[c][0]);
    const rows = (PD.payoutSpecsTable || []).filter(r => names.includes(r.market));
    return `${steps(PAYOUT_STEPS)}
<h4>Payout specifications</h4>
${table(['Market', 'Method', 'Integration', 'Min', 'Max', 'Settlement', 'Fields required'], rows.map(r => [r.market, esc(r.method), r.integration, r.min, r.max, r.settlement, esc(r.fieldsRequired)]))}
<p class="pm-limit">${LIMITS_NOTE}</p>
<p class="pm-dev"><b>For developers:</b> field rules per country are in <a href="#/legacy/payouts-guide">Payouts &amp; funding</a>; every field is in the <a href="#/legacy/payout">Payout API</a>.</p>`;
  }
  function settlements() {
    return `<div class="callout"><p>Currently available for INR (T+5), PKR (T+1) and NGN (T+3).</p></div>
<p>Withdraw your available balance, after applicable fees, refunds and chargebacks are deducted, into your own account. Funds are typically available shortly after approval.</p>
${steps(SETTLE_STEPS)}
<p class="pm-dev"><b>For developers:</b> check balances with <a href="#/legacy/balance">Get Balance</a> and reconcile with <a href="#/legacy/reconciliation">Balance &amp; reconciliation</a>.</p>`;
  }
  const BODY = {payins, payouts, settlements};

  function body() {
    return `<div class="pm-ind" role="group" aria-label="Industry">${Object.keys(INDUSTRY).map(k => `<button type="button" class="chip${k === st.ind ? ' on' : ''}" data-ind="${k}">${k}</button>`).join('')}</div>
<p class="pm-flow"><b>${st.ind}</b> · ${INDUSTRY[st.ind].blurb} Collect → pay out → settle.</p>
${STAGES.map(([k, no, label, blurb]) => `<section class="pm-stage${st.stage === k ? ' open' : ''}" id="pm-${k}">
  <button type="button" class="pm-sh" data-stage="${k}" aria-expanded="${st.stage === k}"><span><small>${no}</small><b>${label}</b><span>${blurb}</span></span><span class="pm-chev" aria-hidden="true"></span></button>
  ${st.stage === k ? `<div class="pm-sb">${BODY[k]()}</div>` : ''}
</section>`).join('')}`;
  }

  const page = () => `<h1>Payment methods</h1>
<p class="lead">What you can accept, pay out and settle in each live market. Open a pay-in method for its limits, a live checkout demo and an end-to-end video.</p>
<div class="callout warn"><p><b>Limits can change.</b> ${LIMITS_NOTE}</p></div>
<div id="pm">${body()}</div>
`;

  /* static version for site search: every country and method as headings */
  const indexHtml = () => `<h1>Payment methods</h1><p>Pay-ins, payouts and settlements by industry (Gaming, Forex, P2P) and country, with live demos and end-to-end videos.</p>
${ORDER.map(cc => `<h2>${COUNTRY[cc][0]} pay-in methods</h2><p>${(PD.payinMethods[cc] || []).concat(PD.payinMethodsP2P[cc] || []).map(m => `${esc(m.name)} (${esc(m.sub || '')}, ${esc((m.cap || {}).minTx || '')} to ${esc((m.cap || {}).maxTx || '')}, settlement ${esc((m.cap || {}).settlement || '')})`).join('; ')}</p>`).join('')}
<h2>Payouts</h2><p>${(PD.payoutSpecsTable || []).map(r => `${r.market} ${esc(r.method)} ${r.min} to ${r.max}`).join('; ')}</p>
<h2>Settlements</h2><p>Withdraw your available balance; INR T+5, PKR T+1, NGN T+3.</p>`;

  const redraw = () => { const el = document.getElementById('pm'); if (el) el.innerHTML = body(); };
  document.addEventListener('click', e => {
    if (!e.target.closest('#pm')) return;
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.ind) { st.ind = b.dataset.ind; st.open = 0; st.demo = false; }
    else if (b.dataset.stage) st.stage = st.stage === b.dataset.stage ? null : b.dataset.stage;
    else if (b.dataset.cc) { st.cc = b.dataset.cc; st.open = 0; st.demo = false; }
    else if (b.dataset.m) { const i = +b.dataset.m; st.open = st.open === i ? null : i; st.demo = false; }
    else if (b.classList.contains('pm-show')) st.demo = true;
    else return;
    redraw();
  });
  /* the demo pages report their content height */
  addEventListener('message', e => {
    if (e.origin !== location.origin && location.origin !== 'null') return;
    if (e.data && e.data.source === 'checkout-demo' && typeof e.data.height === 'number')
      document.querySelectorAll('.pm-demo iframe').forEach(f => { f.style.height = Math.min(1400, e.data.height + 4) + 'px'; });
  });
  return {page, indexHtml, state: st, COUNTRY, INDUSTRY};
})();
