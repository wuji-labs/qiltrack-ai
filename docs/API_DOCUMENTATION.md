# QilTrack AI - API Documentation

## Table of Contents

1. [Authentication](#authentication)
2. [User Management](#user-management)
3. [MFA/2FA Endpoints](#mfa2fa-endpoints)
4. [GDPR Compliance](#gdpr-compliance)
5. [Stock Analysis](#stock-analysis)
6. [Report Management](#report-management)
7. [Admin Endpoints](#admin-endpoints)
8. [Error Handling](#error-handling)
9. [Rate Limiting](#rate-limiting)
10. [Best Practices](#best-practices)

---

## Authentication

All authenticated endpoints require a valid session token obtained through Supabase Auth.

### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com"
    },
    "session": {
      "access_token": "...",
      "refresh_token": "..."
    }
  }
}
```

### Logout

```http
POST /api/auth/logout
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  }
}
```

---

## User Management

### Get User Profile

```http
GET /api/user/profile
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "avatar_url": "https://...",
    "role": "user",
    "credits": 100,
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

### Update User Profile

```http
PATCH /api/user/profile
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "full_name": "Jane Doe",
  "avatar_url": "https://..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "full_name": "Jane Doe",
    "updated_at": "2024-01-15T11:00:00Z"
  }
}
```

### Upload Avatar

```http
POST /api/user/avatar
Authorization: Bearer <access_token>
Content-Type: multipart/form-data

file: <image_file>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "avatar_url": "https://storage.supabase.co/..."
  }
}
```

---

## MFA/2FA Endpoints

### Enroll MFA Device

```http
POST /api/user/mfa/enroll
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "deviceName": "iPhone 15"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "deviceId": "uuid",
    "secret": "BASE32SECRET",
    "qrCodeUrl": "otpauth://totp/QilTrack:user@example.com?secret=...",
    "backupCodes": [
      "ABCD-1234-EFGH-5678",
      "WXYZ-9876-IJKL-4321",
      ...
    ]
  }
}
```

### Verify MFA Token

```http
POST /api/user/mfa/verify
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "deviceId": "uuid",
  "code": "123456",
  "useBackupCode": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "verified": true,
    "message": "MFA verified successfully"
  }
}
```

### List MFA Devices

```http
GET /api/user/mfa/devices
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "devices": [
      {
        "id": "uuid",
        "name": "iPhone 15",
        "verified": true,
        "created_at": "2024-01-15T10:00:00Z"
      }
    ]
  }
}
```

### Remove MFA Device

```http
DELETE /api/user/mfa/devices/:deviceId
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "MFA device removed successfully"
  }
}
```

---

## GDPR Compliance

### Export User Data

```http
GET /api/user/export-data
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "created_at": "2024-01-15T10:00:00Z"
  },
  "reports": [...],
  "watchlists": [...],
  "audit_logs": [...],
  "export_date": "2024-01-20T15:30:00Z"
}
```

### Delete Account

```http
DELETE /api/user/delete-account
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "password": "currentPassword",
  "confirmation": "DELETE MY ACCOUNT"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Account deleted successfully",
    "deleted_at": "2024-01-20T16:00:00Z"
  }
}
```

---

## Stock Analysis

### Analyze Stock

```http
POST /api/stock/analyze
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "symbol": "AAPL",
  "analysisType": "comprehensive"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "symbol": "AAPL",
    "analysis": {
      "summary": "Apple Inc. shows strong fundamentals...",
      "metrics": {
        "pe_ratio": 28.5,
        "market_cap": "2.8T",
        "revenue_growth": "8.5%"
      },
      "recommendation": "BUY",
      "confidence": 0.85
    },
    "cached": false,
    "credits_used": 10
  }
}
```

### Get Stock Quote

```http
GET /api/stock/quote/:symbol
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "symbol": "AAPL",
    "price": 185.50,
    "change": 2.30,
    "change_percent": 1.26,
    "volume": 58234567,
    "timestamp": "2024-01-20T16:00:00Z"
  }
}
```

### Search Stocks

```http
GET /api/stock/search?q=apple
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "symbol": "AAPL",
        "name": "Apple Inc.",
        "exchange": "NASDAQ",
        "type": "Common Stock"
      }
    ]
  }
}
```

---

## Report Management

### Create Report

```http
POST /api/reports
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "symbol": "AAPL",
  "title": "Apple Q4 2024 Analysis",
  "content": "Detailed analysis...",
  "is_public": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "symbol": "AAPL",
    "title": "Apple Q4 2024 Analysis",
    "created_at": "2024-01-20T17:00:00Z"
  }
}
```

### Get Reports

```http
GET /api/reports?page=1&limit=10&symbol=AAPL
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "reports": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 45,
      "totalPages": 5
    }
  }
}
```

### Get Report by ID

```http
GET /api/reports/:reportId
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "symbol": "AAPL",
    "title": "Apple Q4 2024 Analysis",
    "content": "...",
    "author": {
      "id": "uuid",
      "full_name": "John Doe"
    },
    "created_at": "2024-01-20T17:00:00Z"
  }
}
```

### Update Report

```http
PATCH /api/reports/:reportId
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "title": "Updated Title",
  "content": "Updated content..."
}
```

### Delete Report

```http
DELETE /api/reports/:reportId
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Report deleted successfully"
  }
}
```

---

## Admin Endpoints

### Cache Statistics

```http
GET /api/admin/cache/stats
Authorization: Bearer <admin_access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalHits": 15000,
    "totalMisses": 3000,
    "hitRate": 0.833,
    "estimatedSavingsUSD": 150.00,
    "topKeys": [
      {
        "key": "stock:AAPL:analysis",
        "hits": 500
      }
    ]
  }
}
```

### Clear Cache

```http
POST /api/admin/cache/clear
Authorization: Bearer <admin_access_token>
Content-Type: application/json

{
  "pattern": "stock:AAPL:*"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Cache cleared",
    "keysDeleted": 15
  }
}
```

### List Partitions

```http
GET /api/admin/partitions?table=audit_logs
Authorization: Bearer <admin_access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "table": "audit_logs",
    "partitions": [
      {
        "partition_name": "audit_logs_2024_01",
        "partition_size": "245 MB",
        "row_count": 125000,
        "partition_start": "2024-01-01",
        "partition_end": "2024-02-01"
      }
    ]
  }
}
```

### Create Partition

```http
POST /api/admin/partitions/create
Authorization: Bearer <admin_access_token>
Content-Type: application/json

{
  "table": "audit_logs",
  "monthsAhead": 1
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Partition created successfully",
    "table": "audit_logs",
    "monthsAhead": 1
  }
}
```

### Drop Old Partitions

```http
DELETE /api/admin/partitions
Authorization: Bearer <super_admin_access_token>
Content-Type: application/json

{
  "table": "audit_logs",
  "retentionMonths": 12
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Old partitions dropped",
    "table": "audit_logs",
    "retentionMonths": 12
  }
}
```

### Audit Logs

```http
GET /api/admin/audit-logs?page=1&limit=50&action=user_login
Authorization: Bearer <admin_access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": "uuid",
        "user_id": "uuid",
        "action": "user_login",
        "resource_type": "auth",
        "ip_address": "192.168.1.100",
        "user_agent": "Mozilla/5.0...",
        "created_at": "2024-01-20T18:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 250
    }
  }
}
```

---

## Error Handling

### Error Response Format

All errors follow a consistent format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "Additional context"
    }
  }
}
```

### Common Error Codes

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 400 | `VALIDATION_ERROR` | Invalid input data |
| 401 | `UNAUTHORIZED` | Missing or invalid authentication |
| 403 | `FORBIDDEN` | Insufficient permissions |
| 404 | `NOT_FOUND` | Resource not found |
| 409 | `CONFLICT` | Resource conflict (e.g., duplicate) |
| 422 | `UNPROCESSABLE_ENTITY` | Valid syntax but semantic errors |
| 429 | `RATE_LIMIT_EXCEEDED` | Too many requests |
| 500 | `INTERNAL_SERVER_ERROR` | Server error |

### Example Error Responses

**Validation Error:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid stock symbol",
    "details": {
      "symbol": "Symbol must be 1-5 uppercase letters"
    }
  }
}
```

**Unauthorized:**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Session not found or expired"
  }
}
```

**Rate Limit:**
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "details": {
      "retryAfter": 60,
      "limit": 100,
      "remaining": 0
    }
  }
}
```

