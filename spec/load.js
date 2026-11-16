/* Puts the spec files together for the site (loaded after spec/*.js, before app.js). Nothing to edit here.
   Hash recipes are read from the SHA256(...) code blocks in the spec, so each formula lives in one place only. */
(() => {
  const pages = Object.assign({}, window.PF_SPEC, {'error-code': {sections: [], examples: null}});
  const strip = s => String(s || '').replace(/<[^>]+>/g, '');
  const TITLE = {index: 'Payin', payout: 'Payout', refund: 'Refund', balance: 'Get Balance', other: 'Others'};
  const OTHER_SHARED = new Set(['introduction', 'endpoint', 'request-body', 'response-body']);
  const recipes = [];
  Object.keys(TITLE).forEach(page => {
    if (!pages[page]) return;
    let op = '';
    pages[page].sections.forEach(sec => {
      if (page === 'other' && !OTHER_SHARED.has(sec.id)) op = sec.title;
      let h3 = '', h4 = '';
      sec.blocks.forEach(b => {
        if (b.kind === 'h3') { h3 = strip(b.html); h4 = ''; }
        else if (b.kind === 'h4') h4 = strip(b.html);
        else if (b.kind === 'pre' && strip(b.html).trim().toUpperCase().startsWith('SHA256(')) {
          const kind = /Hash|Signature/.test(h3) ? h3 : 'Request Hash';
          const label = [op || TITLE[page], kind, h4 !== 'Instructions:' ? h4 : ''].filter(Boolean).join(' · ');
          recipes.push({page, label, formula: strip(b.html).trim()});
        }
      });
    });
  });
  window.PF_DATA = {flows: {legacy: {site: 'gateway', source: '', pages, recipes, errors: window.PF_ERRORS || []}}};
})();
