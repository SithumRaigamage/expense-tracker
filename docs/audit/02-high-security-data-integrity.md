# 🟠 High — Security and Data Integrity

---

## H1 — Mass assignment on update/create endpoints

| | |
|---|---|
| **Severity** | 🟠 High — mass assignment (CWE-915) |
| **Verification** | Reproduced |
| **Status** | ✅ Fixed |
| **Location** | `services/expenseService.js` (`updateExpense`), `services/walletService.js` (`createWallet`, `updateWallet`), `services/categoryService.js` (`createCategory`, `updateCategory`), `services/billService.js` (`createBill`) |

### Description

Several endpoints pass `req.body` straight to Mongoose
(`findOneAndUpdate(filter, req.body)` or `Model.create(req.body)`), so a client
can write fields the UI never exposes: `user`, `isActive`, `parentExpense`,
`nextRunDate`, `paidAt` and so on.

### Impact

- `PUT /expenses/:id {"user": "<other id>"}` moves a record into another user's
  account. The victim then sees transactions they never made, which corrupts
  their history and analytics.
- The same works for wallets and categories.
- On create, clients can set server-owned state such as a bill's `paidAt`.

### Reproduction

An expense created by Alice and updated with `{"user": "<Bob's id>"}` appears in
Bob's `GET /expenses`.

### Remediation

Use an explicit allow-list of client-writable fields for every create and update,
applied at the HTTP boundary (controller). Internal callers (recurring engine,
importers) keep using the services directly. `ProductBudget` is not affected:
its Joi schemas already reject unknown keys.

### Resolution

- New `src/utils/pick.js`. Expense, wallet, category and bill controllers pass
  only allow-listed fields to their services. Internal callers (the recurring
  engine, importers) are unchanged.
- `updateExpense` now checks that a new wallet belongs to the user and is active
  *before* reverting any balance. Previously a foreign wallet id reverted the old
  balance and then failed, losing the money.
- Regression tests: *H1* (expense/wallet/category reassignment, server-owned
  fields on create, balance safety, bills created already paid).

---

## H2 — Wallet transfer with a string amount inflates balances

| | |
|---|---|
| **Severity** | 🟠 High — improper input validation leading to balance corruption (CWE-20, CWE-843) |
| **Verification** | Reproduced |
| **Status** | ✅ Fixed |
| **Location** | `services/walletService.js` (`transferFunds`), `routes/walletRoutes.js` |

### Description

`POST /wallets/transfer` has no validator. `amount` is used as-is, so a JSON
string `"100"` gives `fromWallet.balance -= "100"` (numeric: 400) but
`toWallet.balance += "100"` (string concatenation: `"500100"`). Mongoose then
casts the result back to a number.

### Impact

Turning 500 into 500100 lets a user create money out of nothing, and it can also
happen by accident from any non-browser client. Every report built on wallet
balances is then wrong.

### Remediation

Validate the request (both wallet ids must be Mongo ids, `amount` a positive
finite number, `description` optional with a bounded length). Coerce `amount` to
a number and round it to cents in the service, as a second line of defence for
internal callers.

### Resolution

- `validateTransfer` (express-validator) checks both ids and requires `amount`
  to be a positive number (converted with `toFloat()`). `description` is
  optional and bounded, and accepts the empty value the dialog sends.
- `transferFunds` also coerces `amount` and rounds it to cents, for internal callers.
- Regression tests: *H2* (`"100"` moves exactly 100; `"abc"`, negatives, zero,
  `null` and `{ $gt: 0 }` are rejected with no balance change).

---

## H3 — `trust proxy` unset: shared rate-limit bucket and wrong URLs

| | |
|---|---|
| **Severity** | 🟠 High — denial of service through a shared rate-limit bucket (CWE-770); incorrect origin handling |
| **Verification** | Code review |
| **Status** | ✅ Fixed |
| **Location** | `src/app.js`, `docker-compose.yml`, `src/controllers/profileController.js`, `src/controllers/receiptController.js` |

### Description

In the supported deployment, nginx proxies `/api` to the backend, but Express
never sets `trust proxy`. As a result:

- `req.ip` is always nginx's container address.
- `req.protocol` is always `http`, even behind TLS.
- Upload URLs are built from `req.protocol` and the `Host` header, which nginx
  forwards without the published port.

### Impact

- **Everyone shares one rate-limit bucket.** Ten failed logins from *anyone*
  lock *everyone* out of login and registration for 15 minutes. That is a
  trivial lockout attack, and normal traffic spends a single shared budget of
  1000 requests per 15 minutes.
- Avatar and receipt URLs come out as `http://localhost/uploads/...` (wrong
  scheme and port), so they break in production and are mixed content under
  HTTPS.

### Remediation

- Make the proxy trust level configurable with `TRUST_PROXY` (hop count, `true`,
  or a subnet list). Leave it off by default, because trusting a proxy that
  doesn't exist lets clients spoof `X-Forwarded-For`. Set `TRUST_PROXY=1` in the
  compose file where nginx is the only hop.
