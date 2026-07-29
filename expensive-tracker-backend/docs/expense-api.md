# Expense API Documentation

This API allows users to manage their expenses. All endpoints are protected and require authentication.

## Base URL

```http
/api/v1/expenses
```

## Authentication

All endpoints require a valid JWT token in the Authorization header:

```http
Authorization: Bearer <token>
```

## Endpoints

### Get All Expenses

**Endpoint:** `GET /api/v1/expenses`

**Description:** Get all expenses with optional filtering, sorting, and pagination.

**Query Parameters:**

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `sortBy` - Field to sort by (default: date)
- `sortOrder` - Sort order: 'asc' or 'desc' (default: desc)
- `startDate` - Filter by start date (ISO format)
- `endDate` - Filter by end date (ISO format)
- `category` - Filter by category ID
- `minAmount` - Filter by minimum amount
- `maxAmount` - Filter by maximum amount

**Response:**

```json
{
  "success": true,
  "message": "Expenses retrieved successfully",
  "data": [
    {
      "_id": "60d21b4667d0d8992e610c85",
      "title": "Grocery Shopping",
      "amount": 50.50,
      "description": "Weekly groceries from supermarket",
      "category": {
        "_id": "60d21b4667d0d8992e610c80",
        "name": "Food",
        "color": "#FF5722",
        "icon": "🍔",
        "type": "expense"
      },
      "user": "60d21b4667d0d8992e610c84",
      "date": "2023-06-22T10:00:00.000Z",
      "paymentMethod": "card",
      "isRecurring": false,
      "createdAt": "2023-06-22T10:00:00.000Z",
      "updatedAt": "2023-06-22T10:00:00.000Z"
    }
  ],
  "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "pages": 5
  }
}
```

### Get Single Expense

**Endpoint:** `GET /api/v1/expenses/:id`

**Description:** Get a specific expense by ID.

**Response:**

```json
{
  "success": true,
  "data": {
    "_id": "60d21b4667d0d8992e610c85",
    "title": "Grocery Shopping",
    "amount": 50.50,
    "description": "Weekly groceries",
    "category": {
      "_id": "60d21b4667d0d8992e610c80",
      "name": "Food",
      "color": "#FF5722",
      "icon": "🍔",
      "type": "expense"
    },
    "date": "2023-06-22T10:00:00.000Z",
    "paymentMethod": "card",
    "isRecurring": false
  }
}
```

### Create Expense

**Endpoint:** `POST /api/v1/expenses`

**Description:** Create a new expense.

**Request Body:**

```json
{
  "title": "Grocery Shopping",
  "amount": 50.50,
  "category": "60d21b4667d0d8992e610c80",
  "date": "2023-06-22",
  "description": "Weekly groceries",
  "paymentMethod": "card",
  "isRecurring": false
}
```

**Response:**

```json
{
  "success": true,
  "message": "Expense created successfully",
  "data": {
    "_id": "60d21b4667d0d8992e610c85",
    "title": "Grocery Shopping",
    "amount": 50.50,
    "category": { ... },
    "user": "60d21b4667d0d8992e610c84",
    "date": "2023-06-22T00:00:00.000Z",
    "createdAt": "2023-06-22T12:00:00.000Z"
  }
}
```

### Update Expense

**Endpoint:** `PUT /api/v1/expenses/:id`

**Description:** Update an existing expense.

**Request Body:**

```json
{
  "amount": 60.00,
  "description": "Updated description"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Expense updated successfully",
  "data": { ... }
}
```

### Delete Expense

**Endpoint:** `DELETE /api/v1/expenses/:id`

**Description:** Delete an expense.

**Response:**

```json
{
  "success": true,
  "message": "Expense deleted successfully",
  "data": {}
}
```

### Get Expense Statistics

**Endpoint:** `GET /api/v1/expenses/stats/summary`

**Description:** Get aggregated statistics (total, average, min, max) and breakdown by category.

**Query Parameters:**
- `startDate` (optional)
- `endDate` (optional)

**Response:**

```json
{
  "success": true,
  "data": {
    "summary": {
      "totalAmount": 1500.00,
      "count": 25,
      "avgAmount": 60.00,
      "minAmount": 10.00,
      "maxAmount": 200.00
    },
    "byCategory": [
      {
        "_id": "60d21b4667d0d8992e610c80",
        "name": "Food",
        "color": "#FF5722",
        "total": 500.00,
        "count": 10
      },
      ...
    ]
  }
}
```

### Get Monthly Expenses

**Endpoint:** `GET /api/v1/expenses/monthly`

**Description:** Get expenses for a specific month.

**Query Parameters:**
- `year` (optional, default: current year)
- `month` (optional, 1-12, default: current month)

**Response:**

```json
{
  "success": true,
  "message": "Expenses for June 2023 retrieved",
  "data": [ ... ],
  "pagination": { ... }
}
```

### Get Monthly Statistics

**Endpoint:** `GET /api/v1/expenses/monthly-stats`

**Description:** Get total expenses breakdown by month for a given year.

**Query Parameters:**
- `year` (optional, default: current year)

**Response:**

```json
{
  "success": true,
  "data": [
    { "month": 1, "total": 1200, "count": 15 },
    { "month": 2, "total": 1100, "count": 14 },
    ...
  ]
}
```
