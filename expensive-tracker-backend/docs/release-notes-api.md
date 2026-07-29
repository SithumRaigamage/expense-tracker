# Release Notes API

This document provides information about the Release Notes API endpoints.

## Authentication and Authorization

- Public endpoints: No authentication required
- Admin endpoints: Require authentication with an admin role
- All write operations (POST, PUT, DELETE) are restricted to admin users only

## Endpoints

### Get All Release Notes

- **URL**: `/api/v1/release-notes`
- **Method**: `GET`
- **Authentication**: Not required
- **Description**: Retrieves all published release notes, sorted by date (newest first).
- **Response**:

```json
{
  "success": true,
  "data": [
    {
      "_id": "60d21b4667d0d8992e610c85",
      "version": "1.0.0",
      "date": "2024-04-06T00:00:00.000Z",
      "features": ["Feature 1", "Feature 2"],
      "bugfixes": ["Bugfix 1"],
      "improvements": ["Improvement 1"],
      "isPublished": true
    }
  ]
}
```

### Get Release Note by Version

- **URL**: `/api/v1/release-notes/:version`
- **Method**: `GET`
- **Authentication**: Not required
- **Description**: Retrieves a specific release note by its version number.
- **Response**:

```json
{
  "success": true,
  "data": {
    "_id": "60d21b4667d0d8992e610c85",
    "version": "1.0.0",
    "date": "2024-04-06T00:00:00.000Z",
    "features": ["Feature 1", "Feature 2"],
    "bugfixes": ["Bugfix 1"],
    "improvements": ["Improvement 1"],
    "isPublished": true
  }
}
```

### Create Release Note

- **URL**: `/api/v1/release-notes`
- **Method**: `POST`
- **Authentication**: Required (Admin role only)
- **Description**: Creates a new release note.
- **Request Body**:

```json
{
  "version": "1.1.0",
  "date": "2024-05-01T00:00:00.000Z",
  "features": ["New feature 1", "New feature 2"],
  "bugfixes": ["New bugfix 1"],
  "improvements": ["New improvement 1"],
  "isPublished": true
}
```

- **Response**:

```json
{
  "success": true,
  "message": "Resource created successfully",
  "data": { ... }
}
```

### Update Release Note

- **URL**: `/api/v1/release-notes/:id`
- **Method**: `PUT`
- **Authentication**: Required (Admin role only)
- **Description**: Updates an existing release note.
- **Request Body**:

```json
{
  "version": "1.1.0",
  "date": "2024-05-01T00:00:00.000Z",
  "features": ["Updated feature 1", "Updated feature 2"],
  "bugfixes": ["Updated bugfix 1"],
  "improvements": ["Updated improvement 1"],
  "isPublished": true
}
```

- **Response**:

```json
{
  "success": true,
  "data": { ... }
}
```

### Delete Release Note

- **URL**: `/api/v1/release-notes/:id`
- **Method**: `DELETE`
- **Authentication**: Required (Admin role only)
- **Description**: Deletes a release note.
- **Response**:

```json
{
  "success": true,
  "message": "Release note removed",
  "data": {}
}
```

## Data Model

### Release Note

- **version**: String (required, unique) - Version number of the release (e.g., "1.0.0")
- **date**: Date (required) - Date of the release
- **features**: Array of Strings - List of new features in the release
- **bugfixes**: Array of Strings - List of bug fixes in the release
- **improvements**: Array of Strings - List of improvements in the release
- **isPublished**: Boolean - Whether the release note is published and visible to users

## Error Handling

The API returns appropriate HTTP status codes and error messages:

```json
{
  "success": false,
  "error": "Error message details"
}
```

- `400 Bad Request`: Invalid request body or parameters
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: User does not have admin privileges
- `404 Not Found`: Release note not found
- `500 Internal Server Error`: Server-side error
