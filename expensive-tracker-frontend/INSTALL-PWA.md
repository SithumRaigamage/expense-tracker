# Installing Expensify as an App

Expensify is a **Progressive Web App (PWA)**. The same build that runs in a
browser can be installed onto Windows, macOS, iOS and Android, where it opens in
its own window with its own icon — no separate download, no app store, and no
second codebase.

- [1. What you get](#1-what-you-get)
- [2. Before you install](#2-before-you-install)
- [3. Install on Windows](#3-install-on-windows)
- [4. Install on macOS](#4-install-on-macos)
- [5. Install on iPhone or iPad](#5-install-on-iphone-or-ipad)
- [6. Install on Android](#6-install-on-android)
- [7. Using the installed app](#7-using-the-installed-app)
- [8. Updating](#8-updating)
- [9. Uninstalling](#9-uninstalling)
- [10. Troubleshooting](#10-troubleshooting)
- [11. For developers](#11-for-developers)

---

## 1. What you get

| | |
|---|---|
| **Its own window** | No address bar or browser tabs — it looks and behaves like a desktop application. |
| **Its own icon** | Appears in the Windows Start menu and taskbar, the macOS Dock and Launchpad, or your phone's home screen. |
| **Quick actions** | Right-click the icon on Windows or macOS for shortcuts straight to **Dashboard**, **Transactions** and **Wallets**. |
| **Faster launches** | The interface is stored on your device, so it opens without re-downloading itself. |
| **Automatic updates** | New versions arrive on their own. See [section 8](#8-updating). |

### What it does *not* do

**Expensify still needs an internet connection.** Opening the app offline shows
the sign-in screen, not your data.

This is deliberate. Your balances and transactions are never stored on the
device, for two reasons:

1. A saved copy would show you an **out-of-date balance** with no way to tell it
   was stale.
2. On a shared computer, saved financial data could be **readable by the next
   person to sign in**.

Only the interface itself — layout, styling, icons — is stored locally.

---

## 2. Before you install

1. **Use a supported browser.** See the table below.
2. **Open the real site over `https://`.** Browsers only offer installation on a
   secure connection. (`http://localhost` is the one exception, for developers.)
3. **Sign in at least once** to confirm the app is reachable.

| Platform | Browser | Supported |
|---|---|---|
| Windows 10 / 11 | Microsoft Edge | Yes |
| Windows 10 / 11 | Google Chrome | Yes |
| macOS 14 Sonoma or later | Safari | Yes — *Add to Dock* |
| macOS | Chrome / Edge | Yes |
| iOS / iPadOS 16.4+ | Safari | Yes — home screen only |
| Android | Chrome | Yes |
| Any | Firefox on desktop | **No** — Firefox does not support desktop installation |

> **Note for iPhone and iPad:** installation must be done from **Safari**.
> Chrome and Firefox on iOS cannot install web apps.

---

## 3. Install on Windows

### Microsoft Edge

1. Open Expensify in Edge and sign in.
2. Wait about **30 seconds** on the page. *(The app registers its background
   updater shortly after loading; the install option appears once it has.)*
3. Look at the right-hand end of the address bar for the **install icon** — a
   small monitor with a downward arrow.
4. Click it, then click **Install**.
   - No icon? Use the **`···`** menu → **Apps** → **Install this site as an app**.
5. Edge offers to pin it to the taskbar and Start menu. Accept if you want it
   there.

### Google Chrome

1. Open Expensify in Chrome and sign in.
2. Wait about **30 seconds**.
3. Click the **install icon** at the right-hand end of the address bar.
   - No icon? Use the **`⋮`** menu → **Cast, save and share** →
     **Install page as app…**
4. Click **Install** in the dialog.

The app now appears in the Start menu as **Expensify** and can be pinned to the
taskbar.

---

## 4. Install on macOS

### Safari (macOS 14 Sonoma or later)

1. Open Expensify in Safari and sign in.
2. From the menu bar choose **File** → **Add to Dock…**
3. Confirm the name (**Expensify**) and click **Add**.

The icon appears in your Dock immediately.

> On macOS 13 Ventura and earlier, Safari cannot install web apps. Use Chrome or
> Edge instead, or simply keep a browser tab open.

### Chrome or Edge

1. Open Expensify and sign in.
2. Wait about **30 seconds**.
3. Click the **install icon** at the right-hand end of the address bar, or use
   **`⋮`** → **Cast, save and share** → **Install page as app…**
4. Click **Install**.

The app is added to your **Applications** folder and appears in Launchpad and
Spotlight.

---

## 5. Install on iPhone or iPad

You must use **Safari**.

1. Open Expensify in Safari and sign in.
2. Tap the **Share** button (a square with an upward arrow).
3. Scroll down and tap **Add to Home Screen**.
4. Confirm the name (**Expensify**) and tap **Add**.

The icon appears on your home screen and opens full-screen, without Safari's
address bar.

---

## 6. Install on Android

1. Open Expensify in Chrome and sign in.
2. Either tap the **Install app** banner if it appears, or open the **`⋮`** menu
   and tap **Add to Home screen** / **Install app**.
3. Tap **Install**.

---

## 7. Using the installed app

### Signing in

The installed app keeps a **separate session from your browser**, so you will be
asked to sign in the first time you open it even if you were already signed in
inside a browser tab. This is normal, and it means signing out of one does not
sign you out of the other.

### Quick actions (Windows and macOS)

**Right-click** the app's icon in the taskbar or Dock for direct links to:

- **Dashboard**
- **Transactions**
- **Wallets**

### Light and dark mode

The app follows your system appearance by default. Use the sun/moon button in
the header to override it; your choice is remembered on that device.

### Going offline

If you lose your connection, the app still opens but shows the sign-in screen.
Your data returns as soon as you are back online. See
[section 1](#1-what-you-get) for why nothing is stored locally.

---

## 8. Updating

Updates are automatic. You do **not** need to reinstall.

1. The app checks for a new version when it starts, and every six hours while it
   stays open.
2. When one is found, a small bar appears at the bottom of the window:
   *"A new version is available."*
3. Click **Reload** to switch to it immediately, or **✕** to dismiss and keep
   working — you will be offered it again next time.

> The app never reloads on its own. If it did, it could discard whatever you had
> half-typed into a form.

---

## 9. Uninstalling

Removing the app does **not** delete your account or any of your data.

| Platform | How |
|---|---|
| **Windows** | Start menu → right-click **Expensify** → **Uninstall**. Or Settings → Apps → Installed apps → **Expensify** → Uninstall. |
| **macOS (Chrome/Edge)** | Open `chrome://apps`, right-click **Expensify**, choose **Remove from Chrome…** |
| **macOS (Safari)** | Drag the icon out of the Dock, or delete it from the Applications folder. |
| **iOS / iPadOS** | Press and hold the icon → **Remove App** → **Delete App**. |
| **Android** | Press and hold the icon → **Uninstall**. |

You can reinstall at any time by following the steps above again.

---

## 10. Troubleshooting

### The install button never appears

Work through these in order:

1. **Are you on `https://`?** Installation is blocked over plain `http://`.
2. **Did you wait long enough?** The background updater registers up to 30
   seconds after the page loads. The option only appears afterwards.
3. **Is it already installed?** Browsers hide the option once it is. Check the
   Start menu, Applications folder or `chrome://apps`.
4. **Are you in a private / incognito window?** Installation is disabled there.
5. **Are you using Firefox on desktop?** It does not support installation.
6. **Still nothing?** In Chrome or Edge, open DevTools (`F12`) →
   **Application** → **Manifest**. Any unmet requirement is listed explicitly at
   the top.

### The app is stuck on an old version

1. Close every window of the app and reopen it.
2. If the update bar still does not appear, uninstall and reinstall it
   ([section 9](#9-uninstalling)).

### The app opens but is blank or unstyled

Usually a partially downloaded copy of the interface.

1. Close and reopen the app.
2. Still broken: uninstall, then in your browser clear the site's data
   (Chrome/Edge: DevTools → **Application** → **Storage** → **Clear site
   data**), then reinstall.

### It asks me to sign in every time

Check that your browser is not set to clear cookies on exit, and that the app is
not being opened in a private window.

---

## 11. For developers

### Testing installation locally

The service worker is **disabled in development builds**, so `ng serve` on
`:4200` will never offer to install the app. You need a production build served
over a secure context — `localhost` counts as one, so no certificate is needed.

```bash
# Build and serve in one step, on http://localhost:4300
npm run pwa

# Or serve a build you already made
npm run build
npm run serve:prod
```

`scripts/serve-prod.mjs` serves the build **and proxies `/api` to the backend on
port 3001**, keeping everything on one origin. That matters: the session cookie
is `SameSite=Strict`, so splitting the interface and the API across two origins
would stop the browser sending it at all.

The backend must be running:

```bash
cd ../expensive-tracker-backend && npm start
```

Override the ports with `PORT` and `API_PORT` if either is taken.

### Deployment requirements

- **Serve over HTTPS.** Browsers will not install a PWA otherwise.
- **Serve the interface and the API from the same origin**, for the cookie
  reason above.
- **Do not cache `ngsw.json` or `ngsw-worker.js`** at the CDN or reverse proxy.
  If either is served stale, clients can never discover a new version.
  `scripts/serve-prod.mjs` sets `Cache-Control: no-cache` on both as a reference.

### Relevant files

| File | Purpose |
|---|---|
| `ngsw-config.json` | What the service worker stores. **Intentionally has no `dataGroups`** — see the comment in `src/app/app.config.ts` before adding one. |
| `public/manifest.webmanifest` | App name, icons, colours and the quick-action shortcuts. |
| `public/icons/` | Icons, 72px to 512px, generated from `src/assets/images/logo.png`. |
| `src/app/shared/components/app-update/app-update.component.ts` | The "new version available" prompt. |
| `src/index.html` | Manifest link and Apple-specific tags. |
| `scripts/serve-prod.mjs` | Local production server used for the commands above. |

### Do not cache API responses

`ngsw-config.json` deliberately declares **no `dataGroups`**, so the worker
stores the application shell and nothing else. Adding an `/api/**` group would:

- serve users **stale balances** with no indication they are stale, and
- leak data between accounts, because the browser Cache API is scoped to the
  **origin, not the signed-in user** — one person's finances would remain
  readable to the next person to sign in on that device.

`navigationUrls` also excludes `/api`, so an API path falls through to the
network instead of being answered with `index.html`.

### Icons

The current set is declared `purpose: "any"`. They are **not** marked
`maskable`: the logo is a rounded square, and a circular mask would clip its
corners. Before targeting Android seriously, add a separate maskable variant
with roughly 20% safe-zone padding and declare it alongside these.
