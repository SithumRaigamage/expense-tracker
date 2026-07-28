# 💰 Expense Tracker Application

<p align="center">
  <img src="expensive-tracker-frontend/src/assets/images/logo.svg" alt="Expensify — Expense Tracker logo" width="120"/>
</p>

<p align="center">
  <strong>A premium, modern personal finance management system.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Angular-19.1.0-DD0031?style=for-the-badge&logo=angular&logoColor=white" alt="Angular"/>
  <img src="https://img.shields.io/badge/Tailwind_CSS-4.0.14-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="TailwindCSS"/>
  <img src="https://img.shields.io/badge/Node.js-18.x-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js"/>
  <img src="https://img.shields.io/badge/MongoDB-4.4+-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB"/>
</p>

---

## 📋 Overview

The **Expense Tracker** is a full-stack, state-of-the-art financial management tool. It features a highly polished, glassmorphic UI, robust security with JWT, and comprehensive expense analytics. Designed with a mobile-first approach, it provides a seamless experience for tracking spending habits, managing complex multi-wallet flows, and monitoring financial goals through a dedicated product budgeting system.

## 🛠️ Tech Stack

### Frontend
- **Framework:** Angular 19 (Standalone Components, fully lazy-loaded routes)
- **Styling:** Tailwind CSS 4 (Theme-driven, CSS-first optimization)
- **Icons:** FontAwesome 6+
- **Charts:** ApexCharts (`ng-apexcharts`) & ECharts (`ngx-echarts`) for Flow, Gauge, and Trend charts
- **Dialogs/Forms:** Angular Material (dialog, form-field, input, select, button) alongside custom Tailwind components
- **Export:** SheetJS-based Excel export service

### Backend
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** MongoDB (Mongoose ODM)
- **Security:** JWT Authentication, Bcryptjs, Helmet, Express-Validator, express-mongo-sanitize, rate limiting
- **External Integration:** Real-time Exchange Rate API for multi-currency support

### CI/CD & Quality
- **Analysis:** SonarQube & SonarLint
- **Scanning:** Trivy Container Vulnerability Scanning
- **Testing:** Karma & Jasmine (Frontend), Jest (Backend)

---

# 🖥️ The UI, Screen by Screen

This section describes exactly what the application renders — every route, every widget, every drawer — so you can picture the product without running it.

## 🧭 Application Shell

The shell (`main-layout`) wraps every authenticated route: a fixed sidebar on the left, a sticky header on top, and a `router-outlet` in the padded main region.

### Sidebar (`app-sidebar`)

A fixed, full-height, frosted-glass panel (`bg-white/90 backdrop-blur-xl`, dark variant `bg-gray-900/95`).

- **Logo block** — the app logo (a wallet under a rising trend line, on the brand indigo gradient) beside the wordmark **“Expensify”**.
- **Collapse behaviour** — 288 px (`w-72`) when expanded, 96 px (`w-24`) when collapsed on desktop; hovering a collapsed sidebar temporarily expands it. On mobile it slides in over a blurred backdrop; clicking the backdrop or pressing **Escape** closes it.
- **Section “Dashboard”** — Dashboard, Wallets, Transactions, Product Budget, Financial Education, Chat.
- **Section “Management”** — Settings (expands to *Profile*, *About & Support*), Help Center (expands to *FAQs*, *Documentation*, *Contact Support*, *Troubleshooting*, *Release Notes*), Feedback.
- Parent items with children toggle open with a rotating chevron; children render in an indented list with a left border. A `NEW` pill can render beside a top-level item, and items flagged `isLocked` are hidden entirely.

### Header (`app-header`)

Sticky, white, bordered on large screens.

- **Hamburger / close button** — toggles the mobile drawer under 1024 px, collapses the desktop sidebar above it.
- **Mobile-only logo** — the app logo plus “Expensify”, linking to `/`.
- **Kebab button (mobile)** — reveals the right-hand action cluster.
- **Currency switcher** (`app-currency-switcher`) — a globe button showing the active code; the dropdown lists `USD, LKR, EUR, GBP, JPY, CAD, AUD, CHF, CNY, INR`. Selecting one rewrites every amount on screen and persists to `localStorage` + the user profile.
- **User dropdown** (`app-user-dropdown`) — avatar (falls back to a default SVG on error), name and email, an *Account settings* link, and **Sign out**.
- Two components exist but are currently commented out of the header template: `app-theme-toggle-button` and `app-notification-dropdown` (the latter has a full mock notification feed with priority dots and relative timestamps).