---

## Rate Limiting

### Rate Limit Headers

All API responses include rate limit information:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1705771200
```

### Rate Limit Tiers

| Tier | Requests/Hour | Requests/Day |
|------|---------------|--------------|
| Free | 100 | 1,000 |
| Pro | 1,000 | 10,000 |
| Enterprise | 10,000 | 100,000 |

### Rate Limit Scope

- **Per User**: Most endpoints are rate-limited per authenticated user
- **Per IP**: Unauthenticated endpoints are rate-limited per IP address
- **Per Resource**: Some expensive operations have additional limits

---

## Best Practices

### 1. Authentication

- **Store tokens securely**: Never expose access tokens in client-side code
- **Refresh tokens**: Implement automatic token refresh before expiration
- **Logout on inactivity**: Clear sessions after 30 minutes of inactivity

### 2. Error Handling

```javascript
try {
  const response = await fetch('/api/stock/analyze', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ symbol: 'AAPL' })
  });

  const data = await response.json();

  if (!data.success) {
    // Handle error based on error code
    switch (data.error.code) {
      case 'VALIDATION_ERROR':
        console.error('Invalid input:', data.error.details);
        break;
      case 'RATE_LIMIT_EXCEEDED':
        const retryAfter = data.error.details.retryAfter;
        setTimeout(() => retry(), retryAfter * 1000);
        break;
      default:
        console.error('Error:', data.error.message);
    }
  }
} catch (error) {
  console.error('Network error:', error);
}
```

### 3. Caching

- **Check ETags**: Use `If-None-Match` headers for conditional requests
- **Respect Cache-Control**: Honor cache directives in responses
- **Cache on client**: Cache frequently accessed data locally

### 4. Pagination

```javascript
async function getAllReports(symbol) {
  let page = 1;
  const allReports = [];

  while (true) {
    const response = await fetch(
      `/api/reports?symbol=${symbol}&page=${page}&limit=50`
    );
    const data = await response.json();

    allReports.push(...data.data.reports);

    if (page >= data.data.pagination.totalPages) {
      break;
    }
    page++;
  }

  return allReports;
}
```

### 5. Input Validation

Always validate and sanitize input on the client side before sending:

```javascript
import { validateSymbol, validateEmail } from '@/lib/utils/validation';

