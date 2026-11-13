/* Paygate10 Developer Docs — renderer.
   Content comes from data.js (generated from the live docs by tools/build_data.py):
     legacy     -> document.paygate10.com
   Hand-written API-side pages (PG10) live in this file. */

/* clickjacking: these docs only run in their own window or inside a page of this site */
(() => { let ok = window.top === window.self; try { ok = ok || window.top.location.origin === location.origin; } catch (_) { ok = false; }
  if (!ok) { document.documentElement.style.display = 'none'; try { window.top.location = location.href; } catch (_) { /* sandboxed */ } } })();
/* addresses can hold a malformed %-sequence: decode without ever throwing */
const dec = s => { try { return decodeURIComponent(s); } catch (_) { return String(s); } };
const D = window.PF_DATA.flows;
const TC = '<span class="tc">TO CONFIRM</span>';
const FLOW_NAME = {legacy: 'Paygate10 Gateway'}; 

/* ---------- helpers ---------- */
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const strip = s => String(s || '').replace(/<[^>]+>/g, '');
const norm = s => strip(s).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/* element text only: quotes stay as they are, so the JSON colouring below can find them */
const escText = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function hl(src, lang) {
  let h = escText(src);
  if (lang === 'json') {
    h = h.replace(/("(?:[^"\\]|\\.)*")(\s*:)?/g, (m, str, colon) => colon ? `<span class="k">${str}</span>${colon}` : `<span class="s">${str}</span>`)
         .replace(/\b(true|false|null|-?\d+(?:\.\d+)?)\b(?![^<]*>)/g, '<span class="n">$1</span>');
  }
  return h;
}
function code(src, lang = 'json') {
  return `<pre><span class="lang">${lang}</span><button class="copy">Copy</button><code style="all:unset">${hl(String(src).trim(), lang)}</code></pre>`;
}
function pretty(raw) {
  try { return {text: JSON.stringify(JSON.parse(raw), null, 2), lang: 'json'}; }
  catch (_) { return {text: raw, lang: 'json'}; }
}
function fields(rows) {
  return `<table><thead><tr><th>Field</th><th>Type</th><th>Required</th><th>Description</th></tr></thead><tbody>${
    rows.map(([f, t, r, d]) => `<tr><td><code>${f}</code></td><td>${t}</td><td>${
      r === true ? '<span class="req">Required</span>' : r === false ? '<span class="opt">Optional</span>' : r}</td><td>${d}</td></tr>`).join('')
  }</tbody></table>`;
}
function table(head, rows) {
  return `<table><thead><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${
    rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
}
const ep = (m, p, extra = '') => `<div class="endpoint"><span class="method ${m.toLowerCase()}">${m}</span><span>${p}</span>${extra}</div>`;
let tabSeq = 0;
function tabs(items) {
  const id = 't' + (++tabSeq);
  return `<div class="tabs" data-tabs="${id}">${items.map((t, i) => `<button class="${i ? '' : 'on'}" data-i="${i}">${t[0]}</button>`).join('')}</div>` +
    items.map((t, i) => `<div class="tabpane ${i ? '' : 'on'}" data-pane="${id}-${i}">${t[1]}</div>`).join('');
}

/* ---------- source data accessors ---------- */
const page = (flow, p) => D[flow].pages[p];
const SKIP_OTHER = new Set(['introduction', 'endpoint', 'request-body', 'response-body']);
const otherOps = flow => page(flow, 'other').sections.filter(s => !SKIP_OTHER.has(s.id));

function endpointInfo(flow, p) {
  const sec = page(flow, p).sections.find(s => s.id === 'endpoint');
  const info = {};
  (sec ? sec.blocks : []).forEach(b => {
    const m = strip(b.html).match(/^\s*([^:]+):\s*(.*)$/);
    if (m) info[m[1].trim().toLowerCase()] = m[2].trim();
  });
  return info;
}
const prodUrl = flow => endpointInfo(flow, 'index')['production url'];
const API_URL = prodUrl('legacy');
/* not offered on this site: refunds are handled manually, prefunding quotes are not used */
const HIDDEN = new Set(['refund', 'op-payout-prefunding-quote', 'op-payout-prefunding-approve-quote', 'op-accept-quote']);
const HIDE_RECIPE = r => /^(Refund|Payout Prefunding Quote|Payout Prefunding Approve Quote|Accept Quote) ·/.test(r.label);
const steps = items => `<ol class="steps">${items.map(([b, t]) => `<li><b>${b}</b>${t}</li>`).join('')}</ol>`;
/* per-page hooks for the interactive pages: INIT[pageId](arg) runs after the page is drawn */
const INIT = {};
/* sidebar groups the reader folded away (kept in this browser) */
const CLOSED = new Set((() => { try { return JSON.parse(localStorage.getItem('pf-nav-closed') || '[]'); } catch (_) { return []; } })());
const sourceLink = () => ''; /* this site is the source of truth: no links to other sites */

/* ---------- generic block rendering ---------- */
function mandatoryCell(v) {
  const t = strip(v).trim();
  if (/^yes$/i.test(t)) return '<span class="badge yes">Yes</span>';
  if (/^no$/i.test(t)) return '<span class="badge no">No</span>';
  if (/^conditional/i.test(t)) return `<span class="badge cond">Conditional</span><span class="cond-note">${v.replace(/^\s*Conditional\s*/i, '')}</span>`;
  return v || '—';
}
function renderTable(b) {
  const mi = b.head.findIndex(h => /mandatory|required/i.test(h));
  return `<table><thead><tr>${b.head.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${
    b.rows.map(r => `<tr>${r.map((c, i) => `<td>${i === 0 && !/<code>/.test(c) && b.head[0] === 'Parameter' ? `<code>${c}</code>` : i === mi ? mandatoryCell(c) : c}</td>`).join('')}</tr>`).join('')
  }</tbody></table>`;
}
const fixLinks = h => String(h)
  .replace(/href="(?:index\.shtml)?#request-signature"/g, 'href="#/legacy/signing/hmac"')
  .replace(/href="(payout|refund|balance|other|error-code)\.shtml[^"]*"/g, (m, p) => `href="#/legacy/${{payout: 'payout', refund: 'refund', balance: 'balance', other: 'op-get-status', 'error-code': 'errors'}[p]}"`);
function renderBlocks(flow, blocks) {
  return blocks.map(b => {
    switch (b.kind) {
      case 'h3': return `<h3>${b.html}</h3>`;
      case 'h4': case 'h5': return `<h4>${b.html}</h4>`;
      case 'p': return `<p>${fixLinks(b.html)}</p>`;
      case 'ul': return `<ul>${b.items.map(i => `<li>${fixLinks(i)}</li>`).join('')}</ul>`;
      case 'table': return renderTable(b);
      case 'pre': {
        const f = strip(b.html).trim();
        if (/^X-Callback-Signature:/i.test(f)) return `<div class="formula"><span>${esc(f)}</span><a href="#/playground/hmac">Try it →</a></div>`;
        if (/^SHA256\(/i.test(f)) {
          const idx = D[flow].recipes.findIndex(r => r.formula === f);
          return `<div class="formula"><span>${esc(f)}</span>${idx >= 0 ? `<a href="#/playground/${idx}">Try it →</a>` : ''}</div>`;
        }
        return code(strip(b.html), 'text');
      }
    }
    return '';
  }).join('');
}
function renderSection(flow, s, level = 'h2') {
  if (s.id === 'introduction') return `<p class="lead">${s.blocks.map(b => strip(b.html || '')).join(' ')}</p>`;
  if (s.id === 'endpoint') return renderEndpoint(flow, s);
  return `<section id="${s.id}"><${level}>${s.title}</${level}>${renderBlocks(flow, s.blocks)}</section>`;
}
function renderEndpoint(flow, s) {
  const info = {};
  s.blocks.forEach(b => { const m = strip(b.html).match(/^\s*([^:]+):\s*(.*)$/); if (m) info[m[1].trim().toLowerCase()] = m[2].trim(); });
  const url = info['production url'] ?? info['url'];
  const label = info['production url'] !== undefined ? 'Production' : 'Sandbox';
  return `<section id="endpoint"><h2>Endpoint</h2>
    ${ep(info['http method'] || 'POST', url ? esc(url) : `&lt;${label.toLowerCase()} URL&gt; ${TC}`)}
    ${info['content-type'] ? table(['Header', 'Value'], [['<code>Content-Type</code>', `<code>${esc(info['content-type'])}</code>`],
      ...(info['header'] ? [[`<code>${esc(info['header'].split(':')[0].trim())}</code>`, `<code>${esc(info['header'].split(':').slice(1).join(':').trim())}</code>`]] : [])]) : ''}
    ${url ? '' : `<div class="callout warn"><p>The ${label.toLowerCase()} URL is blank on ${D[flow].source}.</p></div>`}</section>`;
}
function examplesBox(list, heading = 'Examples') {
  if (!list || !list.length) return '';
  const id = 'ex' + (++tabSeq);
  return `<section id="examples"><h2>${heading}</h2><div class="ex" data-ex="${id}">
    ${list.length > 1 ? `<select aria-label="Choose example">${list.map((e, i) => `<option value="${i}">${esc(e.title)}</option>`).join('')}</select>` : `<b>${esc(list[0].title)}</b>`}
    ${list.map((e, i) => `<div class="expane" data-i="${i}" style="${i ? 'display:none' : ''}">
      ${e.notes ? `<div class="note">${esc(e.notes.replace(/^\(Notes:\s*|\)$/g, ''))}</div>` : ''}
      ${tabs([['Request', code(pretty(e.request).text)], ['Response — success', code(pretty(e.response).text)],
              ...(e.failResponse ? [['Response — fail', code(pretty(e.failResponse).text)]] : [])])}
    </div>`).join('')}
  </div></section>`;
}
function toc(secs, extra = []) {
  const items = secs.filter(s => s.title && s.id !== 'introduction').map(s => [s.id, s.id === 'endpoint' ? 'Endpoint' : s.title]).concat(extra);
  return `<nav class="toc">${items.map(([id, t]) => `<a href="#" data-jump="${id}">${t}</a>`).join('')}</nav>`;
}

/* ---------- API pages from source ---------- */
const API_PAGES = {payin: ['index', 'Payin', './'], payout: ['payout', 'Payout', 'payout.shtml'], refund: ['refund', 'Refund', 'refund.shtml'], balance: ['balance', 'Get Balance', 'balance.shtml']};
function apiPage(flow, key) {
  const [p, title, path] = API_PAGES[key];
  const d = page(flow, p);
  const intro = d.sections.filter(s => s.id === 'introduction'), rest = d.sections.filter(s => s.id !== 'introduction');
  return `<h1>${title}</h1>${intro.map(s => renderSection(flow, s)).join('')}
    ${toc(rest, d.examples && d.examples.length ? [['examples', 'Examples']] : [])}
    ${rest.map(s => renderSection(flow, s)).join('')}
    ${examplesBox(d.examples)}
    ${sourceLink(flow, path === './' ? '' : path)}`;
}
function opPage(flow, opId) {
  const d = page(flow, 'other');
  const s = d.sections.find(x => x.id === opId);
  const ex = (d.examples || []).filter(e => norm(e.title).startsWith(norm(s.title)));
  const common = d.sections.filter(x => SKIP_OTHER.has(x.id) && x.id !== 'introduction');
  return `<h1>${s.title}</h1>${sourceLink(flow, 'other.shtml')}
    ${renderBlocks(flow, s.blocks)}
    ${examplesBox(ex)}
    <h2>Common to all “Others” requests</h2>
    ${common.map(x => renderSection(flow, x, 'h3')).join('')}`;
}

/* ---------- error codes ---------- */
function errorsPage(flow, q = '') {
  const list = D[flow].errors;
  return `<h1>Error codes</h1>${sourceLink(flow, 'error-code.shtml')}
  <p class="lead">Errors are returned in the response <code>error[]</code> array as <code>{ errorCode, errorMessage }</code>. Search for the code or a word from the message to see what it means and how to fix it. Each row shows the API v2 code, with the v1 (PG10) code under it for merchants still on v1.</p>
  <input class="errsearch" id="errSearch" type="search" placeholder="Search by code or message, e.g. 11031 or hash" aria-label="Search error codes" value="${esc(q)}">
  <p class="count" id="errCount">${list.length} codes</p>
  <table id="errTable" class="errtable"><thead><tr><th>Code</th><th>Message</th><th>How to fix</th></tr></thead><tbody>${
    list.map(e => `<tr data-s="${esc(`${e.ErrorCode} ${e.ErrorMessage || ''} ${e.v1ErrorCode || ''} ${e.v1ErrorMessage || ''}`.toLowerCase()).replace(/"/g, '&quot;')}"><td><code>${esc(e.ErrorCode)}</code>${e.v1ErrorCode ? `<small class="v1">v1 ${esc(e.v1ErrorCode)}</small>` : ''}</td><td>${esc(e.ErrorMessage || '')}</td><td class="errfix">${ERROR_FIX(e.ErrorCode, e.ErrorMessage)}</td></tr>`).join('')
  }</tbody></table>`;
}

/* ---------- navigation ---------- */
function nav(flow) {
  const ops = otherOps(flow).map(s => ['op-' + s.id, s.title]);
  const groups = [
    ['Get started', [['overview', 'Overview'], ['getting-started', 'Integration steps'], ['signing', 'Signing & hashes']]],
    ['Transactions', [['payin', 'Payin'], ['payout', 'Payout'], ['refund', 'Refund']]],
    ['Account & utilities', [['balance', 'Get Balance'], ...ops]],
    ['Reference', [['errors', 'Error codes'], ['pg10', 'v1 and v2 compatibility']]],
  ];
  return groups;
}

/* ---------- hand-written guide pages ---------- */
const P = {};


P.pg10 = () => `
<h1>v1 and v2 compatibility</h1>
<p class="lead">The Gateway accepts both API versions: v1 (the PG10 format) and v2 (the format on these pages). They are compatible, so a v1 integration keeps working.</p>
${table(['You are', 'Use'], [
  ['<b>A new merchant</b>, integrating for the first time', '<b>API v2</b>, as documented on these pages.'],
  ['<b>An existing merchant migrating</b> from PG10', '<b>API v1</b>: keep your current integration. You can move to v2 when it suits you; the mapping below shows what changes.'],
])}
<h2>Field mapping: v1 to v2</h2>
${table(['PG10 (v1)', 'API v2'], [
  ['Header <code>X-Version</code>', 'Header <code>api-version: 2.0</code>'],
  ['<code>request_type</code>: <code>deposit</code> / <code>withdrawal</code>', '<code>requestType</code>: <code>PAYIN</code> / <code>PAYOUT</code>'],
  ['<code>midcode</code>', '<code>midCode</code>'],
  ['<code>merchant_ref_no</code>', '<code>merchantRefNo</code>'],
  ['<code>checkout_type</code>: <code>Hosted</code> / <code>Seamless</code>', '<code>integrationType</code>: <code>PG_H</code> / <code>S</code>'],
  ['<code>payby</code>', '<code>paymentMethod</code>'],
  ['<code>notification_url</code>, <code>returnurl</code>', '<code>merchantUrl.notificationUrl</code>, <code>merchantUrl.returnUrl</code>'],
  ['<code>custom_field_1</code> … <code>custom_field_6</code>', '<code>customField.customField1</code> … <code>customField5</code>'],
  ['<code>risk_data</code>', '<code>riskData</code>'],
  ['Error codes <code>15xxx</code>', 'Error codes <code>11xxx</code> — mapping in <a href="#/legacy/errors">Error codes</a>'],
])}
<p>Hashing is unchanged in principle (SHA-256 over <code>~</code>-joined fields with the MID secret), but recipes are per method — use the <a href="#/legacy/signing">v2 recipes</a>.</p>`;

/* ---------- landing ---------- */
function landing() { return ''; }

/* ---------- router ---------- */
const app = document.getElementById('app');
function resolve(flow, id) {
  if (API_PAGES[id]) return () => apiPage(flow, id);
  if (id && id.startsWith('op-')) return () => opPage(flow, id.slice(3));
  if (id === 'errors') return arg => errorsPage(flow, arg ? dec(arg) : '');
  return P[id] ? () => P[id](flow) : null;
}
/* phones hide the header tabs, so the slide-out menu repeats them at the top */
const mobileTabs = () => `<div class="mtabs">${[...document.querySelectorAll('#switch a')].map(a => `<a href="${a.getAttribute('href')}" data-tab="${a.dataset.tab}">${a.textContent}</a>`).join('')}</div>`;
/* Sections: '' = docs home, 'legacy' = guide + API reference (legacy.js). */
function render() {
  const [, sec, id, arg] = (location.hash || '#/').split('/');
  document.body.classList.remove('menu');
  const setTab = tab => document.querySelectorAll('#switch a, .mtabs a').forEach(a => a.classList.toggle('on', a.dataset.tab === tab));
  setTab(null);
  /* old links: the playground and the methods/products pages are now their own tabs */
  const MOVED = {'legacy/playground': '#/playground', 'legacy/methods': '#/methods', 'legacy/products': '#/methods', 'legacy/hashes': '#/legacy/signing', 'legacy/refund': '#/legacy/support', 'legacy/refunds': '#/legacy/support',
    'legacy/op-payout-prefunding-quote': '#/legacy/api-overview', 'legacy/op-payout-prefunding-approve-quote': '#/legacy/api-overview', 'legacy/op-accept-quote': '#/legacy/api-overview'};
  if (MOVED[sec + '/' + id]) { location.replace(MOVED[sec + '/' + id] + (arg ? '/' + arg : '')); return; }
  if (sec === 'guide') { location.replace('#/'); return; }
  /* full-width tool pages without a side menu */
  const SOLO = {playground: ['Hash playground', () => LG.playground()], methods: ['Payment methods', () => PM.page()]};
  if (SOLO[sec]) {
    app.innerHTML = `<div class="layout solo" data-sec="${sec}"><nav class="side">${mobileTabs()}</nav><main>${SOLO[sec][1]()}</main></div>`;
    setTab(sec); document.title = SOLO[sec][0] + ' · Paygate10 Docs'; window.scrollTo(0, 0); afterRender(sec); return;
  }
  const isGuide = sec === 'guide' && typeof GUIDE_NAV !== 'undefined';
  if (!isGuide && !D[sec]) {
    app.innerHTML = typeof docsHome === 'function' ? docsHome() : landing();
    document.title = 'Paygate10 Developer Docs'; window.scrollTo(0, 0); afterRender('home'); return;
  }
  /* each header tab has its own side menu: the Integration guide never lists API reference pages, and vice versa */
  const tabOf = g => /^API reference/.test(g) ? 'api' : 'docs';
  const all = isGuide ? GUIDE_NAV : nav(sec);
  const homes = all.flatMap(([g, items]) => items.filter(i => i[0] === id).map(() => tabOf(g)));
  const onScreen = (app.querySelector('.layout')?.dataset.sec || '').split('-')[1];
  const tab = homes.includes(onScreen) ? onScreen : homes[0] || 'docs';
  const groups = isGuide ? all : all.filter(([g]) => tabOf(g) === tab);
  const label = isGuide ? 'About' : tab === 'api' ? 'API reference' : 'Integration guide';
  const flat = groups.flatMap(([g, items]) => items.map(i => [...i, g]));
  /* a guide page reachable by link but not listed in the menu still opens (instead of falling back to the first page) */
  const cur = flat.find(i => i[0] === id) || (isGuide && id && G[id] ? [id, id, 'Guides'] : flat[0]);
  const idx = flat.indexOf(cur), prev = flat[idx - 1], next = flat[idx + 1];
  const body = isGuide ? G[cur[0]]() : resolve(sec, cur[0])(arg);
  const pager = `<div class="pager">${prev ? `<a href="#/${sec}/${prev[0]}" class="pg-prev"><small>← Previous</small>${prev[1]}</a>` : '<span></span>'}${next ? `<a href="#/${sec}/${next[0]}" class="pg-next"><small>Next →</small>${next[1]}</a>` : ''}</div>
    <div class="page-help"><span>Need help? Reach out on your integration channel · <a href="#/legacy/${tab === 'api' ? 'errors' : 'support'}">${tab === 'api' ? 'Error codes and fixes' : 'How to raise an issue'}</a></span></div>`;
  const gName = g => g.replace(/^API reference · /, '');
  const crumb = `<nav class="crumb" aria-label="Breadcrumb"><a href="#/${sec}/${flat[0][0]}">${label}</a><span>/</span>${gName(cur[2])}<span>/</span><b>${cur[1]}</b></nav>`;
  const label2 = `${cur[1]} · ${label} · Paygate10 Docs`;
  /* Same section already on screen: swap only the content, so the left menu keeps its scroll position. */
  setTab(isGuide ? 'about' : tab);
  const layout = app.querySelector('.layout');
  if (layout && layout.dataset.sec === sec + '-' + tab) {
    layout.querySelector('main').innerHTML = `${crumb}${body}${pager}`;
    const side = layout.querySelector('nav.side');
    side.querySelectorAll('a[href^="#/' + sec + '/"]').forEach(a => a.classList.toggle('on', a.getAttribute('href') === `#/${sec}/${cur[0]}`));
    const g = side.querySelector('.sg a.on')?.closest('.sg'); if (g && g.classList.contains('closed')) { g.classList.remove('closed'); g.querySelector('.sg-h').setAttribute('aria-expanded', 'true'); }
    const on = side.querySelector('a.on');
    if (on && (on.offsetTop < side.scrollTop || on.offsetTop > side.scrollTop + side.clientHeight - 40)) side.scrollTop = on.offsetTop - side.clientHeight / 3;
    document.title = label2;
    window.scrollTo(0, 0);
    afterRender(cur[0], arg);
    return;
  }
  const sideTop = isGuide ? '' : `<div class="side-product">${tab === 'api' ? 'API reference' : 'Integration guide'} <small>Paygate10 Gateway</small></div>`;
  app.innerHTML = `<div class="layout" data-sec="${sec}-${tab}">
    <nav class="side">${mobileTabs()}${sideTop}<input id="navFilter" type="search" placeholder="Filter this menu" aria-label="Filter the menu by page title">
      ${groups.map(([g, items]) => { const k = tab + ':' + gName(g), open = !CLOSED.has(k) || items.some(([pid]) => pid === cur[0]);
        return `<div class="sg${open ? '' : ' closed'}" data-g="${k}"><h4><button type="button" class="sg-h" aria-expanded="${open}">${gName(g)}<span class="sg-chev" aria-hidden="true"></span></button></h4>${items.map(([pid, t]) => `<a href="#/${sec}/${pid}" class="${pid === cur[0] ? 'on' : ''}">${t}</a>`).join('')}</div>`; }).join('')}
    </nav>
    <main>${crumb}${body}${pager}</main></div>`;
  setTab(isGuide ? 'about' : tab); /* again, for the menu's own tab row */
  document.title = label2;
  window.scrollTo(0, 0);
  afterRender(cur[0], arg);
}
window.addEventListener('hashchange', render);

