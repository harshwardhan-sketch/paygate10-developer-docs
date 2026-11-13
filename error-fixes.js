/* "How to fix" for every API error code (shown on the Error codes page and in site search).
   Same file on both docs sites; each site sets ERR_LINKS to its own page routes before this file loads.
   Order: a hand-written fix for the common codes (FIX), then rules by the shape of the message (required field,
   format, limit, bank decline …), so new codes from a re-import still get useful advice.
   Written from the error messages and the API docs. Re-check FIX when the live error list changes. */
const ERROR_FIX = (() => {
  const L = window.ERR_LINKS || {};
  const a = (k, t) => L[k] ? `<a href="${L[k]}">${t}</a>` : t;
  const c = s => `<code>${esc(s)}</code>`;
  const STATUS = () => `check it with ${a('status', 'Get Status')} before you send it again, so you don't create a duplicate`;
  const RAISE = () => `If it keeps happening, ${a('support', 'raise it with us')} with the request, response and time.`;
  const LIMIT = who => `This is a ${who} limit. Retry later or with a smaller amount; ask your integration contact if your limits need to change.`;

  const FIX = {
    '00': () => `A problem on our side. Don't resend straight away: ${STATUS()}. ${RAISE()}`,
    '01': () => `Declined by risk checks for this customer or transaction. Don't retry with the same details; the customer can use another method or account.`,
    '02': () => `The bank or wallet gave no reason. Treat it as failed; the customer can try again or with another method. ${RAISE()}`,
    '11002': () => `The ${c('midCode')} is not recognised. Send the MID exactly as given at onboarding, for the environment you are calling.`,
    '11003': () => `Your MID is disabled, so every request fails until it is re-enabled. Contact your integration channel.`,
    '11008': () => `Send ${c('merchantUrl.notificationUrl')}: a public HTTPS URL on your server where we post the ${a('callbacks', 'callback')}.`,
    '11009': () => `Send ${c('merchantUrl.returnUrl')}: where the customer comes back after the payment page. It is needed for hosted checkout and for seamless methods that redirect the customer.`,
    '11010': () => `Sign the request: send the ${c('hash')} field, or the ${c('X-Callback-Signature')} header. See ${a('signing', 'Signing')}.`,
    '11011': () => `Send ${c('amount')} as a positive number with up to 2 decimals (for example ${c('100.00')}), not as text.`,
    '11023': () => `This currency is not enabled on your MID. Send the market's own currency (for example INR for India), or ask your integration contact to enable it.`,
    '11024': () => `This country is not enabled on your MID. Check ${c('country')} is the 2-letter ISO code of a live market, or ask your integration contact.`,
    '11025': () => `${c('country')} and ${c('currency')} don't belong together. Send the country's own currency, for example ${c('IN')} with ${c('INR')}.`,
    '11026': () => `Pay-ins are not enabled on this MID. Ask your integration contact.`,
    '11027': () => `Every transaction needs a new ${c('merchantRefNo')}, including a retry of a failed one. To check an earlier attempt, use ${a('status', 'Get Status')} instead of resending it.`,
    '11031': () => `Your hash differs from ours. The usual causes: fields in the wrong order, a missing ${c('~')}, the amount formatted differently (${c('100')} vs ${c('100.00')}), the secret not in lower case, or signing values that differ from what you send. Paste your values into the ${a('playground', 'Hash playground')}; see ${a('hash', 'Fixing hash errors')}.`,
    '11032': () => `The amount is below the minimum for this method; the message shows the minimum. Raise the amount or use another method.`,
    '11033': () => `The amount is above the maximum for this method; the message shows the maximum. Lower the amount or split the payment.`,
    '11034': () => `The customer's UPI ID has reached its daily limit. Ask them to pay with another UPI ID.`,
    '11035': () => `Too many payments from this UPI ID are still open. Ask the customer to finish or wait (about 75 minutes), or use another UPI ID.`,
    '11036': () => `A payment from this UPI ID is still open. Ask the customer to finish or wait (about 75 minutes), or use another UPI ID.`,
    '11051': () => `${c('requestType')} is not a known value. Use one of the documented values exactly, for example ${c('PAYIN')}, ${c('PAYOUT')}, ${c('GetBalance')}, ${c('GetStatus')}.`,
    '11062': () => `The customer left the payment page. Nothing to fix; they can start a new payment (with a new ${c('merchantRefNo')}).`,
    '11063': () => `We could not read the request. Send valid JSON with ${c('Content-Type: application/json')} and the ${c('api-version: 2.0')} header, with ${c('requestType')} and ${c('data')} at the top level (camelCase keys).`,
    '11066': () => `Use a documented transaction type value; check the spelling and case against the request's field table.`,
    '11067': () => `The ${c('hash')} value is malformed. Send the 64-character hex SHA-256 digest (not the pre-hash string, not Base64). If it looks right, see ${a('hash', 'Fixing hash errors')}.`,
    '11071': () => `Send ${c('requestType')} at the top level of the body, next to ${c('data')}.`,
    '11073': () => `We can't find this transaction for this MID. Use our transaction ID from the response or callback, with the same MID that created it.`,
    '11074': () => `Balance checks are not enabled on this MID. Ask your integration contact.`,
    '11081': () => `Your balance is too low for this payout. Top it up, then check it with ${a('balance', 'Get Balance')} before sending. See ${a('funding', 'Funding')}.`,
    '11083': () => `Use a ${c('paymentMethod')} code listed for this country on the ${a('payin', 'Payin')} or ${a('payout', 'Payout')} page. Hosted checkout does not need one.`,
    '11085': () => `Use a documented ${c('transaction_type')} value; check spelling and case against the request's field table.`,
    '11087': () => `This customer is blocked by risk rules. Don't retry; tell your integration contact if you think it is wrong.`,
    '11088': () => `Payouts are not enabled on this MID. Ask your integration contact.`,
    '11107': () => `Refunds must be for the full amount of the original pay-in. Send ${c('refund_amount')} equal to that amount.`,
    '11108': () => `This pay-in has already been refunded. Nothing more to do.`,
    '11109': () => `Only approved pay-ins can be refunded. Check the original transaction's status with ${a('status', 'Get Status')}.`,
    '11122': () => `The refund window for this transaction has passed (the message shows the window). Settle it with the customer outside the API.`,
    '11123': () => `A refund for this transaction is already being processed. Wait for its result instead of sending another.`,
    '11133': () => `Only pay-ins (deposits) can be refunded, not payouts.`,
    '11135': () => `Send a ${c('merchantRefNo')} of 1 to 100 characters, with no spaces.`,
    '11138': () => `Quotes are not enabled on this MID. Ask your integration contact.`,
    '11139': () => `Your FX rate type is not set up yet. Ask your integration contact.`,
    '11152': () => `Use the ${c('quoteId')} returned by your latest Prefunding Quote, unchanged.`,
    '11153': () => `This quote has already been used. Request a new quote.`,
    '11157': () => `Send the same currency as the quote, or request a new quote.`,
    '11158': () => `Send the same country as the quote, or request a new quote.`,
    '11159': () => `Send the same amount as the quote, or request a new quote.`,
    '11168': () => `This quote does not exist. Use the ${c('quoteId')} from your latest Prefunding Quote.`,
    '11169': () => `This quote was rejected. Request a new quote.`,
    '11170': () => `Send ${c('accept_quote')} as ${c('True')} or ${c('False')}.`,
    '11173': () => `Not an error: the request was accepted and is being processed. Wait for the callback, or check it with ${a('status', 'Get Status')}.`,
    '11175': () => `No transaction with this ID. Check you are sending our transaction ID, with the MID that created it.`,
    '11176': () => `The customer hasn't paid yet. Wait for the callback; don't create a new transaction for the same order.`,
    '11181': () => `${c('from_date')} can be at most 180 days ago. Ask for older data in a separate request to your integration contact, or move the window.`,
    '11184': () => `Make ${c('to_date')} later than ${c('from_date')}.`,
    '11187': () => `Ask for at most 100 records per call; use ${c('skip')} to page through the rest.`,
    '11188': () => `The quote has expired. Request a new quote and accept it straight away.`,
    '11197': () => `This payment method is not enabled on your MID. Ask your integration contact.`,
    '11209': () => `Something failed on our side. Don't resend straight away: ${STATUS()}. ${RAISE()}`,
    '11210': () => `The bank or wallet declined the payment. The customer can try again or use another method.`,
    '11289': () => `The customer didn't approve the payment in time. They can start a new payment.`,
    '11299': () => `Still processing. Wait for the callback, or check it later with ${a('status', 'Get Status')}; don't resend.`,
    '11318': () => `This bank is not available. Use a bank ID from ${a('banklist', 'Get Bank List')}.`,
    '11346': () => `Payouts to NRE accounts are not possible. Ask the beneficiary for a resident savings or current account.`,
    '11365': () => `An OTP was already sent. Use that OTP, or wait before asking for a new one.`,
    '11366': () => `No FX rate is available for this currency on your MID. Ask your integration contact.`,
    '11368': () => `The customer's Aadhaar KYC is not complete. They need to finish KYC before paying.`,
    '11369': () => `This request was already submitted. Check the first one with ${a('status', 'Get Status')} instead of resending.`,
    '11370': () => `Not an error: the customer's Aadhaar KYC is already verified. Continue with the payment.`,
    '11384': () => `This transaction is already complete. Start a new one with a new ${c('merchantRefNo')} if needed.`,
    '11389': () => `Send a ${c('limit')} between 1 and 50.`,
    '11391': () => `The service is temporarily unavailable. Retry later; ${STATUS()}. ${RAISE()}`,
    '11393': () => `This payment method is not set up on your MID. Ask your integration contact.`,
    '11394': () => `Refunds are not enabled on this MID. Ask your integration contact.`,
    '11396': () => `Quotes are not set up on this MID. Ask your integration contact.`,
    '11399': () => `The bank or wallet declined the refund. Settle it with the customer another way, or ${a('support', 'raise it with us')}.`,
    '11400': () => `This refund is still being processed. Wait for its result.`,
    '11420': () => `Send ${c('country')} as a 2-letter ISO code of a live market.`,
    '11421': () => `We could not create the quote. Try again shortly. ${RAISE()}`,
    '11440': () => `This payout must be a whole number (no decimals). Round the amount, for example ${c('1500')} instead of ${c('1500.50')}.`,
    '11441': () => `The processing currency is not set up on your MID. Ask your integration contact.`,
    '11453': () => `Your ${c('X-Callback-Signature')} doesn't match. Sign the exact bytes you send with HMAC-SHA256 and the lower-case MID secret, and send ${c('sha256=<hex>')}. See ${a('signing', 'Signing')}.`,
    '11454': () => `The ${c('X-Callback-Signature')} header is empty. Send ${c('sha256=<hex>')}, or leave the header out and sign with the body ${c('hash')}.`,
  };
  Object.assign(FIX, {
    '11005': () => `Send ${c('currency')} as a 3-letter ISO code, for example ${c('INR')}.`,
    '11007': () => `Send ${c('country')} as a 2-letter ISO code, for example ${c('IN')}.`,
    '11064': () => `Send ${c('currency')} as a 3-letter ISO code of a live market, for example ${c('INR')}.`,
    '11058': () => FIX['11023'](),
    '11091': () => `Send ${c('account_name')} with letters and spaces only: no digits or symbols.`,
    '11221': () => `This document type can't be used here. Send a document type listed for this country, or ask your integration contact.`,
    '11426': () => `No subscription with this ${c('subscription_id')}. Use the ID returned when the subscription was created, with the same MID. UPI recurring fields are not in these docs: ask your integration contact.`,
    '11427': () => `This subscription has expired. Create a new one.`,
    '11428': () => `No active plan. Create or activate the plan first, then send its ${c('plan_id')}.`,
    '11429': () => `The amount differs from the plan's amount. Send exactly the plan amount.`,
    '11042': () => `Send the card expiry year.`,
    '11044': () => `Send the card expiry month.`,
    '11363': () => `Send every card field: card holder name, card number, expiry month and year, and CVV.`,
    '11388': () => `Send ${c('page')} as 1 or more: page numbers start at 1.`,
    '11415': () => `Correct ${c('account_number')}: it must be numeric and contain 10 to 16 digits. Send digits only, without spaces or dashes.`,
    '11310': () => `Correct ${c('account_number')}: it should contain 10 to 14 digits. Send digits only, without spaces or dashes.`,
    '11359': () => `Send the merchant category. This field is not in these docs: ask your integration contact for the allowed values.`,
    '11360': () => `This merchant category is not allowed. Ask your integration contact for the allowed values.`,
  });
  ['11037', '11038', '11116', '11236'].forEach(k => FIX[k] = () => `The customer has reached a daily or monthly limit. They can try again later, with a smaller amount or another account.`);
  ['11120', '11121', '11397', '11398', '11089', '11082'].forEach(k => FIX[k] = () => LIMIT('daily payout'));
  ['11375', '11376', '11377', '11378'].forEach(k => FIX[k] = () => `Too many payments with this wallet number. Ask the customer to use another wallet, or try again later.`);
  ['11160', '11161', '11162'].forEach(k => FIX[k] = () => `Blocked by risk rules. Don't retry with the same details.`);
  ['11292', '11294', '11295', '11296', '11297', '11205', '11242', '11347', '11348', '11349', '11350', '11057'].forEach(k => FIX[k] = () => `The customer's bank or wallet rejected it (the message gives the reason). Ask the customer to check the account or use another one; resending the same details will fail again.`);
  ['11052', '11053', '11054', '11055', '11056', '11061'].forEach(k => FIX[k] = () => `A problem with the customer's account at their bank or wallet (the message gives the reason). The customer needs to sort it out with them, or pay another way.`);
  ['11059', '11060'].forEach(k => FIX[k] = () => `Your merchant account setup is incomplete. Ask your integration contact.`);
  ['11364', '11423'].forEach(k => FIX[k] = () => `This service is not enabled on your MID. Ask your integration contact.`);
  ['11068', '11069', '11395'].forEach(k => FIX[k] = FIX['11209']);
  ['11355'].forEach(k => FIX[k] = FIX['11083']);
  ['11096', '11101', '11049'].forEach(k => FIX[k] = () => `Use a bank code we support: get the list from ${a('banklist', 'Get Bank List')}.`);

  /* which page documents a field */
  const pageFor = f => /^(from_date|to_date|skip|take|page|limit)/i.test(f) ? 'txlist'
    : /refund/i.test(f) ? 'refund'
    : /quote|requestAmount|includeFee|requestAppliesFor|sending|receiving|payoutfor|receiver|sender_?kyc|senderfullname/i.test(f) ? 'quote'
    : /account|bank|ifsc|payout|wallet|SenderDetails/i.test(f) ? 'payout' : 'payin';
  /* the field a message is about: "wallet_number must …", "Invalid phone. …", "Phone number must …" */
  const field = m => {
    const r = m.match(/^([<>\w.]+?)\.?\s+(?:is\s+)?(?:(?:format|value)\s+)?(?:required|object|getting|length|must|should|has|contains|size)\b/i) || m.match(/^invalid\s+([\w.]+?)\.?(?:\s|$)/i);
    let f = r ? r[1] : /^(invalid |incorrect )?phone number\b/i.test(m) ? 'phone' : /^aadhaar number/i.test(m) ? 'aadhaar_number' : /^an otp/i.test(m) ? 'otp' : '';
    if (/^phone$/i.test(f)) f = 'phone';
    return f;
  };
  /* "… must start with 07 and contain exactly 10 digits" -> "it must start with 07 and contain exactly 10 digits" */
  const rule = m => {
    const r = m.match(/\b(length\s+)?((?:must|should)\b.*)$/i);
    return r ? (r[1] ? 'its length ' : 'it ') + r[2].replace(/\.$/, '') : '';
  };
  function fix(code, msg) {
    msg = String(msg || '').trim();
    if (FIX[code]) return FIX[code]();
    const f = field(msg), pg = f ? pageFor(f) : 'payin', where = a(pg, {payin: 'Payin', payout: 'Payout', refund: 'Refund', txlist: 'Get Transaction List', quote: 'Prefunding Quote'}[pg] + ' field table');
    if (/object (getting )?null|getting null/i.test(msg) && f && !/request_object$|^request$|^data$/i.test(f)) return `Send the ${c(f)} object inside ${c('data')}, with its fields. See the ${where}.`;
    if (/object (getting )?null|getting null/i.test(msg)) return `Part of the request body is missing. Send ${c('requestType')} with a ${c('data')} object holding the fields for that request type, as JSON with camelCase keys.`;
    if (/<fieldName>/.test(msg)) return /required/.test(msg) ? `Send the field named in the message.` : /MB|Base64|PNG|JPEG/i.test(msg) ? `Fix the file named in the message: ${/MB/.test(msg) ? 'make it smaller than the limit shown' : /Base64/.test(msg) ? 'send it as a valid Base64 string, without a data: prefix or line breaks' : 'send a PNG or JPEG image'}.` : `Correct the field named in the message.`;
    if (/\brequired\b/i.test(msg)) return `Send ${f ? c(f) : 'the field named in the message'}: it is mandatory for this request or payment method. See the ${where}.`;
    if (/length|must|should|digits|format|chars|exactly|prefix|start with|between/i.test(msg)) {
      const r = rule(msg), num = /^(phone|wallet_number|account_number|postcode|pin|otp|aadhaar_number)$/i.test(f);
      return `Correct ${f ? c(f) : 'the value'}${r ? `: ${r.replace(/\bbe\s*:\s*/, 'be in the format ')}` : ' as the message says'}.${num ? ` Send digits only, without spaces or dashes${r.includes('+') ? ' (keep the + only where the rule shows it)' : ''}.` : ''}${f && !/aadhaar|otp|pin|page/i.test(f + msg) ? ` See the ${where}.` : ''}`;
    }
    if (/blacklist/i.test(msg)) return FIX['11160']();
    if (/limit|velocity|exceed/i.test(msg)) return LIMIT('transaction');
    if (/disabled|not enabled|not allowed|not configured|not available|not supported|contact (customer )?support/i.test(msg)) return `Not enabled on your MID. Ask your integration contact.`;
    if (/declin|reject|failed|incorrect|frozen|blocked/i.test(msg)) return FIX['11210']();
    if (/^invalid\b/i.test(msg)) return `${f ? c(f) : 'A value'} is not in the accepted format. Check its type, length and allowed characters in the ${where}.`;
    if (/internal|went wrong|could not|unavailable/i.test(msg)) return FIX['11209']();
    return `Check the request against the ${where}. ${RAISE()}`;
  }
  return fix;
})();