- Store upload URLs as root-relative paths (`/uploads/<file>`), so they are
  correct behind any host, port or scheme.

### Resolution

- `src/config/trustProxy.js` parses `TRUST_PROXY`, which Express reads before any
  middleware. It is off by default. The root `docker-compose.yml` sets
  `TRUST_PROXY=1` (nginx is the only hop).
- Upload URLs are root-relative now (see C2/H4), so they no longer depend on
  `req.protocol` or the `Host` header.
- Documented in both `.env.example` files.
- Regression tests: `tests/unit/trustProxy.test.js`. Behind a trusted proxy, a
  client that fails ten logins is locked out (429) while a second client is not.

---

## H4 — Uploads: public receipts, missing nginx route, no persistent volume

| | |
|---|---|
| **Severity** | 🟠 High — sensitive data exposure (CWE-552), plus data loss on redeploy |
| **Verification** | Code review |
| **Status** | ✅ Fixed |
| **Location** | `src/app.js`, `src/middleware/fileUpload.js`, `src/middleware/imageCORS.js`, `src/controllers/receiptController.js`, `expensive-tracker-frontend/nginx.conf.template`, `docker-compose.yml` |

### Description

1. Receipt images are written to the same public `/uploads` directory as avatars
   and served with no authentication, `Access-Control-Allow-Origin: *` and a
   24-hour public cache.
2. nginx has no `/uploads` location (only the dev server's `proxy.conf.json`
   does). In Docker, every image request falls through to `index.html`, so
   avatars never load.
3. The compose file mounts no volume for uploads, so every image is lost when
   the backend container is recreated.
4. Two code paths compute the upload directory differently: `FILE_UPLOAD_PATH`
   relative to the working directory in multer, and `__dirname` in the static
   handler. If they diverge, files are written somewhere that is never served.
5. `imageCORS` sends `Access-Control-Allow-Credentials: true` alongside a
   wildcard origin, a combination browsers reject.

### Impact

Receipts contain merchant names, card fragments, amounts and dates. Anyone who
gets hold of a URL can read them, with no session needed.

### Remediation

- Store receipts in a **private** directory outside the static root. Serve them
  through an authenticated endpoint that only returns a user's own files.
- Resolve every storage path once, as an absolute path, in a single config module.
- Add the nginx `/uploads/` route and named volumes for both directories.
- Drop the invalid credentials header.

**Follow-up (not in this fix):** receipts from scans that are never saved as
expenses are never deleted. They need a retention job.

### Resolution

- Receipts are written to a private `RECEIPT_DIR` (default
  `storage/receipts`, override with `RECEIPT_UPLOAD_PATH`) outside the static
  root. They are served by `GET /api/v1/expenses/receipts/:fileName`, which
  requires a session and checks ownership from the file-name prefix. Other
  users get the same 404 as a missing file.
- nginx: added `location ^~ /uploads/` (proxied to the API) and changed `/api/`
  to `^~`. Without `^~`, the static-asset regex claims any URL ending in
  `.png`/`.jpg`. Verified with `nginx -t` against the rendered template.
- Compose: named volumes `uploads` and `receipts`. Both directories are git- and
  docker-ignored.
- Removed the invalid `Access-Control-Allow-Credentials` header from `imageCORS`.
- Regression tests: *H4* (owner 200 with `Cache-Control: private`, other user
  404, anonymous 401, not reachable via `/uploads`, traversal 404).

> **Still open:** receipts from scans never saved as expenses aren't cleaned
> up. They need a retention job. Receipts stored before this change remain in
> `public/uploads`; move them to `storage/receipts` if you need them private.

---

## H5 — Internal error messages leak; 404s become 500s

| | |
|---|---|
| **Severity** | 🟠 High — information exposure through error messages (CWE-209) |
| **Verification** | Reproduced |
| **Status** | ✅ Fixed |
| **Location** | `src/middleware/errorHandler.js`, `src/middleware/notFound.js`, `src/controllers/releaseNoteController.js` |

### Description

- The error handler returns `err.message` for every error, including unexpected
  ones, in every environment. The audit triggered
  `"Cannot read properties of null (reading 'type')"` from the production code path.
- `notFound` and the release-note controller signal status with
  `res.status(404)` followed by `throw`, but the handler ignores `res.statusCode`.
  **Every unknown API route and every missing release note answered `500`.**

### Impact

Internals (property names, library errors, occasionally paths) are disclosed to
attackers. Monitoring sees a stream of false 500s, and clients can't tell
"not found" from "server broken".

### Remediation

- Honour a 4xx status already set on the response.
- For 5xx errors outside development, return a generic `"Server Error"`. The
  full detail stays in the server log.

### Resolution

- The error handler was rewritten around a `classify()` step. It honours a 4xx
  already set on the response and `http-errors` statuses (malformed JSON is now
  400). For 5xx outside development it returns the generic `"Server Error"`;
  the detail is still logged server-side. 4xx are logged at `warn`, 5xx at `error`.
