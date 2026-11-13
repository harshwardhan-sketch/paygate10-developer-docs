/* What to send for each request, country and method: mandatory fields, fields that take dummy data (with a ready
   dummy value for that country), optional fields and notes. The Payin and Payout parameter lists use it to mark each
   field Required / Required, dummy OK / Optional for the picked country (apiref2.js). Paths are relative to data;
   "userInfo.*" means the userInfo fields not listed elsewhere. Where integration support has not confirmed a rule, it follows the live API docs.
   Key: <request>|<country>|<H for hosted, else the paymentMethod code>. */
const FIELD_RULES = (() => {
  const RISK = ['riskData', {user_category: 'Default', device_fingerprint: ''}, 'Fixed values are fine.'];
  /* realistic dummy customers per country: risk checks decline obvious test data such as test@gmail.com */
  const DUMMY = {
    India: {city: 'Mumbai', state: 'Maharashtra', postCode: '400001', address: '12 MG Road'},
    Morocco: {firstName: 'Youssef', lastName: 'Alaoui', phone: '0612345678', email: 'youssef.alaoui@gmail.com', city: 'Casablanca', address: '12 Rue Mohammed V', state: 'Casablanca-Settat', postCode: '20000'},
      Philippines: {city: 'Quezon City', address: '12 Rizal Street', state: 'Metro Manila', postCode: '1100'},
  };
  const ui = (country, keys) => keys.map(k => [`userInfo.${k}`, DUMMY[country][k]]);
  const R = {};

  /* ---------------- Payin ---------------- */
  R['payin|India|H'] = {
    pm: 'UPI',
    mandatory: [['paymentMethod', '"UPI"'], ['merchantUrl.returnUrl', ''], ['userInfo.firstName', 'the customer\'s first name'], ['userInfo.lastName', 'the customer\'s last name'],
      ['userInfo.email', 'the customer\'s email'], ['userInfo.phone', 'the customer\'s Indian mobile, 10 digits'], ['userInfo.ipAddress', 'the customer\'s IP']],
    dummy: [...ui('India', ['city', 'state', 'postCode', 'address']), RISK],
    optional: ['businessCategory', 'businessTransaction', 'paymMethodFields', 'customField'],
    notes: ['Name, email, phone and IP are checked: invalid or test data is declined and no QR is generated.', '<code>state</code> must not be empty (error 11016).',
      'The customer pays by UPI QR on desktop or UPI Intent (Pay with App) on mobile.'],
  };
  R['payin|Pakistan|H'] = {
    mandatory: [['merchantUrl.returnUrl', '']],
    dummy: [],
    optional: ['paymentMethod', 'userInfo', 'riskData', 'paymMethodFields'],
    notes: ['country and currency in upper case: <code>PK</code>, <code>PKR</code>.', 'Current limits (indicative, they can change at short notice): JazzCash 100–50,000 PKR, Easypaisa 500–50,000 PKR.'],
  };
  const pkWallet = name => ({
    mandatory: [['paymentMethod', name], ['paymMethodFields.wallet_number', 'customer\'s mobile, 11 digits starting 03']],
    dummy: [],
    optional: ['userInfo', 'riskData', 'paymMethodFields.wallet'],
    notes: ['The wallet number is the customer\'s mobile number, without +92.', 'Hash: <code>midCode~merchantRefNo~wallet_number~amount~currency~midsecret</code>.',
      'Easypaisa and JazzCash run on separate MIDs: use the MID set up for the method (otherwise error 11393).', 'Current limits (indicative, they can change at short notice): JazzCash 100–50,000 PKR, Easypaisa 500–50,000 PKR.'],
  });
  R['payin|Pakistan|EP'] = pkWallet('"EP" (Easypaisa) or "JC" (JazzCash)');
  R['payin|Pakistan|JC'] = R['payin|Pakistan|EP'];
  R['payin|Pakistan|QR'] = {
    mandatory: [['paymentMethod', '"QR"']], dummy: [], optional: ['userInfo', 'riskData', 'paymMethodFields'],
    notes: ['The response <code>message</code> holds the QR code as a base64 PNG: show it to the customer to scan with a Raast-enabled app.'],
  };
  R['payin|Pakistan|WT'] = {
    mandatory: [['paymentMethod', '"WT"'], ['paymMethodFields.wallet', 'wallet code'], ['paymMethodFields.wallet_number', '11 digits starting 03']],
    dummy: [], optional: ['userInfo'], notes: [],
  };
  R['payin|Egypt|H'] = {
    mandatory: [['merchantUrl.returnUrl', ''], ['userInfo.phone', 'real customer mobile, 11 digits starting 010, 011, 012 or 015']],
    dummy: [],
    optional: ['paymentMethod', 'userInfo.*', 'riskData', 'paymMethodFields'],
    notes: ['For cash vouchers the payment reference is sent by SMS to this phone number (valid 72 hours).',
      'Current limits (indicative, they can change at short notice): wallet 500–60,000 EGP, bank transfer 1,000–100,000 EGP, cash voucher 10–100,000 EGP.'],
  };
  R['payin|Egypt|WT'] = {
    mandatory: [['paymentMethod', '"MWALLET"'], ['paymMethodFields.wallet_number', 'customer\'s wallet, 11 digits starting 010, 011, 012 or 015'],
      ['userInfo.phone', '11 digits starting 010, 011, 012 or 015']],
    dummy: [], optional: ['userInfo.*', 'riskData'],
    notes: ['Send <code>"MWALLET"</code> for Egypt wallets. <code>"WT"</code>, as in the example, is no longer accepted (error 11393).', 'Current limits (indicative, they can change at short notice): 500–60,000 EGP.'],
  };
  R['payin|Nigeria|H'] = {
    mandatory: [['merchantUrl.returnUrl', ''], ['userInfo.firstName', ''], ['userInfo.lastName', ''], ['userInfo.email', '']],
    dummy: [], optional: ['userInfo.*', 'riskData', 'paymentMethod', 'paymMethodFields'],
    notes: ['Current limits (indicative, they can change at short notice): 100–10,000,000 NGN.'],
  };
  R['payin|Nigeria|CARD'] = {
    mandatory: [['paymentMethod', '"CARD"'], ['paymMethodFields.card_type', ''], ['paymMethodFields.card_holder_name', ''], ['paymMethodFields.card_number', '16–19 digits'],
      ['paymMethodFields.month', 'MM'], ['paymMethodFields.year', 'YYYY'], ['paymMethodFields.cvv', '3–4 digits'], ['userInfo.firstName', ''], ['userInfo.lastName', ''], ['userInfo.email', '']],
    dummy: [RISK], optional: ['userInfo.*'], notes: ['Current limits (indicative, they can change at short notice): 100–10,000,000 NGN.'],
  };
  R['payin|Nigeria|BD'] = {
    mandatory: [['paymentMethod', '"BD"'], ['userInfo.firstName', ''], ['userInfo.lastName', ''], ['userInfo.email', '']],
    dummy: [], optional: ['paymMethodFields', 'userInfo.*', 'riskData'], notes: ['Current limits (indicative, they can change at short notice): 100–10,000,000 NGN.'],
  };
  const maUser = ['firstName', 'lastName', 'phone', 'email', 'city', 'address', 'state', 'postCode'];
  R['payin|Morocco|H'] = {
    mandatory: [['merchantUrl.returnUrl', 'a valid https URL'], ['userInfo.ipAddress', 'the customer\'s IP']],
    dummy: [...ui('Morocco', maUser), RISK],
    optional: ['paymentMethod', 'paymMethodFields', 'customField', 'businessCategory', 'businessTransaction'],
    notes: ['Dummy details must look realistic: obvious test data such as test@gmail.com is declined by risk checks.',
      'On the payment page the customer picks the bank, enters their account number and name, and uploads the payment receipt.'],
  };
  const maSeamless = (code, fields, extra) => ({
    mandatory: [['paymentMethod', `"${code}"`], ...fields, ['customField.customField2', 'Base64 image of the customer\'s payment receipt'], ['userInfo.ipAddress', 'the customer\'s IP']],
    dummy: [...ui('Morocco', maUser), RISK], optional: [],
    notes: ['Dummy details must look realistic: obvious test data such as test@gmail.com is declined by risk checks.',
      'Without <code>customField2</code> the request fails with error 11393.', ...extra],
  });
  R['payin|Morocco|BT'] = maSeamless('BT', [['paymMethodFields.account_number', 'customer\'s account'], ['paymMethodFields.bank_code', 'from Get Bank List for pay-ins'], ['paymMethodFields.account_name', 'account holder']],
    ['Use a pay-in bank code from <a href="#/legacy/op-get-bank-list">Get Bank List</a>; payout bank codes are rejected (error 11393).']);
  R['payin|Morocco|WT'] = maSeamless('WT', [['paymMethodFields.wallet_number', 'customer\'s wallet'], ['paymMethodFields.bank_code', 'from Get Bank List'], ['paymMethodFields.account_name', 'wallet holder']],
    ['The customer pays outside the payment page, then gives the source wallet number, the wallet name and the receipt.']);
  R['payin|Philippines|H'] = {
    mandatory: [['merchantUrl.returnUrl', 'otherwise "returnUrl required"'], ['userInfo.firstName', ''], ['userInfo.lastName', '']],
    dummy: [], optional: ['userInfo.*', 'riskData', 'paymentMethod', 'paymMethodFields'], notes: [],
  };
  R['payin|Bangladesh|H'] = {
    mandatory: [['merchantUrl.returnUrl', ''], ['userInfo', 'all fields'], ['riskData.user_category', '']], dummy: [], optional: ['paymentMethod', 'paymMethodFields'], notes: [],
  };

  /* ---------------- Payout ---------------- */
  const PO = 'integrationType';
  R['payout|India|NB'] = {
    mandatory: [['paymentMethod', '"NB"'], ['paymMethodFields.account_number', ''], ['paymMethodFields.account_name', ''], ['paymMethodFields.bank_name', ''],
      ['paymMethodFields.bank_ifsc', '11-character IFSC'], ['paymMethodFields.payout_type', '"Individual" or "Corporate"'], ['userInfo', 'all fields'], ['riskData.user_category', '']],
    dummy: [], optional: [PO, 'paymMethodFields.bank_branch', 'paymMethodFields.bank_address'],
    notes: ['Hash: <code>midcode~account_name~account_number~bank_ifsc~amount~currency~bank_name~midsecret</code>.'],
  };
  const pkPayout = {
    mandatory: [['paymentMethod', '"EP" (Easypaisa) or "JC" (JazzCash)'], ['paymMethodFields.wallet_number', 'beneficiary\'s mobile, 11 digits starting 03']],
    dummy: [['paymMethodFields.document_id', '4210112345671', 'A 13-digit CNIC, no dashes. It does not have to be real, but it must be 13 digits.']],
    optional: [PO, 'userInfo', 'riskData', 'customField', 'merchantUrl.returnUrl'],
    notes: ['Hash: <code>midcode~merchantrefno~wallet_number~document_id~amount~currency~midsecret</code>.',
      'Easypaisa and JazzCash run on separate MIDs: use the MID set up for the method (otherwise error 11393).',
      'Current limits (indicative, they can change at short notice): JazzCash 100–200,000 PKR per payout, Easypaisa 100–300,000 PKR.'],
  };
  R['payout|Pakistan|EP'] = pkPayout; R['payout|Pakistan|JC'] = pkPayout;
  const pkBank = code => ({
    mandatory: [['paymentMethod', `"${code}"`], ['paymMethodFields.account_number', ''], ['paymMethodFields.account_name', ''], ['paymMethodFields.bank_code', 'for example PK035']],
    dummy: [], optional: [PO, 'userInfo', 'riskData'], notes: ['Ask your integration contact for the list of bank codes.'],
  });
  R['payout|Pakistan|BT'] = pkBank('BT'); R['payout|Pakistan|BD'] = pkBank('BD');
  R['payout|Egypt|MWALLET'] = {
    mandatory: [['paymentMethod', '"MWALLET"'], ['paymMethodFields.wallet_number', 'beneficiary\'s wallet, 11 digits starting 01']],
    dummy: [['paymMethodFields.account_name', 'test', 'Any name is accepted.']],
    optional: [PO, 'userInfo', 'riskData', 'paymMethodFields.document_id', 'paymMethodFields.document_type', 'paymMethodFields.bank_name', 'paymMethodFields.bank_branch', 'paymMethodFields.bank_address', 'paymMethodFields.account_type'],
    notes: ['Do not send <code>bank_code</code> for wallet payouts: it makes the payout fail.'],
  };
  R['payout|Egypt|BD'] = {
    mandatory: [['paymentMethod', '"BD"'], ['paymMethodFields.account_number', ''], ['paymMethodFields.account_name', '']], dummy: [], optional: [PO, 'userInfo', 'riskData'],
    notes: ['Use the MID set up for this method: a request to another method\'s MID fails with 11031.'],
  };
  R['payout|Egypt|BT'] = {
    mandatory: [['paymentMethod', '"BT"'], ['paymMethodFields.account_number', ''], ['paymMethodFields.bank_code', ''], ['paymMethodFields.account_name', '']], dummy: [], optional: [PO, 'userInfo', 'riskData'], notes: [],
  };
  R['payout|Nigeria|BT'] = {
    mandatory: [['paymentMethod', '"BT"'], ['paymMethodFields.account_number', '10 digits'], ['paymMethodFields.bank_code', 'NG + 4 digits, from the bank list'], ['paymMethodFields.account_name', ''], ['userInfo.email', '']],
    dummy: [], optional: [PO, 'userInfo.*', 'riskData'], notes: ['A bank code not set up on your MID returns 11049 "bank_code not mapped".', 'Current limits (indicative, they can change at short notice): 100–10,000,000 NGN.'],
  };
  R['payout|Morocco|BT'] = {
    mandatory: [['paymentMethod', '"BT"'], ['paymMethodFields.account_number', 'exactly 24 digits (RIB)'], ['paymMethodFields.bank_code', 'MOBT…, from Get Bank List (withdrawal)'],
      ['paymMethodFields.account_name', 'account holder'], ['userInfo.firstName', 'beneficiary'], ['userInfo.lastName', 'beneficiary'], ['userInfo.phone', '10–14 characters']],
    dummy: [...ui('Morocco', ['email', 'city', 'address', 'state', 'postCode']), RISK], optional: [PO, 'customField'],
    notes: ['A 24-digit RIB is required: other lengths fail with 11412.', 'Send the amount with two decimals, for example "50.00".'],
  };
  R['payout|Morocco|WT'] = {
    mandatory: [['paymentMethod', '"WT"'], ['paymMethodFields.wallet_number', '10 digits starting 06 or 07'], ['paymMethodFields.bank_code', 'from Get Bank List (withdrawal)'],
      ['paymMethodFields.account_name', 'wallet holder'], ['userInfo.firstName', 'beneficiary'], ['userInfo.lastName', 'beneficiary'], ['userInfo.phone', '10–14 characters']],
    dummy: [...ui('Morocco', ['email', 'city', 'address', 'state', 'postCode']), RISK], optional: [PO, 'customField'],
    notes: ['Send the amount with two decimals, for example "50.00".'],
  };
  R['payout|Philippines|WT'] = {
    mandatory: [['paymentMethod', '"WT"'], ['paymMethodFields.wallet_number', '11 digits starting 09'], ['paymMethodFields.bank_code', 'PHW…, set up on your MID'],
      ['paymMethodFields.account_name', ''], ['userInfo.firstName', ''], ['userInfo.lastName', ''], ['userInfo.phone', '11 digits starting 09'], ['userInfo.email', ''], ['userInfo.ipAddress', '']],
    dummy: [...ui('Philippines', ['city', 'address', 'state', 'postCode']), RISK], optional: [PO, 'customField'],
    notes: ['A bank code not set up on your MID returns 11049 "bank_code not mapped".'],
  };
  R['payout|Bangladesh|WT'] = {
    mandatory: [['paymentMethod', '"WT"'], ['paymMethodFields.wallet_number', ''], ['paymMethodFields.bank_code', ''], ['userInfo', 'all fields'], ['riskData.user_category', '']],
    dummy: [], optional: [PO], notes: [],
  };
  return R;
})();

