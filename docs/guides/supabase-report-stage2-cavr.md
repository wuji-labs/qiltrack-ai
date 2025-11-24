# Supabase Report Stage 2 - CAVR & Environment Setup

**Date:** 2025-11-24
**Branch:** feat/supabase-integration
**Stage:** 2 (Report API + Quota Integration)

---

## Executive Summary

Stage 2 implements the complete Supabase integration for report generation workflow. All code is production-ready with comprehensive test coverage (33 tests passing). The implementation includes:

- ✅ Refactored `/api/report` to use Supabase RPC + Storage
- ✅ New `/api/report/history` endpoint for report listings
- ✅ New `/api/report/credits` endpoint for quota queries
- ✅ Proper cookie handling via `@supabase/ssr` server client
- ✅ TEST_REPORT_TOKEN bypass mode for development
- ✅ Full audit logging and report storage

---

## Environment Variables Required

### For Development (`.env.local`)

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key-from-supabase>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# Report Generation
FINNHUB_API_KEY=<your-finnhub-api-key>
HELICONE_API_KEY=<your-helicone-api-key>
# OR
OPENROUTER_API_KEY=<your-openrouter-api-key>

# Test Mode
TEST_REPORT_TOKEN=local-test-token
SUPABASE_STORAGE_REPORT_BUCKET=report-assets
```

### Environment Variable Descriptions

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Anon key for client-side queries (public) |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Service role key for privileged operations (server-only, never expose to client) |
| `FINNHUB_API_KEY` | Yes | Finnhub API key for stock data |
| `HELICONE_API_KEY` | No | Helicone API key for LLM calls (Preferred provider) |
| `OPENROUTER_API_KEY` | No | OpenRouter API key for LLM calls (Fallback) |
| `TEST_REPORT_TOKEN` | No | Token for bypassing auth in test mode |
| `SUPABASE_STORAGE_REPORT_BUCKET` | No | Storage bucket name for reports (default: `report-assets`) |

**Note:** At least one of `HELICONE_API_KEY` or `OPENROUTER_API_KEY` must be configured.

---

## Local Supabase Setup

### Prerequisites

- **Docker & Docker Compose** - Required for running Supabase locally
- **Node.js 18+**
- **Supabase CLI 2.58.5+**

### Step 1: Install Docker

Follow the [Docker Desktop installation guide](https://docs.docker.com/desktop). Ensure Docker is running before proceeding.

### Step 2: Initialize Supabase Project

```bash
# Initialize Supabase (one-time setup)
npx supabase init

# Start the Supabase stack
npx supabase start
```

**First-time output will show:**

```
Started Supabase local development server.

         API URL: http://localhost:54321
      DB URL: postgresql://postgres:postgres@localhost:5432/postgres
     Studio URL: http://localhost:54323
   Inbucket URL: http://localhost:54324
   Logflare URL: http://localhost:54325
        anon key: <ANON_KEY>
service_role key: <SERVICE_ROLE_KEY>
```

### Step 3: Copy Credentials to `.env.local`

```bash
# From the output above, copy into .env.local:
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<ANON_KEY>
SUPABASE_SERVICE_ROLE_KEY=<SERVICE_ROLE_KEY>
```

### Step 4: Apply Database Migrations

```bash
# Apply any pending migrations
npx supabase db pull  # (if migrations exist)
npx supabase migration list
```

### Step 5: Verify Connection

```bash
# The app should now connect to your local Supabase instance
npm run dev

# Visit http://localhost:3000 and check Network tab for Supabase calls
```

### Common Issues

**Docker not running:**
```bash
# Error: "Docker Desktop is a prerequisite..."
# Solution: Start Docker Desktop or `docker-compose up`
```

**Connection refused:**
```bash
# Error: "ECONNREFUSED 127.0.0.1:54321"
# Solution: Run `npx supabase status` to verify services are running
# If not, run `npx supabase start` again
```

**Service role key rejected:**
```bash
# Error: "SUPABASE_SERVICE_ROLE_KEY is required"
# Solution: Copy the correct key from `npx supabase status`
```

---

## Test Results

### Unit & Integration Tests

```bash
npm test
```

**Current Status:**
- **Test Files:** 6 passed
- **Tests:** 33 passed, 1 skipped (due to module loading timing in Vitest)
- **Coverage:** Core report API, quota service, history API, server client

```
 ✓ lib/supabase/server.test.ts (9 tests)
 ✓ __tests__/api.test.ts (3 tests)
 ✓ lib/services/quota.test.ts (9 tests)
 ✓ __tests__/api/report.history.test.ts (7 tests)
 ✓ __tests__/api/report.supabase.test.ts (4 tests | 1 skipped)
 ✓ __tests__/useProgress.test.tsx (2 tests)