---

## 🔐 Auth Screens (no shell)

| Route | Screen | What it does |
|-------|--------|--------------|
| `/login` | **Sign In** | Reactive form with email (required + format) and password (required, min 6). Eye/eye-slash toggle reveals the password, a spinner replaces the submit label while the request is in flight, and inline errors appear on touch. Honours `?returnUrl=` to bounce you back to the page a guard interrupted, and shows *“Your session has expired. Please sign in again.”* when arriving with `?sessionExpired`. |
| `/register` | **Create Account** | Name (min 3), email, password (min 6) with the same visibility toggle and inline validation. On success it lands directly on `/dashboard`. |

Everything else sits behind `AuthGuard`; unknown paths redirect to `/dashboard`, and `/` redirects there too.

---

## 📊 Dashboard (`/dashboard`)

A 12-column responsive grid of independently toggleable widgets.

**Customize Dashboard** — a floating pill button in the bottom-right corner opens a right-hand drawer over a blurred backdrop. The drawer lists all 11 widgets as toggle rows with eye / eye-slash icons; visible rows are tinted brand-50. A **Reset to Default** button sits in the footer. Choices persist to `localStorage` under `dashboard_widget_config`, and **Escape** closes the drawer.

Widgets, in grid order:

### 1. Key Metrics (`app-metrics`)
One card per wallet type you actually own — Bank Balance, Cash in Hand, Savings, Credit Card, and so on — each with the type's FontAwesome icon, the summed balance across wallets of that type, and an up/down trend badge. Colour-coded per type (blue/green/amber/purple). Renders skeleton placeholders while loading and an empty state when you have no wallets.

### 2. Monthly Statistics (`app-monthly-stat`)
Current-month income, expense and net totals with an **Income / Expense / All** tab strip that switches the underlying bar chart (`app-chart`). Falls back to an empty state when there are no transactions.

### 3. Expense Breakdown (`app-expense-breakdown`) — *“Financial Flow Analysis”*
An ECharts panel with two tabs:
- **Sankey** — *Income → Wallets → Categories*, with coloured nodes, curved translucent links, adjacency highlighting on hover, and a tooltip reading `Source → Target: CUR 1,234`.
- **Sunburst** — *Categories share*, a two-ring radial chart totalling spend per category.

Both convert values into the active currency live. If the API returns nodes but no links, the widget shows the empty state instead of a smear of stacked labels.

### 4. Detailed Trend Chart (`app-statchart`)
An ApexCharts area chart of Income (green) vs Expenses (red) with gradient fills, a top-right legend, and a **Monthly / Quarterly / Annually / Trends** tab strip:
- *Monthly* — 12 month buckets;
- *Quarterly* — Q1–Q4;
- *Annually* — a single-year bar chart;
- *Trends* — one smooth line per year of expense history, from a 7-colour palette.

Y-axis labels render as `CUR 12K`; tooltips show the full converted amount.

### 5. Wallet Management (`app-manage-wallets`)
A compact card list of every wallet — coloured type icon, name, balance, currency — with a link through to the full Wallets page and a *“No wallets yet”* empty state.

### 6. Recent Transactions (`app-recent-transactions`)
The 20 most recent transactions sorted newest-first, displayed 5 at a time with a **View all** toggle. Table columns: Description, Category, Date, Amount, Type — the type rendered as a green (`income`) or red (`expense`) badge. Skeletons while loading.

### 7. Budget Planner (`app-budget-planner`)
Savings-goal cards showing name, progress bar, Saved, Remaining and Target Date. The bar is colour-graded by completion: red < 25 %, yellow < 50 %, blue < 75 %, green above. Has loading, error, and *“No budget goals yet”* states.

### 8. Upcoming Bills (`app-upcoming-bills`)
Only bills whose status is *Upcoming* or *Due Today*. Each row carries a category-coloured icon, provider, due date, amount, a status pill (blue / yellow / red for Upcoming / Due Today / Overdue) and a reminder toggle.