/* Format examples for fields that must carry real data: what a valid value looks like in each country.
   Emails use example.com and IPs the documentation range (203.0.113.x), so no example points at a real person or server. */
const FIELD_EXAMPLES = {
  India: {city: 'Mumbai', address: '12 MG Road', state: 'Maharashtra', postCode: '400001', firstName: 'Rahul', lastName: 'Sharma', email: 'rahul.sharma@example.com', phone: '9876543210', ipAddress: '203.0.113.24',
    account_number: '123456789012', account_name: 'Rahul Sharma', bank_name: 'Example Bank', bank_ifsc: 'ABCD0001234', payout_type: 'Individual'},
  Pakistan: {city: 'Karachi', address: '12 Shahrah-e-Faisal', state: 'Sindh', postCode: '75400', wallet_number: '03001234567', phone: '03001234567', account_number: 'PK36SCBL0000001123456702', account_name: 'Ali Khan', bank_code: 'PK035', firstName: 'Ali', lastName: 'Khan', ipAddress: '203.0.113.24'},
  Egypt: {city: 'Cairo', address: '15 Tahrir Street', state: 'Cairo', postCode: '11511', phone: '01012345678', wallet_number: '01012345678', account_number: '100012345678', account_name: 'Ahmed Hassan', firstName: 'Ahmed', lastName: 'Hassan', email: 'ahmed.hassan@example.com', ipAddress: '203.0.113.24'},
  Morocco: {customField2: 'iVBORw0KGgoAAAANSUhEUgAA… (the receipt image, Base64)', city: 'Casablanca', address: '12 Rue Mohammed V', state: 'Casablanca-Settat', postCode: '20000', ipAddress: '203.0.113.24', firstName: 'Youssef', lastName: 'Alaoui', phone: '0612345678', wallet_number: '0612345678', account_number: '011780000012345678901234', account_name: 'Youssef Alaoui'},
  Nigeria: {city: 'Lagos', address: '12 Awolowo Road', state: 'Lagos', postCode: '100001', firstName: 'Chinedu', lastName: 'Okafor', email: 'chinedu.okafor@example.com', phone: '08031234567', ipAddress: '203.0.113.24', account_number: '0123456789', account_name: 'Chinedu Okafor'},
  Philippines: {city: 'Quezon City', address: '12 Rizal Street', state: 'Metro Manila', postCode: '1100', firstName: 'Juan', lastName: 'Dela Cruz', email: 'juan.delacruz@example.com', phone: '09171234567', wallet_number: '09171234567', account_name: 'Juan Dela Cruz', ipAddress: '203.0.113.24'},
  Bangladesh: {city: 'Dhaka', address: '12 Gulshan Avenue', state: 'Dhaka', postCode: '1212', firstName: 'Rahim', lastName: 'Uddin', email: 'rahim.uddin@example.com', phone: '01712345678', wallet_number: '01712345678', ipAddress: '203.0.113.24'},
};