- Unknown API routes and missing release notes now return 404.
- Regression tests: *H5*.

---

## H6 — Sessions cannot be revoked; token lifetime ignores config

| | |
|---|---|
| **Severity** | 🟠 High — insufficient session expiration (CWE-613) |
| **Verification** | Code review |
| **Status** | ✅ Fixed |
| **Location** | `src/services/userService.js`, `src/middleware/auth.js`, `src/controllers/userController.js` |

### Description

- Logout only clears the browser cookie. A copied token stays valid for its full
  30 days.
- Changing the password does not end other sessions. A thief who already has a
  token keeps access after the victim changes their password, which is the very
  moment the victim is trying to lock them out.
- The JWT lifetime reads `JWT_EXPIRES_IN`, which nothing sets. The cookie reads
  `JWT_EXPIRE`. Setting `JWT_EXPIRE=1h` shortened the cookie but not the token
  inside it.

### Remediation

- Give every token a unique `jti` and record revoked ids in a `RevokedToken`
  collection with a TTL index, so entries expire when the token would have.
  Logout revokes the current token.
- Add a `tokenVersion` to `User` and embed it in the token. Changing the password
  increments it, which invalidates every other session at once. The current
  session is re-issued, so the user who just changed their password stays signed in.
- Read the lifetime from one function that both the token and the cookie use.

### Resolution

- Tokens carry a unique `jti` and the user's `tv` (`tokenVersion`, hidden from
  API responses).
- `RevokedToken` collection with a TTL index. Logout revokes the current token
  only, so other devices stay signed in.
- Changing the password increments `tokenVersion`, which invalidates every
  session. The current session is re-issued a cookie so the user stays signed in.
- `protect` rejects revoked tokens and stale versions. Tokens issued before this
  change stay valid until they expire or the password changes.
- Token and cookie lifetimes now come from one function (`JWT_EXPIRE`).
- Regression tests: *H6* and `tests/unit/userService.test.js`.

> **Recommendation:** 30 days (`JWT_EXPIRE=30d`) is long for a finance app.
> Consider 7 days or less.

---

## H7 — Known-vulnerable dependencies

| | |
|---|---|
| **Severity** | 🟠 High (uses components with known vulnerabilities, CWE-1395) |
| **Verification** | Tooling (`npm audit --omit=dev`) |
| **Status** | ✅ Fixed |
| **Location** | `expensive-tracker-backend/package-lock.json`, `expensive-tracker-frontend/package-lock.json` |

### Description

- **Backend:** 9 advisories (1 critical, 2 high), including `proxy-addr`
  IP spoofing (GHSA-jqcg-44mw-7w3h). That one matters directly once
  `trust proxy` is enabled (H3). Also `qs` denial of service.
- **Frontend:** 13 advisories (6 high), including `source-map-js` and `uuid`
  (through `exceljs`).

### Remediation

Apply the non-breaking upgrades (`npm audit fix`) and re-run the test suites.
Track any advisory whose fix needs a breaking major upgrade separately.

### Resolution

- **Backend:** `npm audit fix` → **0 vulnerabilities** (was 9: 1 critical, 2 high).
- **Frontend:** non-breaking fixes applied, and the Angular framework packages
  moved together from 21.2.18 to **21.2.25** (same major; fixes the
  `@angular/common` and `@angular/compiler` XSS and cache advisories). Down from
  13 production advisories to **2 moderate**.
- **`uuid` through `exceljs`** (branch `fix/h7-exceljs-uuid`): exceljs 4.4.0 is
  the latest release (December 2024) and still depends on `uuid@^8`; npm's only
  "fix" was downgrading exceljs to 3.4.0. A scoped override in
  `expensive-tracker-frontend/package.json`
  (`"overrides": { "exceljs": { "uuid": "^11.1.1" } }`) moves exceljs to
  `uuid@11.1.1` without touching other consumers. exceljs only calls
  `require('uuid').v4()`, which uuid 11 still exports. `npm audit --omit=dev`
  → **0 vulnerabilities**.
- **Residual, not exploitable:** the browser build loads exceljs's prebuilt
  `dist/exceljs.min.js`, which has uuid 8 compiled in, so the override can't
  reach that copy. The advisory (GHSA-w5hq-g745-h8pq) only affects
  `v3`/`v5`/`v6` called with a `buf` argument; exceljs only calls `v4()` with
  no arguments. Replacing exceljs would remove the bundled copy too. Revisit
  that if exceljs stays unmaintained.
- `uuid@8.3.2` also remains under `webpack-dev-server` → `sockjs`. It's a
  dev-server dependency and never ships.
- Verified: frontend production build, lint and 167/167 unit tests pass; exceljs
  writes a workbook with a data-bar conditional format (the code path that
  calls `uuidv4()`) under Node with `uuid@11.1.1`.

