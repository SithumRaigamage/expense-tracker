# Product Budget API Documentation

This API allows users to create and manage product budget goals. All endpoints are protected and require authentication.

## Base URL

```http
/api/v1/productbudgets
```

## Authentication

All endpoints require a valid JWT token in the Authorization header:

```http
Authorization: Bearer <token>
```

## Endpoints

### Create Product Budget

**Endpoint:** `POST /api/v1/productbudgets`

**Description:** Create a new product budget goal

**Request Body:**

```json
{
  "name": "New Laptop",
  "imageUrl": "https://example.com/image.jpg", 
  "targetAmount": 1500,
  "savedAmount": 300, 
  "targetDate": "2023-12-31", 
  "isActive": true
}
```

Note:

- `imageUrl` is optional
- `savedAmount` is optional, defaults to 0
- `targetDate` should be an ISO date string
- `isActive` is optional, defaults to true

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "60d21b4667d0d8992e610c85",
    "name": "New Laptop",
    "imageUrl": "https://example.com/image.jpg",
    "targetAmount": 1500,
    "savedAmount": 300,
    "targetDate": "2023-12-31T00:00:00.000Z",
    "user": "60d21b4667d0d8992e610c84",
    "isActive": true,
    "createdAt": "2023-06-22T10:00:00.000Z",
    "updatedAt": "2023-06-22T10:00:00.000Z",
    "progress": 20,
    "remainingAmount": 1200
  }
}
```

### Get All Product Budgets

**Endpoint:** `GET /api/v1/productbudgets`

**Description:** Get all product budgets for the current user

**Query Parameters:**
- `isActive` - Filter by active status (true/false)

**Response:**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "60d21b4667d0d8992e610c85",
      "name": "New Laptop",
      "imageUrl": "https://example.com/image.jpg",
      "targetAmount": 1500,
      "savedAmount": 300,
      "targetDate": "2023-12-31T00:00:00.000Z",
      "user": "60d21b4667d0d8992e610c84",
      "isActive": true,
      "createdAt": "2023-06-22T10:00:00.000Z",
      "updatedAt": "2023-06-22T10:00:00.000Z",
      "progress": 20,
      "remainingAmount": 1200
    },
    {
      "_id": "60d21b4667d0d8992e610c86",
      "name": "Vacation",
      "imageUrl": "https://example.com/vacation.jpg",
      "targetAmount": 3000,
      "savedAmount": 1500,
      "targetDate": "2023-08-15T00:00:00.000Z",
      "user": "60d21b4667d0d8992e610c84",
      "isActive": true,
      "createdAt": "2023-06-22T11:00:00.000Z",
      "updatedAt": "2023-06-22T11:00:00.000Z",
      "progress": 50,
      "remainingAmount": 1500
    }
  ]
}
```

### Get Product Budget Summary

**Endpoint:** `GET /api/v1/productbudgets/summary`

**Description:** Get summary statistics for all active product budgets of the current user

**Response:**
```json
{
  "success": true,
  "data": {
    "totalBudgets": 2,
    "totalTargetAmount": 4500,
    "totalSavedAmount": 1800,
    "totalRemainingAmount": 2700,
    "averageProgress": 35
  }
}
```

### Get Product Budget by ID

**Endpoint:** `GET /api/v1/productbudgets/:id`

**Description:** Get a specific product budget by ID

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "60d21b4667d0d8992e610c85",
    "name": "New Laptop",
    "imageUrl": "https://example.com/image.jpg",
    "targetAmount": 1500,
    "savedAmount": 300,
    "targetDate": "2023-12-31T00:00:00.000Z",
    "user": "60d21b4667d0d8992e610c84",
    "isActive": true,
    "createdAt": "2023-06-22T10:00:00.000Z",
    "updatedAt": "2023-06-22T10:00:00.000Z",
    "progress": 20,
    "remainingAmount": 1200
  }
}
```

### Update Product Budget

**Endpoint:** `PUT /api/v1/productbudgets/:id`

**Description:** Update a product budget

**Request Body:**
```json
{
  "name": "Updated Laptop Name",
  "targetAmount": 2000,
  "imageUrl": "https://example.com/new-image.jpg",
  "targetDate": "2024-01-31", 
  "isActive": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "60d21b4667d0d8992e610c85",
    "name": "Updated Laptop Name",
    "imageUrl": "https://example.com/new-image.jpg",
    "targetAmount": 2000,
    "savedAmount": 300,
    "targetDate": "2024-01-31T00:00:00.000Z",
    "user": "60d21b4667d0d8992e610c84",
    "isActive": true,
    "createdAt": "2023-06-22T10:00:00.000Z",
    "updatedAt": "2023-06-23T15:30:00.000Z",
    "progress": 15,
    "remainingAmount": 1700
  }
}
```

### Update Saved Amount

**Endpoint:** `PATCH /api/v1/productbudgets/:id/amount`

**Description:** Update only the saved amount for a product budget

**Request Body:**
```json
{
  "savedAmount": 500
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "60d21b4667d0d8992e610c85",
    "name": "New Laptop",
    "imageUrl": "https://example.com/image.jpg",
    "targetAmount": 1500,
    "savedAmount": 500,
    "targetDate": "2023-12-31T00:00:00.000Z",
    "user": "60d21b4667d0d8992e610c84",
    "isActive": true,
    "createdAt": "2023-06-22T10:00:00.000Z",
    "updatedAt": "2023-06-23T16:00:00.000Z",
    "progress": 33,
    "remainingAmount": 1000
  }
}
```

### Delete Product Budget

**Endpoint:** `DELETE /api/v1/productbudgets/:id`

**Description:** Delete a product budget

**Response:**
```json
{
  "success": true,
  "message": "Product budget deleted successfully"
}
```

## Error Responses

**Validation Error:**
```json
{
  "message": "Product name is required"
}
```

**Not Found Error:**
```json
{
  "success": false,
  "message": "Product budget not found"
}
```

**Server Error:**
```json
{
  "success": false,
  "message": "Failed to create product budget",
  "error": "Error message details"
}
```
