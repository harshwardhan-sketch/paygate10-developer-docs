# Paygate10 Developer Docs

Guides, API reference and tools for merchants integrating directly with the Paygate10 Gateway.
A static site with no build step: open `index.html` in a browser, or serve the folder from any static host.

## What's in it

| Tab | Content |
|---|---|
| Integration guide | Payment flows, integration journey (5 stages), quickstarts, build rules, operations, testing and go-live, troubleshooting |
| Payment methods | Gaming / Forex / P2P → pay-ins, payouts, settlements → country → method, with specs and demos |
| API reference | Overview, signing & hashes, callbacks, Payin, Payout, Get Balance, Get Status and the other utility requests, error codes, v1 and v2 compatibility |
| Hash playground | Signature header (HMAC, recommended), older body hash builder, hash detective |

Tools: site-wide search (header button, Ctrl/⌘ K or `/`), hash recipe finder, error-code filter, go-live checklists.

## Files

| File | What it does |
|---|---|
| `index.html` | Page shell: header, tabs, script order, content security policy |
| `styles.css`, `redesign.css` | Design (light and dark theme, mobile) |
| **API spec** | |
| `spec/payin.js` | Payin: field tables, nested objects, payment methods, callback, hash formulas, examples |
| `spec/payout.js` | Payout: same structure as Payin |
| `spec/balance.js` | Get Balance |
| `spec/other-requests.js` | Get Status, Get Bank List, verifications, Get Transaction List and the other utility requests |
| `spec/refund.js` | Refund (kept for reference; refunds are manual, so it is hidden on the site, see `HIDDEN` in `app.js`) |
| `spec/error-codes.js` | Every error code and message, with the matching v1 code |
| `spec/load.js` | Puts the spec files together for the site and reads the hash recipes from their `SHA256(...)` blocks. No need to edit |
| **Rules and help text** | |
| `fieldrules.js` | Per country and method: which fields are required or optional, example values, "Good to know" notes |
| `error-fixes.js` | "How to fix" text for each error code |
| `errgroups.js` | How error codes are grouped on the Error codes page |
| **Pages** | |
| `app.js` | Router, shared helpers, SHA-256 / HMAC-SHA256 in plain JavaScript, Error codes page, list of pages hidden from the site (`HIDDEN`) |
| `apiref2.js` | API reference pages (Payin, Payout, Get Balance, utility requests, Signing & hashes, Callbacks): parameters, country and method picker, code samples in cURL / Node.js / Python / PHP |
| `recipes.js` | Hash recipe finder on the Signing & hashes page |
| `playground.js` | Hash playground: signature header (HMAC, recommended), older body hash builder, hash detective |
| `guide.js` | Shared guide pages and building blocks (operations, testing and go-live, troubleshooting, FAQ), used by `legacy.js` |
| `legacy.js` | Integration guide: its pages (welcome, journey, quickstarts, build rules, payouts and funding), its menu, and the API reference menu and routes |
| `home.js` | Docs home page and the Payment flows explainers (diagrams) |
| `methods.js` | Payment methods tab: industry, stage, country, method, with specs and demos |
| `assets/product-data.js` | Data for the Payment methods tab (method tables, limits, specs) |
| `assets/icon.svg` | Site icon |
| `demos/` | Clickable checkout demos used on the Payment methods tab: `checkout-flow` (generic hosted checkout), `egypt-p2p-flow`, `morocco-bank-flow`, `morocco-wallet-flow` |
| `search.js` | Site search (header button, Ctrl/⌘ K or `/`); runs in the browser only |
| `motion.js` | Small animations; off when the visitor prefers reduced motion |
| `tools/check.py` | Full check of the site: run it after every change (see How to update) |
| `tools/selftest.html`, `tools/selftest.js` | The browser part of the check: opens every page and link, clicks every tab and picker, checks hashing, search and phone width. Banned words are listed at the top of `selftest.js` |
| `tools/probe.js` | Helper the self-test loads into the site; not used by the site itself |
| `tools/stamp.py` | Adds `?v=` version stamps to `index.html` (run by `check.py --write`) |

## Publishing

Any static host works. Never add secrets, MID secrets, bank details or internal-only information to the site, and no company names, logos or links: the site is branded Paygate10 only.

## How to update

- Field rules per country and method (required / optional, example values, notes): `fieldrules.js`
- API fields, hash formulas and examples: `spec/payin.js`, `spec/payout.js`, `spec/balance.js`, `spec/other-requests.js` (how to edit is at the top of each file)
- Error codes: `spec/error-codes.js`; how to fix each code: `error-fixes.js`; grouping: `errgroups.js`
- Guide pages: `guide.js`, `legacy.js`, `home.js`; payment methods: `methods.js`, `assets/product-data.js`
- A new spec file needs its own `<script>` line in `index.html`, before `spec/load.js`

Everything is plain text: edit any file by hand. After a change, run this before committing:

```
python3 tools/check.py --write
```

It re-stamps `index.html` (so browsers never mix a new page with cached old files), then tests the whole site in Chrome: every page and link, the country and method pickers, hashing, search and phone width. It lists anything wrong and exits with an error. `python3 tools/check.py` (without `--write`) only checks. It needs Python 3 and Google Chrome.
