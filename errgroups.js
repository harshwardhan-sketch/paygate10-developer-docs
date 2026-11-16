/* Error codes page, grouped: the most common codes first, then one folding section per kind of problem
   (signing, request format, setup, fields, limits, declines, status, our side …), each with what to do.
   Same file on both docs sites. Codes are put in a group by their message, so a re-import still lands each
   new code somewhere sensible ("Other" is the fallback). */
const ERR_GROUPS = [
  {k: 'system', t: 'On our side', d: 'Something failed inside the gateway. The payment may still go through.', act: 'Check status first', tone: 'warn',
    m: /internal (system )?error|something went wrong|currently down|could not process transaction|processor not found|could not find bank account|reason unknown|transaction could not be processed/},
  {k: 'signing', t: 'Signing and hash', d: 'The hash or signature is missing, malformed or does not match ours.', act: 'Fix and send again', tone: 'fix',
    m: /hash|signature/},
  {k: 'quotes', t: 'Quotes and FX', d: 'Problems creating, approving or using a quote, or getting an FX rate.', act: 'Fix and send again', tone: 'fix',
    m: /quote|fx rate|requestamount|includefee|requestappliesfor|sendingcurrency|receivingcurrency|payoutfor|sender_?kyc|receiver_?kyc|receiverfullname|senderfullname/},
  {k: 'services', t: 'UPI recurring and Aadhaar KYC', d: 'Only for these optional services.', act: 'Fix and send again', tone: 'fix',
    m: /aadhaar|otp|subscription|plan|recurring|\bkyc\b/},
  {k: 'trade', t: 'Trade (export) details', d: 'The BusinessTransaction object for export payments is missing a field or a value is too long.', act: 'Fix and send again', tone: 'fix',
    m: /businesstransaction|businesstype|origincountry|useridnumber|userdob|userbirthplace|shipping|hsncode|codeofpurpose|loadingport|usercountry|exporttxn/},
  {k: 'lookups', t: 'Status and transaction list requests', d: 'A field in Get Status or Get Transaction List is missing or out of range.', act: 'Fix and send again', tone: 'fix',
    m: /from_date|to_date|\bskip\b|\btake\b|page value|limit must be between|transaction_id|transaction id not found|get_status|transactionlist|get_balance|balance feature/},
  {k: 'limits', t: 'Limits', d: 'An amount, count or velocity limit was reached, or your balance is too low.', act: 'Retry later or change the amount', tone: 'wait',
    m: /limit|exceed|minimum|maximum|velocity|attempts|insufficient|daily usage/},
  {k: 'declined', t: 'Declined by the bank, wallet or risk checks', d: 'The request was valid but the payment was refused or not completed.', act: "Don't retry the same details", tone: 'stop',
    m: /declined|failed|rejected|blacklisted|blocked|frozen|incorrect account|incorrect wallet|nre account|abandoned|timeout|did not authori|inactive wallet|suspended|restricted|not working|user not approved/},
  {k: 'status', t: 'Duplicates and payments in progress', d: 'The payment already exists, is still open or was already completed.', act: 'Check status, don\'t resend', tone: 'warn',
    m: /duplicate|already|in progress|in-process|pending|request accepted|same request/},
  {k: 'setup', t: 'Your account and setup', d: 'Something is not enabled or configured on your MID.', act: 'Contact us', tone: 'stop',
    m: /midcode|account disabled|disabled|not supported|not enabled|not configured|not available|not allowed|gst|tdr|merchant category|account is locked|not mapped|user not found|password incorrect|user inactive|country not found|validation failed/},
  {k: 'format', t: 'Request format', d: 'The body could not be read, a required object or URL is missing, or the request type or method is not a known value.', act: 'Fix and send again', tone: 'fix',
    m: /invalid request|requesttype|object null|getting null|request object|integrationtype|transaction.?type|payout_type|payment.?method|wallet required/},
  {k: 'money', t: 'Amount, currency and reference', d: 'The amount, currency, country or your merchantRefNo is missing or not valid.', act: 'Fix and send again', tone: 'fix',
    m: /amount|currency|country|merchantrefno/},
  {k: 'payment', t: 'Bank, wallet, UPI and card details', d: 'Where the money goes or comes from: account, IFSC, bank code, wallet number, UPI ID or card.', act: 'Fix and send again', tone: 'fix',
    m: /account|ifsc|bank|wallet|vpa|card|cvv|year|month/},
  {k: 'customer', t: 'Customer details', d: 'Name, phone, email, address, document or risk data is missing or in the wrong format.', act: 'Fix and send again', tone: 'fix',
    m: /name|phone|email|address|city|state|postcode|ipaddress|document|riskdata|senderdetails|\bpin\b|cpf|cnpj|file|fieldname|base64|mb limit|png/},
  {k: 'other', t: 'Other', d: 'Codes that don\'t fit the groups above.', act: 'See the fix', tone: 'fix', m: /./},
];
/* the codes merchants hit most, shown as cards at the top */
const ERR_COMMON = [
  ['11031', 'Hash does not match'], ['11027', 'Duplicate merchantRefNo'], ['11002', 'Invalid midCode'], ['11063', 'Invalid request'],
  ['11032', 'Amount below minimum'], ['11081', 'Balance too low for payout'], ['11010', 'Hash missing'], ['00', 'Internal error'],
];
/* codes whose message would land them in the wrong group */
const ERR_PIN = {'00': 'system', '02': 'system', '01': 'declined', '11008': 'format', '11009': 'format', '11297': 'declined',
  '11317': 'customer', '11319': 'customer', '11221': 'customer', '11448': 'customer', '11451': 'customer', '11440': 'money',
  '11049': 'payment', '11096': 'payment', '11318': 'payment', '11434': 'payment'};
