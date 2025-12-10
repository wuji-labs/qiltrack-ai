# Quick Start Guide - New Features

This guide helps you quickly get started with the newly implemented features.

---

## 🚀 Environment Setup

### 1. Update Environment Variables

Copy the new variables from `.env.example` to your `.env.local`:

```bash
# Required: Upstash Redis for LLM caching
UPSTASH_REDIS_REST_URL=https://your-redis-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_redis_token

# Required: MFA encryption key
ENCRYPTION_KEY=$(openssl rand -hex 32)

# Optional: Test bypass token
TEST_REPORT_TOKEN=$(openssl rand -base64 32)
```

### 2. Apply Database Migrations

```bash
# Using Supabase CLI (recommended)
supabase db push

# Or manually
psql $DATABASE_URL -f supabase/migrations/20251210000001_add_mfa_support.sql
psql $DATABASE_URL -f supabase/migrations/20251210000002_add_webhook_idempotency.sql
psql $DATABASE_URL -f supabase/migrations/20251210000003_add_hnsw_indexes.sql
psql $DATABASE_URL -f supabase/migrations/20251210000004_add_table_partitioning.sql
```

### 3. Create Initial Partitions

```sql
-- Create next 3 months of partitions
SELECT fn_create_next_partition('audit_logs', 1);
SELECT fn_create_next_partition('audit_logs', 2);
SELECT fn_create_next_partition('audit_logs', 3);

SELECT fn_create_next_partition('report_credit_events', 1);
SELECT fn_create_next_partition('report_credit_events', 2);
SELECT fn_create_next_partition('report_credit_events', 3);
```

---

## 🔐 Multi-Factor Authentication (MFA)

### User Enrollment

```typescript
// 1. Enroll a new MFA device
const response = await fetch('/api/user/mfa/enroll', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    deviceName: 'My iPhone',
  }),
});

const { qrCodeUrl, secret, backupCodes } = await response.json();

// 2. Show QR code to user
<QRCodeDisplay url={qrCodeUrl} />

// 3. Verify the device with TOTP code
await fetch('/api/user/mfa/verify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    deviceId: deviceId,
    code: userEnteredCode, // 6-digit code from authenticator app
  }),
});
```

### Check MFA Status

```typescript
const response = await fetch('/api/user/mfa/status');
const { mfaEnabled, devices } = await response.json();

if (mfaEnabled) {
  console.log('MFA is enabled with', devices.length, 'devices');
}
```

---

## 🌍 Internationalization (i18n)

### Client-side Usage

```typescript
import { useTranslation } from '@/lib/i18n';

function MyComponent() {
  const { t, lang } = useTranslation('zh-Hans'); // or 'en'

  return (
    <div>
      <h1>{t('common.loading')}</h1>
      <p>{t('auth.emailRequired')}</p>

      {/* With parameters */}
      <p>{t('report.creditsRequired', { credits: 30 })}</p>
    </div>
  );
}
```

### Server-side Usage

```typescript
import { t, createTranslator } from '@/lib/i18n';

// Direct translation
const message = t('common.error', 'zh-Hans');

// Create bound translator
const translator = createTranslator('zh-Hans');
const message2 = translator('auth.loginSuccess');
```

### Adding New Translations

1. Add to `lib/i18n/translations/en.json`:
```json
{
  "myFeature": {
    "title": "My Feature",
    "description": "This is my feature"
  }
}
```

2. Add to `lib/i18n/translations/zh-Hans.json`:
```json
{
  "myFeature": {
    "title": "我的功能",
    "description": "这是我的功能"
  }
}
```

3. Use in code (type-safe!):
```typescript
t('myFeature.title', 'zh-Hans'); // TypeScript knows this key exists
```

---

## 🔒 PII Data Masking

### Automatic Masking in Logs

```typescript
import { createSafeLogger } from '@/lib/middleware/pii-masking';

const logger = createSafeLogger('MyModule');

// PII is automatically masked
logger.info('User registered', {
  email: 'john.doe@example.com', // Will be masked: j***e@example.com
  phone: '+1-234-567-8900',       // Will be masked: +1-***-***-8900
  userId: '550e8400-e29b-41d4-a716-446655440000', // Masked: 550e8400-****
});
```

### Manual Masking

```typescript
import { maskPII, maskEmail, maskCreditCard } from '@/lib/middleware/pii-masking';

// Mask entire object
const userData = {
  email: 'john@example.com',
  name: 'John Doe',
  ssn: '123-45-6789',
};

const masked = maskPII(userData);
// {
//   email: 'j***n@example.com',
//   name: 'J******e',
//   ssn: '***-**-6789'
// }

// Mask specific values
const maskedEmail = maskEmail('john@example.com'); // j***n@example.com
const maskedCard = maskCreditCard('4532-1234-5678-9010'); // ****-****-****-9010
```