### 9. Emergency Fund (`app-emergency-fund`)
Bound to the wallet of type `emergencyfund`. Four stat tiles — **Current Balance**, **Target Goal**, **Monthly Goal**, **Progress** — above a *Balance History* ApexCharts area chart plotting cumulative savings (green) against cumulative spend (red), with thinned, rotated date labels. Below it, a paginated *Recent Transactions* table (10 per page) with Date, Category, Amount, Type and a **Running Balance** column. Two shortcuts deep-link into `/transactions?walletType=emergencyfund`, one of which also opens the add-transaction drawer pre-filled.

### 10. Financial Tips (`app-financial-education`)
Static curated cards (article/video, difficulty, duration) with a category filter and a **Financial Glossary** section of term/definition pairs. Missing thumbnails hide themselves rather than showing a broken-image icon.

> The widget registry also contains a `Fund Flow Analysis` entry whose component is commented out of the template — the toggle exists, but nothing renders for it.

---

## 👛 Wallets (`/wallets`)

- **Header row** — “Wallets” title, plus **Transfer**, **Export**, **Refresh** and **Add Wallet** actions.
- **Total Assets card** — the sum of every wallet converted into the active currency.
- **Wallet grid** — one card per wallet: coloured type icon, name, balance, type label, and edit/delete icons. Deleting opens a confirmation dialog.
- **Add / Edit drawer** (`app-side-drawer`) with two tabs:
  - **Manual** — Name (min 3), Type (Cash, Bank Account, Credit Card, Savings Account, Crypto Assets, Investments, Loans, Emergency Fund), Balance (≥ 0), Currency (10 options), optional Payment Method, all with inline validation.
  - **Upload** — drop a `.json` array of wallets; the file is parsed and validated client-side (name, valid type, numeric balance), a preview lists *“Previewing N Wallets”*, and import reports per-wallet successes and failures.
- **Transfer dialog** — a Material dialog with From wallet, To wallet, amount (> 0) and description. Same-wallet transfers are rejected inline; the backend performs the move atomically.
- **Export** — writes every wallet to `MyWallets.xlsx`.
- Distinct states for loading, *Connection Error* (with a **Go to login** path when the failure is an auth error) and *No Wallets Found*.

## 💳 Transactions (`/transactions`)

- **Filter bar** — custom dropdowns for **All Types / Income / Expense**, **All Categories**, **All Wallets**, plus start/end date pickers and a *“Search by description…”* box. Every dropdown closes on backdrop click or **Escape**. A **Reset** clears them all.
- **Table** — Date, Description, Category, Wallet, Amount, Type, Actions (edit / delete). Amounts render in the active currency; delete asks for confirmation.
- **Pagination** — 10 rows per page with numbered page controls.
- **Export** — all transactions to `AllTransactions.xlsx`.
- **Add / Edit drawer** with two tabs:
  - **Manual** — Date, Amount, Description, Type, Category (filtered to the chosen type) and Wallet. Choosing a category **auto-selects a sensible wallet**: health/medical/emergency-style categories jump to the emergency fund wallet, salary-style categories jump to a bank wallet, otherwise the first cash or bank wallet is used.
  - **Upload** — JSON import validated for description, type, amount, category and date, with an *“Previewing N Items”* summary and a per-row failure report.
- Reads `?walletType=emergencyfund&action=add` to pre-filter the list and open the drawer as an income entry.

## 🎯 Product Budget (`/budget`)

- **Header** — “Product Budget Goals” with **Add Goal**, **Import**, **Export** and **Refresh**.
- **Toolbar** — a *“Search goals…”* box, a **Sort** dropdown (Progress, Amount, Target Date, Name) and a **Filter** dropdown (All, Ongoing, Completed). Both close on Escape.
- **Goal cards** — cover image, name, a colour-graded progress ring/bar (red → orange → yellow → blue → green), saved vs target amounts, target date, and per-card **Add Money**, **Edit** and **Delete** actions. Empty state: *“No goals found”*.
- **Drawer**, in three modes:
  - **Add / Edit Goal** — Cover Image via **URL or upload** (images only, ≤ 2 MB, stored as a base64 data URL with an upload spinner), Goal Name, Target Amount, Initial Savings, Target Date.
  - **Add Money to Goal** — pick a **source wallet** (only cash/bank wallets with a positive balance, each showing its available balance), then a contribution amount with quick-fill percentage buttons and an **Entire Balance** button. The server debits the wallet and credits the goal in a single transaction, clamping the amount to whichever is smaller — the wallet balance or what the goal still needs — and reports back how much it actually applied.
  - **Import** — JSON array of goals validated for name, targetAmount and targetDate, with a preview and per-goal failure report.

