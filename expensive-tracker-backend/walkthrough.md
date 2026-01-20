# Backend Refactoring Walkthrough

## Overview
Infrastructure improvements for Expense Tracker Backend.

## 1. Logging (Winston)
Replaced `console.log` with `winston`.
- **Logs**: `logs/error-*.log`, `logs/combined-*.log`.
- **Rotates**: Daily, 14-day retention.

## 2. Errors & Constants
- **Classes**: `AppError`, `NotFoundError`, etc. in `src/utils/errors.js`.
- **Constants**: `src/config/constants.js` for currencies, types.
- **Middleware**: `errorHandler` now uses standardized errors.

## 3. Service Layer (New)
Moved logic from Controllers to Services.
- **CategoryService**: CRUD, defaults.
- **WalletService**: CRUD, stats, soft-delete.

## 4. Response Formatting
Standardized JSON responses in `src/utils/responseFormatter.js`.

## Next Steps
- Implement `ExpenseService` & `ProductBudgetService`.
- Add Validation middleware.
- Add Tests.
