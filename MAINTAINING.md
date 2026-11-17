# Maintaining the docs site

This repository is the source of truth for the Paygate10 merchant docs. There is no other copy and nothing is imported
from anywhere: when the gateway changes, change the files here. Anyone on the team may edit, commit and publish.

Everything is plain text (HTML, CSS, JavaScript and data written as JavaScript). There is no build step, framework or package to install.

## The workflow

1. Edit the file(s) for your change (see the task list below).
2. Look at it: open `index.html` in a browser (double-click works) and go to the page you changed.
3. Run the check:

   ```
   python3 tools/check.py --write
   ```

   It updates the cache stamps in `index.html`, then opens the whole site in headless Chrome: every page and link,
   every country and method in the pickers, the hash playground, search and phone layout. It prints each problem with
   the page it is on, and ends with `All checks passed.` Fix what it reports and run it again. Needs Python 3 and Google Chrome.
4. Commit and push. The site is static: the host serves the files as they are (GitHub Pages publishes `main` within a few minutes).

If you skip step 3, browsers may keep old copies of the files you changed and show a broken mix of old and new.

## Where things are

| You want to change | Edit |
|---|---|
| A field: name, type, length, required, description | `spec/<request>.js`, the field table |
| A hash formula | `spec/<request>.js`, the `SHA256(...)` block in the `hash-generation` section |
| An example request or response | `spec/<request>.js`, `examples` at the end of the file |
| What is required / optional for one country and method | `fieldrules.js` |
| An error code or its message | `spec/error-codes.js` |
| The "how to fix" text of an error | `error-fixes.js` (`FIX`) |
| The endpoint URL | `spec/payin.js`, section `endpoint` (`Production URL: ...`) |
| Guide pages (quickstarts, build rules, journey) | `legacy.js` |
| Shared guide pages (operations, testing, go-live, FAQ, fixing hash errors) | `guide.js` |
| Signing & hashes page, API page layout, code samples | `apiref2.js` |
| Payment methods tab (limits, specs, demos) | `assets/product-data.js`, `methods.js` |
| Hide a page or request from the site | `HIDDEN` and `HIDE_RECIPE` in `app.js` |
| Menu order | `nav` in `legacy.js` (API reference), `LEGACY_GUIDE_NAV` in `legacy.js` (guide) |

`<request>` is `payin`, `payout`, `balance` or `other-requests` (Get Status, Get Bank List, Get Transaction List, Verify ...).
Each spec file starts with a comment that explains its format.

## Common tasks

### Change a field

In the request's spec file, find the row in the field table:

```js
['<code>amount</code>', 'Number', 'Max 10.2', 'Yes', 'Transaction amount.'],
//  parameter            type      length      required  description
```

Required is `Yes`, `No`, or `Conditional <when>` (for example `Conditional Required for India.`). A field inside an object
(`userInfo`, `merchantUrl`, ...) goes in that object's table in the `nested-objects` section. The API page, search and
the parameter list pick it up automatically.

If the field is required in some countries and not others, also update `fieldrules.js` (next task): the picker shows what
`fieldrules.js` says for the picked country and method.

### Change what a country needs

`fieldrules.js` has one entry per request, country and method, for example `R['payin|India|H']` (H = hosted) or
`R['payout|Pakistan|BT']` (the `paymentMethod` code):

```js
mandatory: [['userInfo.phone', 'the customer\'s mobile, 10 digits']],  // required, with a hint shown under the field
dummy:     [['riskData.user_category', 'Default']],                     // required, with a ready value to send
optional:  ['businessCategory', 'customField'],                         // optional
notes:     ['Shown under "Good to know".'],
```

Only write a rule that integration support has confirmed. A field not listed falls back to the field table in the spec.

### Change a hash formula

Edit the `SHA256(...)` block. The Signing page, the recipe finder, the Hash playground and the hash detective all read
the formula from there, so it lives in one place only. Keep the format: field names joined with `~`, the secret written
as `midsecret`, for example `SHA256(midcode~merchantrefno~amount~currency~midsecret)`. Callback hashes are written with
spaces and no `~`: `SHA256(midcode transactionid amount midsecret)`. The check recomputes every recipe in the playground.

