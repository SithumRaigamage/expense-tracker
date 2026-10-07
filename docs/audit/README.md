# Application Audit — October 2026

A full audit of the Expense Tracker covering security, data integrity, functional
bugs, UI/UX, accessibility, infrastructure and repository hygiene.

- **Audited revision:** working tree on `fix/m8-stats-split-by-type`
- **Date:** 2026-10-07
- **Scope:** `expensive-tracker-backend/`, `expensive-tracker-frontend/`, root
  Docker/nginx/CI configuration

## How findings were verified

Each finding is marked with how it was established:

| Marker | Meaning |
|---|---|
| **Reproduced** | Exploited or triggered against the real application code and a throwaway MongoDB instance. Most of these now have a regression test. |
| **Code review** | Established by reading the code; not exercised at runtime. |
| **Tooling** | Reported by `npm audit`, the linter or the test runner. |

## Severity scale

| Severity | Meaning |
|---|---|
| 🔴 **Critical** | Any signed-in user can take over privileges or damage the server. Fix immediately. |
| 🟠 **High** | Exploitable security weakness, or a defect that silently corrupts financial data. |
| 🟡 **Medium** | A feature is broken or gives wrong numbers, without a security impact. |
| 🔵 **Low** | UX, accessibility, maintainability or hardening. |

## Reports

| File | Contents | Issues |
|---|---|---|
| [01-critical-security.md](01-critical-security.md) | Privilege escalation, arbitrary file deletion | C1–C2 |
| [02-high-security-data-integrity.md](02-high-security-data-integrity.md) | Mass assignment, injection-by-type, proxy trust, uploads, error leakage, sessions, dependencies | H1–H7 |
| [03-money-correctness.md](03-money-correctness.md) | Wallet balances drifting from the transaction history | M1–M8 |
| [04-broken-features.md](04-broken-features.md) | Frontend/API contract mismatches and logic bugs | F1–F12 |
| [05-ui-ux-accessibility.md](05-ui-ux-accessibility.md) | Usability and accessibility | U1–U8 |
| [06-infra-ci-hygiene.md](06-infra-ci-hygiene.md) | Docker, CI, dependencies, repository contents | I1–I10 |

## Status tracker

| ID | Title | Severity | Status |
|---|---|---|---|
| C1 | Any user can grant themselves the `admin` role | 🔴 Critical | ✅ Fixed |
| C2 | Arbitrary file deletion via `profileImage` path traversal | 🔴 Critical | ✅ Fixed |
| H1 | Mass assignment on update/create endpoints | 🟠 High | ✅ Fixed |
| H2 | Wallet transfer with a string amount inflates balances | 🟠 High | ✅ Fixed |
| H3 | `trust proxy` unset — shared rate-limit bucket, wrong URLs | 🟠 High | ✅ Fixed |
| H4 | Uploads: public receipts, missing nginx route, no volume | 🟠 High | ✅ Fixed |
| H5 | Internal error messages returned to clients; 404s returned as 500 | 🟠 High | ✅ Fixed |
| H6 | Sessions cannot be revoked; token lifetime ignores config | 🟠 High | ✅ Fixed |
| H7 | Known-vulnerable dependencies | 🟠 High | ⚠️ Partially fixed |
| M1–M3, M5–M8 | Money correctness | 🟡 Medium | ✅ Fixed |
| M4 | Cross-currency transfers and payments | 🟡 Medium | ⏳ Open |
| F1, F12 | Broken features | 🟡 Medium | ✅ Fixed |
| F2–F11 | Broken features | 🟡 Medium | ⏳ Open |
| U1–U8 | UI/UX & accessibility | 🔵 Low | ⏳ Open (U1 resolved by C1) |
| I1–I10 | Infra, CI & hygiene | 🔵 Low | ⏳ Open (I3 partially fixed) |

Remediation for C1–H7 was completed across the security-fix work and is being
verified on the current branch. Each report records what changed and how it was
verified. Regression tests live
in `expensive-tracker-backend/tests/integration/security.test.js` and
`tests/unit/trustProxy.test.js`.

## Required actions when deploying the fixes

1. **Run the role migration and review admins:** `npm run migrate:roles` in
   `expensive-tracker-backend` (add `--dry-run` first to preview). Any account
   could make itself admin before C1 was fixed, so demote anyone on the printed
   list who shouldn't be there.
2. **Set `TRUST_PROXY`** to the number of proxies in front of the API. The
   bundled compose file defaults it to `1`. Leave it unset when the API is
   reached directly.
3. **Recreate the backend container** so the new `uploads` and `receipts`
   volumes are created. Copy any existing avatars into the `uploads` volume.
4. **Rebuild the frontend image** to pick up the nginx `/uploads/` route and the
   Angular security patch.

After deploy, sessions issued earlier stay valid until they expire or the user
changes their password.
