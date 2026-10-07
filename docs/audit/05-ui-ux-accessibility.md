# 🔵 Low — UI/UX and Accessibility

| ID | Issue | Location | Status |
|---|---|---|---|
| U1 | The free-text "Role/Occupation" input wrote to the authorization role. See C1. | `profile.component.html` | ✅ Fixed (C1) |
| U2 | Both password fields are pre-filled with a fake `●●●●●●●●●●` value that must be cleared before typing. This confuses users and breaks password managers. | `profile.component.ts` | ⏳ Open |
| U3 | The transaction form picks *type* separately from *category*, so "Income" + "Food" is allowed. The API goes by the category, so the user's choice of type is silently ignored. The amount field allows `0`, which the API rejects. | `transactions.component.ts` | ⏳ Open |
| U4 | The production CSP allows images only from `'self'`, `data:` and Unsplash, so bill logos and goal images from any other host are blocked. | `nginx.conf.template` | ⏳ Open |
| U5 | When `/users/verify` fails for *any* reason, including being offline, the user is signed out. That undermines the installed PWA. | frontend `services/auth.service.ts`, `core/guards/auth.guard.ts` | ⏳ Open |
| U6 | Root-level services (`TransactionService`, `WalletService`) keep the previous user's data after logout. On a shared device it flashes for the next person until their own data loads. | frontend services | ⏳ Open |
| U7 | Bills & Payments has no sidebar entry. A settings route is literally named `about & support`, which produces an encoded URL. | `sidebar.component.ts`, `app.routes.ts` | ⏳ Open |
| U8 | 12 elements remove the focus outline (`outline-none`) with no `focus-visible`/`focus:ring` replacement, so keyboard users lose track of focus. | various templates | ⏳ Open |