/* ---------- error filter: every word must match (code, message or v1 code) ---------- */
function filterErrors() {
  const box = document.getElementById('errSearch'); if (!box) return;
  const words = box.value.toLowerCase().split(/\s+/).filter(Boolean); let n = 0;
  document.querySelectorAll('#errTable tbody tr').forEach(tr => {
    const t = tr.dataset.s || tr.textContent.toLowerCase(), show = words.every(w => t.includes(w));
    tr.style.display = show ? '' : 'none'; n += show;
  });
  const total = document.querySelectorAll('#errTable tbody tr').length;
  document.getElementById('errCount').textContent = n === total ? `${total} codes` : n ? `${n} of ${total} codes` : 'No codes match. Try a code number or one word from the message.';
}

/* ---------- after every render ---------- */
function afterRender(pageId, arg) {
  /* soft fade-in for the new page content */
  const m = document.querySelector('#app main') || document.getElementById('app');
  m.classList.remove('enter'); void m.offsetWidth; m.classList.add('enter');
  /* wrap tables so they fill the frame and scroll sideways on small screens */
  document.querySelectorAll('#app table').forEach(t => { if (!t.parentElement.classList.contains('tw')) { const w = document.createElement('div'); w.className = 'tw'; t.replaceWith(w); w.appendChild(t); } });
  if (pageId === 'errors') filterErrors();
  if (INIT[pageId]) INIT[pageId](arg ? dec(arg) : '');
  document.dispatchEvent(new CustomEvent('pf:rendered', {detail: {pageId, arg}}));
}