## 🧾 Bills & Payments (`/bills`)

- Card grid of bills — icon, name, category, due date, amount, status pill — with edit and delete actions.
- **Add / Edit drawer** — Bill Name, Category (Utilities, Subscription, Entertainment, Internet, Insurance), Provider, Amount, Due Date, optional icon URL, a **Recurring Bill** switch (“Auto-renew this bill monthly”) and an **Auto-pay Wallet** selector limited to funded cash/bank wallets.
- **Payment History** list of settled bill transactions.
- **Export** to `MyBills.xlsx`.

> Bills are served from an in-memory demo dataset (Mobitel, Spotify, Dialog subscriptions), not from MongoDB — there is no bills endpoint yet.

## 🎓 Financial Education (`/financial-education`)

Search box, difficulty / type / category filters (beginner–advanced; article, video, quiz; budgeting, investing, savings, taxes), sortable by title, date added, duration or difficulty, paginated 9 cards per page. Cards support bookmarking, marking complete (sets progress to 100 %) and star ratings. Content is currently seeded from local sample data.

## 💬 Chat (`/chat`)

A chat surface with an assistant/user message thread, timestamps, expandable source citations, a loading bubble, and controls for **clear chat**, **copy message**, **regenerate response**, plus temperature and max-token settings. Responses are simulated on a timer — no model is wired up yet.

## 📝 Feedback (`/feedback`)

Four category tiles (Feature Request, Bug Report, UI/UX Feedback, Performance), a five-emoji sentiment strip (😢 → 😄), a 1–5 star rating, title, description (min 20 chars), file attachments, and an auto-populated device-info field (user agent, platform, screen and window size). Submission currently logs to the console and resets the form.

## ⚙️ Settings (`/settings`)

A shell with a `router-outlet`; the sidebar exposes **Profile** and **About & Support**, and `/settings/currency` is routable directly.

- **Profile** (`/settings/profile`) — avatar with camera-badge upload (with progress and error fallbacks), editable profile fields in a side drawer, a **change password** form (current, new ≥ 8, confirm, with a match validator and per-field eye toggles) and a **change email** form (new email + password confirmation). Existing secrets render as a masked `●●●●●●●●●●`.
- **Currency** (`/settings/currency`) — a select of supported currencies fetched from the backend; changing it updates the app-wide active currency and confirms with an alert.
- **About & Support** (`/settings/about & support`) — app name and version, release highlights, developer card, an accessibility statement, legal links (Terms, Privacy, License) and an **Export all data** button that writes wallets, transactions, budget goals, upcoming bills and bill history into a single multi-sheet `ExpenseTracker_FullExport.xlsx`.

## ❓ Help Center (`/help`)

Also a `router-outlet` shell, with five children:

- **FAQs** (`/help/faqs`) — searchable, category-filtered accordion (Getting Started, Wallet Management, Transactions, Budgeting, Account Settings) with helpful / not-helpful voting.
- **Documentation** (`/help/docs`) — sectioned guides with screenshots and video slots, plus a PDF download action.
- **Contact Support** (`/help/support`) — four contact tiles (email, live chat, phone, ticket), a support-hours table, expected response times, and a ticket form with name, email, subject, category, priority and message.
- **Troubleshooting** (`/help/troubleshooting`) — searchable issue list with error codes, severity pills (green/yellow/red) and step-by-step solutions.
- **Release Notes** (`/help/release-notes`) — version-stamped, expandable entries split into **Features**, **Bug fixes** and **Improvements**, with a search box. Admins additionally get a create/edit form (semver-validated version, date, three newline-separated lists, published flag) and delete controls; the write endpoints are admin-only server-side.

---

## 🧩 Shared UI Components

Reusable pieces in [`shared/components/`](expensive-tracker-frontend/src/app/shared/components/):

