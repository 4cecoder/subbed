# API Documentation

This document provides comprehensive documentation for the Subbed application's API endpoints.

## Overview

Subbed provides a RESTful API for managing YouTube subscriptions and accessing feed data. The API supports both authenticated and development modes, with built-in offline capabilities.

## Base URL

```
https://your-domain.com/api
```

## Authentication

Most endpoints work in both authenticated and development modes:
- **Authenticated Mode**: Uses Clerk JWT tokens for user-specific data
- **Development Mode**: Uses development user ID for testing

## Endpoints

### Subscriptions API

#### GET `/api/subscriptions`

Retrieves all subscriptions for the current user.

**Response:**
```json
[
  {
    "id": "UCsBjURrPoezykLs9EqgamOA",
    "title": "Fireship",
    "url": "https://www.youtube.com/channel/UCsBjURrPoezykLs9EqgamOA",
    "createdAt": "2024-01-15T10:30:00Z",
    "lastSyncedAt": "2024-01-15T10:30:00Z"
  }
]
```

**Error Response:**
```json
{
  "error": "Error message"
}
```

#### POST `/api/subscriptions`

Adds a new subscription.

**Request Body:**
```json
{
  "id": "UCsBjURrPoezykLs9EqgamOA",
  "title": "Fireship",
  "url": "https://www.youtube.com/channel/UCsBjURrPoezykLs9EqgamOA"
}
```

**Response:**
```json
{
  "ok": true
}
```

#### DELETE `/api/subscriptions?id={channelId}`

Removes a specific subscription or clears all subscriptions.

**Parameters:**
- `id` (optional): Channel ID to remove. If omitted, clears all subscriptions.

**Response:**
```json
{
  "ok": true
}
```

### Settings API

#### GET `/api/settings`

Retrieves user settings.

**Response:**
```json
{
  "settings": {
    "per_page": 20,
    "per_channel": 10,
    "showThumbnails": true,
    "showDescriptions": true,
    "defaultFeedType": "all",
    "sortOrder": "newest",
    "caching_ttl": 300,
    "concurrency": 6
  }
}
```

#### POST `/api/settings`

Updates user settings.

**Request Body:**
```json
{
  "per_page": 25,
  "per_channel": 15,
  "showThumbnails": true,
  "showDescriptions": false,
  "defaultFeedType": "video",
  "sortOrder": "oldest",
  "caching_ttl": 600,
  "concurrency": 8
}
```

**Response:**
```json
{
  "settings": {
    "per_page": 25,
    "per_channel": 15,
    "showThumbnails": true,
    "showDescriptions": false,
    "defaultFeedType": "video",
    "sortOrder": "oldest",
    "caching_ttl": 600,
    "concurrency": 8
  }
}
```

### Feed API

#### GET `/api/feed`

Retrieves aggregated feed content from all subscriptions.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `per_page` (number): Items per page (default: from settings or 20)
- `per_channel` (number): Max items per channel (default: from settings or 10, max: 50)
- `q` (string): Search query to filter content
- `type` (string): Content type filter - "all", "video", or "short"

**Response:**
```json
{
  "page": 1,
  "per_page": 20,
  "total": 150,
  "items": [
    {
      "id": "dQw4w9WgXcQ",
      "title": "Video Title",
      "link": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      "published": "2024-01-15T10:30:00Z",
      "thumbnail": "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
      "description": "Video description...",
      "channelId": "UCsBjURrPoezykLs9EqgamOA",
      "channelTitle": "Fireship",
      "isShort": false
    }
  ]
}
```

### RSS API

#### GET `/api/rss`

Retrieves RSS feed data for a specific YouTube channel.

**Query Parameters:**
- `id` (string, required): YouTube channel ID (UC...) or channel URL
- `limit` (number): Maximum items to return (default: from settings or 10, max: 50)
- `q` (string): Search query to filter content
- `type` (string): Content type filter - "all", "video", or "short"

**Supported Input Formats for `id`:**
- Channel ID: `UCsBjURrPoezykLs9EqgamOA`
- Channel URL: `https://www.youtube.com/channel/UCsBjURrPoezykLs9EqgamOA`
- Username: `@username`
- Custom URL: `https://www.youtube.com/c/ChannelName`
- Video URL: `https://www.youtube.com/watch?v=VIDEO_ID`