/* ---------- UI events ---------- */
document.addEventListener('click', e => {
  const c = e.target.closest('.copy');
  if (c) { navigator.clipboard?.writeText(c.parentElement.querySelector('code').innerText); c.textContent = 'Copied'; setTimeout(() => c.textContent = 'Copy', 1200); }
  const tb = e.target.closest('.tabs button');
  if (tb) {
    const id = tb.parentElement.dataset.tabs, i = tb.dataset.i;
    tb.parentElement.querySelectorAll('button').forEach(b => b.classList.toggle('on', b === tb));
    document.querySelectorAll(`[data-pane^="${id}-"]`).forEach(p => p.classList.toggle('on', p.dataset.pane === `${id}-${i}`));
  }
  const ds = e.target.closest('[data-search]');
  if (ds) { e.preventDefault(); window.openSearch?.(ds.dataset.search); }
  /* sidebar group headings fold their links */
  const gh = e.target.closest('.sg-h');
  if (gh) {
    const g = gh.closest('.sg'), closed = g.classList.toggle('closed');
    gh.setAttribute('aria-expanded', !closed);
    closed ? CLOSED.add(g.dataset.g) : CLOSED.delete(g.dataset.g);
    try { localStorage.setItem('pf-nav-closed', JSON.stringify([...CLOSED])); } catch (_) { /* ignore */ }
    return;
  }
  /* in-page links (section shortcuts): scroll to the target, opening any folded parent first */
  const j = e.target.closest('[data-jump]');
  if (j) {
    e.preventDefault();
    const el = document.getElementById(j.dataset.jump);
    if (el) { for (let p = el.parentElement; p; p = p.parentElement) if (p.tagName === 'DETAILS') p.open = true;
      el.scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start'});
      /* if smooth scrolling is unavailable or interrupted, land on the section anyway */
      setTimeout(() => { if (Math.abs(el.getBoundingClientRect().top - 84) > 40 && innerHeight + scrollY < document.documentElement.scrollHeight - 2) el.scrollIntoView({block: 'start'}); }, 800);
      el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); }
  }
});
document.addEventListener('change', e => {
  const box = e.target.closest('.ex');
  if (box && e.target.tagName === 'SELECT') box.querySelectorAll('.expane').forEach(p => p.style.display = p.dataset.i === e.target.value ? '' : 'none');
});
document.addEventListener('input', e => {
  if (e.target.id === 'navFilter') {
    const q = e.target.value.toLowerCase().trim(), side = e.target.closest('nav.side'); let any = 0;
    side.classList.toggle('filtering', !!q);
    side.querySelectorAll('h4').forEach(h => {
      let n = h.nextElementSibling, shown = 0;
      while (n && n.tagName === 'A') { const ok = n.textContent.toLowerCase().includes(q); n.style.display = ok ? '' : 'none'; shown += ok; n = n.nextElementSibling; }
      h.style.display = shown ? '' : 'none'; any += shown;
    });
    let none = side.querySelector('.side-none');
    if (!none) { none = document.createElement('p'); none.className = 'side-none'; e.target.after(none); }
    none.innerHTML = any ? '' : `No page titles match. <a href="#" data-search="${esc(e.target.value)}">Search all the docs for “${esc(e.target.value)}” →</a>`;
    none.style.display = any ? 'none' : '';
  }
  if (e.target.id === 'errSearch') filterErrors();
});
document.getElementById('menuBtn').onclick = () => document.body.classList.toggle('menu');
document.getElementById('themeBtn').onclick = () => {
  const r = document.documentElement, dark = r.dataset.theme ? r.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  /* switch colours instantly: no element should animate its colours on a theme change */
  r.classList.add('theme-switching'); r.dataset.theme = dark ? 'light' : 'dark'; void r.offsetWidth;
  setTimeout(() => r.classList.remove('theme-switching'), 0);
  try { localStorage.setItem('pf-theme', r.dataset.theme); } catch (_) {}
};
try { const t = localStorage.getItem('pf-theme'); if (t) document.documentElement.dataset.theme = t; } catch (_) {}