---

## 💾 LLM Response Caching

### Automatic Caching

LLM caching is **automatic** - no code changes needed! All calls to `LLMService.generateReport()` are cached.

### Monitor Cache Performance

```typescript
// Get cache statistics
const response = await fetch('/api/admin/cache/stats', {
  headers: {
    'Authorization': `Bearer ${adminToken}`,
  },
});

const stats = await response.json();
console.log(stats);
// {
//   totalHits: 1234,
//   hitRate: 0.72,
//   estimatedSavingsUSD: 123.45
// }
```

### Clear Cache (Admin Only)

```typescript
// Clear all LLM caches
await fetch('/api/admin/cache/invalidate', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ pattern: 'llm:*' }),
});

// Clear specific model caches
await fetch('/api/admin/cache/invalidate', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ pattern: 'llm:gpt-5.1:*' }),
});
```

---

## 📊 Database Partitioning

### Create New Partitions

```sql
-- Automatically create next month's partition
SELECT fn_create_next_partition('audit_logs', 1);
SELECT fn_create_next_partition('report_credit_events', 1);
```

### List All Partitions

```sql
SELECT * FROM fn_list_partitions('audit_logs');
-- Returns: partition_name, size, row_count, partition_start, partition_end
```

### Drop Old Partitions

```sql
-- Drop partitions older than 12 months
SELECT fn_drop_old_partitions('audit_logs', 12);
SELECT fn_drop_old_partitions('report_credit_events', 12);
```

### Query Partitioned Tables

No changes needed! Query as normal:

```sql
-- PostgreSQL automatically uses partition pruning
SELECT COUNT(*)
FROM audit_logs
WHERE created_at >= '2024-12-01'
  AND created_at < '2025-01-01';
-- Only scans audit_logs_2024_12 partition (much faster!)
```

---

## 🍪 Cookie Consent

### Enable Cookie Consent Banner

Already enabled in `app/layout.tsx`! The banner appears automatically on first visit.

### Customize Cookie Categories

Edit `components/cookie-consent-banner.tsx`:

```typescript
interface CookiePreferences {
  essential: boolean;  // Always true
  analytics: boolean;  // Google Analytics, etc.
  marketing: boolean;  // Ads, social media pixels
}
```

### Check User Consent Programmatically

```typescript
const consent = localStorage.getItem('qiltrack_cookie_consent');
if (consent) {
  const { preferences } = JSON.parse(consent);

  if (preferences.analytics) {
    // Initialize analytics
    initializeGoogleAnalytics();
  }

  if (preferences.marketing) {
    // Initialize marketing pixels
    initializeFacebookPixel();
  }
}
```

---

## 📥 GDPR Data Export/Deletion

### Export User Data

```typescript
// User clicks "Export My Data"
const response = await fetch('/api/user/export-data');
const blob = await response.blob();

// Download JSON file
const url = window.URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = `qiltrack-data-export-${Date.now()}.json`;
a.click();
```

### Delete User Account

```typescript
// User clicks "Delete My Account"
const response = await fetch('/api/user/delete-account', {
  method: 'DELETE',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    password: userPassword, // Required for verification
    confirmation: 'DELETE MY ACCOUNT',
  }),
});

if (response.ok) {
  // Account deleted - log user out
  await signOut();
}
```

---

## 🔍 Input Validation

### Validate User Input

```typescript
import { validateSymbol, validateEmail, sanitizeString } from '@/lib/utils/validation';

// Validate stock symbol (whitelist: alphanumeric, hyphen, dot)
try {
  const symbol = validateSymbol(userInput); // "AAPL"
} catch (error) {
  console.error('Invalid symbol:', error.message);
}

// Validate email
try {
  const email = validateEmail(userInput); // "john@example.com"
} catch (error) {
  console.error('Invalid email:', error.message);
}

// Sanitize free-form text
const safeText = sanitizeString(userInput, 500); // Max 500 chars, XSS safe
```

### API Route Validation

All API routes now validate inputs:

```typescript
// Example: app/api/report/route.ts
import { validateSymbol } from '@/lib/utils/validation';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Throws ValidationError if invalid
  const symbol = validateSymbol(searchParams.get('symbol'));

  // Continue with validated input
  const report = await generateReport(symbol);
  return NextResponse.json(report);
}
```

---

## 🔔 Webhook Idempotency

### Stripe Webhooks

Webhook idempotency is **automatic** in `app/api/stripe/webhook/route.ts`.

```typescript
// Stripe may retry webhooks multiple times
// Our system ensures each event is processed exactly once

POST /api/stripe/webhook
Event ID: evt_123 (first delivery)  → ✅ Processed
Event ID: evt_123 (retry)           → ⏭️ Skipped (already processed)
Event ID: evt_123 (retry)           → ⏭️ Skipped (already processed)
```

