/* Hash recipe finder, on Signing & hashes (#/legacy/signing). "Try it" opens the Hash playground on the recipe.
   Instead of one long list, the reader picks: request type (Payin, Payout, Utilities) → integration
   (hosted or seamless) → country → method, and sees three labelled cards: the request hash (sent in `hash`),
   the response hash and the callback hash (both to check). Recipes come from data.js (the live API docs). */
const RP = (() => {
  const OPS = ['Payin', 'Payout'];
  const KIND = {'request hash': 'req', 'request signature': 'req', 'response hash': 'res', 'callback hash': 'cb'};
  const KIND_TXT = {
    req: ['Request hash', 'You build it and send it in <code>hash</code> on the request.'],
    res: ['Response hash', 'Check it on our response before you trust it.'],
    cb: ['Callback hash', 'Check it on the callback to your <code>notificationUrl</code>. The values are joined with <b>no separator</b>.'],
  };
  /* one row per recipe: op, kind, mode (hosted / seamless / ''), method, countries */
  const model = flow => D[flow].recipes.map((r, i) => {
    const [op, kindRaw = '', title = ''] = r.label.split(' · ');
    const kind = KIND[kindRaw.toLowerCase()] || 'req';
    const t = title.trim(), cc = (t.match(/\(([^)]+)\)\s*$/) || [])[1];
    const mode = /^all hosted|^hosted/i.test(t) ? 'hosted' : /^seamless/i.test(t) ? 'seamless' : '';
    const method = /^all hosted/i.test(t) ? 'All methods (hosted checkout)' : t.replace(/^(seamless|hosted)\s*/i, '').replace(/\s*\([^)]*\)\s*$/, '').trim();
    return {i, op, kind, mode, method, countries: cc ? cc.split(/\s*,\s*/) : [], formula: r.formula, hide: typeof HIDE_RECIPE === 'function' && HIDE_RECIPE(r)};
  }).filter(r => !r.hide);
  const uniq = a => [...new Set(a)];
  const playable = r => /^SHA256\(/i.test(r.formula) && !/serializ/i.test(r.formula);
  const utilOps = M => uniq(M.filter(r => !OPS.includes(r.op)).map(r => r.op));

  /* state → the recipes to show */
  function pick(M, s) {
    if (s.tab === 'Utilities') {
      const rs = M.filter(r => r.op === s.op);
      return {req: rs.find(r => r.kind === 'req'), res: rs.find(r => r.kind === 'res'), cb: rs.find(r => r.kind === 'cb')};
    }
    const rs = M.filter(r => r.op === s.tab);
    const req = rs.filter(r => r.kind === 'req' && (!r.mode || r.mode === s.mode) && (s.mode === 'hosted' || (!s.country || r.countries.includes(s.country))) && (!s.method || r.method === s.method))[0]
      || rs.find(r => r.kind === 'req');
    const res = rs.find(r => r.kind === 'res' && r.mode === s.mode) || rs.find(r => r.kind === 'res' && !r.mode) || rs.find(r => r.kind === 'res');
    return {req, res, cb: rs.find(r => r.kind === 'cb')};
  }
  /* the options each dropdown offers for the current state (and the state made consistent) */
  function options(M, s) {
    if (s.tab === 'Utilities') { const ops = utilOps(M); if (!ops.includes(s.op)) s.op = ops[0]; return {ops}; }
    const reqs = M.filter(r => r.op === s.tab && r.kind === 'req');
    const modes = uniq(reqs.map(r => r.mode).filter(Boolean));
    if (!modes.includes(s.mode)) s.mode = modes.includes('seamless') ? 'seamless' : modes[0] || '';
    if (s.mode === 'hosted') { s.country = ''; s.method = ''; return {modes, countries: [], methods: []}; }
    const inMode = reqs.filter(r => !r.mode || r.mode === s.mode);
    const countries = uniq(inMode.flatMap(r => r.countries)).sort();
    if (countries.length && !countries.includes(s.country)) s.country = countries[0];
    const methods = uniq(inMode.filter(r => !countries.length || r.countries.includes(s.country)).map(r => r.method).filter(Boolean));
    if (methods.length && !methods.includes(s.method)) s.method = methods[0];
    if (!methods.length) s.method = '';
    return {modes, countries, methods};
  }
  /* the state that shows recipe i (for links such as #/legacy/signing/12) */
  function stateFor(M, i) {
    const r = M[i]; if (!r) return null;
    if (!OPS.includes(r.op)) return {tab: 'Utilities', op: r.op};
    const s = {tab: r.op, mode: r.mode || 'seamless', country: r.countries[0] || '', method: r.method || ''};
    if (r.kind !== 'req') { s.mode = r.mode || 'seamless'; s.country = ''; s.method = ''; }
    return s;
  }

  const chips = f => { const m = f.match(/^SHA256\((.*)\)$/i), body = m ? m[1] : f, sep = body.includes('~') ? '~' : ' ';
    return body.split(sep).map(t => t.trim()).filter(Boolean).map(t => `<span class="rp-tok${/^(midsecret|rcode)$/i.test(t) ? ' sec' : ''}">${esc(t)}</span>`).join(sep === '~' ? '<span class="rp-sep">~</span>' : '<span class="rp-sep nosep">+</span>'); };
  const select = (id, label, opts, val, fmt = x => x) => `<label class="rp-f"><span>${label}</span><select data-rp-set="${id}">${opts.map(o => `<option value="${esc(o)}"${o === val ? ' selected' : ''}>${esc(fmt(o))}</option>`).join('')}</select></label>`;

  function cards(flow, M, s, mode) {
    const p = pick(M, s);
    const card = k => { const r = p[k]; if (!r) return '';
      const [t, d] = KIND_TXT[k];
      /* the playground builds field lists only: no Try it for a recipe such as "JSON serialization of the quote" */
      const act = playable(r) ? `<a class="rp-try" href="#/playground/${r.i}">Try it →</a>` : '';
      return `<div class="rp-card rp-${k}" id="rp-${k}"><div class="rp-card-h"><b>${t}</b>${act}</div><p>${d}</p><div class="formula"><span>${esc(r.formula)}</span></div><div class="rp-toks">${chips(r.formula)}</div></div>`; };
    return ['req', 'res', 'cb'].map(card).join('') || '<p class="src">No recipe in the live API docs for this choice.</p>';
  }
  function body(flow, M, s, mode) {
    const o = options(M, s);
    const tabs = `<div class="rp-tabs" role="tablist" aria-label="Request type">${[...OPS, 'Utilities'].map(t => `<button type="button" role="tab" class="${t === s.tab ? 'on' : ''}" aria-selected="${t === s.tab}" data-rp-tab="${t}">${t}</button>`).join('')}</div>`;
    let fields = '';
    if (s.tab === 'Utilities') fields = select('op', 'Request', o.ops, s.op);
    else if (s.tab !== 'Refund') {
      if (o.modes.length > 1) fields += select('mode', 'Integration', o.modes, s.mode, m => m === 'hosted' ? 'Hosted checkout' : 'Seamless (server to server)');
      else fields += `<div class="rp-f"><span>Integration</span><div class="rp-fixed">${s.mode === 'hosted' ? 'Hosted checkout' : 'Seamless (server to server)'}</div></div>`;
      if (s.mode === 'hosted') fields += `<div class="rp-f rp-wide"><span>Country and method</span><div class="rp-fixed">One recipe for every country and method</div></div>`;
      else {
        if (o.countries.length) fields += select('country', 'Country', o.countries, s.country);
        if (o.methods.length) fields += select('method', 'Method', o.methods, s.method);
      }
    }
    return `${tabs}${fields ? `<div class="rp-fields">${fields}</div>` : ''}<div class="rp-cards">${cards(flow, M, s, mode)}</div>`;
  }
  /* the full list, one table, folded away */
  function table_(flow, M) {
    const rows = M.map(r => [esc(r.op), KIND_TXT[r.kind][0], esc([r.mode && r.mode[0].toUpperCase() + r.mode.slice(1), r.method].filter(Boolean).join(' · ') || '—'), esc(r.countries.join(', ') || 'All'), `<code>${esc(r.formula)}</code>`, playable(r) ? `<a href="#/playground/${r.i}">Try it</a>` : '']);
    return `<details class="rp-all"><summary>All ${M.length} recipes in one table</summary>${table(['Request', 'Hash', 'Method', 'Country', 'Recipe', ''], rows)}</details>`;
  }

  const STATE = {};
  function picker(flow, mode = 'ref', preset) {
    const M = model(flow);
    const TAB = {payin: 'Payin', payout: 'Payout', utilities: 'Utilities'};
    const s = (TAB[preset] && {tab: TAB[preset], mode: 'seamless'}) || (/^\d+$/.test(preset || '') && stateFor(M, +preset)) || STATE[mode] || {tab: 'Payin', mode: 'seamless'};
    STATE[mode] = s;
    return `<div class="rp" data-rp="${mode}" data-flow="${flow}">${body(flow, M, s, mode)}</div>`;
  }
  const redraw = el => { const mode = el.dataset.rp, flow = el.dataset.flow; el.innerHTML = body(flow, model(flow), STATE[mode], mode); };

  document.addEventListener('click', e => {
    const t = e.target.closest('[data-rp-tab]');
    if (t) { const el = t.closest('[data-rp]'), s = STATE[el.dataset.rp]; s.tab = t.dataset.rpTab; s.country = s.method = ''; redraw(el); return; }
  });
  document.addEventListener('change', e => {
    const f = e.target.closest('[data-rp-set]'); if (!f) return;
    const el = f.closest('[data-rp]'), s = STATE[el.dataset.rp];
    s[f.dataset.rpSet] = f.value;
    if (f.dataset.rpSet === 'mode') s.country = s.method = '';
    if (f.dataset.rpSet === 'country') s.method = '';
    redraw(el);
  });
  return {picker, table: table_, model, stateFor, pick};
})();