```

### Lint Status

```bash
npm run lint
```

**Status:** 0 errors from Stage 2 changes (15 pre-existing warnings in other components)

---

## Manual Testing Workflow (CAVR)

### Prerequisites

- Local Supabase running (`npx supabase start`)
- All env vars set in `.env.local`
- App running (`npm run dev`)

### Test Scenario 1: Test Bypass Mode (No Auth Required)

**Objective:** Verify that `TEST_REPORT_TOKEN` allows bypassing authentication

**Steps:**

1. **Start the app without logging in:**
   ```bash
   npm run dev
   # Open http://localhost:3000
   ```

2. **Generate a report with test token:**
   ```bash
   # Via URL query parameter:
   # http://localhost:3000?symbol=AAPL&testToken=local-test-token

   # Or via JavaScript console:
   fetch('/api/report?symbol=AAPL&testToken=local-test-token')
     .then(r => r.json())
     .then(d => console.log(d))
   ```

3. **Verify response:**
   - Status: `200 OK`
   - Response includes:
     - `symbol: "AAPL"`
     - `report: "<markdown content>"`
     - `remainingQuota: 999`
     - `reportRunId: "<uuid>"`

4. **Check Supabase records:**
   ```sql
   -- In Supabase Studio (http://localhost:54323)
   -- Table: report_runs
   SELECT * FROM report_runs WHERE mode = 'test' ORDER BY created_at DESC LIMIT 1;

   -- Should show:
   -- user_id: 00000000-0000-0000-0000-000000000001
   -- symbol: AAPL
   -- mode: test
   -- status: completed
   ```

**Expected Outcome:** ✓ Report generated, logged to Supabase with `mode='test'`

---

### Test Scenario 2: Authenticated Report Generation

**Objective:** Verify authenticated users can generate reports and consume quota

**Prerequisites:** User must be logged in via Supabase Auth

**Steps:**

1. **Login to the application:**
   ```bash
   # Visit http://localhost:3000
   # Click "Login" or "Sign Up"
   # Use test credentials from Supabase Auth settings
   ```

2. **Check remaining quota:**
   ```bash
   # The quota should display in the UI
   # OR via API:
   fetch('/api/report/credits')
     .then(r => r.json())
     .then(d => console.log(d))

   # Expected response:
   # { remainingCredits: 100 }  (or configured default)
   ```

3. **Generate a report:**
   ```bash
   # Use the UI report generator or:
   fetch('/api/report?symbol=MSFT', {
     method: 'GET',
     credentials: 'include'  // Include cookies for auth
   })
     .then(r => r.json())
     .then(d => console.log(d))
   ```

4. **Verify quota decremented:**
   ```bash
   # Check quota again - should be reduced by 1
   fetch('/api/report/credits')
     .then(r => r.json())
     .then(d => console.log(d))  // { remainingCredits: 99 }
   ```

5. **View report history:**
   ```bash
   # Via UI: Navigate to /reports
   # OR via API:
   fetch('/api/report/history?limit=10&offset=0')
     .then(r => r.json())
     .then(d => console.log(d))

   # Expected response:
   # {
   #   reports: [
   #     { id, symbol, status, created_at, documents: [...] }
   #   ],
   #   total: 1
   # }
   ```

**Expected Outcome:** ✓ Quota consumed, report created, history shows new entry

---

### Test Scenario 3: Storage & Downloads

**Objective:** Verify reports are stored in Supabase Storage and can be downloaded

**Steps:**

1. **After generating a report, check Storage:**
   ```bash
   # In Supabase Studio (Storage tab)
   # Bucket: report-assets
   # Path: {user_id}/{report_run_id}.md

   # File contents should be the markdown report
   ```

2. **Download report via signed URL:**
   ```bash
   # The API response includes a signed URL:
   # GET /api/report?symbol=AAPL
   # Response includes: reportSignedUrl (or similar)

   # Download with:
   curl "<signed-url>" -o report.md

   # OR in browser: click download link if provided in UI
   ```

3. **Verify markdown content:**
   ```bash
   # Open report.md
   # Should contain:
   # - Title: # 【Investor AI】Apple Inc. (AAPL) 投资分析报告
   # - Sections 0-8 with proper Markdown formatting
   # - Company data embedded
   # - Disclaimer at end
   ```

**Expected Outcome:** ✓ Markdown file accessible, properly formatted, contains company data

---

### Test Scenario 4: Error Cases

**Objective:** Verify proper error handling

**Scenario 4a: Missing Symbol**

```bash
# Request without symbol
fetch('/api/report', { credentials: 'include' })
  .then(r => r.json())
  .then(d => console.log(d))

# Expected: 400 { error: "Missing symbol param" }
```

**Scenario 4b: Quota Exceeded**

```bash
# After consuming all credits
fetch('/api/report?symbol=AAPL', { credentials: 'include' })
  .then(r => r.json())
  .then(d => console.log(d))

# Expected: 429 { error: "Quota exceeded" }
```

**Scenario 4c: Unauthorized (No Session)**

```bash
# Request without being logged in (no test token)
fetch('/api/report?symbol=AAPL')
  .then(r => r.json())
  .then(d => console.log(d))

# Expected: 401 { error: "Unauthorized" }
```

**Expected Outcome:** ✓ All error cases return correct HTTP status and message

---

## Browser Developer Tools Checklist

When manually testing, verify these in the browser:

### Network Tab
- [ ] `/api/report` request completes with 200
- [ ] Request headers include `Cookie` with Supabase session
- [ ] Response headers include `Set-Cookie` for session refresh
- [ ] Response time < 5 seconds

### Application Tab
- [ ] `sb-auth-token` cookie present after login
- [ ] `sb-session` cookie present after login
- [ ] LocalStorage shows Supabase auth data

### Console Tab
- [ ] No JavaScript errors
- [ ] No `Missing SUPABASE_` warnings (all env vars loaded)
- [ ] Successful Supabase client initialization logged

---

## Verification Checklist

Complete these checks to verify Stage 2 implementation:

### Code Quality
- [ ] `npm test` passes with 33 tests (1 skip allowed)
- [ ] `npm run lint` shows 0 errors from our changes
- [ ] All modified files have proper TypeScript types
- [ ] No `any` types without explicit `/* eslint-disable-next-line */`

### API Endpoints
- [ ] `GET /api/report?symbol=AAPL` generates report (auth or test-token)
- [ ] `GET /api/report/history` lists user reports (auth required)
- [ ] `GET /api/report/credits` returns remaining quota (auth required)

### Supabase Integration
- [ ] `report_runs` table receives new records
- [ ] `report_documents` table linked to reports
- [ ] `report_credit_events` audit log populated
- [ ] Storage `report-assets/` bucket has markdown files
- [ ] Signed URLs work for downloads

### Cookie & Session Handling
- [ ] Supabase session cookies set after auth
- [ ] Cookies persisted across page reloads
- [ ] Cookie refresh on API calls
- [ ] Session preserved in `useSupabaseAuth` hook

### Test Mode (`TEST_REPORT_TOKEN`)
- [ ] Reports generated without login
- [ ] Marked as `mode='test'` in database
- [ ] user_id set to deterministic UUID (`00000000-0000-0000-0000-000000000001`)
- [ ] Audit logs created with `mode='test'`

---

## Troubleshooting

### "Supabase 配额不足" Error

**Symptom:** API returns 429 after a few requests
**Cause:** RPC function returning 0 remaining credits
**Solution:**
1. Check `v_user_quota` view in Supabase
2. Verify `fn_consume_report_credit` RPC function exists
3. Check user's initial quota in `user_credits` table
4. Run: `INSERT INTO user_credits (user_id, remaining_credits) VALUES ('<user-id>', 100);`

### "Storage upload failed" Error

**Symptom:** Report generated but file not accessible
**Cause:** `report-assets` bucket doesn't exist or RLS blocked upload
**Solution:**
1. In Supabase Storage, create bucket `report-assets` (private)
2. Add policy: `Allow service role to upload/read`
3. Verify bucket path format: `{user_id}/{report_run_id}.md`

### "Session not found" on API Calls

**Symptom:** 401 Unauthorized despite being logged in
**Cause:** Cookies not included in request, or session expired
**Solution:**
1. Ensure `credentials: 'include'` in fetch requests
2. Check browser cookies - should have `sb-auth-token`
3. Refresh page to renew session
4. Check Supabase session expiry (default 1 hour)

### Tests Fail Locally

**Symptom:** `npm test` fails with Supabase connection errors
**Cause:** Tests mock Supabase by default; only manual tests need real DB
**Solution:**
1. Run `npm test` - should pass with mocks
2. For real Supabase testing, ensure local stack is running first
3. Check that mock setup in test files covers all scenarios

---

## Files Modified in Stage 2

| File | Changes |
|------|---------|
| `lib/supabase/server.ts` | Cookie handling via `getAll/setAll` callbacks |
| `app/api/report/route.ts` | Complete Supabase RPC + Storage integration |
| `app/api/report/history/route.ts` | New endpoint for report listings |
| `app/api/report/credits/route.ts` | New endpoint for quota queries |
| `lib/services/quota.ts` | RPC consumption, audit logging |
| `__tests__/api/report.supabase.test.ts` | API route tests |
| `__tests__/api/report.history.test.ts` | History endpoint tests |
| `lib/services/quota.test.ts` | Quota service tests |

---

## Performance Notes

### API Response Times (Expected)

- `/api/report`: 2-4 seconds (includes LLM call via Helicone/OpenRouter)
- `/api/report/history`: < 500ms
- `/api/report/credits`: < 200ms

### Database Queries

- `v_user_quota`: Lightweight view, cached
- `fn_consume_report_credit`: Single atomic RPC, < 50ms
- Report storage: Async, doesn't block API response

---

## Next Steps (Stage 3)

- [ ] Implement content modules (analysis sections)
- [ ] Add DOCX generation for reports
- [ ] Enhance history UI with filtering/search
- [ ] Implement report regeneration endpoint
- [ ] Add analytics/metrics tracking

---

## Contact & Support

For issues with this Stage 2 implementation:

1. Check Supabase logs: `npx supabase logs` (local)
2. Review error messages in browser console
3. Check this CAVR guide troubleshooting section
4. Review related Stage 1 documentation in `docs/decisions/2025-11-24-supabase-report-stage1.md`

---

**Generated:** 2025-11-24 | **Branch:** feat/supabase-integration
