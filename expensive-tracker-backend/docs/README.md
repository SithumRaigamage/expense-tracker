# API Documentation

This directory contains the API documentation for the Expense Tracker Backend.

## Overview
The API is designed with RESTful principles, using JSON for data exchange. All endpoints are prefixed with `/api/v1`.

## Authentication
Most endpoints require authentication via JWT (JSON Web Token). 
Include the token in the request header: `Authorization: Bearer <token>`.

## Modules

- **[User API](./user-api.md)**
  - Registration, Login, Profile Management, Password Reset
  
- **[Expense API](./expense-api.md)**
  - CRUD for Expenses, Filtering, Search, and Statistics
  
- **[Category API](./category-api.md)**
  - Manage transaction categories (Income/Expense)
  
- **[Wallet API](./wallet-api.md)**
  - Manage multiple wallets/accounts
  
- **[Product Budget API](./product-budget-api.md)**
  - Set and track saving goals for specific items
  
- **[Release Notes API](./release-notes-api.md)**
  - Access changelogs and version history

## Response Format

**Success:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "error": "Error message description"
}
```
