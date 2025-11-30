"use client";

import Link from "next/link";
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
		<div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 flex items-center justify-center px-4 py-10">
			<div className="w-full max-w-md space-y-6">
				{/* Logo */}
				<div className="text-center space-y-3">
					<div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800/60 font-bold tracking-[0.16em] text-emerald-200 shadow-lg">
						IA
					</div>
					<h1 className="text-2xl font-semibold">Reset Password</h1>
					<p className="text-sm text-slate-400">Please wait while we redirect you...</p>
				</div>

				{/* Loading Card */}
				<div className="rounded-3xl border border-slate-800 bg-slate-900/80 backdrop-blur-xl shadow-[0_20px_80px_rgba(0,0,0,0.6)] p-8">
					<div className="flex flex-col items-center gap-4">
						{/* Spinner */}
						<div className="relative w-16 h-16">
							<div className="absolute inset-0 border-4 border-slate-700 rounded-full"></div>
							<div className="absolute inset-0 border-4 border-emerald-400 rounded-full border-t-transparent animate-spin"></div>
						</div>

						{/* Loading Text */}
						<div className="text-center space-y-2">
							<p className="text-base text-slate-300 font-medium">Verifying your reset link...</p>
							<p className="text-sm text-slate-500">This will only take a moment</p>
						</div>
					</div>
				</div>

				{/* Manual Redirect */}
				<p className="text-xs text-slate-500 text-center">
					If you're not redirected automatically,{" "}
					<button
						onClick={() => router.replace(`/account/change-password?${searchParams.toString()}`)}
						className="text-emerald-300 hover:underline"
					>
						click here
					</button>
				</p>

				{/* Footer */}
				<p className="text-xs text-slate-500 text-center">
					<Link className="text-emerald-300 hover:underline" href="/legal/privacy">
						Privacy Policy
					</Link>
					{" • "}
					<Link className="text-emerald-300 hover:underline" href="/legal/terms">
						Terms of Service
					</Link>
				</p>
			</div>
		</div>
	);
}
