# Category API Documentation

This API allows users to manage transaction categories. All endpoints are protected and require authentication.

## Base URL

```http
/api/v1/categories
```

## Endpoints

### Get All Categories

**Endpoint:** `GET /api/v1/categories`

**Description:** Get all categories for the user.

**Query Parameters:**
- `type` - Filter by type ('income' or 'expense')
- `isActive` - Filter by active status (true/false)
- `sortBy` - Field to sort by
- `sortOrder` - Sort order (asc/desc)

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "_id": "60d21b4667d0d8992e610c80",
      "name": "Food",
      "color": "#FF5722",
      "icon": "🍔",
      "type": "expense",
      "user": "60d21b4667d0d8992e610c84",
      "isActive": true
    },
    ...
  ]
}
```

### Get Single Category

**Endpoint:** `GET /api/v1/categories/:id`

**Description:** Get a specific category by ID.

**Response:**

```json
{
  "success": true,
  "data": { ...categoryObject }
}
```

### Create Category

**Endpoint:** `POST /api/v1/categories`

**Description:** Create a new custom category.

**Request Body:**

```json
{
  "name": "Freelance",
  "type": "income",
  "color": "#4CAF50",
  "icon": "💻",
  "description": "Income from freelance work"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Category created successfully",
  "data": { ...createdCategory }
}
```

### Update Category

**Endpoint:** `PUT /api/v1/categories/:id`

**Description:** Update an existing category.

**Request Body:**

```json
{
  "name": "Side Hustle",
  "color": "#2E7D32"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Category updated successfully",
  "data": { ...updatedCategory }
}
```

### Delete Category

**Endpoint:** `DELETE /api/v1/categories/:id`

**Description:** Delete a category.

**Response:**

```json
{
  "success": true,
  "message": "Category deleted successfully",
  "data": {}
}
```

### Create Default Categories

**Endpoint:** `POST /api/v1/categories/defaults`

**Description:** Initialize default categories (Food, Housing, Salary, etc.) for the user. Useful for new accounts.

**Response:**

```json
{
  "success": true,
  "message": "12 default categories created successfully",
  "data": [ ...arrayOfCreatedCategories ]
}
```