### Check Webhook Processing Status

```sql
SELECT
  event_id,
  event_type,
  status,
  created_at,
  processed_at
FROM webhook_events
WHERE provider = 'stripe'
ORDER BY created_at DESC
LIMIT 10;
```

---

## 🛡️ Content Security Policy (CSP)

CSP is **automatically enabled** in `next.config.ts`. No action needed!

### Allowed Sources

- **Scripts**: Self, Vercel analytics
- **Styles**: Self, inline styles (required for Next.js)
- **Images**: Self, HTTPS, data URIs, blobs
- **Connect**: Supabase, OpenRouter, Helicone, Stripe, Upstash

### Testing CSP

```bash
# Check CSP headers
curl -I https://your-domain.com

# Should include:
# Content-Security-Policy: default-src 'self'; script-src 'self' ...
```

---

## 📈 Performance Monitoring

### Vector Search Performance

```sql
-- Test HNSW index performance
EXPLAIN ANALYZE
SELECT
  r.symbol,
  r.title,
  1 - (e.embedding <=> $1::vector) AS similarity
FROM reports_embeddings e
JOIN reports r ON r.report_run_id = e.report_run_id
WHERE e.language = 'en'
ORDER BY e.embedding <=> $1::vector
LIMIT 10;

-- Should show "Index Scan using idx_reports_embeddings_hnsw_cosine"
```

### LLM Cache Hit Rate

```bash
# Monitor logs for cache performance
grep "LLM_CACHE" logs/production.log

[LLM_CACHE_HIT] Saved $0.1523 by using cached response
[LLM_CACHE_MISS] Fresh LLM request cost: $0.1523
```

---

## 🧪 Testing

### Run Security Tests

```bash
# Test input validation
npm run test -- validation.test.ts

# Test PII masking
npm run test -- pii-masking.test.ts

# Test MFA TOTP
npm run test -- totp.test.ts
```

### Manual Testing Checklist

- [ ] MFA enrollment flow works end-to-end
- [ ] Cookie consent banner appears on first visit
- [ ] Data export returns complete JSON
- [ ] Data deletion removes all user records
- [ ] LLM cache hit rate > 50% after warmup
- [ ] Vector search returns results in <100ms
- [ ] PII is masked in production logs
- [ ] Webhook deduplication prevents double processing

---

## 🆘 Troubleshooting

### MFA QR Code Not Showing

```typescript
// Check if ENCRYPTION_KEY is set
console.log('ENCRYPTION_KEY:', process.env.ENCRYPTION_KEY ? 'Set' : 'Missing');

// Generate new key if missing
openssl rand -hex 32
```

### LLM Cache Not Working

```bash
# Check Redis configuration
echo $UPSTASH_REDIS_REST_URL
echo $UPSTASH_REDIS_REST_TOKEN

# Test Redis connection
curl -X GET "$UPSTASH_REDIS_REST_URL/get/test-key" \
  -H "Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN"
```

### Partitions Not Created

```sql
-- Check existing partitions
SELECT * FROM fn_list_partitions('audit_logs');

-- Manually create missing partition
SELECT fn_create_next_partition('audit_logs', 1);
```

### CSP Blocking Resources

```javascript
// Check browser console for CSP violations
// Add allowed domains to next.config.ts:

headers: [
  {
    key: 'Content-Security-Policy',
    value: [
      "connect-src 'self' https://your-new-domain.com",
      // ... other directives
    ].join('; '),
  },
]
```

---

## 📚 Further Reading

- **Compliance Audit**: `COMPLIANCE_AUDIT_REPORT.md`
- **Implementation Summary**: `IMPLEMENTATION_SUMMARY.md`
- **LLM Caching Guide**: `lib/llm/README.md`
- **Environment Setup**: `.env.example`

---

## 🎯 Quick Commands Reference

```bash
# Environment setup
cp .env.example .env.local
openssl rand -hex 32  # Generate ENCRYPTION_KEY

# Database migrations
supabase db push

# Create partitions
psql $DATABASE_URL -c "SELECT fn_create_next_partition('audit_logs', 1);"

# Check cache stats
curl https://your-domain.com/api/admin/cache/stats \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Clear cache
curl -X POST https://your-domain.com/api/admin/cache/invalidate \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"pattern": "llm:*"}'

# List partitions
psql $DATABASE_URL -c "SELECT * FROM fn_list_partitions('audit_logs');"

# Drop old partitions (12 month retention)
psql $DATABASE_URL -c "SELECT fn_drop_old_partitions('audit_logs', 12);"
```

---

**Happy coding! 🚀**

If you encounter any issues, please refer to the detailed documentation or open an issue on GitHub.
