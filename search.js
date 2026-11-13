/* Site-wide search.
   Builds an index from the rendered pages (every guide page, every API page, split by heading)
   plus every error code, and shows results in a dialog opened from the header, Ctrl/⌘ K or "/".
   Loaded last, after all page modules. Runs fully in the browser; nothing is sent anywhere. */

(() => {
  /* words merchants use for the same thing */
  const SYN = {
    deposit: ['payin'], payin: ['deposit'], 'pay-in': ['payin'], collect: ['payin'],
    withdrawal: ['payout'], withdraw: ['payout'], payout: ['withdrawal'], disbursement: ['payout'],
    webhook: ['callback', 'notificationurl'], callback: ['webhook', 'notificationurl'], notification: ['callback'],
    signature: ['hash', 'signing'], sign: ['hash', 'signing'], signing: ['hash', 'signature'], hash: ['signature', 'signing'], hmac: ['signature'],
    sandbox: ['lpl', 'test'], test: ['lpl', 'testing'], staging: ['lpl'],
    generator: ['playground'], generate: ['playground'], calculator: ['playground'], tool: ['playground', 'calculator'], debug: ['detective', 'fixing'], playground: ['calculator'], demo: ['methods'], video: ['methods'], limits: ['methods'], settlement: ['settlements'], gaming: ['methods'], forex: ['methods'], p2p: ['methods'],
    status: ['getstatus'], balance: ['getbalance'], refund: ['refunds'], error: ['errors'], errors: ['error'],
  };
  const POPULAR = ['Payin', 'Payout', 'hash does not match', 'Hash playground', 'Callbacks', 'Get Status', 'Signature header', 'Test cases', 'Easypaisa', '11031'];

  let INDEX = null;
  const lower = s => s.toLowerCase();
  const clean = s => s.replace(/\s+/g, ' ').trim();
  const plain = html => { const t = document.createElement('template'); t.innerHTML = html; return clean(t.content.textContent); };

  /* split rendered HTML into chunks at each h2/h3 (and each FAQ question) */
  function chunks(html) {
    const tpl = document.createElement('template');
    tpl.innerHTML = html;
    const out = [{head: '', text: ''}];
    const SKIP = new Set(['SVG', 'PRE', 'SELECT', 'SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'BUTTON', 'IMG']);
    const walk = n => {
      for (const c of n.childNodes) {
        if (c.nodeType === 3) { out[out.length - 1].text += c.textContent; continue; }
        if (c.nodeType !== 1) continue;
        const tag = c.tagName.toUpperCase();
        if (SKIP.has(tag) || c.classList.contains('toc') || c.classList.contains('src') || c.classList.contains('tabs')) continue;
        if (tag === 'H2' || tag === 'H3' || tag === 'SUMMARY') { out.push({head: clean(c.textContent), text: ''}); continue; }
        if (tag === 'H1') continue;
        walk(c);
        out[out.length - 1].text += ' ';
      }
    };
    walk(tpl.content);
    const h1 = tpl.content.querySelector('h1');
    return {h1: h1 ? clean(h1.textContent) : '', parts: out.map(p => ({head: p.head, text: clean(p.text)})).filter(p => p.head || p.text)};
  }

  function buildIndex() {
    const docs = [];
    const add = (sec, id, title, area, fn) => {
      let html = '';
      try { html = fn(); } catch (_) { return; }
      let {parts} = chunks(html);
      /* the error list is indexed code by code below; keep only the intro of that page */
      if (sec === 'legacy' && id === 'errors') parts = parts.filter(p => !p.head).map(p => ({head: '', text: p.text.slice(0, 260)}));
      const url = id ? `#/${sec}/${id}` : `#/${sec}`;
      /* the page itself (title + intro) */
      const intro = parts.find(p => !p.head);
      docs.push({kind: 'page', url, title, area, head: '', text: intro ? intro.text : '', all: lower(`${title} ${intro ? intro.text : ''}`)});
      parts.filter(p => p.head).forEach(p => docs.push({kind: 'section', url, title, area, head: p.head, text: p.text, all: lower(`${p.head} ${p.text}`)}));
    };
    if (typeof GUIDE_NAV !== 'undefined') GUIDE_NAV.forEach(([, items]) => items.forEach(([id, t]) => add('guide', id, t, 'About', () => G[id]())));
    nav('legacy').forEach(([g, items]) => items.forEach(([id, t]) => add('legacy', id, t, /^API reference/.test(g) ? 'API reference' : 'Integration guide', () => resolve('legacy', id)())));
    if (LG.playground) add('playground', '', 'Hash playground', 'Hash playground', () => LG.playground());
    if (typeof PM !== 'undefined') add('methods', '', 'Payment methods', 'Payment methods', () => PM.indexHtml());
    D.legacy.errors.forEach(e => {
      const msg = e.ErrorMessage || '';
      docs.push({kind: 'error', url: `#/legacy/errors/${encodeURIComponent(e.ErrorCode)}`, title: `Error ${e.ErrorCode}`, area: 'Error codes', head: '', text: msg + (e.v1ErrorCode ? ` (v1 ${e.v1ErrorCode})` : ''),
        fix: plain(ERROR_FIX(e.ErrorCode, msg)),
        code: String(e.ErrorCode), v1: String(e.v1ErrorCode || ''), all: lower(`${e.ErrorCode} ${msg} ${e.v1ErrorCode || ''} ${e.v1ErrorMessage || ''}`)});
    });
    return docs;
  }
  const index = () => INDEX || (INDEX = buildIndex());

  function terms(q) {
    return lower(q).split(/[^a-z0-9_.@-]+/).map(t => t.replace(/^[.-]+|[.-]+$/g, '')).filter(t => t.length > 0);
  }
  const squash = s => s.replace(/[\s_-]+/g, '');
  const has = (hay, t) => hay.includes(t) || (SYN[t] || []).some(s => hay.includes(s));

  function search(q) {
    const ts = terms(q); if (!ts.length) return [];
    const phrase = lower(clean(q));
    const res = [];
    for (const d of index()) {
      d.sq ||= squash(d.all);
      if (!ts.every(t => has(d.all, t) || d.sq.includes(t))) continue;
      const ti = lower(d.title), hd = lower(d.head), tsq = squash(ti);
      let s = 0;
      for (const t of ts) {
        if (ti.includes(t) || tsq.includes(t)) s += 10; else if ((SYN[t] || []).some(x => ti.includes(x))) s += 9;
        if (hd.includes(t)) s += 7;
        const n = d.all.split(t).length - 1; s += Math.min(n, 5);
      }
      if (ti === phrase) s += 40; else if (ti.includes(phrase)) s += 20;
      /* "deposit" means the Payin page, "withdrawal" the Payout page, … */
      if (ts.length === 1 && !d.head && (SYN[ts[0]] || []).some(x => tsq.startsWith(x))) s += 30;
      if (hd === phrase) s += 25; else if (hd.includes(phrase)) s += 12;
      if (d.all.includes(phrase)) s += 4;
      if (d.kind === 'error') {
        if (d.code === phrase || d.v1 === phrase) s += 200; else if (/^\d+$/.test(phrase)) s -= 5; else s -= 6;
      }
      if (d.kind === 'page') s += 3;
      res.push([s, d]);
    }
    res.sort((a, b) => b[0] - a[0]);
    /* at most 3 hits per page so one long page doesn't fill the list */
    const per = {}, out = [];
    for (const [, d] of res) {
      const k = d.url; per[k] = (per[k] || 0) + 1;
      if (per[k] > 3 && d.kind !== 'error') continue;
      out.push(d); if (out.length >= 30) break;
    }
    return out;
  }

  function mark(text, ts) {
    let h = esc(text);
    const all = [...new Set(ts.flatMap(t => [t, ...(SYN[t] || [])]))].filter(t => t.length > 1 || /\d/.test(t)).sort((a, b) => b.length - a.length);
    if (!all.length) return h;
    const re = new RegExp(`(${all.map(t => esc(t).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
    return h.replace(re, '<mark>$1</mark>');
  }
  function snippet(text, ts) {
    if (!text) return '';
    const lo = lower(text);
    let at = -1;
    for (const t of ts) { const i = lo.indexOf(t); if (i >= 0 && (at < 0 || i < at)) at = i; }
    /* slice by code points so emoji flags are never cut in half */
    const cps = Array.from(text), pos = at < 0 ? 0 : Array.from(text.slice(0, at)).length;
    const a = at < 0 ? 0 : Math.max(0, pos - 50), b = Math.min(cps.length, a === 0 && at < 0 ? 140 : pos + 110);
    return (a ? '…' : '') + cps.slice(a, b).join('') + (b < cps.length ? '…' : '');
  }

  /* ---------- dialog ---------- */
  const modal = document.createElement('div');
  modal.id = 'searchModal'; modal.className = 'sm'; modal.hidden = true;
  modal.innerHTML = `<div class="sm-box" role="dialog" aria-modal="true" aria-label="Search the docs">
    <div class="sm-in">
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2"/><path d="M20 20l-4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
      <input id="smQ" type="search" placeholder="Search guides, API fields and error codes" autocomplete="off" spellcheck="false" aria-label="Search" aria-controls="smRes">
      <button class="sm-close" id="smClose" aria-label="Close search">Esc</button>
    </div>
    <div class="sm-res" id="smRes" role="listbox" aria-label="Results"></div>
    <div class="sm-foot"><span><kbd>↑</kbd> <kbd>↓</kbd> move</span><span><kbd>Enter</kbd> open</span><span><kbd>Esc</kbd> close</span></div>
  </div>`;
  document.body.appendChild(modal);
  const q = modal.querySelector('#smQ'), box = modal.querySelector('#smRes');
  let items = [], sel = 0, lastFocus = null;

  const AREA_CLS = {'Integration guide': 'g', 'API reference': 'a', 'Error codes': 'e', 'About': 'p'};
  function draw() {
    const v = q.value.trim();
    if (!v) {
      items = [];
      box.innerHTML = `<div class="sm-empty"><p>Popular searches</p><div class="sm-pop">${POPULAR.map(p => `<button type="button" data-pop="${esc(p)}">${esc(p)}</button>`).join('')}</div></div>`;
      return;
    }
    const ts = terms(v);
    items = search(v); sel = 0;
    if (!items.length) {
      box.innerHTML = `<div class="sm-empty"><p>No results for “${esc(v)}”.</p><p class="sm-hint">Try fewer words, an API name like <b>payin</b> or <b>GetStatus</b>, or an error code like <b>11031</b>.</p><div class="sm-pop">${POPULAR.slice(0, 6).map(p => `<button type="button" data-pop="${esc(p)}">${esc(p)}</button>`).join('')}</div></div>`;
      return;
    }
    box.innerHTML = `<p class="sm-count">${items.length === 30 ? 'Top 30' : items.length} result${items.length === 1 ? '' : 's'}</p>` + items.map((d, i) => `<a class="sm-item${i ? '' : ' on'}" role="option" id="smo${i}" aria-selected="${i ? 'false' : 'true'}" href="${d.url}" data-i="${i}">
      <span class="sm-area ${AREA_CLS[d.area] || ''}">${esc(d.area)}</span>
      <span class="sm-title">${mark(d.title, ts)}${d.head ? `<span class="sm-sep">›</span>${mark(d.head, ts)}` : ''}</span>
      ${d.text ? `<span class="sm-snip">${mark(snippet(d.text, ts), ts)}</span>` : ''}
      ${d.fix ? `<span class="sm-fix"><b>How to fix:</b> ${esc(d.fix.length > 170 ? d.fix.slice(0, 168).replace(/\s\S*$/, '') + '…' : d.fix)}</span>` : ''}
    </a>`).join('');
  }
  function move(n) {
    if (!items.length) return;
    sel = (sel + n + items.length) % items.length;
    box.querySelectorAll('.sm-item').forEach((a, i) => { a.classList.toggle('on', i === sel); a.setAttribute('aria-selected', i === sel); });
    box.querySelector('.sm-item.on')?.scrollIntoView({block: 'nearest'});
  }

  /* open a result: go to the page, then scroll to the heading and flash it */
  let pending = null;
  function go(d) {
    close();
    pending = d.head ? {head: d.head} : null;
    if (location.hash === d.url) { render(); } else location.hash = d.url;
  }
  document.addEventListener('pf:rendered', () => {
    if (!pending) return;
    const want = pending.head; pending = null;
    const main = document.querySelector('main'); if (!main) return;
    const h = [...main.querySelectorAll('h2,h3,summary')].find(x => clean(x.textContent) === want);
    if (!h) return;
    const det = h.closest('details'); if (det) det.open = true;
    const header = document.querySelector('header');
    window.scrollTo({top: h.getBoundingClientRect().top + window.scrollY - (header ? header.offsetHeight : 0) - 16});
    h.classList.remove('flash'); void h.offsetWidth; h.classList.add('flash');
  });

  function open(prefill) {
    if (!modal.hidden) { q.focus(); q.select(); return; }
    lastFocus = document.activeElement;
    modal.hidden = false; document.body.classList.add('sm-open');
    if (typeof prefill === 'string') q.value = prefill;
    draw(); q.focus(); q.select();
  }
  function close() {
    if (modal.hidden) return;
    modal.hidden = true; document.body.classList.remove('sm-open');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  window.openSearch = open;

  q.addEventListener('input', draw);
  q.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
    else if (e.key === 'Enter') { e.preventDefault(); if (items[sel]) go(items[sel]); }
    else if (e.key === 'Escape') { e.preventDefault(); close(); }
  });
  box.addEventListener('click', e => {
    const p = e.target.closest('[data-pop]');
    if (p) { q.value = p.dataset.pop; draw(); q.focus(); return; }
    const a = e.target.closest('.sm-item');
    if (a && !e.metaKey && !e.ctrlKey && !e.shiftKey) { e.preventDefault(); go(items[+a.dataset.i]); }
  });
  box.addEventListener('mousemove', e => {
    const a = e.target.closest('.sm-item'); if (!a || +a.dataset.i === sel) return;
    sel = +a.dataset.i; box.querySelectorAll('.sm-item').forEach((x, i) => x.classList.toggle('on', i === sel));
  });
  modal.addEventListener('mousedown', e => { if (e.target === modal) close(); });
  modal.querySelector('#smClose').onclick = close;
  /* keep Tab inside the dialog */
  modal.addEventListener('keydown', e => {
    if (e.key !== 'Tab') return;
    const f = [...modal.querySelectorAll('input,button,a.sm-item')].filter(x => x.offsetParent);
    if (!f.length) return;
    if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
  });

  document.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && lower(e.key) === 'k') { e.preventDefault(); modal.hidden ? open() : close(); return; }
    const t = e.target, typing = t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
    if (e.key === '/' && !typing && modal.hidden) { e.preventDefault(); open(); }
  });

  const btn = document.getElementById('searchBtn');
  if (btn) {
    btn.onclick = () => open();
    const k = btn.querySelector('kbd');
    if (k && !/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)) k.textContent = 'Ctrl K';
  }

  /* build the index when the browser is idle, so the first search is instant */
  (window.requestIdleCallback || (f => setTimeout(f, 600)))(() => { try { index(); } catch (_) {} });
})();
