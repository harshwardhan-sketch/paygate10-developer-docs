/* API reference pages in one layout (left: explanation; right: sticky code), for every operation:
   Payout, Payin, Refund, Get Balance and the utility calls (Get Status, quotes, verifications, Get Transaction List).
   - left: title, endpoint bar, a country + method picker (requests with several methods),
     one parameter card with Request / Response buttons; nested objects fold under their parent,
     paymMethodFields follows the picked method, hash shows the picked recipe;
   - right: Request panel (cURL, Node.js, Python, PHP, JSON) and Response panel (success / error), with line numbers.
   Hash recipes and callbacks are not repeated per operation: they have their own pages (Signing & hashes, Callbacks),
   placed before the requests in the menu because a request needs both.
   Content comes only from the live API docs (data.js, document.paygate10.com). A picked method is kept in the URL (#/legacy/payout/<method>).
   Uses helpers from app.js (esc, hl, norm, strip, pretty, page, fixLinks, renderBlocks, steps). */
const API2 = (() => {
  const STOP = new Set(['for', 'and', 'seamless', 'hosted', 'the', 'object']);
  const toks = s => new Set(norm(s).split(' ').filter(w => w && !STOP.has(w)));
  const overlap = (a, b) => [...toks(a)].filter(w => toks(b).has(w)).length;
  const countryOf = t => (strip(t).match(/\(([^)]+)\)\s*$/) || [])[1] || '';
  const nameOf = t => strip(t).replace(/^\s*(for|seamless|hosted)\s+/i, '').replace(/\s*\([^)]*\)\s*$/, '').trim();
  const slug = s => norm(s).replace(/ /g, '-');
  const FLAG = {India: '🇮🇳', Pakistan: '🇵🇰', Egypt: '🇪🇬', Nigeria: '🇳🇬', Philippines: '🇵🇭', Morocco: '🇲🇦', Bangladesh: '🇧🇩'};
  const STATUS_TXT = {live: 'Live', soon: 'API ready · testing', doc: 'In the docs · ask your contact'};
  const json = raw => { try { return JSON.parse(raw); } catch (_) { return null; } };
  const dataOf = raw => { const r = json(raw) || {}; return r.data || r.Data || {}; };
  const sec = (d, id) => d.sections.find(s => s.id === id);
  const LABEL = {payout: 'Payout', payin: 'Payin', refund: 'Refund'};
  const pageKey = {payout: 'payout', payin: 'index', refund: 'refund'};

  /* ---------- reading the imported docs ---------- */
  const rowOf = (b, r) => {
    const H = b.head.map(h => h.toLowerCase()), at = re => H.findIndex(h => re.test(h));
    const [ti, li, mi, di] = [at(/type/), at(/length/), at(/mandatory|required/), at(/description/)];
    const m = strip(r[mi] || '').trim();
    return {name: strip(r[0]).trim(), type: strip(r[ti] || ''), len: strip(r[li] || ''), req: /^yes/i.test(m) ? 'yes' : /^conditional/i.test(m) ? 'cond' : 'no',
      cond: /^conditional/i.test(m) ? m.replace(/^conditional\s*/i, '').replace(/find mandatory\s*\/\s*optional in example request\.?/i, '').trim() : '', desc: fixLinks(r[di] || '')};
  };
  function tablesIn(blocks) {
    const out = []; let title = '';
    (blocks || []).forEach(b => {
      if (b.kind === 'h3' || b.kind === 'h4') title = strip(b.html);
      if (b.kind === 'table') out.push({title, rows: b.rows.map(r => rowOf(b, r))});
    });
    return out;
  }
  const tablesOf = s => tablesIn(s ? s.blocks : []);
  function recipesIn(blocks) {
    const out = []; let h = '', group = '';
    (blocks || []).forEach(b => {
      if (b.kind === 'h3') { group = strip(b.html); h = ''; }
      if (b.kind === 'h4') h = strip(b.html);
      if (b.kind === 'pre' && /^SHA256/i.test(strip(b.html).trim())) out.push({group, title: h || group, formula: strip(b.html).trim()});
    });
    return out;
  }
  const recipesOf = d => recipesIn((sec(d, 'hash-generation') || {}).blocks);
  /* a utility section ("Others" page) split into its phases: intro, request, response, hash */
  function splitOp(s) {
    const ph = {intro: [], req: [], res: [], hash: []}; let p = 'intro';
    s.blocks.forEach(b => {
      const t = b.kind === 'h3' ? norm(b.html) : '';
      if (t === 'request body') { p = 'req'; return; }
      if (t === 'response body') { p = 'res'; return; }
      if (t === 'hash generation') { p = 'hash'; return; }
      ph[p].push(b);
    });
    return ph;
  }

  /* ---------- operation specs ---------- */
  function exampleOptions(d, examples) {
    const pm = tablesOf(sec(d, 'payment-methods'));
    const recipes = recipesOf(d).filter(r => /request/i.test(r.group));
    const best = (list, name, country) => list.filter(t => !countryOf(t.title) || countryOf(t.title) === country)
      .map(t => [overlap(t.title, name) + (countryOf(t.title) ? 0.5 : 0), t]).filter(([s]) => s >= 1).sort((a, b) => b[0] - a[0]).map(x => x[1])[0];
    return examples.map(e => {
      const country = countryOf(e.title), hosted = /^\s*hosted/i.test(e.title), name = nameOf(e.title), dd = dataOf(e.request);
      return {id: slug(e.title), title: strip(e.title), country, hosted, name, ex: e,
        fields: hosted ? null : best(pm, name, country) || null,
        recipe: hosted ? recipes.find(r => /hosted/i.test(r.title)) : best(recipes.filter(r => !/hosted/i.test(r.title)), name, country) || (recipes.length === 1 ? recipes[0] : null),
        method: dd.paymentMethod || dd.PaymentMethod || '', ccy: dd.currency || dd.Currency || '', cc: dd.country || dd.Country || ''};
    });
  }
  function specFromPage(flow, key) {
    const [p, title, path] = API_PAGES[key], d = page(flow, p);
    const req = tablesOf(sec(d, 'request-body')), res = tablesOf(sec(d, 'response-body'));
    const intro = sec(d, 'introduction'), ex = d.examples || [];
    return {key, title, d, source: path === './' ? '' : path,
      lead: intro ? strip(intro.blocks.map(b => b.html || '').join(' ')) : '',
      req: req[0], reqNested: req.slice(1).concat(tablesOf(sec(d, 'nested-objects'))),
      res: res[0], resNested: res.slice(1),
      opts: exampleOptions(d, ex), picker: ex.length > 1 && ex.some(e => countryOf(e.title)),
      notes: [], recipe: recipesOf(d).find(r => /request/i.test(r.group)) || null};
  }
  function specFromOp(flow, opId) {
    const d = page(flow, 'other'), s = sec(d, opId), ph = splitOp(s);
    const common = {req: tablesOf(sec(d, 'request-body')), res: tablesOf(sec(d, 'response-body'))};
    const ex = (d.examples || []).filter(e => norm(e.title).startsWith(norm(s.title)));
    const recipe = recipesIn(ph.hash).find(r => /request/i.test(r.group)) || recipesIn(ph.hash)[0] || null;
    const ps = ph.intro.filter(b => b.kind === 'p').map(b => strip(b.html)).filter(t => !/^Request, Response and Callback structure/i.test(t));
    const notes = [...ph.req, ...ph.res].filter(b => b.kind === 'p' || b.kind === 'ul').concat(ph.hash.filter(b => b.kind === 'ul'));
    return {key: 'op-' + opId, title: s.title, d, source: 'other.shtml', lead: ps.join(' ') || `The ${s.title} request.`,
      req: common.req[0], reqNested: tablesIn(ph.req).concat(common.req.slice(1)),
      res: common.res[0], resNested: tablesIn(ph.res).concat(common.res.slice(1)),
      opts: ex.map(e => ({id: slug(e.title), title: strip(e.title), ex: e, recipe})), picker: false, notes, recipe};
  }

  /* ---------- parameters ---------- */
  const EXTRA = {
    notificationUrl: ' <a class="prm-link" href="#/legacy/api-callbacks">What we send to this URL →</a>',
    hash: ' <span class="hashSlot"></span>',
    signature: ' <span class="hashSlot"></span>', /* Get Transaction List signs with a "signature" field */
  };
  const baseName = t => norm(t).replace(/^nested object /, '').replace(/ object( parameters| structure)?$/, '').replace(/ .*$/, '');
  /* ---------- per-country status of a field (fieldrules.js) ---------- */
  const ruleOf = (S, o) => (o && typeof FIELD_RULES !== 'undefined' && FIELD_RULES[`${S.key}|${o.country}|${o.hosted ? 'H' : o.method}`]) || null;
  const lc = s => String(s).toLowerCase();
  /* value at a data path in the picked example, ignoring key case (some examples use MidCode, UserInfo, ...) */
  const valAt = (obj, path) => path.split('.').reduce((v, k) => v && typeof v === 'object' ? v[Object.keys(v).find(x => lc(x) === lc(k))] : undefined, obj);
  function statusOf(R, path) {
    if (!R || !path) return null;
    const p = lc(path), par = p.includes('.') ? p.slice(0, p.lastIndexOf('.')) : '', leaf = p.slice(p.lastIndexOf('.') + 1);
    const M = R.mandatory.find(([f]) => lc(f) === p); if (M) return {st: 'yes', hint: M[1]};
    const D = R.dummy.find(([f]) => lc(f) === p);
    if (D) return typeof D[1] === 'object' ? {st: 'yes'} : {st: 'dummy', value: D[1], hint: D[2] || ''};
    const DP = R.dummy.find(([f, v]) => lc(f) === par && typeof v === 'object');
    if (DP) { const k = Object.keys(DP[1]).find(x => lc(x) === leaf); if (k !== undefined) return {st: 'dummy', value: DP[1][k], hint: DP[2] || ''}; }
    if (R.optional.some(f => lc(f) === p)) return {st: 'no'};
    if (R.optional.some(f => p.startsWith(lc(f) + '.'))) return {st: 'no'};
    if (par && R.optional.some(f => lc(f) === par + '.*')) return {st: 'no'};
    if (R.mandatory.some(([f]) => p.startsWith(lc(f) + '.')) || R.dummy.some(([f]) => p.startsWith(lc(f) + '.'))) return {st: 'yes'};
    if (R.mandatory.some(([f]) => lc(f).startsWith(p + '.')) || R.dummy.some(([f]) => lc(f).startsWith(p + '.'))) return {st: 'yes'};
    return null;
  }
  const show = v => typeof v === 'string' ? `"${v}"` : JSON.stringify(v);
  /* examples for fields every request shares, used when the docs example has none or only a test value */
  const GEN = {midCode: 'MID123', merchantRefNo: 'PO-10001', amount: 1500.00, hash: 'd824966e68287e417103830f4c0795cd21b09b6c6827da21550b912fdd343007', notificationUrl: 'https://yourcompany.example/payments/callback',
    returnUrl: 'https://yourcompany.example/payments/done', customField1: 'order-77', customField2: '', customField3: '', customField4: '', customField5: '', user_category: 'Default', device_fingerprint: 'a1b2c3d4e5f6',
    bank_branch: 'Andheri East', bank_address: '12 MG Road, Mumbai', merchant_ref_no: 'PO-10001', address: '12 MG Road', iscompeleted: true,
    /* businessTransaction (India, businessCategory "Import&Export"): values from the live docs example */
    businessType: 'Electronics', originCountry: 'INDIA', userIdNumber: 'ID9876543210', userDob: '1990-07-15', userBirthplace: 'Mumbai', shippingNumber: 'AWB1234567890',
    shippingDate: '2025-08-15', hsnCode: '847130', codeOfPurpose: 'P0101', loadingPort: 'Mumbai', userCountry: 'IN', exportTxnCurrency: 'USD', exportTxnAmount: 1250.75};
  function prm(r, kids = '', open = false, idp = '', extra = false, ctx = null, path = '') {
    const meta = [r.type, r.len && !/^(-|n\/a)$/i.test(r.len) ? r.len : ''].filter(Boolean);
    let st = ctx && statusOf(ctx.R, path);
    /* no "Conditional" once a country is picked: resolve the docs' condition for this country and method */
    if (ctx && !st && path && r.req === 'cond') {
      const c = lc(r.cond), inEx = valAt(ctx.data, path) !== undefined;
      /* India-only fields: for any other country they are simply not needed, and the India note is not shown */
      if (/india/.test(c)) st = ctx.country === 'India' ? {st: inEx ? 'yes' : 'no'} : {st: 'no', notHere: true, hint: `Not needed for ${ctx.country || 'this method'}.`};
      else if (/import/.test(c)) st = {st: 'no', hint: 'Only when businessCategory is "Import&Export".'};
      else if (/integrationtype|seamless/.test(c)) st = {st: ctx.hosted ? 'no' : 'yes'};
      else if (/hosted/.test(c)) st = {st: ctx.hosted || /^(BT|BD)$/i.test(ctx.method || '') ? 'yes' : 'no'};
      else st = {st: inEx ? 'yes' : 'no'};
      st.auto = true;
    }
    const req = st ? st.st : r.req;
    const star = req === 'yes' || req === 'dummy' ? '<span class="prm-star" title="Required">*</span>' : '';
    /* the body hash is not needed when the request is signed with the X-Callback-Signature header */
    const sigAlt = idp === 'p-' && /^hash$/i.test(path);
    const tag = sigAlt ? '<span class="prm-req sig">Required unless signed with the header</span>' : req === 'dummy' ? '<span class="prm-req dummy">Required · dummy OK</span>' : req === 'yes' ? '<span class="prm-req yes">Required</span>' : req === 'cond' ? '<span class="prm-req cond">Conditional</span>' : '<span class="prm-req no">Optional</span>';
    /* the example for the picked country: the dummy value where one is fine, otherwise the value in that country's example request */
    let ex = '';
    if (ctx && path) {
      const leaf0 = path.slice(path.lastIndexOf('.') + 1), E0 = typeof FIELD_EXAMPLES !== 'undefined' && FIELD_EXAMPLES[ctx.country];
      const k0 = E0 && (/^(userInfo|paymMethodFields)\./i.test(path) || (/^customField\./i.test(path) && st && st.st === 'yes')) && Object.keys(E0).find(k => lc(k) === lc(leaf0));
      /* the country example beats the old docs example (which often holds "test" values) */
      const test = x => x === undefined || x === null || /^(test|x+|1{4,}|n\/a|string)$|test@|@test\./i.test(String(x));
      const g = Object.keys(GEN).find(k => lc(k) === lc(leaf0));
      const COMMON = /^(midCode|merchantRefNo|amount|hash|merchantUrl\.notificationUrl|merchantUrl\.returnUrl)$/i;
      let v = st && st.st === 'dummy' ? st.value : k0 ? E0[k0] : COMMON.test(path) && g ? GEN[g] : valAt(ctx.data, path);
      if (test(v) && g) v = GEN[g];
      /* integrationType and paymentMethod follow the picked method */
      if (test(v) && /^integrationType$/i.test(path)) v = ctx.hosted ? 'PG_H' : 'S';
      if (test(v) && /^paymentMethod$/i.test(path) && ctx.method) v = ctx.method;
      const where = esc(ctx.country || 'this method');
      /* is this value specific to the country? (country rules and formats yes; URLs, IDs, amounts, riskData no) */
      const perCountry = () => !!ctx.country && (!!k0 || (!!st && !st.auto && !/^(riskData|merchantUrl)\./i.test(path)) || /^(currency|country|paymentMethod)$/i.test(path));
      const lbl = () => perCountry() ? `Example for ${where}` : 'Example';
      const real = st && st.hint && /real|customer's|beneficiary|holder/i.test(st.hint);
      const fixed = st && st.hint && /^"[^"]+"/.test(st.hint) ? st.hint.match(/^"[^"]+"/)[0] : '';
      if (st && st.notHere) ex = `<div class="prm-ex"><span>${esc(st.hint)}</span></div>`;
      else if (st && st.st === 'dummy') ex = `<div class="prm-ex dummy"><b>Pass dummy data.</b> ${lbl()}: <code>${esc(show(v))}</code>${st.hint ? ` <span>${st.hint}</span>` : ''}</div>`;
      else if (real) {
        /* a valid-looking value for this country, so the format is clear */
        const leaf = path.slice(path.lastIndexOf('.') + 1), E = typeof FIELD_EXAMPLES !== 'undefined' && FIELD_EXAMPLES[ctx.country];
        const fx = E && Object.keys(E).find(k => lc(k) === lc(leaf));
        ex = `<div class="prm-ex real"><b>Send real data:</b> <span>${esc(st.hint)}.</span> Dummy or test values are declined.${fx ? `<br><b>Valid format for ${where}:</b> <code>${esc(show(E[fx]))}</code>` : ''}</div>`;
      }
      else if (fixed) ex = `<div class="prm-ex"><b>${lbl().replace('Example for', 'For')}:</b> <code>${esc(st.hint)}</code></div>`;
      /* "Example for <country>" only where the value depends on the country; a plain "Example" otherwise */
      else if (v !== undefined && v !== null && typeof v !== 'object' && !/^(test|x+|1{4,}|n\/a)$|test@|@test\./i.test(String(v))) ex = `<div class="prm-ex"><b>${lbl()}:</b> <code>${esc(/^hash$/i.test(path) && /^[0-9a-f]{64}$/i.test(String(v)) ? `"${String(v).slice(0, 8)}…${String(v).slice(-8)}" (64 hex characters)` : show(v))}</code>${st && st.hint ? ` <span>${esc(st.hint)}</span>` : ''}</div>`;
      else if (st && st.hint) ex = `<div class="prm-ex"><span>${esc(st.hint)}</span></div>`;
    }
    /* ids stay unique when a name appears twice (e.g. merchantRefNo in two response objects) */
    let pid = idp ? idp + slug(r.name) : '';
    if (pid && USED.has(pid)) { pid = idp + slug(path || r.name); let n = 2; while (USED.has(pid)) pid = idp + slug(path || r.name) + '-' + n++; }
    if (pid) USED.add(pid);
    return `<div class="prm${st ? ' st-' + st.st : ''}"${pid ? ` id="${pid}"` : ''}><div class="prm-h"><code class="prm-n">${esc(r.name)}</code>${star}${meta.map(m => `<span class="prm-t">${esc(m)}</span>`).join('')}${tag}</div>
      <div class="prm-d">${r.desc || ''}${sigAlt ? ` <span class="prm-cond">Not needed when you sign the whole request with the <code>X-Callback-Signature</code> header instead: see <a href="#/legacy/signing/hmac">Signing &amp; hashes</a>.</span>` : ''}${extra && EXTRA[r.name] ? EXTRA[r.name] : ''}${r.cond && (!st || (st.auto && !st.notHere)) ? `<span class="prm-cond">${esc(r.cond)}</span>` : ''}</div>${ex}${kids ? `<details class="prm-kids"${open ? ' open' : ''}><summary>Child parameters</summary>${kids}</details>` : ''}</div>`;
  }
  function prmList(rows, nested, opts = {}, base = '') {
    return rows.map(r => {
      const path = /^(requestType|data)$/i.test(r.name) && !base ? (/^data$/i.test(r.name) ? '' : r.name) : base + r.name;
      const kidBase = /^data$/i.test(r.name) && !base ? '' : path + '.';
      if (opts.pmf && /^paymMethodFields$/i.test(r.name)) return prm(r, '<div class="pmfKids"></div>', true, opts.idp, opts.extra, opts.ctx, path);
      /* every nested table for this parameter; several (e.g. txdata per transaction type) get their own sub-heading */
      const ts = nested.filter(n => baseName(n.title) === norm(r.name));
      const rest = nested.filter(n => !ts.includes(n));
      const kids = ts.length > 1 ? ts.map(t => `<p class="prm-sub">${esc(t.title.replace(/^Nested object\s*/i, ''))}</p>${prmList(t.rows, rest, opts, kidBase)}`).join('') : ts.length ? prmList(ts[0].rows, rest, opts, kidBase) : '';
      return prm(r, kids, !!ts.length && /^data$/i.test(r.name), opts.idp, opts.extra, opts.ctx, path);
    }).join('');
  }
  let USED = new Set();
  const list = (main, nested, opts) => { USED = new Set(); return main ? `<div class="prm-list">${prmList(main.rows, nested, opts)}</div>` : ''; };

  /* ---------- code panels ---------- */
  /* one block per line (for the line numbers); copying the pane still gives one line per row */
  const lines = txt => hl(txt, 'json').split('\n').map(l => `<span class="ln">${l || ' '}</span>`).join('');
  const SNIP = {
    'cURL': body => `curl -X POST '${API_URL}' \\\n  -H 'Content-Type: application/json' \\\n  -H 'api-version: 2.0' \\\n  -d '${pretty(body).text.replace(/'/g, "'\\''")}'`,
    'Node.js': body => `const body = ${pretty(body).text};\n\nconst res = await fetch('${API_URL}', {\n  method: 'POST',\n  headers: { 'Content-Type': 'application/json', 'api-version': '2.0' },\n  body: JSON.stringify(body),\n});\nconst result = await res.json(); // check result.success and result.error`,
    'Python': body => `import requests\n\nbody = ${pretty(body).text.replace(/\btrue\b/g, 'True').replace(/\bfalse\b/g, 'False').replace(/\bnull\b/g, 'None')}\n\nres = requests.post(\n    "${API_URL}",\n    json=body,\n    headers={"api-version": "2.0"},\n)\nresult = res.json()  # check result["success"] and result["error"]`,
    'PHP': body => `<?php\n$body = '${pretty(body).text.replace(/'/g, "\\'")}';\n\n$ch = curl_init('${API_URL}');\ncurl_setopt_array($ch, [\n    CURLOPT_POST => true,\n    CURLOPT_POSTFIELDS => $body,\n    CURLOPT_RETURNTRANSFER => true,\n    CURLOPT_HTTPHEADER => ['Content-Type: application/json', 'api-version: 2.0'],\n]);\n$result = json_decode(curl_exec($ch), true); // always HTTP 200: check success and error`,
    'JSON': body => pretty(body).text,
  };
  let LANG = (() => { try { return localStorage.getItem('pf-lang') || 'cURL'; } catch (_) { return 'cURL'; } })();
  function panel(title, panes, kind) {
    const on = Math.max(0, panes.findIndex(([t]) => t === LANG));
    return `<div class="snip" data-snip="${kind}">
      <div class="snip-bar"><b>${title}</b>${panes.length > 1 ? `<div class="snip-tabs" role="tablist" aria-label="${title} format">${panes.map(([t], i) => `<button type="button" role="tab" class="${i === on ? 'on' : ''}" aria-selected="${i === on}" data-snip-tab="${i}">${t}</button>`).join('')}</div>` : `<span class="snip-one">${panes[0][0]}</span>`}<button type="button" class="snip-copy" data-snip-copy aria-label="Copy ${title.toLowerCase()}">Copy</button></div>
      ${panes.map(([, txt], i) => `<pre class="snip-pane${i === on ? ' on' : ''}" data-snip-pane="${i}"><code>${lines(txt)}</code></pre>`).join('')}
    </div>`;
  }
  /* the docs examples hold "test" values and nulls: swap them for the same sample values the parameter list shows */
  function polish(raw, o) {
    const j = json(raw), data = j && (j.data || j.Data); if (!data) return raw;
    const E0 = (typeof FIELD_EXAMPLES !== 'undefined' && FIELD_EXAMPLES[o.country]) || {};
    const testy = x => x === null || /^(test|x+|1{4,}|n\/a|string)$|test@|@test\./i.test(String(x));
    const walk = (obj, base) => Object.keys(obj).forEach(k => {
      const v = obj[k], p = base + k;
      if (v && typeof v === 'object' && !Array.isArray(v)) return walk(v, p + '.');
      if (!testy(v)) return;
      const inUser = /^(userInfo|paymMethodFields)\./i.test(p), ek = Object.keys(E0).find(x => lc(x) === lc(k)), gk = Object.keys(GEN).find(x => lc(x) === lc(k));
      if (ek && inUser) obj[k] = E0[ek]; else if (gk && v !== null && !/^hash$/i.test(k)) obj[k] = GEN[gk];
    });
    walk(data, '');
    return JSON.stringify(j);
  }
  function codeBox(o, all) {
    const e = o.ex, req = polish(e.request, o);
    const head = all && all.length > 1 && !all.some(x => x.country)
      ? `<select class="snip-ex" aria-label="Choose example">${all.map(x => `<option value="${x.id}"${x === o ? ' selected' : ''}>${esc(x.title)}</option>`).join('')}</select>`
      : `<span>${esc(o.title)}</span>`;
    return `<div class="snip-head"><span class="snip-dots" aria-hidden="true"><i></i><i></i><i></i></span>${head}</div>
      ${panel('Request', Object.entries(SNIP).map(([t, f]) => [t, f(req)]), 'req')}
      ${panel('Response', [['Success', pretty(e.response).text], ...(e.failResponse ? [['Error', pretty(e.failResponse).text]] : [])], 'res')}
      ${e.notes ? `<div class="snip-note">${esc(e.notes.replace(/^\(Notes:\s*|\)$/g, ''))}</div>` : ''}
      <p class="snip-foot">Example from the live API docs, with sample values. Use your own MID, values and hash.</p>`;
  }

  /* ---------- picker: what to send for the picked method ---------- */
  function sendCard(S, o) {
    const data = S.reqNested.find(t => baseName(t.title) === 'data');
    const applies = r => {
      const c = r.cond.toLowerCase(), cs = Object.keys(FLAG).filter(k => c.includes(k.toLowerCase()));
      if (cs.length) return cs.includes(o.country);
      if (/seamless|'s'|"s"/.test(c)) return !o.hosted;
      if (/hosted|pg_h/.test(c)) return o.hosted;
      return false;
    };
    const link = n => `<a href="#" data-jump="p-${slug(n)}"><code>${esc(n)}</code></a>`;
    const always = data ? data.rows.filter(r => r.req === 'yes').map(r => r.name) : [];
    const extra = data ? data.rows.filter(r => r.req === 'cond' && applies(r) && !/^(paymMethodFields|paymentMethod)$/i.test(r.name)).map(r => r.name) : [];
    const pmf = o.fields ? o.fields.rows : [];
    const status = S.statusFn(S.key, o.country);
    const rows = [
      o.cc || o.ccy ? ['Country · currency', [o.cc, o.ccy].filter(Boolean).map(v => `<code>${esc(v)}</code>`).join(' · ')] : null,
      ['integrationType', o.hosted ? '<code>"PG_H"</code> hosted: the customer pays on our page' : '<code>"S"</code> seamless: you send the details'],
      o.method ? ['paymentMethod', `<code>"${esc(o.method)}"</code>`] : null,

      pmf.length ? ['paymMethodFields', pmf.map(r => `<span class="pmf-i"><code>${esc(r.name)}</code>${r.req === 'yes' ? '' : '<small>optional</small>'}</span>`).join(' ')] : o.hosted ? ['paymMethodFields', 'Not needed'] : null,
    ].filter(Boolean);
    const head = `<div class="send-h"><b>${FLAG[o.country] || ''} ${esc(o.hosted ? 'Hosted' : 'Seamless')} · ${esc(o.name)}</b>${status ? `<span class="pk-st ${status}">${STATUS_TXT[status]}</span>` : ''}</div>`;
    const rule = typeof FIELD_RULES !== 'undefined' && FIELD_RULES[`${S.key}|${o.country}|${o.hosted ? 'H' : o.method}`];
    if (rule) return `<div class="send-card">${head}${ruleCard(S, o, rule)}</div>`;
    return `<div class="send-card">${head}
      <dl class="send-spec">${rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl></div>`;
  }
  /* short summary above the parameters; the per-field rules are in the parameter list itself */
  function ruleCard(S, o, R) {
    const pm = (R.mandatory.find(([f]) => f === 'paymentMethod') || [])[1];
    const rows = [
      o.cc || o.ccy ? ['Country · currency', [o.cc, o.ccy].filter(Boolean).map(v => `<code>${esc(v)}</code>`).join(' · ')] : null,
      ['integrationType', o.hosted ? '<code>"PG_H"</code> hosted: the customer pays on our page' : '<code>"S"</code> seamless: you send the details'],
      pm ? ['paymentMethod', esc(pm).replace(/&quot;([^&]+)&quot;/g, '<code>"$1"</code>')] : null,
      R.dummy.length ? ['Dummy data', `${R.dummy.length} field${R.dummy.length > 1 ? 's' : ''} can take dummy values: see <a href="#" data-jump="params">Parameters</a>`] : null,
    ].filter(Boolean);
    return `<dl class="send-spec">${rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl>
      ${R.notes.length ? `<div class="rc-notes2"><b>Good to know</b><ul>${R.notes.map(n => `<li>${n}</li>`).join('')}</ul></div>` : ''}`;
  }
  function pmfKids(o, ctx = null) {
    if (!o.fields) return `<p class="prm-empty">${o.hosted ? 'Not needed for hosted checkout.' : 'No extra fields for this method.'}</p>`;
    return `<p class="prm-for">Fields for <b>${esc(o.name)}${o.country ? ` (${esc(o.country)})` : ''}</b>. Pick another method above to see its fields.</p>` + o.fields.rows.map(r => prm(r, '', false, 'p-', false, ctx, 'paymMethodFields.' + r.name)).join('');
  }
  const hashLink = S => `#/legacy/signing/${/^op-|^balance$/.test(S.key) ? 'utilities' : S.key}`;
  const hashSlot = (S, o) => {
    const r = (o && o.recipe) || S.recipe;
    return r ? `<span class="hash-for">Recipe${S.picker ? ' for this method' : ''}: <code class="hash-f">${esc(r.formula)}</code> <a class="prm-link" href="${hashLink(S)}">All hash recipes →</a></span>` : `<a class="prm-link" href="${hashLink(S)}">How to build it →</a>`;
  };

  /* ---------- the operation page ---------- */
  const STATE = {};
  const defaultPick = (S, arg) => S.opts.find(o => o.id === arg) || S.opts.find(o => S.statusFn(S.key, o.country) === 'live') || S.opts.find(o => S.statusFn(S.key, o.country) === 'soon') || S.opts[0];
  function renderSpec(flow, S, arg, statusFn = () => '') {
    S.flow = flow; S.statusFn = statusFn; STATE[S.key] = S;
    const pick = defaultPick(S, arg);
    const countries = [...new Set(S.opts.map(o => o.country))];
    const toc = [['endpoint', 'Endpoint'], ...(S.picker ? [['pick', 'Country & method']] : []), ['params', 'Parameters'], ...(S.notes.length ? [['notes', 'Notes']] : [])];
    return `<div class="api2" data-api2="${S.key}">
      <div class="api2-left">
        <div class="api2-head">
          <h1>${esc(S.title)}</h1>${S.lead ? `<p class="lead">${esc(S.lead)}</p>` : ''}
          <nav class="toc" aria-label="On this page">${toc.map(([id, t]) => `<a href="#" data-jump="${id}">${t}</a>`).join('')}</nav>
          <div class="ep2" id="endpoint"><span class="method post">POST</span><code>${esc(API_URL)}</code><button type="button" class="ep2-copy" data-copy-text="${esc(API_URL)}" aria-label="Copy endpoint">Copy</button></div>
          <div class="ep2-h"><span>Headers</span> <code>Content-Type: application/json</code> <code>api-version: 2.0</code> <span>· signed with a body <a href="${hashLink(S)}">hash</a> or the <a href="#/legacy/signing/hmac">signature header</a></span></div>
          ${S.picker ? `<section id="pick"><h2>Country and method</h2>
            <p class="pick-help">Each method needs different fields. Pick one to see what to send and its example.</p>
            <div class="pk-c" role="group" aria-label="Country">${countries.map(c => { const s = statusFn(S.key, c); return `<button type="button" class="chip" data-pk-c="${esc(c)}">${FLAG[c] || ''} ${esc(c || 'All')}${s ? `<span class="pk-dot ${s}" title="${STATUS_TXT[s]}"></span>` : ''}</button>`; }).join('')}</div>
            <div class="pk-m" role="group" aria-label="Method"></div>
            <div class="sendCard"></div>
          </section>` : ''}
        </div>
        <aside class="api2-code" aria-label="Code examples"><div class="api2-sticky codeBox">${pick ? codeBox(pick, S.opts) : '<p class="snip-foot">No example in the live API docs for this request.</p>'}</div></aside>
        <div class="api2-body">
          <section class="pcard" id="params">
            <div class="pcard-top"><h2>Parameters</h2><div class="ptabs" role="tablist"><button type="button" role="tab" class="on" aria-selected="true" data-ptab="req">Request</button><button type="button" role="tab" aria-selected="false" data-ptab="res">Response</button></div></div>
            <div class="ppane on" data-ppane="req"><p class="pnote">A JSON body with <code>requestType</code> and a <code>data</code> object. Fields marked <span class="prm-star">*</span> are required.${S.picker ? ' Required / optional and the examples follow the country and method you pick above.' : ''}</p><div class="reqList">${list(S.req, S.reqNested, {pmf: S.picker, idp: 'p-', extra: true})}</div></div>
            <div class="ppane" data-ppane="res"><p class="pnote">Check <code>success</code> and <code>error[]</code> in every response.${S.picker ? ' The final result arrives in the <a href="#/legacy/api-callbacks">callback</a>.' : ''}</p>${list(S.res, S.resNested, {idp: 'r-'})}</div>
          </section>
          ${S.notes.length ? `<section id="notes" class="op-notes"><h2>Notes</h2>${renderBlocks(flow, S.notes)}</section>` : ''}
          ${sourceLink(flow, S.source)}
        </div>
      </div>
    </div>`;
  }
  function select(key, id, push = true) {
    const S = STATE[key]; if (!S) return;
    const o = S.opts.find(x => x.id === id) || S.opts[0];
    const root = document.querySelector(`[data-api2="${key}"]`); if (!root) return;
    const q = c => root.querySelector(c);
    if (o) {
      root.querySelectorAll('[data-pk-c]').forEach(b => b.classList.toggle('on', b.dataset.pkC === o.country));
      if (q('.pk-m')) q('.pk-m').innerHTML = S.opts.filter(x => x.country === o.country).map(x => `<button type="button" class="chip${x === o ? ' on' : ''}" data-pk-m="${x.id}">${esc(x.hosted ? 'Hosted' : 'Seamless')} · ${esc(x.name)}</button>`).join('');
      if (q('.sendCard')) q('.sendCard').innerHTML = sendCard(S, o);
      const R = ruleOf(S, o);
      const ctx = {R, data: dataOf(o.ex.request), country: o.country, hosted: o.hosted, method: o.method};
      if (q('.reqList')) { const open = [...q('.reqList').querySelectorAll('details')].map(d => d.open); q('.reqList').innerHTML = list(S.req, S.reqNested, {pmf: S.picker, idp: 'p-', extra: true, ctx}); q('.reqList').querySelectorAll('details').forEach((d, i) => { if (open[i] !== undefined) d.open = open[i]; }); }
      if (q('.pmfKids')) q('.pmfKids').innerHTML = pmfKids(o, ctx);
      if (q('.codeBox')) q('.codeBox').innerHTML = codeBox(o, S.opts);
    }
    root.querySelectorAll('.hashSlot').forEach(h => h.innerHTML = hashSlot(S, o));
    if (push && o && S.opts.length > 1) history.replaceState(null, '', `#/legacy/${key}/${o.id}`);
  }
  const init = (key, arg) => { const S = STATE[key]; if (S) select(key, (defaultPick(S, arg) || {}).id, false); };
  const render = (flow, key, arg, statusFn) => renderSpec(flow, specFromPage(flow, key), arg, statusFn);
  const renderOp = (flow, opId, arg) => renderSpec(flow, specFromOp(flow, opId), arg);

  /* ---------- side code for the reference pages ---------- */
  const HASH_CODE = {
    'Node.js': `const crypto = require('crypto');

// Join the values in the recipe's order with "~" and hash them.
// Put your MID secret (lower case) where the recipe says midsecret.
function midHash(values, sep = '~') {
  return crypto.createHash('sha256').update(values.join(sep), 'utf8').digest('hex');
}

// Payout · Seamless Net Banking (India)
// SHA256(midcode~account_name~account_number~bank_ifsc~amount~currency~bank_name~midsecret)
const f = data.paymMethodFields;
const hash = midHash([
  data.midCode, f.account_name, f.account_number, f.bank_ifsc,
  data.amount, data.currency, f.bank_name,
  process.env.MID_SECRET.toLowerCase(),
]);

// Callback hashes use no separator: midHash([...], '')`,
    'Python': `import hashlib, os

# Join the values in the recipe's order with "~" and hash them.
# Put your MID secret (lower case) where the recipe says midsecret.
def mid_hash(values, sep="~"):
    return hashlib.sha256(sep.join(str(v) for v in values).encode("utf-8")).hexdigest()

# Payout · Seamless Net Banking (India)
# SHA256(midcode~account_name~account_number~bank_ifsc~amount~currency~bank_name~midsecret)
f = data["paymMethodFields"]
hash_ = mid_hash([
    data["midCode"], f["account_name"], f["account_number"], f["bank_ifsc"],
    data["amount"], data["currency"], f["bank_name"],
    os.environ["MID_SECRET"].lower(),
])

# Callback hashes use no separator: mid_hash([...], sep="")`,
    'PHP': `<?php
// Join the values in the recipe's order with "~" and hash them.
// Put your MID secret (lower case) where the recipe says midsecret.
function mid_hash(array $values, string $sep = '~'): string {
    return hash('sha256', implode($sep, $values));
}

// Payout · Seamless Net Banking (India)
// SHA256(midcode~account_name~account_number~bank_ifsc~amount~currency~bank_name~midsecret)
$f = $data['paymMethodFields'];
$hash = mid_hash([
    $data['midCode'], $f['account_name'], $f['account_number'], $f['bank_ifsc'],
    $data['amount'], $data['currency'], $f['bank_name'],
    strtolower(getenv('MID_SECRET')),
]);

// Callback hashes use no separator: mid_hash([...], '')`,
  };
  const sideCode = (title, panes, note) => `<aside class="api2-code" aria-label="Code example"><div class="api2-sticky">
    <div class="snip-head"><span class="snip-dots" aria-hidden="true"><i></i><i></i><i></i></span><span>${esc(title)}</span></div>
    ${panel('Code', panes, 'side')}${note ? `<p class="snip-foot">${note}</p>` : ''}</div></aside>`;
  const twoCol = (head, body, aside) => `<div class="api2"><div class="api2-left"><div class="api2-head">${head}</div>${aside}<div class="api2-body">${body}</div></div></div>`;

  /* ---------- Signing & hashes page (one page: how to sign, the recipes, how to check ours) ----------
     No calculator here: every "Try it" opens the Hash playground on that recipe. */
  const HMAC_CODE = {
    'Node.js': `const crypto = require('crypto');

const body = JSON.stringify(request);               // serialise once
const signature = crypto.createHmac('sha256', process.env.MID_SECRET.toLowerCase())
  .update(body, 'utf8').digest('hex');

await fetch(url, { method: 'POST', body,             // send the same string
  headers: { 'Content-Type': 'application/json', 'api-version': '2.0',
             'X-Callback-Signature': \`sha256=\${signature}\` } });`,
    'Python': `import hmac, hashlib, json, os, requests

body = json.dumps(request, separators=(",", ":")).encode("utf-8")
sig = hmac.new(os.environ["MID_SECRET"].lower().encode(), body, hashlib.sha256).hexdigest()
requests.post(url, data=body, headers={"Content-Type": "application/json", "api-version": "2.0",
                                       "X-Callback-Signature": f"sha256={sig}"})`,
    'PHP': `<?php
$body = json_encode($request);
$sig  = hash_hmac('sha256', $body, strtolower($secret));
// send $body unchanged with header  X-Callback-Signature: sha256=$sig`,
    'C#': `var body = JsonSerializer.Serialize(request);
var bodyBytes = Encoding.UTF8.GetBytes(body);
var signature = Convert.ToHexString(HMACSHA256.HashData(
    Encoding.UTF8.GetBytes(midsecret.ToLowerInvariant()), bodyBytes)).ToLowerInvariant();
var content = new ByteArrayContent(bodyBytes);
content.Headers.ContentType = new MediaTypeHeaderValue("application/json");
content.Headers.Add("X-Callback-Signature", "sha256=" + signature);`,
  };
  function signingPage(flow, arg) {
    const play = '#/playground';
    const head = `<h1>Signing &amp; hashes</h1>
      <p class="lead">Every request must prove it comes from you, and every response and callback from us carries a hash you should check. Both use the MID secret you get at onboarding, in lower case.</p>
      <nav class="toc" aria-label="On this page"><a href="#" data-jump="choose">Choose how to sign</a><a href="#" data-jump="hmac">Option A · Signature header</a><a href="#" data-jump="body-hash">Option B · Body hash</a><a href="#" data-jump="check">Check our hashes</a><a href="#" data-jump="all-recipes">All recipes</a></nav>
      <section id="choose" class="hsec"><h2>Choose how to sign</h2>
      <div class="grid2">
        <a class="tile" href="#" data-jump="hmac"><span class="tag">Option A · one method for all requests</span><b>Signature header</b><span>Sign the whole request body with HMAC-SHA256 and send it in the <code>X-Callback-Signature</code> header. The same code works for every request type.</span></a>
        <a class="tile" href="#" data-jump="body-hash"><span class="tag">Option B · per request type</span><b>Body hash</b><span>Join specific fields with <code>~</code>, add your secret and send the SHA-256 in the <code>hash</code> field. The fields and their order differ per request, method and country.</span></a>
      </div>
      <p class="pick-help"><b>Which one?</b> Option A is simpler: one piece of code for every request. When the header is valid, the body <code>hash</code> is ignored. Whichever you choose, check the hashes on our responses and callbacks (<a href="#" data-jump="check">below</a>).</p></section>`;
    /* each option: what to do (numbered steps), then the same steps worked through with real values */
    const optHead = (letter, title, sub) => `<div class="opt-h"><span class="opt-badge">Option ${letter}</span><h2>${title}</h2><p>${sub}</p></div>`;
    const doSteps = items => `<h3>What you do</h3><ol class="do-steps">${items.map(([t, d]) => `<li><b>${t}</b><span>${d}</span></li>`).join('')}</ol>`;
    const example = (rows, act = '', foot = false) => `<div class="anat"><div class="anat-bar"><span class="anat-dots" aria-hidden="true"><i></i><i></i><i></i></span><span>Worked example</span>${act}</div>
      ${rows.map(([n, label, val]) => `<div class="ex-row"><span class="anat-n a${n}">${n}</span><div><span class="ex-l">${label}</span><div class="ex-v">${val}</div></div></div>`).join('')}
      ${foot ? '<p class="ex-foot">Both examples use made-up values. The secret is the Hash playground\'s demo secret, so you can reproduce them there.</p>' : ''}</div>`;
    const EX_BODY = '{"requestType":"GetBalance","data":{"midCode":"MID123"}}', EX_SIG = '9be56556b3b102b63267d53bcb460e830e80f483bdb81d29d97c50e8b8a4ff03';
    const EX_HASH = 'eeeba1863e8cb1866afd4ff1f515036bc0436fdd11700c36d05679a49fcc20b1';
    const tk = (c, t) => `<span class="${c}">${esc(t)}</span>`, sep = '<span class="t-p">~</span>';
    const hmac = `<section id="hmac" class="hsec opt">${optHead('A', 'Signature header', 'Sign the whole request body once, and send the signature in a header (the API docs call this the Request Signature). The same code works for every request.')}
      ${doSteps([
        ['Turn your request into a JSON string', 'Serialise the body once and keep that exact string. You sign it and you send it, byte for byte.'],
        ['Sign the string with HMAC-SHA256', 'Use your MID secret <b>in lower case</b> as the key and the string as the message. Take the result as hex.'],
        ['Add the header', '<code>X-Callback-Signature: sha256=&lt;hex&gt;</code>. The <code>sha256=</code> prefix is recommended.'],
        ['Send the same string as the body', 'Don\'t re-serialise or pretty-print it after signing: one changed space and the signature no longer matches.'],
      ])}
      ${example([
        [1, 'Your request body, as a string', `<code>${esc(EX_BODY)}</code>`],
        [2, 'HMAC-SHA256 with your MID secret (lower case)', `key ${tk('t3', 'demo_secret_42')} → ${tk('t4', EX_SIG)}`],
        [3, 'The header you add', `<code>X-Callback-Signature: sha256=${EX_SIG}</code>`],
        [4, 'The body you send', `<code>${esc(EX_BODY)}</code> <span class="t-p">(unchanged)</span>`],
      ], `<a class="anat-try" href="${play}/hmac">Try it →</a>`)}
      <h3>What we do with it</h3>
      <ul class="opt-rules">
      <li>Header valid: the request goes through, and the <code>hash</code> field in the body is ignored, so you can leave it out.</li>
      <li>Header sent but wrong: the request fails with <a href="#/${flow}/errors/11031"><code>11031</code> hash does not match</a>, even if the body <code>hash</code> is right.</li>
      <li>No header: we check the body hash (Option B) instead.</li>
      </ul></section>`;
    const body = `<section id="body-hash" class="hsec opt">${optHead('B', 'Body hash', 'Build a hash from a few fields of the request plus your secret, and send it in the <code>hash</code> field. Each request, method and country has its own recipe.')}
      ${doSteps([
        ['Find the recipe for your request', 'Use the finder below: request type, integration, country and method. The recipe lists the fields and their order.'],
        ['Put the values in that order, joined with ~', 'Use the values exactly as you send them: same case, amounts with two decimals like <code>100.00</code>. Put your MID secret <b>in lower case</b> where the recipe says <code>midsecret</code> (it is not always last).'],
        ['Take the SHA-256 of that string, as hex', 'You get 64 characters.'],
        ['Send it in the hash field', 'Add it to <code>data</code> as <code>"hash"</code>, next to the fields you hashed.'],
      ])}
      ${example([
        [1, 'Recipe: Payin, hosted checkout', `<code>SHA256(midcode~merchantrefno~amount~currency~midsecret)</code>`],
        [2, 'Your values in that order, joined with ~', `${tk('t1', 'MID123')}${sep}${tk('t1', 'ORD-0001')}${sep}${tk('t1', '100.00')}${sep}${tk('t1', 'PKR')}${sep}${tk('t3', 'demo_secret_42')}`],
        [3, 'SHA-256 of that string, as hex', tk('t4', EX_HASH)],
        [4, 'In your request', `<code>"data": { "midCode": "MID123", "merchantRefNo": "ORD-0001", "amount": 100.00, "currency": "PKR", "hash": "${EX_HASH}", … }</code>`],
      ], `<a class="anat-try" href="${play}/0">Try it →</a>`, true)}
      <p class="opt-rules">Our responses and callbacks carry a hash built the same way, so you can check them (<a href="#" data-jump="check">see below</a>). Callback hashes join the values with <b>no separator</b>.</p>
      <h3>Find your recipe</h3>
      <p>Pick the request type, then your integration, country and method. <b>Try it</b> opens the recipe in the <a href="${play}">Hash playground</a>, where you can type your values and see the hash.</p>
      ${RP.picker(flow, 'ref', arg)}</section>`;
    const check = `<section id="check" class="hsec"><h2>Check our hashes</h2>
      <p>Our responses and callbacks carry a <code>hash</code> too. Rebuild it from the fields you received and your MID secret, and compare before you trust the result. Pick your request in the finder above: the <b>Response hash</b> and <b>Callback hash</b> cards show the recipes.</p>
      <ul>
      <li><b>Response hash:</b> check it before you act on the response.</li>
      <li><b>Callback hash:</b> the values are joined with <b>no separator</b>. Ignore a callback whose hash doesn't match; reply HTTP 200 once you have stored a valid one. See <a href="#/${flow}/api-callbacks">Callbacks</a>.</li>
      <li>Hash doesn't match? The <a href="${play}">Hash playground</a>'s detective tells you which of the usual mistakes you made.</li>
      </ul></section>`;
    const all = `<section id="all-recipes" class="hsec"><h2>All recipes</h2>${RP.table(flow, RP.model(flow))}</section>`;
    const aside = `<aside class="api2-code" aria-label="Code examples"><div class="api2-sticky">
      <div class="snip-head"><span class="snip-dots" aria-hidden="true"><i></i><i></i><i></i></span><span>Sign a request</span></div>
      ${panel('Option A · Signature header', Object.entries(HMAC_CODE), 'side')}
      ${panel('Option B · Body hash', Object.entries(HASH_CODE), 'side')}
      <p class="snip-foot">Sign on your server: never put the MID secret in an app or browser.</p></div></aside>`;
    return twoCol(head, hmac + body + check + all, aside);
  }

  /* ---------- Callbacks page ---------- */
  function callbacksPage(flow) {
    const keys = ['payout', 'payin'];
    const cbs = keys.map(key => { const d = page(flow, pageKey[key]), s = sec(d, 'callback-body'); return s ? {key, s, t: tablesOf(s)[0], cb: recipesOf(d).find(r => /callback/i.test(r.group))} : null; }).filter(Boolean);
    const block = ({key, s, t, cb}) => {
      const ul = s.blocks.filter(b => b.kind === 'ul').map(b => `<ul>${b.items.map(i => `<li>${fixLinks(i)}</li>`).join('')}</ul>`).join('');
      return `<section id="cb-${key}" class="hsec"><h2>${LABEL[key]} callback</h2>
        <section class="pcard"><div class="pcard-top"><h3>Callback parameters</h3><span class="pcard-sub">form-encoded POST to your <code>notificationUrl</code></span></div>${t ? `<div class="prm-list">${prmList(t.rows, tablesOf(s).slice(1), {})}</div>` : ''}</section>
        ${cb ? `<h3>Callback hash</h3><div class="formula"><span>${esc(cb.formula)}</span></div>` : ''}
        ${ul ? `<h3>Instructions</h3>${ul}` : ''}</section>`;
    };
    /* the callback body as your server receives it: field names from the live docs, values left as placeholders */
    const body = ({t}) => t ? t.rows.map(r => `${r.name}=<${r.name}>`).join('&\n') : '';
    const head = `<h1>Callbacks</h1>
      <p class="lead">When a transaction reaches a final status, we send its result to the <code>merchantUrl.notificationUrl</code> you gave in the request. Set up this URL before you send your first request.</p>
      <nav class="toc" aria-label="On this page">${cbs.map(c => `<a href="#" data-jump="cb-${c.key}">${LABEL[c.key]}</a>`).join('')}<a href="#/legacy/op-get-status">Get Status</a></nav>
      ${steps([
        ['Give us a public HTTPS URL', 'Send it in <code>merchantUrl.notificationUrl</code> on every request.'],
        ['Check the callback hash', 'Rebuild it from the callback fields and your MID secret, and compare. Ignore the callback if it does not match.'],
        ['Reply HTTP 200', 'Then update your order. The callback is the final result; use Get Status if one is late.'],
      ])}`;
    return twoCol(head, cbs.map(block).join(''), sideCode('What your server receives', cbs.map(c => [LABEL[c.key], `POST /your/notification/url\nContent-Type: application/x-www-form-urlencoded\n\n${body(c)}`]), 'Field names from the live API docs; values are placeholders.'));
  }

  /* ---------- events ---------- */
  document.addEventListener('click', e => {
    const tb = e.target.closest('[data-ptab]');
    if (tb) { const card = tb.closest('.pcard'); card.querySelectorAll('[data-ptab]').forEach(b => { b.classList.toggle('on', b === tb); b.setAttribute('aria-selected', b === tb); });
      card.querySelectorAll('[data-ppane]').forEach(p => p.classList.toggle('on', p.dataset.ppane === tb.dataset.ptab)); return; }
    const st = e.target.closest('[data-snip-tab]');
    if (st) {
      const snip = st.closest('[data-snip]'), i = st.dataset.snipTab;
      snip.querySelectorAll('[data-snip-tab]').forEach(b => { const on = b.dataset.snipTab === i; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); });
      snip.querySelectorAll('[data-snip-pane]').forEach(p => p.classList.toggle('on', p.dataset.snipPane === i));
      if (snip.dataset.snip === 'req' && SNIP[st.textContent]) { LANG = st.textContent; try { localStorage.setItem('pf-lang', LANG); } catch (_) { /* ignore */ } }
      return;
    }
    const cp = e.target.closest('[data-snip-copy]');
    if (cp) { const pane = cp.closest('[data-snip]').querySelector('.snip-pane.on code'); navigator.clipboard?.writeText(pane.innerText.replace(/\u00a0/g, ' ')).catch(() => {}); cp.textContent = 'Copied ✓'; setTimeout(() => cp.textContent = 'Copy', 1300); return; }
    const ct = e.target.closest('[data-copy-text]');
    if (ct) { navigator.clipboard?.writeText(ct.dataset.copyText).catch(() => {}); ct.textContent = 'Copied ✓'; setTimeout(() => ct.textContent = 'Copy', 1300); return; }
    const root = e.target.closest('[data-api2]'); if (!root || !STATE[root.dataset.api2]) return;
    const key = root.dataset.api2, S = STATE[key];
    const c = e.target.closest('[data-pk-c]');
    if (c) { select(key, S.opts.find(x => x.country === c.dataset.pkC).id); return; }
    const m = e.target.closest('[data-pk-m]'); if (m) select(key, m.dataset.pkM);
  });
  document.addEventListener('change', e => {
    const s = e.target.closest('.snip-ex'); if (!s) return;
    const root = s.closest('[data-api2]'); if (root) select(root.dataset.api2, s.value);
  });
  /* for other pages (home, corridors): the same terminal panels */
  const requestPanel = (body, title = 'Request') => panel(title, Object.entries(SNIP).map(([t, f]) => [t, f(body)]), 'req');
  const jsonPanel = (title, panes) => panel(title, panes, 'side');
  return {render, renderOp, init, options: d => exampleOptions(d, d.examples || []), signingPage, callbacksPage, requestPanel, jsonPanel};
})();
