# Wallet CRUD API Documentation

## Overview
The Wallet API provides comprehensive CRUD (Create, Read, Update, Delete) operations for managing user wallets in the expense tracker application.

## Authentication
All endpoints require authentication via Bearer token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Base URL
```
/api/v1/wallets
```

## Endpoints

### 1. Create Wallet
**POST** `/api/v1/wallets`

Creates a new wallet for the authenticated user.

**Request Body:**
```json
{
  "name": "My Savings Account",
  "type": "savings",
  "balance": 5000,
  "currency": "USD",
  "paymentMethod": "Bank Transfer"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Wallet created successfully",
  "data": {
    "_id": "65f1a2b3c4d5e6f7g8h9i0j1",
    "name": "My Savings Account",
    "type": "savings",
    "balance": 5000,
    "currency": "USD",
    "paymentMethod": "Bank Transfer",
    "user": "65f1a2b3c4d5e6f7g8h9i0j2",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Validation Rules:**
- `name`: Required, 1-50 characters, must be unique per user
- `type`: Required, must be one of: `cash`, `bank`, `credit`, `savings`, `crypto`, `investment`, `loan`
- `balance`: Optional, must be non-negative number, defaults to 0
- `currency`: Optional, must be valid currency code, defaults to 'LKR'
- `paymentMethod`: Optional, max 30 characters

### 2. Get All Wallets
**GET** `/api/v1/wallets`

Retrieves all active wallets for the authenticated user with pagination and filtering.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `type`: Filter by wallet type
- `sortBy`: Sort field (default: 'createdAt')
- `sortOrder`: 'asc' or 'desc' (default: 'desc')

**Example Request:**
```
GET /api/v1/wallets?page=1&limit=5&type=bank&sortBy=balance&sortOrder=desc
```

**Response:**
```json
{
  "success": true,
  "count": 3,
  "total": 8,
  "pagination": {
    "page": 1,
    "limit": 5,
    "pages": 2
  },
  "data": [
    {
      "_id": "65f1a2b3c4d5e6f7g8h9i0j1",
      "name": "My Savings Account",
      "type": "savings",
      "balance": 5000,
      "currency": "USD",
      "user": "65f1a2b3c4d5e6f7g8h9i0j2",
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

### 3. Get Single Wallet
**GET** `/api/v1/wallets/:id`

Retrieves a specific wallet by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "65f1a2b3c4d5e6f7g8h9i0j1",
    "name": "My Savings Account",
    "type": "savings",
    "balance": 5000,
    "currency": "USD",
    "paymentMethod": "Bank Transfer",
    "user": "65f1a2b3c4d5e6f7g8h9i0j2",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### 4. Update Wallet
**PUT** `/api/v1/wallets/:id`

Updates an existing wallet. Only provided fields will be updated.

**Request Body:**
```json
{
  "name": "Updated Savings Account",
  "balance": 7500,
  "paymentMethod": "Online Banking"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Wallet updated successfully",
  "data": {
    "_id": "65f1a2b3c4d5e6f7g8h9i0j1",
    "name": "Updated Savings Account",
    "type": "savings",
    "balance": 7500,
    "currency": "USD",
    "paymentMethod": "Online Banking",
    "user": "65f1a2b3c4d5e6f7g8h9i0j2",
    "isActive": true,
    "updatedAt": "2024-01-15T11:45:00.000Z"
  }
}
```

### 5. Delete Wallet (Soft Delete)
**DELETE** `/api/v1/wallets/:id`

Soft deletes a wallet by setting `isActive` to false.

**Response:**
```json
{
  "success": true,
  "message": "Wallet deleted successfully",
  "data": {}
}
```

### 6. Get Wallet Statistics
**GET** `/api/v1/wallets/stats`

Retrieves comprehensive statistics about user's wallets.

**Response:**
```json
{
  "success": true,
  "data": {
    "byType": [
      {
        "_id": "bank",
        "totalBalance": 15000,
        "count": 3,
        "avgBalance": 5000
      },
      {
        "_id": "cash",
        "totalBalance": 500,
        "count": 1,
        "avgBalance": 500
      }
    ],
    "byCurrency": [
      {
        "_id": "USD",
        "totalBalance": 12000,
        "count": 2
      },
      {
        "_id": "LKR",
        "totalBalance": 3500,
        "count": 2
      }
    ],
    "overall": {
      "totalBalance": 15500,
      "totalWallets": 4,
      "avgBalance": 3875,
      "maxBalance": 10000,
      "minBalance": 500
    }
  }
}
```

### 7. Bulk Delete Wallets
**DELETE** `/api/v1/wallets/bulk`

Soft deletes multiple wallets at once.

**Request Body:**
```json
{
  "walletIds": [
    "65f1a2b3c4d5e6f7g8h9i0j1",
    "65f1a2b3c4d5e6f7g8h9i0j2",
    "65f1a2b3c4d5e6f7g8h9i0j3"
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "3 wallets deleted successfully",
  "data": {
    "deletedCount": 3,
    "requestedCount": 3
  }
}
```

### 8. Restore Deleted Wallet
**PATCH** `/api/v1/wallets/:id/restore`

Restores a soft-deleted wallet by setting `isActive` to true.

**Response:**
```json
{
  "success": true,
  "message": "Wallet restored successfully",
  "data": {
    "_id": "65f1a2b3c4d5e6f7g8h9i0j1",
    "name": "My Savings Account",
    "type": "savings",
    "balance": 5000,
    "isActive": true,
    "updatedAt": "2024-01-15T12:00:00.000Z"
  }
}
```

## Error Responses

### Validation Error
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "type": "field",
      "msg": "Wallet name is required",
      "path": "name",
      "location": "body"
    }
  ]
}
```

### Not Found Error
```json
{
  "success": false,
  "error": "Wallet not found"
}
```

### Duplicate Name Error
```json
{
  "success": false,
  "error": "A wallet with this name already exists"
}
```

### Invalid ID Error
```json
{
  "success": false,
  "error": "Invalid wallet ID format"
}
```

## Wallet Types
- `cash`: Physical cash
- `bank`: Bank account
- `credit`: Credit card
- `savings`: Savings account
- `crypto`: Cryptocurrency wallet
- `investment`: Investment account
- `loan`: Loan account

## Supported Currencies
- `LKR`: Sri Lankan Rupee (default)
- `USD`: US Dollar
- `EUR`: Euro
- `GBP`: British Pound
- `JPY`: Japanese Yen
- `CAD`: Canadian Dollar
- `AUD`: Australian Dollar
- `CHF`: Swiss Franc
- `CNY`: Chinese Yuan
- `INR`: Indian Rupee

## Security Notes
- All operations are scoped to the authenticated user
- Users can only access their own wallets
- Soft delete ensures data integrity
- Input validation prevents malicious data

## Rate Limiting
API endpoints are subject to rate limiting to prevent abuse. Default limits apply per IP address.
