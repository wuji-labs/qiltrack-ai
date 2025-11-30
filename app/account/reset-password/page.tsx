"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

/**
 * Reset Password Redirect Page
 *
 * This page handles password reset links from email.
 * It redirects to /account/change-password with all query parameters preserved.
 *
 * Flow:
 * 1. User clicks reset password link in email
 * 2. Link points to /account/reset-password?code=xxx
 * 3. This page redirects to /account/change-password?code=xxx
 * 4. Change password page handles the actual password update
 */
export default function ResetPasswordRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Get all query parameters
    const params = new URLSearchParams(searchParams.toString());

    // Redirect to change-password page with all parameters
    const targetUrl = `/account/change-password?${params.toString()}`;
    router.replace(targetUrl);
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400 mb-4"></div>
        <p className="text-slate-400">Redirecting to password reset...</p>
      </div>
    </div>
  );
}