/* ---------- SHA-256 (pure JS: works offline and on file://) ---------- */
const sha256 = (() => {
  const primes = []; for (let n = 2; primes.length < 64; n++) { let p = true; for (let d = 2; d * d <= n; d++) if (n % d === 0) { p = false; break; } if (p) primes.push(n); }
  const frac = x => ((x - Math.floor(x)) * 4294967296) >>> 0;
  const K = primes.map(p => frac(Math.cbrt(p))), H0 = primes.slice(0, 8).map(p => frac(Math.sqrt(p)));
  const rotr = (x, n) => (x >>> n) | (x << (32 - n));
  return input => {
    const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : input, l = bytes.length;
    const buf = new Uint8Array(((l + 9 + 63) >> 6) << 6); buf.set(bytes); buf[l] = 0x80;
    const dv = new DataView(buf.buffer); dv.setUint32(buf.length - 4, (l * 8) >>> 0); dv.setUint32(buf.length - 8, Math.floor(l / 536870912));
    const H = H0.slice(), W = new Uint32Array(64);
    for (let i = 0; i < buf.length; i += 64) {
      for (let t = 0; t < 16; t++) W[t] = dv.getUint32(i + t * 4);
      for (let t = 16; t < 64; t++) { const a = W[t - 15], b = W[t - 2]; W[t] = (W[t - 16] + (rotr(a, 7) ^ rotr(a, 18) ^ (a >>> 3)) + W[t - 7] + (rotr(b, 17) ^ rotr(b, 19) ^ (b >>> 10))) >>> 0; }
      let [a, b, c, d, e, f, g, h] = H;
      for (let t = 0; t < 64; t++) {
        const t1 = (h + (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) + ((e & f) ^ (~e & g)) + K[t] + W[t]) >>> 0;
        const t2 = ((rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) >>> 0;
        h = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
      }
      [a, b, c, d, e, f, g, h].forEach((v, j) => H[j] = (H[j] + v) >>> 0);
    }
    const out = new Uint8Array(32); H.forEach((x, j) => new DataView(out.buffer).setUint32(j * 4, x));
    return typeof input === 'string' || !sha256.raw ? [...out].map(b => b.toString(16).padStart(2, '0')).join('') : out;
  };
})();
/* raw-bytes digest, used by HMAC */
const sha256raw = bytes => { sha256.raw = true; try { return sha256(bytes); } finally { sha256.raw = false; } };
/* HMAC-SHA256(key, message) -> hex, both UTF-8 strings */
function hmacSha256(key, msg) {
  const enc = new TextEncoder(); let k = enc.encode(key);
  if (k.length > 64) k = sha256raw(k);
  const pad = v => { const b = new Uint8Array(64); b.set(k); return b.map(x => x ^ v); };
  const cat = (a, b) => { const c = new Uint8Array(a.length + b.length); c.set(a); c.set(b, a.length); return c; };
  const inner = sha256raw(cat(pad(0x36), enc.encode(msg)));
  return [...sha256raw(cat(pad(0x5c), inner))].map(b => b.toString(16).padStart(2, '0')).join('');
}

/* recipe "SHA256(a~b~midsecret~c)" -> {tokens, sep}; callback recipes are space-listed and joined without separator */
function parseRecipe(formula) {
  const inner = formula.replace(/^SHA256\(/i, '').replace(/\)\s*$/, '');
  return inner.includes('~') ? {tokens: inner.split('~').map(s => s.trim()), sep: '~'} : {tokens: inner.split(/\s+/), sep: ''};
}
const isSecret = t => /^(midsecret|rcode)$/i.test(t);

/* page routes the error fixes link to (error-fixes.js) */
window.ERR_LINKS = {hash: '#/legacy/hash-help', signing: '#/legacy/signing', playground: '#/playground', callbacks: '#/legacy/callbacks',
  support: '#/legacy/support', status: '#/legacy/op-get-status', balance: '#/legacy/balance', funding: '#/legacy/payouts-guide',
  payin: '#/legacy/payin', payout: '#/legacy/payout', refund: '#/legacy/support', txlist: '#/legacy/op-get-transaction-list',
  quote: '#/legacy/support', banklist: '#/legacy/op-get-bank-list'};

window.addEventListener('DOMContentLoaded', render);
