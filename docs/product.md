# Product Guide: Project "Titan" API

## Overview
Titan is a backend service for retrieving user data.

## Endpoints
### GET /api/v1/user
- **Description**: Returns basic user details.
- **Parameters**: `id` (required), `format` (optional).
- **Example**: `GET /api/v1/user?id=123`

### POST /api/v1/data
- **Description**: Submits new dataset.

## Error Codes
- **401**: Unauthorized
- **404**: User not found
