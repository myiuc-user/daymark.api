# Rate Limiting & Error Handling

## Rate Limiting

### Global Rate Limiter
- **Limit:** 100 requests per 15 minutes per user/IP
- **Applied to:** All routes automatically
- **Response Headers:**
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Requests remaining
  - `X-RateLimit-Reset`: When the limit resets

### Sensitive Rate Limiter
- **Limit:** 10 requests per 15 minutes per user/IP
- **Applied to:** Authentication endpoints (login, refresh)
- **Usage:**
```javascript
import { sensitiveRateLimiter } from '../middleware/rateLimiter.js';

router.post('/login', sensitiveRateLimiter, controller.login);
```

### Rate Limit Response
```json
{
  "error": "Too many requests",
  "retryAfter": 900
}
```

## Error Handling

### Standardized Error Response Format
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "statusCode": 400
}
```

### Using AppError
```javascript
import { AppError, asyncHandler } from '../middleware/errorHandler.js';

export const myController = {
  action: asyncHandler(async (req, res, next) => {
    if (!resource) {
      throw new AppError('Resource not found', 404, 'NOT_FOUND');
    }
    res.json({ data: resource });
  })
};
```

### Handled Error Types

#### Validation Errors (400)
```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "statusCode": 400,
  "details": [...]
}
```

#### Authentication Errors (401)
```json
{
  "error": "Invalid token",
  "code": "INVALID_TOKEN",
  "statusCode": 401
}
```

#### Authorization Errors (403)
```json
{
  "error": "Insufficient permissions",
  "code": "FORBIDDEN",
  "statusCode": 403
}
```

#### Not Found Errors (404)
```json
{
  "error": "Resource not found",
  "code": "NOT_FOUND",
  "statusCode": 404
}
```

#### Duplicate Entry Errors (409)
```json
{
  "error": "Unique constraint violation",
  "code": "DUPLICATE_ENTRY",
  "statusCode": 409
}
```

#### Database Connection Errors (503)
```json
{
  "error": "Database temporarily unavailable",
  "code": "DB_CONNECTION_ERROR",
  "statusCode": 503
}
```

### Migrating Controllers

Replace try-catch blocks with asyncHandler:

**Before:**
```javascript
export const myController = {
  action: async (req, res) => {
    try {
      const data = await service.getData();
      res.json({ data });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};
```

**After:**
```javascript
import { asyncHandler, AppError } from '../middleware/errorHandler.js';

export const myController = {
  action: asyncHandler(async (req, res, next) => {
    const data = await service.getData();
    if (!data) throw new AppError('Data not found', 404, 'NOT_FOUND');
    res.json({ data });
  })
};
```

## Best Practices

1. **Always use asyncHandler** for async route handlers
2. **Throw AppError** instead of returning error responses
3. **Use appropriate status codes** (400, 401, 403, 404, 409, 500)
4. **Include error codes** for client-side handling
5. **Apply sensitiveRateLimiter** to auth and sensitive endpoints
6. **Let errorHandler catch all errors** - don't catch and respond manually