function errGroupOf(e) {
  if (ERR_PIN[e.ErrorCode]) return ERR_PIN[e.ErrorCode];
  const s = (e.ErrorMessage || '').toLowerCase();
  return ERR_GROUPS.find(g => g.m.test(s)).k;
}
/* list: error objects; row(e) -> <tr>…</tr>; hide(e, group) -> true for codes of removed features; q: search text from the address */
function errorsGrouped(list, row, hide, q = '') {
  const shown = hide ? list.filter(e => !hide(e, errGroupOf(e))) : list;
  const by = {}; shown.forEach(e => (by[errGroupOf(e)] ||= []).push(e));
  const ORDER = ['signing', 'format', 'setup', 'money', 'payment', 'customer', 'limits', 'declined', 'status', 'system', 'lookups', 'quotes', 'trade', 'services', 'other'];
  const groups = ORDER.map(k => ERR_GROUPS.find(g => g.k === k)).filter(g => by[g.k]);
  const have = new Set(shown.map(e => e.ErrorCode));
  return `<div class="eg-find"><label for="errSearch">Got an error? Enter the code</label>
    <div class="eg-box"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg><input class="errsearch" id="errSearch" type="search" inputmode="search" autocomplete="off" placeholder="e.g. 11031, or a word like hash or wallet" value="${esc(q)}"></div>
    <small>Shows that code and how to fix it. A word from the message works too.</small></div>
  <div class="eg-common"><h2>Most common</h2><div class="eg-cards">${ERR_COMMON.filter(([c]) => have.has(c)).map(([c, t]) =>
      `<button type="button" class="eg-card" data-errq="${esc(c)}"><code>${esc(c)}</code><span>${esc(t)}</span></button>`).join('')}</div></div>
  <div class="eg-chips" role="group" aria-label="Show one kind of error"><button type="button" class="eg-chip on" data-errg="">All <small>${shown.length}</small></button>${
    groups.map(g => `<button type="button" class="eg-chip" data-errg="${g.k}">${esc(g.t)} <small>${by[g.k].length}</small></button>`).join('')}</div>
  <p class="count" id="errCount">${shown.length} codes in ${groups.length} groups</p>
  <div id="errTable">${groups.map(g => `<details class="eg" data-g="${g.k}"><summary><span class="eg-h"><b>${esc(g.t)}</b><span>${esc(g.d)}</span></span><span class="eg-act ${g.tone}">${esc(g.act)}</span><span class="eg-n">${by[g.k].length}</span></summary>
    <table class="errtable"><thead><tr><th>Code</th><th>Message</th><th>How to fix</th></tr></thead><tbody>${by[g.k].map(row).join('')}</tbody></table></details>`).join('')}</div>`;
}
let ERR_G = '';
function filterErrors() {
  const box = document.getElementById('errSearch'); if (!box) return;
  const words = box.value.toLowerCase().split(/\s+/).filter(Boolean), exact = words.length === 1 && /^\d+$/.test(words[0]) ? words[0] : '';
  let n = 0, total = 0;
  document.querySelectorAll('#errTable details.eg').forEach(d => {
    let m = 0;
    d.querySelectorAll('tbody tr').forEach(tr => {
      total++;
      const t = tr.dataset.s || tr.textContent.toLowerCase();
      const show = (!ERR_G || d.dataset.g === ERR_G) && (exact ? (tr.dataset.c || '').split(' ').includes(exact) || t.includes(exact) : words.every(w => t.includes(w)));
      tr.style.display = show ? '' : 'none'; m += show;
    });
    d.hidden = !m; n += m;
    if (words.length || ERR_G) d.open = !!m; else d.open = false;
  });
  document.querySelectorAll('.eg-chip').forEach(c => c.classList.toggle('on', c.dataset.errg === ERR_G));
  /* while searching, the result goes straight under the box */
  document.querySelectorAll('.eg-common, .eg-chips').forEach(x => x.hidden = !!words.length);
  document.getElementById('errCount').textContent = !words.length && !ERR_G ? `${total} codes in ${document.querySelectorAll('#errTable details.eg').length} groups · open a group to see its codes`
    : n ? `${n} of ${total} codes` : 'No codes match. Try a code number or one word from the message.';
}
document.addEventListener('click', e => {
  const chip = e.target.closest('[data-errg]'), card = e.target.closest('[data-errq]');
  if (chip) { ERR_G = chip.dataset.errg; filterErrors(); }
  if (card) { const box = document.getElementById('errSearch'); ERR_G = ''; box.value = card.dataset.errq; filterErrors();
    const tr = [...document.querySelectorAll('#errTable tbody tr')].find(r => r.style.display !== 'none'); tr && tr.scrollIntoView({block: 'center', behavior: 'smooth'}); }
});