| Component | Selector | Purpose |
|-----------|----------|---------|
| Badge | `app-badge` | Status pill — colour, `light`/`solid` variant, size, optional start/end icon. |
| Chart | `app-chart` | ApexCharts wrapper driven by `chartType` (`income`/`expense`/`all`) and a transaction list. |
| Chart Tab | `app-chart-tab` | Monthly / Quarterly / Annually / Trends segmented control; emits `periodChanged`. |
| Monthly Transaction Tab | `app-monthly-transaction-tab` | Income / Expense / All segmented control; emits `tabChanged`. |
| Confirmation Dialog | `app-confirmation-dialog` | Material destructive-action confirmation, driven by `DialogService`. |
| Currency Switcher | `app-currency-switcher` | Header globe dropdown over the 10 supported currencies. |
| Dropdown | `app-dropdown` | Generic anchored popover with an `isOpen` input and `closed` output. |
| Empty State | `app-empty-state` | Icon + title + message placeholder in three sizes. |
| Side Drawer | `app-side-drawer` | The right-hand sheet used by Wallets, Transactions, Budget, Bills and Profile. |
| Skeleton | `app-skeleton` | Shimmer placeholder with width, height and rounding inputs. |
| Toast | `app-toast` | Global feedback stack, fed by `NotificationService`; mounted once at the app root. |
| `appCurrency` pipe | — | Converts and formats any amount into the currently active currency. |

## 🔌 Frontend Services

`auth` (login/register/logout/verify, `currentUser$`, `isAdmin`), `wallet` (CRUD, bulk import, transfer, metrics, expense flow), `transaction` (CRUD, bulk import, monthly stats, categories), `product-budget` (goals, bulk add, add money), `bill` (in-memory bills + history), `settings` (profile, currencies), `release-note`, `dashboard` (widget visibility persistence), `sidebar-service` (expand/mobile state), `excel-export`, plus `core/services/currency` (rates, conversion, active currency) and `core/services/token`.

An `AuthInterceptor` attaches the bearer token to every request and, on a 401 that is *not* a credential check (`/users/login`, `/register`, `/change-password`, `/change-email`), clears the session and redirects to `/login?sessionExpired=1` — so a rejected token can never strand you on a dashboard of failed widgets.

---

## 🌐 REST API

