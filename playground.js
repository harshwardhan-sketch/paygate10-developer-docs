/* Hash playground: build a body hash piece by piece, sign a body with HMAC,
   and let the "hash detective" work out why a merchant's hash doesn't match.
   Recipes come from data.js (the live docs). Pure JS hashing, so it works offline and on file://. */
(() => {
  const F = 'legacy';
  const RECIPES = D[F].recipes
    .map((r, i) => ({i, label: r.label, formula: r.formula, parts: r.label.split(' · ')}))
    .filter(r => /^SHA256\(/i.test(r.formula) && !/serializ/i.test(r.formula) && !HIDE_RECIPE(r));
  const MAIN = ['Payin', 'Payout', 'Get Balance', 'Get Status'];
  const groupOf = r => MAIN.includes(r.parts[0]) ? r.parts[0] : 'More';
  const GROUPS = [...MAIN, 'More'].filter(g => RECIPES.some(r => groupOf(r) === g));
  const recipeName = r => groupOf(r) === 'More' ? r.parts.join(' · ') : r.parts.slice(1).join(' · ').replace(/ Hash\b/, '');

  const CCY = [['India', 'INR'], ['Nigeria', 'NGN'], ['Pakistan', 'PKR'], ['Morocco', 'MAD'], ['Egypt', 'EGP'], ['Bangladesh', 'BDT'], ['Philippines', 'PHP']];
  const VAL = {midcode: 'MID123', merchantrefno: 'ORD-0001', merchantref: 'ORD-0001', merchant_ref_no: 'ORD-0001', amount: '100.00', refund_amount: '50.00', currency: 'PKR',
    country: 'PK', transactionid: 'INVABC1757498791747', transaction_id: 'INVABC1757498791747', parent_transactionid: 'INVABC1757498000001', txnstatus: 'APPROVED',
    transaction_type: 'payin', wallet_number: '03001234567', account_name: 'Asha Rao', account_holder_name: 'Ada Obi', account_number: '000123456789', bank_ifsc: 'ABCD0123456',
    bank_name: 'Example Bank', bank_code: 'BANK01', document_id: '4210112345671', checkouturl: 'https://checkout.example.com/pay/abc123', available_balance: '1000.00',
    running_balance: '1000.00', transactionref: 'REF-778899', requestamount: '1000.00', sendingcurrency: 'USD', receivingcurrency: 'PKR', quoteid: 'Q-1001', quote_id: 'Q-1001',
    accept_quote: 'true', sendingamount: '1000.00', receivingamount: '278000.00', pin: '1234', otp: '123456', phone: '03001234567', postalcode: '10001'};
  const isAmount = t => /^(amount|refund_amount)$/i.test(t);
  const two = v => /^\s*-?\d+(\.\d+)?\s*$/.test(v) ? Number(v).toFixed(2) : v;

  LG.playground = () => `<h1>Hash playground</h1>
<p class="lead">Build a signature piece by piece and watch it change as you type. Paste the hash your code made and the hash detective tells you what went wrong. Everything runs in your browser; nothing is sent anywhere.</p>
<div class="callout warn"><p>Use a <b>test</b> secret only. The demo secret below is made up.</p></div>
<div class="pg">
${tabs([
  ['Body hash', `<div class="pg-split"><div class="pg-in"><div class="pg-l">Request type</div><div class="chips" id="pgGroups">${GROUPS.map((g, i) => `<button type="button" class="chip${i ? '' : ' on'}" data-g="${esc(g)}">${esc(g)}</button>`).join('')}</div>
    <div class="pg-l">Recipe</div><div class="chips chips-sm" id="pgRecipes"></div>
    <div class="pg-formula" id="pgFormula"></div>
    <div class="pg-grid"><div id="pgFields" class="pg-fields"></div>
      <div><label class="pg-l" for="pgSecret">MID secret</label><input id="pgSecret" value="Demo_Secret_42" autocomplete="off" spellcheck="false"></div></div>
    </div><div class="pg-res">
    <div class="pg-l">The string that gets hashed</div><div class="pg-string" id="pgString" aria-live="polite"></div>
    <div class="pg-fixes" id="pgFixes"></div>
    <div class="pg-l">SHA-256 · send this in <code>hash</code></div><div class="pg-out"><code id="pgHash"></code><button type="button" class="copy-mini" data-copy="pgHash">Copy</button></div>
    <div class="pg-l">The same in your code</div><div id="pgCode"></div></div></div>`],
  ['Signature header', `<p>Option A signs the <b>raw request body</b> with HMAC-SHA256 instead. One extra space changes the signature completely, so sign exactly the bytes you send. Try the buttons below.</p>
    <div class="pg-split"><div class="pg-in"><label class="pg-l" for="hmBody">Raw request body</label><textarea id="hmBody" rows="5" spellcheck="false">{"requestType":"GetBalance","data":{"midCode":"MID123"}}</textarea>
    <div class="chips"><button type="button" class="chip" id="hmPretty">Pretty-print it</button><button type="button" class="chip" id="hmMin">Minify it</button></div>
    <label class="pg-l" for="hmSecret">MID secret</label><input id="hmSecret" value="Demo_Secret_42" autocomplete="off" spellcheck="false">
    </div><div class="pg-res"><div class="pg-l">Header to send</div><div class="pg-out"><code id="hmOut"></code><button type="button" class="copy-mini" data-copy="hmOut">Copy</button></div>
    <p id="hmNote" class="pg-note"></p></div></div>`],
  ['Hash detective', `<p>Pick the recipe and type your values on the <b>Body hash</b> tab first. Then paste the hash <b>your code</b> produced. The detective tries the usual mistakes and tells you which one you made.</p>
    <div class="det-row"><input id="detIn" placeholder="Paste your 64-character hash" autocomplete="off" spellcheck="false"><button type="button" class="btn btn-navy" id="detGo">Investigate</button></div>
    <div id="detOut" class="det-out" aria-live="polite"></div>`],
])}
</div>
<h2>The rules, once more</h2>
<ul><li>Fields in exactly the recipe order, joined with <code>~</code>. Callback hashes join them with <b>no separator</b>.</li><li>Amounts with two decimals: <code>100.00</code>.</li><li>The MID secret in lower case.</li><li>Still stuck? See <a href="#/legacy/hash-help">Fixing hash errors</a>, or all recipes on <a href="#/legacy/signing">Signing &amp; hashes</a>.</li></ul>`;

  function init() {
    const $ = id => document.getElementById(id);
    let group = GROUPS[0], rec = RECIPES.find(r => groupOf(r) === group);
    /* #/playground/<recipe number> opens that recipe; #/playground/hmac opens the signature header tab */
    const arg = (location.hash.split('/')[2] || '').trim();
    const pre = /^\d+$/.test(arg) && RECIPES.find(r => r.i === +arg);
    if (pre) { group = groupOf(pre); rec = pre; $('pgGroups').querySelectorAll('.chip').forEach(c => c.classList.toggle('on', c.dataset.g === group)); }
    const vals = {...VAL}, box = $('pgFields');
    const recipe = () => parseRecipe(rec.formula);
    const defaultFor = t => {
      const k = t.toLowerCase();
      if (k === 'currency') { const c = CCY.find(([n]) => rec.label.includes(n)); if (c) return c[1]; }
      if (k === 'transaction_type' && /Get Status/.test(rec.label)) return 'payout';
      return vals[k] ?? '';
    };
    const build = (o = {}) => {
      const {tokens, sep} = recipe(), raw = $('pgSecret').value, fixes = [];
      const parts = tokens.map(t => {
        if (isSecret(t)) { const s = o.rawSecret ? raw : raw.toLowerCase(); if (s !== raw) fixes.push('secret lower-cased'); return {t, v: s, secret: true}; }
        let v = box.querySelector(`[data-tok="${CSS.escape(t)}"]`)?.value ?? '';
        if (isAmount(t) && !o.rawAmount) { const n = two(v); if (n !== v) fixes.push(`${t} ${v || '∅'} → ${n}`); v = n; }
        return {t, v};
      });
      return {parts, sep, fixes};
    };
    const join = (ps, s) => ps.map(p => p.v).join(s);
    const snippet = (tokens, sep) => {
      const vars = tokens.map(t => isSecret(t) ? 'SECRET' : t.replace(/[^A-Za-z0-9_]/g, '_'));
      const s = `'${sep}'`;
      const node = `const crypto = require('crypto');\nconst SECRET = process.env.MID_SECRET.toLowerCase();\nconst hash = crypto.createHash('sha256')\n  .update([${vars.join(', ')}].join(${s}), 'utf8').digest('hex');`;
      const py = `import hashlib, os\nSECRET = os.environ["MID_SECRET"].lower()\nhash = hashlib.sha256(${s}.join([${vars.join(', ')}]).encode()).hexdigest()`;
      const php = `<?php\n$SECRET = strtolower(getenv('MID_SECRET'));\n$hash = hash('sha256', implode(${s}, [${vars.map(v => '$' + v).join(', ')}]));`;
      return tabs([['Node.js', code(node, 'js')], ['Python', code(py, 'python')], ['PHP', code(php, 'php')]]);
    };
    let codeKey = '';
    const redraw = () => {
      const {parts, sep, fixes} = build();
      $('pgString').innerHTML = parts.map((p, i) => `${i && sep ? `<span class="sep">${sep}</span>` : ''}<span class="tok t${i % 6}" title="${esc(p.t)}">${p.secret ? '•'.repeat(Math.min(p.v.length, 10)) || '∅' : esc(p.v) || '∅'}<small>${esc(p.t)}</small></span>`).join('');
      $('pgFixes').innerHTML = (sep ? '' : '<span class="fix info">callback hash: values joined with no separator</span>') + fixes.map(f => `<span class="fix">auto-fixed: ${esc(f)}</span>`).join('');
      const h = $('pgHash'); h.textContent = sha256(join(parts, sep)); h.classList.remove('flash'); void h.offsetWidth; h.classList.add('flash');
      const key = rec.formula; if (key !== codeKey) { codeKey = key; const r = recipe(); $('pgCode').innerHTML = snippet(r.tokens, r.sep); }
    };
    const drawRecipes = () => {
      $('pgRecipes').innerHTML = RECIPES.filter(r => groupOf(r) === group).map(r => `<button type="button" class="chip${r === rec ? ' on' : ''}" data-i="${r.i}">${esc(recipeName(r))}</button>`).join('');
    };
    const draw = () => {
      $('pgFormula').innerHTML = `<span>${esc(rec.formula)}</span>`;
      box.innerHTML = recipe().tokens.filter(t => !isSecret(t)).map(t => `<div><label class="pg-l" for="f-${esc(t)}">${esc(t)}</label><input id="f-${esc(t)}" data-tok="${esc(t)}" value="${esc(defaultFor(t))}" autocomplete="off" spellcheck="false"></div>`).join('');
      box.classList.remove('pop'); void box.offsetWidth; box.classList.add('pop');
      $('detOut').innerHTML = '';
      redraw();
    };
    const remember = () => box.querySelectorAll('[data-tok]').forEach(i => { const k = i.dataset.tok.toLowerCase(); if (k !== 'currency' && k !== 'transaction_type') vals[k] = i.value; });
    $('pgGroups').onclick = e => {
      const b = e.target.closest('.chip'); if (!b) return;
      remember(); group = b.dataset.g; rec = RECIPES.find(r => groupOf(r) === group);
      $('pgGroups').querySelectorAll('.chip').forEach(c => c.classList.toggle('on', c === b));
      drawRecipes(); draw();
    };
    $('pgRecipes').onclick = e => {
      const b = e.target.closest('.chip'); if (!b) return;
      remember(); rec = RECIPES.find(r => r.i === +b.dataset.i);
      $('pgRecipes').querySelectorAll('.chip').forEach(c => c.classList.toggle('on', c === b));
      draw();
    };
    box.oninput = redraw; $('pgSecret').oninput = redraw;

    /* signature header (HMAC) */
    const hb = $('hmBody'), hs = $('hmSecret'); let last = '';
    const hm = () => {
      const v = hmacSha256(hs.value.toLowerCase(), hb.value), out = $('hmOut'), note = $('hmNote');
      out.textContent = 'X-Callback-Signature: sha256=' + v;
      out.classList.remove('flash'); void out.offsetWidth; out.classList.add('flash');
      let n = `${new TextEncoder().encode(hb.value).length} bytes signed.`;
      try { JSON.parse(hb.value); } catch (_) { n += ' This body is not valid JSON.'; }
      if (last && last !== v) n += ' The signature changed: send exactly these bytes, or the gateway answers 11031.';
      note.textContent = n; last = v;
    };
    hb.oninput = hs.oninput = hm;
    const reformat = sp => { try { hb.value = JSON.stringify(JSON.parse(hb.value), null, sp); hm(); } catch (_) { $('hmNote').textContent = 'That body is not valid JSON.'; } };
    $('hmPretty').onclick = () => reformat(2); $('hmMin').onclick = () => reformat(0);
    hm();

    /* hash detective */
    const investigate = () => {
      const raw = $('detIn').value.trim(), out = $('detOut');
      const card = (cls, html) => { out.innerHTML = `<div class="result-card pop ${cls}">${html}</div>`; };
      if (!/^[0-9a-fA-F]{64}$/.test(raw)) return card('', '<p>That doesn’t look like a SHA-256 hash. It should be 64 characters, using only 0–9 and a–f.</p>');
      const want = raw.toLowerCase(), {parts, sep} = build();
      const c = [['ok', join(parts, sep)]];
      const rs = build({rawSecret: true}); if (join(rs.parts, sep) !== c[0][1]) c.push(['Your MID secret isn’t in lower case. Lower-case it before hashing.', join(rs.parts, sep)]);
      const ra = build({rawAmount: true}); if (join(ra.parts, sep) !== c[0][1]) c.push(['Amount format: write it with two decimals, like 100.00.', join(ra.parts, sep)]);
      ['', '~', '|', ',', ' '].filter(s => s !== sep).forEach(s => c.push([`Wrong separator: you joined with ${s ? `“${s === ' ' ? 'a space' : s}”` : 'nothing'}, but this recipe uses ${sep ? `“${sep}”` : 'no separator'}.`, join(parts, s)]));
      c.push(['You left the MID secret out of the string.', join(parts.filter(p => !p.secret), sep)]);
      const sec = parts.find(p => p.secret);
      if (sec && parts.at(-1) !== sec) c.push(['You put the secret at the end. In this recipe it sits in the middle.', join([...parts.filter(p => !p.secret), sec], sep)]);
      for (let i = 0; i < parts.length - 1; i++) { const sw = parts.slice(); [sw[i], sw[i + 1]] = [sw[i + 1], sw[i]]; c.push([`Field order: ${parts[i].t} and ${parts[i + 1].t} are swapped.`, join(sw, sep)]); }
      const others = RECIPES.filter(r => r.formula !== rec.formula);
      const hit = c.find(([, s]) => sha256(s) === want);
      if (hit) return card(hit === c[0] ? 'good' : 'warn', hit === c[0] ? '<p><b>Perfect match.</b> Your hash is correct for these values.</p>' : `<p><b>Found it.</b> ${esc(hit[0])}</p>`);
      card('', `<p><b>No match among the usual mistakes.</b></p><ul><li>Check every value is exactly what you sent, with no extra spaces.</li><li>Check you picked the right recipe for this request type and country (${others.length + 1} recipes differ in field order).</li><li>Check it is the secret for the same MID.</li></ul>`);
    };
    $('detGo').onclick = investigate;
    $('detIn').onkeydown = e => { if (e.key === 'Enter') investigate(); };

    drawRecipes(); draw();
    if (arg === 'hmac') [...document.querySelectorAll('.pg .tabs button')].find(b => /signature/i.test(b.textContent))?.click();
  }

  document.addEventListener('pf:rendered', e => { if (e.detail.pageId === 'playground' && document.getElementById('pgGroups')) init(); });
  document.addEventListener('click', e => {
    const b = e.target.closest('.copy-mini'); if (!b) return;
    navigator.clipboard?.writeText(document.getElementById(b.dataset.copy).textContent);
    b.textContent = 'Copied ✓'; b.classList.add('done'); setTimeout(() => { b.textContent = 'Copy'; b.classList.remove('done'); }, 1200);
  });

})();
