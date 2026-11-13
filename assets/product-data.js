/* Source data for the Payment methods tab. */
/* ==========================================================================
   PRODUCT_DATA — single source of truth for the tabular/spec content on
   this page (payin method tables, payout/collections/remittance spec
   sheets). This file is what the Google Sheet sync keeps in step with —
   don't hand-edit values here once the sheet sync is live; edit the sheet
   instead and let the sync script regenerate this file.
   ========================================================================== */

const PRODUCT_DATA = {

  /* Pay-in payment methods, per country. Rendered in the method dropdown
     panels (renderMethodPanel in script.js). iconKey maps to an icon via
     the ICONS lookup in script.js. */
  payinMethods: {
    IN: [
      { name: "UPI QR", sub: "Scan to pay via any UPI app", iconKey: "qr", demoTarget: "collapseUPIQR",
        journey: [{ url: "https://www.youtube.com/watch?v=iWAHVabW_iM" }],
        cap: { speed: "Real-time, 24x7", currency: "INR", integrationType: "S2S, Hosted", channels: "Any UPI app via QR scan", fieldsRequired: "UPI ID / VPA", depositLimits: "Min INR 100 / Max INR 10,000 per transaction; daily cap INR 50,000,000", minTx: "INR 100", maxTx: "INR 10,000 per transaction", settlement: "T+4 working days", fx: "Local currency, no FX required", notes: "Ideal for in-person or checkout page QR flows." } }
    ],
    NG: [
      { name: "Bank deposit", sub: "Direct from any Nigerian bank", iconKey: "bank", demoTarget: "collapseBankDepositNigeria",
        cap: { speed: "Real-time", currency: "NGN", integrationType: "Hosted, S2S", channels: "All Nigerian banks", fieldsRequired: "Account number, account name, transaction reference", depositLimits: "5,000,000 NGN per transaction", minTx: "NGN 100", maxTx: "NGN 10,000,000", settlement: "T+3 working days", fx: "Local currency, no FX required", notes: "Primary accepted method for Nigerian merchants." } }
    ],
    EG: [
      { name: "Fawry", sub: "Cash", iconKey: "cash", demoTarget: "collapseCashMethod",
        journey: [{ url: "https://www.youtube.com/watch?v=htWOTI4LIjM" }],
        cap: { speed: "Up to 24h (cash network)", currency: "EGP", integrationType: "Hosted", channels: "Fawry retail network nationwide", fieldsRequired: "Account number, account name, transaction reference", depositLimits: "Max EGP 100,000 per transaction", minTx: "EGP 10", maxTx: "EGP 100,000", settlement: "T+5 working days", fx: "Local currency, no FX required", notes: "Reaches unbanked and cash-preferring customers." } },
      { name: "Wallets", sub: "Etisalat, Vodafone, Wecash, Orange", iconKey: "wallet", demoTarget: "collapseWalletEgyptMethod",
        journey: [{ url: "https://www.youtube.com/watch?v=SGOD2db_zBw" }],
        cap: { speed: "Real-time", currency: "EGP", integrationType: "Hosted, S2S", channels: "Etisalat, Vodafone, Wecash, Orange", fieldsRequired: "Wallet/mobile number (e.g. 010XXXXXXXXX)", depositLimits: "EGP 60,000 per transaction; EGP 150,000 monthly cap", minTx: "EGP 10", maxTx: "EGP 100,000", settlement: "T+3 working days", fx: "Local currency, no FX required", notes: "Popular with mobile-first shoppers." } }
    ],
    PK: [
      { name: "Easypaisa", sub: "Mobile wallet", iconKey: "phone", demoTarget: "collapseEasypaisa",
        journey: [{ url: "https://www.youtube.com/watch?v=4gXFJARohog" }],
        cap: { speed: "Real-time", currency: "PKR", integrationType: "Hosted, S2S", channels: "Easypaisa wallet network", fieldsRequired: "Mobile number (11 digits, e.g. 03XXXXXXXXX)", depositLimits: "PKR 500–50,000 per transaction", minTx: "PKR 500", maxTx: "PKR 50,000", settlement: "T+1 working day", fx: "Local currency, no FX required", notes: "One of Pakistan's most-used mobile wallets." } },
      { name: "JazzCash", sub: "Mobile wallet", iconKey: "phone", demoTarget: "collapseJazzCash",
        cap: { speed: "Real-time", currency: "PKR", integrationType: "Hosted, S2S", channels: "JazzCash wallet network", fieldsRequired: "Mobile number (11 digits, e.g. 03XXXXXXXXX)", depositLimits: "PKR 100–200,000 per transaction", minTx: "PKR 100", maxTx: "PKR 200,000", settlement: "T+1 working day", fx: "Local currency, no FX required", notes: "Second major Pakistani mobile wallet." } }
    ],
    ZA: [
      { name: "Bank deposit", sub: "Direct from South African banks", iconKey: "bank", demoTarget: "collapseBottomBankDeposit",
        cap: { speed: "Real-time", currency: "ZAR", channels: "All South African banks", fieldsRequired: "None — redirects to bank selection (Ozow)", fx: "Local currency, no FX required", notes: "Primary accepted method for South African merchants." } }
    ],
    PH: [
      { name: "QR PH", sub: "Scan to pay via any QR PH app", iconKey: "phone", demoTarget: "collapsePhilippinesQrph",
        cap: { speed: "Real-time", currency: "PHP", integrationType: "Hosted", channels: "Any QR PH-enabled banking app", fx: "Local currency, no FX required", notes: "The Philippines' national interoperable QR standard." } },
      { name: "Bank Transfer", sub: "Direct from Philippine banks", iconKey: "bank", demoTarget: "collapsePhilippinesVcaBankTransfer",
        cap: { speed: "Real-time via InstaPay", currency: "PHP", integrationType: "Hosted", channels: "Philippine banks via InstaPay", fx: "Local currency, no FX required", notes: "Uses a unique Virtual Collection Account per transaction." } },
      { name: "Wallets", sub: "Local mobile wallets", iconKey: "wallet", demoTarget: "collapseDfnnWallets",
        journey: [{ label: "Watch GCash journey", url: "https://www.youtube.com/watch?v=muQz94pXrDY" }, { label: "Watch Maya journey", url: "https://www.youtube.com/watch?v=Gl6Ry7o8d_E" }],
        cap: { speed: "Real-time", currency: "PHP", integrationType: "Hosted", channels: "GCash, Maya", fieldsRequired: "Wallet selection (GCash/Maya), mobile number (e.g. 09XXXXXXXXX)", depositLimits: "Payin: Min PHP 100 / Max PHP 50,000", minTx: "PHP 100", maxTx: "PHP 50,000", settlement: "T+1 working day", fx: "Local currency, no FX required", notes: "The Philippines' two leading e-wallets." } }
    ],
    BD: [
      { name: "Nagad", sub: "Mobile wallet", iconKey: "phone", demoTarget: "collapseBanWallets",
        journey: [{ url: "https://www.youtube.com/watch?v=iTdRuZs5Q6U" }],
        cap: { speed: "Real-time", currency: "BDT", channels: "Nagad wallet network", fieldsRequired: "Mobile number (11 digits, e.g. 01XXXXXXXXX)", minTx: "BDT 100", maxTx: "BDT 50,000 per transaction", settlement: "T+1 working day", fx: "Local currency, no FX required", notes: "Government-backed mobile financial service." } },
      { name: "bKash", sub: "Mobile wallet", iconKey: "phone", demoTarget: "collapseBanWallets",
        journey: [{ url: "https://www.youtube.com/watch?v=iTdRuZs5Q6U" }],
        cap: { speed: "Real-time", currency: "BDT", channels: "bKash wallet network", fieldsRequired: "Mobile number (11 digits, e.g. 01XXXXXXXXX)", minTx: "BDT 100", maxTx: "BDT 50,000 per transaction", settlement: "T+1 working day", fx: "Local currency, no FX required", notes: "Bangladesh's largest mobile wallet." } }
    ],
    MA: [
      { name: "Mobile Wallet", sub: "CashPlus, Orange Money, MT Cash", iconKey: "wallet", demoSrc: "morocco-wallet-flow/index.html",
        journey: [{ url: "https://www.youtube.com/watch?v=bd9j7-nQcjI" }],
        cap: { speed: "Real-time", currency: "MAD", integrationType: "Hosted, S2S", channels: "CashPlus, Orange Money, MT Cash", fieldsRequired: "Wallet number, wallet name", depositLimits: "Min MAD 50 / Max MAD 5,000 per transaction", minTx: "MAD 50", maxTx: "MAD 5,000 per transaction", settlement: "T+5 working days", fx: "Local currency, no FX required", notes: "Reaches mobile-first and unbanked customers across Morocco." } },
      { name: "Bank Transfer", sub: "Attijariwafa, CIH, BCP, Bank Of Africa & more", iconKey: "bank", demoSrc: "morocco-bank-flow/index.html",
        cap: { speed: "Real-time", currency: "MAD", integrationType: "Hosted, S2S", channels: "Attijariwafa, CIH Bank, Lbanka Lik, BCP, Bank Of Africa", fieldsRequired: "Account number, account name", depositLimits: "Min MAD 100 / Max MAD 20,000 per transaction", minTx: "MAD 100", maxTx: "MAD 20,000 per transaction", settlement: "T+5 working days", fx: "Local currency, no FX required", notes: "Well suited to higher-value transactions." } }
    ]
  },

  /* P2P-specific pay-in method override, per country (only where it differs
     from the standard payinMethods set above). */
  payinMethodsP2P: {
    EG: [
      { name: "Bank Deposit", sub: "Direct from any Egyptian bank", iconKey: "bank", demoSrc: "egypt-p2p-flow/index.html",
        cap: { speed: "Real-time", currency: "EGP", integrationType: "S2S", channels: "All Egyptian banks", fieldsRequired: "Account number, account name, proof-of-payment upload", depositLimits: "EGP 1,000–100,000 per transaction", minTx: "EGP 1,000", maxTx: "EGP 100,000", settlement: "T+5 working days", fees: "Deposit: 7.50%", fx: "Local currency, no FX required" } },
      { name: "Wallets", sub: "Orange Cash, Etisalat, We Cash, Vodafone", iconKey: "wallet", demoSrc: "egypt-p2p-flow/index.html?method=wallet",
        journey: [{ url: "https://www.youtube.com/watch?v=V3i6OEbkiWU" }],
        cap: { speed: "Real-time", currency: "EGP", integrationType: "Hosted, S2S", channels: "Orange Cash, Etisalat, We Cash, Vodafone", fieldsRequired: "Wallet/mobile number, proof-of-payment upload", depositLimits: "EGP 500–60,000 per transaction", minTx: "EGP 500", maxTx: "EGP 60,000", settlement: "T+5 working days", fees: "Deposit (e-wallet): 5.25%", fx: "Local currency, no FX required" } }
    ]
  },

  /* Generic cross-market payout specifications table, shown under the
     legacy "Payouts" stage panel. */
  payoutSpecsTable: [
    { market: "India", method: "Net Banking (Bank Transfer)", integration: "S2S", min: "INR 100", max: "INR 100,000", settlement: "T+5 working days", fieldsRequired: "Account number, account name, bank name, bank IFSC, payout type" },
    { market: "Nigeria", method: "Bank Transfer", integration: "S2S", min: "NGN 100", max: "NGN 10,000,000", settlement: "T+3 working days", fieldsRequired: "Account number, account name, bank code" },
    { market: "Egypt", method: "Bank Transfer", integration: "S2S", min: "EGP 100", max: "EGP 150,000", settlement: "T+5 working days", fieldsRequired: "Account number, account name, bank code" },
    { market: "Egypt", method: "Wallet (Etisalat, Vodafone, Wecash, Orange)", integration: "S2S", min: "EGP 100", max: "EGP 150,000", settlement: "T+5 working days", fieldsRequired: "Wallet number, account name (optional)" },
    { market: "Pakistan", method: "Easypaisa & JazzCash Wallet", integration: "S2S", min: "PKR 100", max: "PKR 200,000", settlement: "T+1 working day", fieldsRequired: "Wallet number, document ID" },
    { market: "Pakistan", method: "Bank Transfer", integration: "S2S", min: "PKR 100", max: "PKR 200,000", settlement: "T+1 working day", fieldsRequired: "Account number, account name, bank code" },
    { market: "Philippines", method: "Wallets (GCash, Maya)", integration: "S2S", min: "PHP 20", max: "PHP 50,000", settlement: "T+5 working days", fieldsRequired: "Wallet number, bank code, account name" },
    { market: "Bangladesh", method: "Wallet (Nagad, bKash)", integration: "S2S", min: "BDT 100", max: "BDT 50,000", settlement: "T+1 working day", fieldsRequired: "Wallet number, bank code" }
  ],

  /* Collections product "Collection Specifications" key/value rows,
     per country (currently India only). */
  collectionsSpecs: {
    IN: [
      { label: "Sender location", value: "India" },
      { label: "Rails", value: "RTGS and NEFT bank transfers" },
      { label: "Credit confirmation", value: "Subject to bank notification and confirmation that funds are receivable" },
      { label: "Transaction type", value: "B2B" },
      { label: "Transaction limits", value: "No limit" },
      { label: "Virtual account", value: "Unique virtual account available; multiple accounts per customer supported" },
      { label: "Named account allocation", value: "Takes 1–2 weeks" },
      { label: "Account holder name", value: "Merchant, per request" },
      { label: "Rate availability window", value: "12:00 PM–3:30 PM IST (last trade cutoff)" }
    ]
  },

  /* Remittance product "Payout Specifications" key/value rows, per country. */
  remittancePayoutSpecs: {
    IN: [
      { label: "Supported modes", value: "B2B, B2C, C2B, C2C" },
      { label: "Supported currency", value: "INR" },
      { label: "Network participant", value: "Bank" },
      { label: "FX source", value: "Live interbank-based rates, available 24x7" },
      { label: "Channels", value: "IMPS, NEFT" },
      { label: "Cutoff & delivery", value: "Real-time, 24x7 up to INR 400,000 via IMPS (all banks). Same-day via NEFT, average 45 minutes, during Indian banking hours." },
      { label: "Mandatory data", value: "Payout type, account number, account name, bank IFSC, bank name" },
      { label: "Supporting documents", value: "Invoice and GST number required for business payouts" },
      { label: "Beneficiary statement", value: "IMPS narrative varies by transaction. NEFT shows the sending bank's name." },
      { label: "Proof of payment", value: "UTR number generated on every successful transaction and passed in the callback" },
      { label: "Transaction limits", value: "IMPS: min INR 1,000 / max INR 400,000. NEFT: min INR 200,000 / no maximum." }
    ],
    PK: [
      { label: "Supported modes", value: "Bank transfer, Easypaisa wallet, JazzCash wallet" },
      { label: "Supported currency", value: "PKR" },
      { label: "Network participant", value: "Bank" },
      { label: "Funding currency", value: "USDT (TRON / TRC-20 only)" },
      { label: "Throughput", value: "Up to 1,500 TPS" },
      { label: "Cutoff", value: "2:30 PM GST" },
      { label: "Cutoff (to bank)", value: "4:00 PM PKR time / 3:00 PM GST" },
      { label: "Settlement", value: "PKR liquidity available within 30 minutes–1 hour of the bank receiving the USDT" },
      { label: "Payee verification", value: "Account title verified before any funds move" },
      { label: "Proof of payment", value: "Final status delivered asynchronously via webhook; status inquiry available as a fallback" },
      { label: "Liquidity availability", value: "Monday–Saturday, subject to cutoff. Not available Sundays." }
    ]
  }
};
