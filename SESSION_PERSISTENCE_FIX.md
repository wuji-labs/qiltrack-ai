# Session Persistence Fix

## Problem

用户反馈："现在生成一次 再次生成就需要重新登录 为啥"

After generating a report once, users were forced to re-login when attempting to generate a second report. This severely impacted user experience.

## Root Cause

Cookies were being set without proper serialization options:

```typescript
// ❌ WRONG - Missing critical cookie options
responseCookies.forEach(({ name, value }) => {
  response.headers.append("Set-Cookie", `${name}=${value}`);
});
```

This caused session cookies to be set without:
- `path` - Cookie path scope
- `maxAge` - Cookie expiration time
- `httpOnly` - Security flag to prevent XSS
- `secure` - HTTPS-only flag for production
- `sameSite` - CSRF protection

## Solution

### 1. Created Cookie Helper Utility

**File**: `lib/utils/cookie-helper.ts`

```typescript
import { serialize, type CookieSerializeOptions } from "cookie";

export interface CookieToSet {
  name: string;
  value: string;
  options?: CookieSerializeOptions;
}

export function appendCookies(response: Response, cookies: CookieToSet[]) {
  cookies.forEach(({ name, value, options }) => {
    const defaultOptions: CookieSerializeOptions = {
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    };

    const mergedOptions = { ...defaultOptions, ...options };
    const serialized = serialize(name, value, mergedOptions);

    response.headers.append("Set-Cookie", serialized);
  });
}
```

### 2. Updated Supabase Server Client

**File**: `lib/supabase/server.ts` (Lines 79-95)

Added default cookie options when Supabase sets auth cookies:

```typescript
setAll(cookiesToSet: Array<{ name: string; value: string; options?: unknown }>) {
  if (cookieSetter) {
    const cookiesWithOptions = cookiesToSet.map((cookie) => ({
      ...cookie,
      options: cookie.options || {
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax" as const,
      },
    }));
    cookieSetter(cookiesWithOptions);
  }
},
```

### 3. Fixed All Report API Routes

Created automated script `scripts/fix-all-cookie-setting.js` to replace all instances of manual cookie setting with the `appendCookies()` helper.

**Files Fixed**:
- ✅ `app/api/report/route.ts`
- ✅ `app/api/report/availability/route.ts`
- ✅ `app/api/report/similar/route.ts`
- ✅ `app/api/report/popular/route.ts`
- ✅ `app/api/report/daily-reward/route.ts`
- ✅ `app/api/report/daily-reward/status/route.ts`
- ✅ `app/api/report/export/pdf/route.tsx`

**Before**:
```typescript
responseCookies.forEach(({ name, value }) => {
  response.headers.append("Set-Cookie", `${name}=${value}`);
});
```

**After**:
```typescript
import { appendCookies } from "@/lib/utils/cookie-helper";

appendCookies(response, responseCookies);
```

## Testing

To verify the fix:

1. Login to the application
2. Generate a report
3. Immediately generate another report without refreshing
4. ✅ User should remain logged in and second report should generate successfully

## Impact

- 🔐 **Security**: Session cookies now have proper security flags (httpOnly, secure, sameSite)
- ⏱️ **Session Duration**: Cookies now persist for 7 days instead of browser session only
- ✅ **User Experience**: Users can generate multiple reports without being forced to re-login
- 🛡️ **CSRF Protection**: sameSite='lax' provides protection against cross-site request forgery

## Deployment Notes

This fix requires code changes only - no database migrations needed.

Before deploying to production:
1. Ensure `cookie` package is installed in production dependencies
2. Test session persistence in staging environment
3. Verify all API endpoints return proper Set-Cookie headers

## Related Issues

This fix also resolves potential session issues in:
- Report availability checks
- Similar report lookups
- Popular reports listing
- Daily reward claims
- PDF export functionality