All routes are mounted under `/api/v1` and, unless noted, require a bearer token.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/users/register` | Create an account (rate-limited, validated). *Public.* |
| `POST` | `/users/login` | Sign in and receive a JWT. *Public.* |
| `POST` | `/users/logout` | End the session. |
| `GET` | `/users/verify` | Validate the current token. |
| `GET` `PUT` | `/users/profile` | Read / update the profile (incl. preferred currency). |
| `PUT` | `/users/change-password` | Change password with current-password confirmation. |
| `POST` `DELETE` | `/users/profile/image` | Upload or remove the avatar (5 MB, jpg/png/gif). |
| `GET` `POST` | `/wallets` | List / create wallets. |
| `GET` `PUT` `DELETE` | `/wallets/:id` | Read / update / soft-delete a wallet. |
| `PATCH` | `/wallets/:id/restore` | Restore a soft-deleted wallet. |
| `DELETE` | `/wallets/bulk` | Bulk delete. |
| `GET` | `/wallets/stats` | Aggregate wallet statistics. |
| `GET` | `/wallets/flow` | Sankey nodes and links for the flow chart. |
| `POST` | `/wallets/transfer` | Atomic wallet-to-wallet transfer. |
| `GET` `POST` | `/expenses` | List / create transactions. |
| `GET` `PUT` `DELETE` | `/expenses/:id` | Single-transaction operations. |
| `GET` | `/expenses/stats/summary` | Expense summary. |
| `GET` | `/expenses/monthly` | Monthly expense series. |
| `GET` | `/expenses/monthly-stats` | Income / expense / net for a month. |
| `GET` `POST` | `/categories` | List / create categories. |
| `GET` `PUT` `DELETE` | `/categories/:id` | Single-category operations. |
| `POST` | `/categories/defaults` | Seed the default category set. |
| `GET` `POST` | `/productbudgets` | List / create savings goals. |
| `GET` `PUT` `DELETE` | `/productbudgets/:id` | Single-goal operations. |
| `PATCH` | `/productbudgets/:id/amount` | Set a goal's saved amount directly. |
| `POST` | `/productbudgets/:id/contribute` | Move money from a wallet into a goal in one transaction. |
| `GET` | `/productbudgets/summary` | Goal summary. |
| `GET` | `/release-notes` · `/release-notes/:version` | Public changelog. |
| `POST` `PUT` `DELETE` | `/release-notes[/:id]` | Manage changelog entries. **Admin only.** |
| `GET` | `/currency/rates` · `/currency/supported` | Live exchange rates and the supported list. *Public.* |
| `GET` | `/health` | Liveness probe. |

### Domain constants

- **Wallet types:** `cash`, `bank`, `credit`, `savings`, `crypto`, `investment`, `loan`, `emergencyfund`
- **Currencies:** `LKR` (default), `USD`, `EUR`, `GBP`, `JPY`, `CAD`, `AUD`, `CHF`, `CNY`, `INR`
- **Category types:** `income`, `expense`
- **Payment methods:** `cash`, `credit_card`, `debit_card`, `bank_transfer`, `digital_wallet`, `other`
- **Recurring frequencies:** `daily`, `weekly`, `monthly`, `yearly`
- **Roles:** `user`, `admin`

### Data models

| Model | Key fields |
|-------|-----------|
| **User** | name, firstName, lastName, email (unique), password (bcrypt, hidden), currency, avatar, profileImage, phone, bio, location, role, isActive, lastLogin, reset-token fields |
| **Wallet** | name, type, balance, currency, paymentMethod, user, isActive |
| **Expense** | title, amount, description, category → Category, wallet → Wallet, user, date, paymentMethod, receipt, tags, isRecurring, recurringFrequency |
| **Category** | name (unique per user), description, icon, colour (hex), type, user, isActive |
| **ProductBudget** | name, imageUrl, targetAmount, savedAmount, targetDate, user, isActive, plus virtual `progress` and `remainingAmount` |
| **ReleaseNote** | version (unique), date, features[], bugfixes[], improvements[], isPublished |

---

## ✨ Feature Summary

- 👤 **Advanced Authentication:** JWT login/register with reactive validation, password visibility toggles, return-URL handling and automatic session recovery on 401.
- 🎨 **Premium UI/UX:** Glassmorphic cards, collapsible hover-expanding sidebar, side drawers, skeleton loaders and purpose-built empty states.
- 🧩 **Customisable Dashboard:** Eleven widgets you can show or hide, persisted per browser.
- 💳 **Wallet & Account Management:** Eight wallet types, native currencies, atomic transfers, soft delete with restore, JSON bulk import and Excel export.
- 🌊 **Financial Flow Analysis:** ECharts Sankey and Sunburst views of money moving from income through wallets into categories.
- 🎯 **Product Budgets (Savings Goals):** Target vs saved tracking, colour-graded progress, wallet-funded contributions clamped to the remaining target, and cover images by URL or upload.
- 🌍 **Automated Multi-Currency:** Live exchange rates with app-wide conversion from a single header switcher.
- 📊 **Dynamic Analytics:** Monthly statistics, monthly/quarterly/annual/multi-year trend charts, and an emergency-fund balance history.
- 📤 **Data Portability:** Per-page Excel export plus a single multi-sheet full-account export.
- 📝 **Release Repository:** Admin-controlled release notes and changelog tracking.

---

## 🗂️ Project Structure

```bash
expense-tracker/
├── 📂 expensive-tracker-frontend/      # Angular 19 SPA
│   ├── 📂 src/app/
│   │   ├── 📂 auth/components/         # login, register
│   │   ├── 📂 main-layout/             # shell: sidebar, header, dropdowns
│   │   ├── 📂 dashboard/               # dashboard page + 10 widgets
│   │   ├── 📂 Navigation/components/   # wallets, transactions, budget, bills,
│   │   │                               # education, chat, feedback, help, settings
│   │   ├── 📂 shared/                  # badge, chart, drawer, skeleton, pipes…
│   │   ├── 📂 core/                    # guards, interceptors, models, services
│   │   └── 📂 services/                # feature/API services
├── 📂 expensive-tracker-backend/       # Node.js API
│   ├── 📂 src/
│   │   ├── 📂 controllers/             # request handlers
│   │   ├── 📂 models/                  # Mongoose schemas
│   │   ├── 📂 routes/                  # API entry points
│   │   ├── 📂 services/                # Sankey flow, currency, wallet services
│   │   ├── 📂 middleware/              # auth, validation, uploads, rate limits
│   │   └── 📂 validators/              # express-validator rule sets
└── 📝 README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18.x or higher)
- MongoDB running locally or on Atlas

