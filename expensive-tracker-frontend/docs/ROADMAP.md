# Expense Tracker Project Roadmap

This document outlines the current state of the Expense Tracker application and details the planned features and future vision for the project.

## 🏁 Phase 0: Existing Features (Current State)

The application currently provides a robust foundation for personal finance management.

### 💰 Core Tracking
- **Multi-Wallet Management**: Separate tracking for Bank, Cash, and Savings accounts.
- **Transaction Logging**: Detailed recording of income and expenses with categories.
- **Bulk Operations**: Support for bulk adding transactions via the backend.
- **Multi-Currency**: Global settings for tracking in USD, LKR, EUR, etc.

### 📊 Visualization & Analysis
- **Customizable Dashboard**: Toggleable widgets for metrics, stats, and transaction lists.
- **Advanced Charts**: **Sankey** and **Sunburst** visualizations for financial flow and hierarchy. (Sankey flow upgraded with Inflow data - Development feature done)
- **Monthly Net Savings**: High-level comparison of Income vs. Expenses.

### 🎯 Planning Tools

- **Product Goals (Budget Planner)**: Target-vs-saved tracking for named savings goals, funded directly from a wallet.
- **Emergency Fund**: Dedicated module for building a financial safety net.
- **Upcoming Bills**: Recurring/one-off bill tracking with due-status pills and one-click pay-from-wallet.

### 🤖 Automation & Intelligence (shipped)

- **Import & Scan**: Receipt-photo OCR, bank-statement CSV import, and bank SMS-alert parsing — all landing in the same review-and-commit flow. (Was listed under Phase 2 below as future work; it's built and live at `/import`.)
- **Recurring Expenses**: Automatic generation of due recurring transactions, in-process or via external cron.
- **AI Financial Chat**: Streaming assistant answering from the user's real wallet/transaction/goal data, not generic advice.

### ⚙️ Utilities

- **Excel Export**: Per-page export plus a single multi-sheet full-account export.
- **Financial Education**: Six written articles + glossary (compiled-in, not yet CMS-editable).
- **Modern UI**: Dark/Light mode support with premium aesthetics.
- **PWA**: Installable on desktop, macOS and iOS.

---

## 🚀 Phase 1: Near-Term Enhancements (Planned)

Focus on efficiency and immediate value additions.

| Feature | Category | Description |
| :--- | :--- | :--- |
| **Subscription Tracker** | Automation | Auto-calculate total monthly cost of SaaS/recurring services. |
| **Privacy Mask** | Security | Toggle to blur sensitive balances in public spaces. |
| **Progress Overlays** | UI | Visual progress bars for Budget and Goal targets. |
| **Transaction Tags** | Organization | Add custom tags (e.g., #Vacation) across categories. |
| **Smart Templates** | Efficiency | One-click entry for common transaction types. |

---

## 📈 Phase 2: Deep Insights & Automation (Future)

Leveraging data and tools for better financial outcomes. (Statement import, AI chat, and OCR scanning — originally planned here — have already shipped; see Phase 0.)

### 💹 Advanced Forecasting
- **Net Worth Snapshot**: Line chart tracking `Assets - Debts` over time.
- **Budget Predictor**: Predictive alerts based on 6-month historical data.
- **"What-If" Simulator**: Impact analysis for major purchases or savings changes.

---

## 🎮 Phase 3: Engagement & Ecosystem (Vision)

Transforming the tracker into a holistic financial companion.

- **Gamification**: "No Spend" day streaks and Achievement Badges.
- **Debt Repayment Tool**: Snowball/Avalanche calculators for loan management.
- **Financial Goals 2.0**: Shared family budgets and cooperative goal tracking.

---

> [!NOTE]
> This roadmap is a living document and will be updated as new requirements emerge and features are implemented.
