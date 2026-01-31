# User Story: Wallet & Asset Management

## Current Status
- Users can create multiple wallets (e.g., Bank, Cash, Savings).
- Users can track the balance of each wallet.
- View total balance across all wallets.
- Manage wallet types (Credit, Crypto, Investment, etc.).

## Proposed Improvements for Individual Use

### 1. Inter-Wallet Transfers [IMPLEMENTED]
- **Story**: As a user, I want to record moving money from one wallet to another (e.g., ATM withdrawal from Bank to Cash) without it affecting my total net worth or appearing as a simple expense.
- **Status**: ✅ Implemented with atomic updates (background transactions with standalone fallback).
- **Benefit**: Accurate tracking of money movement without distorting income/expense reports.

### 2. Multi-Currency Support [IMPLEMENTED]
- **Story**: As a user who travels or holds foreign assets, I want to have wallets in different currencies (e.g., USD, LKR, EUR) with automatic conversion to my primary currency.
- **Status**: ✅ Implemented with real-time exchange rates.
- **Benefit**: Essential for users with international exposure or investments.
