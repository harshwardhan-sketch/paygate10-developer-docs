/* Self-test for the docs site. tools/check.py runs this page in headless Chrome (through a local web server)
   and reads the JSON it writes into #result. It:
   - opens every page reachable from the menus and from any link (crawl), and checks it lands on the page the link names;
   - records JavaScript errors and Content-Security-Policy violations;
   - flags text that must never appear (old site names, "PG10", "dummy", provider names, internal terms, broken templates);
   - checks in-page jump links, local files linked from pages and images;
   - clicks every tab, picker chip (country / method) and recipe-finder option;
   - checks the hash playground and the Signing page examples against a known SHA-256 / HMAC;
   - runs site search for a few terms;
   - checks phone width (no sideways scroll) on the main pages.
   Edit BANNED below to change what text is not allowed. */
(async () => {
  const BANNED = [
    [/\bPG ?-?10\b/i, 'the name PG10'],
    [/\bdummy\b/i, '"dummy"'],
    [/\.shtml\b|document\.paygate10|document\.payfuture/i, 'a link or name from the old docs sites'],
    [/\bundefined\b|\[object Object\]|\bNaN\b|\$\{/, 'a broken template value'],
    [/\b(TODO|FIXME|lorem ipsum)\b/i, 'placeholder text'],
    [/\b(simpaisa|kashier|korapay|payhub|kinderpay|kpay|payaza|assanpay|paymate|nagupay|dfnn|fawrypay)\b/i, 'a provider name'],
    [/\bIGE?\b|\bigateway\b(?!-[a-z]+\.paygate10\.com)/, 'an internal platform name'], /* igateway-*.paygate10.com are the real public API and checkout hosts */
  ];
  const $ = id => document.getElementById(id);
  const status = t => { $('status').textContent = t; };
  const out = {pages: 0, clicks: 0, problems: [], external: {}};
  const problem = (page, kind, detail) => { if (out.problems.length < 400) out.problems.push({page, kind, detail: String(detail).slice(0, 300)}); };
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const frame = $('site');
  await new Promise(r => { frame.onload = r; frame.src = '../index.html#/'; });
  const W = frame.contentWindow, doc = () => W.document;
  let errs = [];
  W.addEventListener('error', e => errs.push(e.message || String(e)));
  W.addEventListener('unhandledrejection', e => errs.push('unhandled promise: ' + (e.reason && e.reason.message || e.reason)));
  doc().addEventListener('securitypolicyviolation', e => errs.push(`CSP blocked ${e.blockedURI} (${e.violatedDirective})`));
  const ce = W.console.error.bind(W.console); W.console.error = (...a) => { errs.push('console.error: ' + a.join(' ')); ce(...a); };
  const flush = page => { errs.forEach(e => problem(page, 'javascript error', e)); errs = []; };
  for (const g of ['PF_DATA', 'PF_SPEC', 'PF_ERRORS']) if (!W[g]) problem('load', 'missing on load', g + ' (a script failed to load or threw)');
  await new Promise(r => { const sc = doc().createElement('script'); sc.src = '../tools/probe.js?' + Date.now(); sc.onload = r; sc.onerror = () => { problem('load', 'probe', 'tools/probe.js did not load'); r(); }; doc().body.appendChild(sc); });
  const T = W.__T;
  Object.entries(T.types).forEach(([g, t]) => { if (t === 'undefined') problem('load', 'missing on load', g); });
  /* the site must not call anything: record every fetch / XMLHttpRequest */
  const of = W.fetch; W.fetch = (...a) => { errs.push('network call: fetch ' + a[0]); return of.apply(W, a); };
  const oo = W.XMLHttpRequest.prototype.open; W.XMLHttpRequest.prototype.open = function (m, u) { errs.push('network call: XMLHttpRequest ' + u); return oo.apply(this, arguments); };

  /* navigate and wait for the page to finish drawing */
  const go = hash => new Promise(res => {
    let done = false;
    const fin = d => { if (done) return; done = true; doc().removeEventListener('pf:rendered', on); setTimeout(() => res(d), 30); };
    const on = e => fin(e.detail);
    doc().addEventListener('pf:rendered', on);
    if (W.location.hash === hash) W.dispatchEvent(new W.HashChangeEvent('hashchange')); else W.location.hash = hash;
    setTimeout(() => fin(null), 2500);
  });
  const visText = el => (el ? el.innerText : '');
  function scan(page) {
    const main = doc().querySelector('#app main') || doc().getElementById('app');
    const txt = visText(main) + '\n' + visText(doc().querySelector('#app nav.side')) + '\n' + doc().title;
    /* code samples may hold ${...} and similar on purpose: the broken-template check skips <pre> and <code> */
    const clone = main ? main.cloneNode(true) : doc().createElement('div'); clone.querySelectorAll('pre, code').forEach(e => e.remove());
    const prose = clone.textContent;
    BANNED.forEach(([re, what]) => { const t = /template/.test(what) ? prose : txt, m = t.match(re); if (m) problem(page, 'banned text', `${what}: "…${t.slice(Math.max(0, m.index - 50), m.index + 50).replace(/\s+/g, ' ')}…"`); });
    return {main, txt};
  }
  function links(page, main) {
    const found = [];
    doc().querySelectorAll('#app a[href], header a[href]').forEach(a => {
      const h = a.getAttribute('href');
      if (h === '#' || a.dataset.jump) { const t = a.dataset.jump; if (t && !doc().getElementById(t)) problem(page, 'broken jump link', `"${a.textContent.trim()}" → #${t}`); return; }
      if (h.startsWith('#/')) found.push(h.replace(/\/$/, ''));
      else if (h.startsWith('#')) { if (!doc().getElementById(h.slice(1))) problem(page, 'broken anchor', h); }
      else if (/^https?:/i.test(h)) { const u = new URL(h); out.external[u.host] = (out.external[u.host] || 0) + 1; if (/document\.(paygate10|payfuture)|\.shtml/i.test(h)) problem(page, 'old site link', h); }
      else if (/^(mailto|tel):/i.test(h)) { /* fine */ }
      else found.push('FILE:' + h.split('#')[0].split('?')[0]);
    });
    main.querySelectorAll('img').forEach(i => { if (i.complete && !i.naturalWidth) problem(page, 'broken image', i.getAttribute('src')); });
    return found;
  }

  /* 1. crawl: start from the home page, every menu, both API flows and the tool pages */
  const seeds = ['#/', '#/playground', '#/methods', '#/legacy/api-overview', '#/legacy/payin', '#/legacy/payout', '#/legacy/signing', '#/legacy/errors'];
  T.nav('legacy').forEach(([, items]) => items.forEach(([id]) => seeds.push('#/legacy/' + id)));
  const queue = [...new Set(seeds)], seen = new Set(queue), files = new Set();
  while (queue.length && out.pages < 1500) {
    const h = queue.shift();
    status(`page ${out.pages + 1}: ${h} (${queue.length} queued)`);
    const d = await go(h); out.pages++;
    const [, sec, id] = h.split('/');
    if (!d) problem(h, 'did not render', 'no pf:rendered event');
    else if (sec === 'legacy' && id && W.location.hash === h && d.pageId !== id) problem(h, 'link lands on the wrong page', `opened "${d.pageId}" instead of "${id}"`);
    flush(h);
    const {main, txt} = scan(h);
    if (txt.replace(/\s+/g, ' ').length < 150) problem(h, 'almost empty page', txt.slice(0, 120));
    links(h, main).forEach(l => { if (l.startsWith('FILE:')) files.add(l.slice(5)); else if (!seen.has(l)) { seen.add(l); queue.push(l); } });
  }
  /* everything the site loaded: only this site and Google Fonts */
  W.performance.getEntriesByType('resource').forEach(e => { const u = new URL(e.name); if (u.origin !== W.location.origin && !/^fonts\.(googleapis|gstatic)\.com$/.test(u.host)) problem('network', 'loaded from elsewhere', e.name); });
  for (const f of files) { try { const r = await fetch(new URL(f, frame.src).href, {method: 'HEAD'}); if (!r.ok) problem('links', 'missing file', `${f} (${r.status})`); } catch (e) { problem('links', 'missing file', f); } }

  /* 2. interactions: tabs, pickers, recipe finder */
  const clickAll = async (page, sel) => {
    const n = doc().querySelectorAll(sel).length;
    for (let i = 0; i < n; i++) { const el = doc().querySelectorAll(sel)[i]; if (!el) continue; el.click(); out.clicks++; await sleep(15); flush(page + ' · click ' + (el.textContent || '').trim().slice(0, 30)); scan(page + ' · ' + (el.textContent || '').trim().slice(0, 30)); }
  };
  for (const h of [...seen].filter(x => /^#\/(legacy|playground|methods)/.test(x) && !/\/errors\/./.test(x))) {
    await go(h); status('clicking on ' + h);
    await clickAll(h, '#app .tabs button, #app .rp-tabs button, #app .ptabs button, #app [data-ppane-btn]');
  }
  for (const k of ['payin', 'payout']) {
    await go('#/legacy/' + k);
    const nC = doc().querySelectorAll('.pk-c .chip').length;
    for (let c = 0; c < nC; c++) {
      const cc = doc().querySelectorAll('.pk-c .chip')[c]; cc.click(); await sleep(20);
      const country = cc.textContent.trim();
      const nM = doc().querySelectorAll('.pk-m .chip, .pk-m button').length;
      for (let m = 0; m < Math.max(nM, 1); m++) {
        const mc = doc().querySelectorAll('.pk-m .chip, .pk-m button')[m]; if (mc) { mc.click(); await sleep(20); }
        out.clicks++;
        const where = `#/legacy/${k} · ${country} · ${mc ? mc.textContent.trim() : ''}`;
        flush(where); scan(where);
        if (!doc().querySelector('.reqList .prm')) problem(where, 'no parameters shown', '');
        /* India pay-ins send riskData (live docs + merchant chats): it must show as required */
        if (k === 'payin' && /India/.test(country)) {
          const r = [...doc().querySelectorAll('.reqList .prm')].find(p => /^riskData$/i.test((p.querySelector('.prm-n') || {}).textContent || ''));
          if (r && !/Required/.test(r.querySelector('.prm-req')?.textContent || '')) problem(where, 'wrong required flag', 'riskData should be Required for India');
        }
      }
    }
  }
  await go('#/legacy/signing'); status('recipe finder');
  for (let pass = 0; pass < 2; pass++) {
    const sels = doc().querySelectorAll('#app select');
    for (let s = 0; s < sels.length; s++) {
      const n = (doc().querySelectorAll('#app select')[s] || {options: []}).options.length;
      for (let o = 0; o < n; o++) { const el = doc().querySelectorAll('#app select')[s]; if (!el || !el.options[o]) break; el.value = el.options[o].value; el.dispatchEvent(new W.Event('change', {bubbles: true})); out.clicks++; await sleep(10); flush('#/legacy/signing · finder'); scan('#/legacy/signing · finder'); }
    }
    await clickAll('#/legacy/signing', '#app .rp-tabs button');
  }

  /* 3. hashing: the playground and the Signing page examples must match real SHA-256 / HMAC-SHA256 */
  const sha = s => T.sha256(s), hmac = (k, m) => T.hmacSha256(k, m);
  if (sha('abc') !== 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad') problem('hashing', 'sha256 is wrong', sha('abc'));
  if (hmac('key', 'The quick brown fox jumps over the lazy dog') !== 'f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8') problem('hashing', 'HMAC-SHA256 is wrong', '');
  const sigTxt = visText(doc().querySelector('#app main'));
  const exHash = sha('MID123~ORD-0001~100.00~PKR~demo_secret_42'), exSig = hmac('demo_secret_42', '{"requestType":"GetBalance","data":{"midCode":"MID123"}}');
  if (!sigTxt.includes(exHash)) problem('#/legacy/signing', 'worked example hash is wrong', 'expected ' + exHash);
  if (!sigTxt.includes(exSig)) problem('#/legacy/signing', 'worked example signature is wrong', 'expected ' + exSig);
  await go('#/playground');
  const pgTabs = [...doc().querySelectorAll('.pg .tabs button')].map(b => b.textContent.trim());
  if (!/^Signature header/.test(pgTabs[0] || '') || !/^Body hash/.test(pgTabs[1] || '')) problem('#/playground', 'tab order', pgTabs.join(' | '));
  const hm = doc().getElementById('hmOut'), hb = doc().getElementById('hmBody'), hs = doc().getElementById('hmSecret');
  if (hm && hm.textContent !== 'X-Callback-Signature: sha256=' + hmac(hs.value.toLowerCase(), hb.value)) problem('#/playground', 'signature header result is wrong', hm.textContent);
  for (const b of doc().querySelectorAll('#pgGroups .chip')) {
    b.click(); await sleep(15);
    for (const r of doc().querySelectorAll('#pgRecipes .chip')) {
      r.click(); await sleep(10); out.clicks++;
      /* rebuild the string from the recipe and the inputs, independently of the playground's own code */
      const f = doc().getElementById('pgFormula').textContent, inner = (f.match(/SHA256\((.*)\)/i) || [])[1] || '';
      const sep = inner.includes('~') ? '~' : '', secret = doc().getElementById('pgSecret').value.toLowerCase();
      const val = t => /secret/i.test(t) ? secret : (doc().querySelector(`#pgFields [data-tok="${t}"]`) || {}).value;
      const parts = inner.split(/\s*[~+]\s*|\s+/).map(t => t.trim()).filter(Boolean), vals = parts.map(val);
      const h = doc().getElementById('pgHash').textContent, want = sha(vals.join(sep));
      if (vals.some(v => v === undefined)) problem('#/playground · ' + r.textContent.trim(), 'recipe field without an input', parts.filter((t, i) => vals[i] === undefined).join(', '));
      else if (h !== want) problem('#/playground · ' + r.textContent.trim(), 'body hash result is wrong', `${vals.join(sep)} should give ${want}, shows ${h}`);
    }
  }
  flush('#/playground');

  /* 4. search */
  for (const term of ['11031', 'payout', 'signature', 'riskData', 'India']) {
    W.openSearch(term); await sleep(60);
    const n = doc().querySelectorAll('#smRes a, #smRes [role="option"], #smRes li').length;
    if (!n) problem('search', 'no results', term);
    doc().getElementById('smClose').click(); flush('search · ' + term);
  }

  /* 5. phone width: nothing may scroll sideways */
  frame.style.width = '390px'; await sleep(100);
  for (const h of ['#/', '#/legacy/api-overview', '#/legacy/payin', '#/legacy/payout', '#/legacy/signing', '#/legacy/errors', '#/legacy/op-get-status', '#/playground', '#/legacy/quickstart-payin']) {
    await go(h); await sleep(50);
    const se = doc().scrollingElement;
    if (se.scrollWidth > se.clientWidth + 2) problem(h + ' (phone)', 'sideways scroll on a phone', `${se.scrollWidth}px wide in a ${se.clientWidth}px screen`);
    flush(h + ' (phone)');
  }
  frame.style.width = '1280px';

  flush('end');
  status(`done: ${out.pages} pages, ${out.clicks} clicks, ${out.problems.length} problems`);
  $('result').textContent = JSON.stringify(out);
  document.title = 'DONE';
})().catch(e => { document.getElementById('result').textContent = JSON.stringify({fatal: e.stack || String(e)}); document.title = 'DONE'; });
