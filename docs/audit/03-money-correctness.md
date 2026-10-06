# 🟡 Medium — Money Correctness

Wallet balances are stored as a running total that each endpoint must keep in step
with the transaction history. The defects below let the two drift apart. All are
**open**.

| ID | Issue | Location | Verification |
|---|---|---|---|
| M1 | Changing an expense's category between an **expense** type and an **income** type doesn't rebalance the wallet. Balances are only adjusted when `amount` or `wallet` change, so moving 100 from *Food* to *Salary* should shift the balance by +200 but shifts it by 0. | `services/expenseService.js` (`updateExpense`) | Reproduced |
| M2 | Deleting a category leaves its expenses without one. `deleteExpense`/`updateExpense` then read `expense.category.type` on `null` and fail with **500**, and the frontend mapper (`expense.category.name`) throws, which can empty the transaction list. | `services/categoryService.js` (`deleteCategory`), `services/expenseService.js:250`, frontend `services/transaction.service.ts` | Reproduced |
| M3 | Deleting a wallet (soft delete) makes its expenses impossible to edit or delete: `updateBalance` requires an active wallet and answers *"Wallet not found"*. | `services/walletService.js` (`deleteWallet`, `updateBalance`) | Reproduced |
| M4 | Transfers, goal contributions and bill payments ignore currency, so moving 100 from an LKR wallet into a USD wallet moves "100". The chat's *"Total across all wallets"* also sums different currencies together. | `walletService.transferFunds`, `productBudgetService.contribute`, `billService.payBill`, `chatService.buildFinancialContext` | Code review |
| M5 | The shipped compose file runs MongoDB as a single standalone server, which can't run transactions, so every multi-write money operation silently falls back to separate writes. Those also read the balance, modify it in memory and `save()` it back, so two concurrent requests overwrite each other. Prefer atomic `$inc` with a guard (`balance: { $gte: amount }`), and/or run MongoDB as a single-node replica set. | `walletService.transferFunds`, `productBudgetService.contribute`, `billService.payBill`, `docker-compose.yml` | Code review |
| M6 | Funding a savings goal debits the wallet but records no transaction, so the money disappears from history and analytics. Bill payments, by contrast, record an expense. | `services/productBudgetService.js` (`contribute`) | Code review |
| M7 | Bills: a subscription can be paid twice by double-submitting (only one-off bills set `paidAt`). Month roll-over uses `setMonth(+1)`, so a Jan 31 due date becomes Mar 3. Recurring expenses have the same overflow. | `services/billService.js:143`, `utils/recurrence.js:25` | Code review |
| M8 | `getExpenseStats` and `getMonthlyStats` add income and expense transactions together into one "total" without checking the category type. | `services/expenseService.js` | Code review |