The recommended way to sign is the `X-Callback-Signature` header (HMAC-SHA256 of the raw body). It is described on the
Signing page (`signingPage` in `apiref2.js`) and in `spec/payin.js`, section `request-signature`. The `hash` field is the
older method, kept for existing integrations: keep calling it that.

### Add a country or method to Payin or Payout

1. **Example:** add an entry to `examples` in `spec/payin.js` or `spec/payout.js`. The title decides where it appears:
   `'Seamless <Method> (<Country>)'` or `'Hosted <Methods> (<Country>)'`, for example `'Seamless Wallet (Egypt)'`.
   The country in brackets becomes a chip in the country picker; the request JSON is shown as the example.
2. **Method fields:** in the `payment-methods` section, add a table under the heading `For <Method> (<Country>)` with the
   `paymMethodFields` of that method. The picker matches it to the example by the words in the title.
3. **Hash:** in `hash-generation`, add an `h4` heading `Seamless <Method> (<Country>)` and the `SHA256(...)` block below it.
4. **Rules:** add `R['payin|<Country>|<paymentMethod code>']` in `fieldrules.js`.
5. New country only: add its flag to `FLAG` in `apiref2.js`, its currency to `CCY` in `playground.js`, and example values to
   `FIELD_EXAMPLES` in `fieldrules.js` if it has country-specific formats.

Run the check: it opens every country and method combination and reports any that show no fields.

### Add a utility request (like Get Status)

Add a section to `spec/other-requests.js` with `h3` headings `Request Body`, `Response Body` and `Hash Generation`
(copy an existing one, such as `get-bank-list`), and add its examples at the end of the file with titles that start with
the section title. It appears in the API reference menu automatically, in the order of the sections in the file
(the menu is ordered by how much merchants use each request: Get Status, Get Balance, Get Bank List, Get Transaction List, Verify ...).

### Add or change an error code

Add a line to `spec/error-codes.js`:

```js
{ErrorCode: '11500', ErrorMessage: 'Example message.', v1ErrorCode: null, v1ErrorMessage: null},
```

It is grouped automatically by its message (`errgroups.js`) and gets a generic fix by the shape of the message. For a
specific fix, add it to `FIX` in `error-fixes.js`.

### Edit a guide page

Guide pages are HTML inside JavaScript template strings (`` `...` ``) in `legacy.js` and `guide.js`. Edit the text as
HTML. Inside the backticks, write a backtick as `` \` `` and `${` as `\${`. Links to other pages look like
`<a href="#/legacy/payout">Payout</a>`.

### Add a new page

Add `LG['my-page'] = () => \`<h1>Title</h1>...\`` in `legacy.js` and add `['my-page', 'Title']` to the right group in the
menu (`LEGACY_GUIDE_NAV` for the guide, `nav` for the API reference). If you add a new `.js` file, add a `<script>` line
for it in `index.html` (spec files go before `spec/load.js`) and a line in the README's Files table: the check fails otherwise.

## Rules for the content

- Merchant-facing only. No MID secrets, real credentials, bank details, provider names or internal names.
- No links to the old docs sites (document.paygate10.com, document.payfuture.net): they are being shut down.
- The API is called v1 and v2. Don't use the old platform names.
- Don't ask merchants to send "dummy" or test data: risk checks decline it. Give a realistic example value instead.
- Required / optional must match what the gateway really does. When unsure, check with integration support.

The check enforces most of these: the banned words are listed at the top of `tools/selftest.js`, and you can add to them.

## If something breaks

- **A page is blank:** open the browser console (F12). A JavaScript error names the file and line; usually it is a missing
  comma or quote in a spec file.
- **The check says "link lands on the wrong page":** a link points to a page that does not exist; the site would silently
  show the first page instead.
- **The check says "version stamps are out of date":** run `python3 tools/check.py --write` (not just `check.py`).
- **The check says "banned text":** the message shows the words around it and the page it is on.
- **Chrome not found:** install Google Chrome, or run `CHROME=/path/to/chrome python3 tools/check.py --write`.