function analyzeStock(symbol) {
  try {
    const validatedSymbol = validateSymbol(symbol);
    // Proceed with API call
  } catch (error) {
    // Handle validation error
    console.error('Invalid symbol:', error.message);
  }
}
```

### 6. Security

- **Use HTTPS**: Always use HTTPS in production
- **Validate SSL**: Verify SSL certificates
- **Sanitize output**: Escape HTML/XSS in rendered content
- **CORS**: Whitelist allowed origins

### 7. Performance

- **Batch requests**: Group multiple operations when possible
- **Compress requests**: Use gzip compression for large payloads
- **Use webhooks**: Subscribe to webhooks instead of polling
- **Optimize queries**: Use pagination and filtering

---

## SDK Examples

### JavaScript/TypeScript

```typescript
import { QilTrackClient } from '@qiltrack/sdk';

const client = new QilTrackClient({
  apiKey: process.env.QILTRACK_API_KEY
});

// Analyze stock
const analysis = await client.stock.analyze('AAPL');

// Get user profile
const profile = await client.user.getProfile();

// Enable MFA
const mfaSetup = await client.mfa.enroll('My Device');
```

### Python

```python
from qiltrack import QilTrackClient

client = QilTrackClient(api_key=os.environ['QILTRACK_API_KEY'])

# Analyze stock
analysis = client.stock.analyze('AAPL')

# Get user profile
profile = client.user.get_profile()

# Enable MFA
mfa_setup = client.mfa.enroll('My Device')
```

---

## Webhooks

### Configure Webhook

```http
POST /api/webhooks
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "url": "https://your-app.com/webhook",
  "events": ["report.created", "stock.alert"],
  "secret": "webhook_secret_key"
}
```

### Webhook Payload

```json
{
  "event": "report.created",
  "timestamp": "2024-01-20T19:00:00Z",
  "data": {
    "report_id": "uuid",
    "symbol": "AAPL",
    "user_id": "uuid"
  },
  "signature": "sha256_signature"
}
```

### Verify Webhook Signature

```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(JSON.stringify(payload)).digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest)
  );
}
```

---

## Support

- **Email**: support@qiltrack.ai
- **Documentation**: https://docs.qiltrack.ai
- **API Status**: https://status.qiltrack.ai
- **GitHub**: https://github.com/qiltrack/api

---

**Last Updated**: January 20, 2025
**API Version**: v1.0.0