**Response:**
```json
{
  "channelId": "UCsBjURrPoezykLs9EqgamOA",
  "channelTitle": "Fireship",
  "items": [
    {
      "id": "dQw4w9WgXcQ",
      "title": "Video Title",
      "link": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      "published": "2024-01-15T10:30:00Z",
      "thumbnail": "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
      "description": "Video description...",
      "isShort": false
    }
  ]
}
```

### Sync API

#### POST `/api/sync`

Triggers manual synchronization of data between local storage and ConvexDB.

**Response (Success):**
```json
{
  "success": true,
  "message": "Sync completed successfully"
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Error message"
}
```

#### GET `/api/sync`

Returns sync status information.

**Response:**
```json
{
  "status": "ready",
  "message": "Sync endpoint is available"
}
```

### Feedback API

#### POST `/api/feedback`

Submits user feedback.

**Request Body:**
```json
{
  "type": "bug|feature|general",
  "message": "Feedback message",
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Feedback submitted successfully"
}
```

### Resolve API

#### GET `/api/resolve`

Resolves various YouTube URL formats to channel information.

**Query Parameters:**
- `url` (string, required): YouTube URL to resolve

**Response:**
```json
{
  "channelId": "UCsBjURrPoezykLs9EqgamOA",
  "channelTitle": "Fireship",
  "channelUrl": "https://www.youtube.com/channel/UCsBjURrPoezykLs9EqgamOA"
}
```

## Data Models

### Subscription
```typescript
{
  id: string;           // YouTube channel ID
  title: string;        // Channel name
  url: string;          // Channel URL
  createdAt?: string;   // ISO date string
  lastSyncedAt?: string; // ISO date string
}
```

### Feed Item
```typescript
{
  id: string;           // Video ID
  title: string;        // Video title
  link: string;         // Video URL
  published: string;    // ISO date string
  thumbnail?: string;   // Thumbnail URL
  description?: string; // Video description
  channelId: string;    // Channel ID
  channelTitle?: string; // Channel name
  isShort?: boolean;    // Whether it's a YouTube Short
}
```

### Settings
```typescript
{
  per_page: number;        // Items per page (1-100)
  per_channel: number;     // Items per channel (1-50)
  showThumbnails: boolean; // Display thumbnails
  showDescriptions: boolean; // Display descriptions
  defaultFeedType: "all" | "video" | "short";
  sortOrder: "newest" | "oldest";
  caching_ttl: number;     // Cache TTL in seconds
  concurrency: number;     // Concurrent requests (1-10)
}
```

## Error Handling

All endpoints return appropriate HTTP status codes:

- `200`: Success
- `400`: Bad Request (invalid parameters)
- `401`: Unauthorized
- `500`: Internal Server Error

Error responses include an `error` field with a descriptive message.

## Rate Limiting

- API endpoints are rate-limited to prevent abuse
- Limits vary by endpoint complexity
- Rate limit headers are included in responses

## Caching

- Feed data is cached to improve performance
- Cache TTL is configurable via settings
- Cache invalidation occurs on data changes

## Examples

### Get User Subscriptions
```bash
curl -X GET "https://your-domain.com/api/subscriptions" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Add a Subscription
```bash
curl -X POST "https://your-domain.com/api/subscriptions" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "UCsBjURrPoezykLs9EqgamOA",
    "title": "Fireship",
    "url": "https://www.youtube.com/channel/UCsBjURrPoezykLs9EqgamOA"
  }'
```

### Get Feed with Search
```bash
curl -X GET "https://your-domain.com/api/feed?page=1&per_page=10&q=react&type=video"
```

### Update Settings
```bash
curl -X POST "https://your-domain.com/api/settings" \
  -H "Content-Type: application/json" \
  -d '{
    "per_page": 25,
    "showThumbnails": true,
    "defaultFeedType": "video"
  }'
```

---

**Last Updated**: September 13, 2025
**Version**: 1.0.0</content>
<parameter name="filePath">docs/API.md