### Environment variables

The API refuses to boot without these (see `src/config/validateEnv.js`):

| Variable | Required | Notes |
|----------|----------|-------|
| `MONGODB_URI` | yes | Connection string. |
| `JWT_SECRET` | yes | Rejected if absent, a known placeholder, or under 32 chars in production. Generate with `openssl rand -base64 48`. |
| `PORT` | no | Defaults to 3001. |
| `NODE_ENV` | no | `development` enables the Docker MongoDB bootstrap and verbose logging. |
| `FRONTEND_URL` | production | Comma-separated allowed origins for CORS. Ignored outside production, where CORS is open. |
| `JWT_EXPIRE` | no | Token lifetime, default 30d. |

The frontend reads its API base URL from `src/environments/environment.ts`
(development) and `environment.prod.ts` (production, `/api/v1` relative to the
host). Production builds swap the file via `fileReplacements` in `angular.json`.

### Quick Start

> **⚡ One command:** From the repo root, run `./start.sh` to launch the backend
> and frontend together. It installs dependencies if needed, brings MongoDB up in
> Docker (starting Docker Desktop first if it isn't running), and streams both
> logs. Press `Ctrl+C` to stop everything.
>
> ```bash
> ./start.sh            # start both services
> ./start.sh --dev      # backend with data seeding + nodemon
> ./start.sh --help     # all options
> ```
>
> The same MongoDB bootstrap runs on `npm run dev` inside the backend, so that
> works standalone too. Both go through `ensure-mongo.sh`, which starts the
> `mongodb` service from `expensive-tracker-backend/docker-compose.yml` (container
> `expense-tracker-db`, data kept in a named volume) and waits for it to accept
> connections.
>
> **This only happens when `NODE_ENV=development`** — taken from the shell if set,
> otherwise from `expensive-tracker-backend/.env`. Any other value skips the
> container so deployed environments keep using their own database. Pointing local
> dev at Mongo Atlas or a local `mongod`? Set `SKIP_MONGO=1` (or pass `--no-mongo`).

Prefer to run each service manually? Follow the steps below.

1. **Clone & Setup:**
   ```bash
   git clone https://github.com/SithumRaigamage/expense-tracker.git
   cd expense-tracker
   ```

2. **Backend Setup:**
   ```bash
   cd expensive-tracker-backend
   npm install
   npm run dev  # Starts server and seeds initial data (User, Release Notes, etc.)
   ```

3. **Frontend Setup:**
   ```bash
   cd ../expensive-tracker-frontend
   npm install
   npm run start # Launches dev server at http://localhost:4200
   ```

## 🐳 Containerization & Security

The application is fully containerized for production deployment.

```bash
# Build and Scan Frontend
cd expensive-tracker-frontend
docker build -t expense-tracker:2.0.0 .
trivy image expense-tracker:2.0.0
```

## 📈 Roadmap

- [x] Angular 19 Upgrade
- [x] Tailwind CSS 4 Integration
- [x] Refactored Auth UI/UX
- [x] Multi-Currency Support (Automated)
- [x] Product Budgeting & Savings Tracking
- [x] Real-time Financial Flow Visualization
- [x] Customisable dashboard widgets
- [x] Excel export (per-page and full account)
- [/] AI-driven spending insights & predictions *(Chat UI built, model not yet wired)*
- [ ] Persist Bills to MongoDB (currently an in-memory demo dataset)
- [ ] Real content for Financial Education
- [ ] Wire up the Feedback submission endpoint
- [ ] Re-enable the theme toggle and notification centre in the header
- [ ] Automated financial report generation (PDF/Excel)
- [ ] Push notifications for budget thresholds

---
<p align="center">
  Developed by <strong>Sithum Raigamage</strong><br>
  <a href="https://github.com/SithumRaigamage">GitHub</a> • <a href="https://linkedin.com/in/sithum-raigamage">LinkedIn</a>
</p>
