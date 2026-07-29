# User API Documentation

This API handles user authentication and profile management.

## Base URL

```http
/api/v1/users
```

## Endpoints

### Register User

**Endpoint:** `POST /api/v1/users/register`

**Description:** Register a new user account.

**Access:** Public

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "currency": "USD" 
}
```

**Response:**

```json
{
  "success": true,
  "message": "Resource created successfully",
  "data": {
    "user": {
      "id": "60d21b4667d0d8992e610c84",
      "name": "John Doe",
      "email": "john@example.com",
      "currency": "USD",
      "role": "user",
      "isActive": true
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI..."
  }
}
```

### Login User

**Endpoint:** `POST /api/v1/users/login`

**Description:** Authenticate a user and receive a token.

**Access:** Public

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "60d21b4667d0d8992e610c84",
      "name": "John Doe",
      "email": "john@example.com",
      ...
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI..."
  }
}
```

### Get Profile

**Endpoint:** `GET /api/v1/users/profile`

**Description:** Get current user's profile information.

**Access:** Private (Requires Token)

**Response:**

```json
{
  "success": true,
  "data": {
    "_id": "60d21b4667d0d8992e610c84",
    "name": "John Doe",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "currency": "USD",
    "avatar": "default.jpg",
    "profileImage": "https://...",
    ...
  }
}
```

### Update Profile

**Endpoint:** `PUT /api/v1/users/profile`

**Description:** Update user profile details.

**Access:** Private

**Request Body:**

```json
{
  "firstName": "John",
  "lastName": "Smith",
  "phone": "+1234567890",
  "bio": "Software Engineer"
}
```

**Response:**

```json
{
  "success": true,
  "data": { ...updatedUserObject }
}
```

### Change Password

**Endpoint:** `PUT /api/v1/users/change-password`

**Description:** Change the user's password.

**Access:** Private

**Request Body:**

```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newPassword456"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Password updated successfully",
  "data": {}
}
```

### Verify Token

**Endpoint:** `GET /api/v1/users/verify`

**Description:** Verify if the current token is valid and get user status. Used for client-side auth checks.

**Access:** Private

**Response:**

```json
{
  "success": true,
  "data": {
    "user": { ... },
    "valid": true
  }
}
```

### Profile Image Upload

**Endpoint:** `POST /api/v1/users/profile/image`

**Description:** Upload a profile image (multipart/form-data).

**Access:** Private

**Request (Multipart):**
- field: `profileImage` (File)

**Response:**

```json
{
  "success": true,
  "message": "Profile image uploaded successfully",
  "data": {
    "profileImage": "http://localhost:3000/uploads/profile-123.jpg"
  }
}
```

### Delete Profile Image

**Endpoint:** `DELETE /api/v1/users/profile/image`

**Description:** Remove the custom profile image.

**Access:** Private

**Response:**

```json
{
  "success": true,
  "message": "Profile image deleted successfully"
}
```
