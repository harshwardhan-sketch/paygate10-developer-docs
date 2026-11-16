# Paygate10 Developer Docs

Guides, API reference and tools for merchants integrating directly with the Paygate10 Gateway.
A static site with no build step: open `index.html` in a browser, or serve the folder from any static host.

## What's in it

| Tab | Content |
|---|---|
| Integration guide | Payment flows, integration journey (5 stages), quickstarts, build rules, operations, testing and go-live, troubleshooting |
| Payment methods | Gaming / Forex / P2P → pay-ins, payouts, settlements → country → method, with specs and demos |
| API reference | Overview, signing & hashes, callbacks, Payin, Payout, Get Balance, Get Status and the other utility requests, error codes, v1 and v2 compatibility |
| Hash playground | Body hash builder, HMAC signature header, hash detective |

Tools: site-wide search (header button, Ctrl/⌘ K or `/`), hash recipe finder, error-code filter, go-live checklists.

## Files

- `index.html`: page shell (content security policy included)
- `styles.css`, `redesign.css`: design (light and dark, mobile)
- `app.js`: router and shared helpers, SHA-256 / HMAC-SHA256 in plain JavaScript
- `apiref2.js`, `recipes.js`, `fieldrules.js`: API reference pages, hash recipe finder, per-country field rules and examples
- `guide.js`, `legacy.js`, `home.js`: guide pages, navigation, home page
- `methods.js`, `demos/`: Payment methods tab and checkout demos
- `playground.js`, `search.js`, `motion.js`: Hash playground, site search, light animations
- `spec/`: the API spec, one file per request (`payin.js`, `payout.js`, `balance.js`, `other-requests.js`, `refund.js`) plus `error-codes.js`; `spec/load.js` puts them together
- `assets/`: icon and payment-method data

## Publishing

Any static host works. Never add secrets, MID secrets, bank details or internal-only information to the site, and no company names, logos or links: the site is branded Paygate10 only.

## How to update

- Field rules per country and method (required / optional, example values, notes): `fieldrules.js`
- API fields, hash formulas and examples: `spec/payin.js`, `spec/payout.js`, `spec/balance.js`, `spec/other-requests.js` (how to edit is at the top of each file)
- Error codes: `spec/error-codes.js`; how to fix each code: `error-fixes.js`; grouping: `errgroups.js`
- Guide pages: `guide.js`, `legacy.js`, `home.js`; payment methods: `methods.js`, `assets/product-data.js`
- A new spec file needs its own `<script>` line in `index.html`, before `spec/load.js`

After changing any `.css` or `.js` file, run this before committing:

```
python3 tools/stamp.py
```

It updates the `?v=` stamps in `index.html`, so browsers never mix a new page with cached old files. `python3 tools/stamp.py --check` exits with an error if a stamp is out of date.
