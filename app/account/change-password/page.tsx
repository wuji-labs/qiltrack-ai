"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useLanguage } from "@/lib/i18n";

export default function ChangePasswordPage() {
	const router = useRouter();
	const { isAuthenticated, authMethod, oauthProviders } = useSupabaseAuth();
	const { t } = useLanguage();

	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [error, setError] = useState("");
	const [success, setSuccess] = useState(false);
	const [loading, setLoading] = useState(false);

	// Redirect if not authenticated
	useEffect(() => {
		if (!isAuthenticated) {
			router.push("/login");
		}
	}, [isAuthenticated, router]);

	// Check if user uses OAuth (no password to change)
	const isOAuthUser = authMethod === "oauth" && oauthProviders.length > 0;

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setSuccess(false);

		// Validation
		if (!currentPassword || !newPassword || !confirmPassword) {
			setError(t("password.error.allFieldsRequired") || "All fields are required");
			return;
		}

		if (newPassword.length < 8) {
			setError(t("password.error.tooShort") || "New password must be at least 8 characters");
			return;
		}

		if (newPassword !== confirmPassword) {
			setError(t("password.error.mismatch") || "New passwords do not match");
			return;
		}

		setLoading(true);

		try {
			const response = await fetch("/api/auth/change-password", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					currentPassword,
					newPassword,
				}),
			});

			const data = await response.json();

			if (!response.ok) {
				setError(data.error || t("password.error.failed") || "Failed to change password");
				return;
			}

			setSuccess(true);
			setCurrentPassword("");
			setNewPassword("");
			setConfirmPassword("");

			// Redirect to account page after 2 seconds
			setTimeout(() => {
				router.push("/account");
			}, 2000);
		} catch (err) {
			console.error("Password change error:", err);
			setError(t("password.error.network") || "Network error. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	if (!isAuthenticated) {
		return null;
	}

	return (
		<div className="min-h-screen bg-[var(--bg-base)] text-[var(--color-foreground)] flex items-center justify-center px-4 py-10">
			<div className="w-full max-w-md space-y-6">
				{/* Header */}
				<div className="text-center space-y-2">
					<h1 className="text-3xl font-bold text-[var(--color-foreground)]">
						{t("password.title") || "Change Password"}
					</h1>
					<p className="text-sm text-[var(--color-muted)]">
						{t("password.subtitle") || "Update your account password"}
					</p>
				</div>

				{/* OAuth User Notice */}
				{isOAuthUser && (
					<div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4 space-y-3">
						<div className="flex items-start gap-3">
							<div className="text-blue-400 mt-0.5">
								<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
									<path
										fillRule="evenodd"
										d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
										clipRule="evenodd"
									/>
								</svg>
							</div>
							<div className="flex-1 space-y-1">
								<h3 className="font-semibold text-blue-200">
									{t("password.oauth.title") || "OAuth Account"}
								</h3>
								<p className="text-sm text-blue-300/90">
									{t("password.oauth.message") ||
										`You're signed in with ${oauthProviders.join(", ")}. OAuth accounts don't have passwords. Your password is managed by your provider.`}
								</p>
							</div>
						</div>
						<Link
							href="/account"
							className="inline-flex items-center gap-1 text-sm text-blue-300 hover:text-blue-200 transition-colors"
						>
							← {t("password.oauth.backToAccount") || "Back to Account"}
						</Link>
					</div>
				)}

				{/* Password Change Form (only for password users) */}
				{!isOAuthUser && (
					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="rounded-2xl border border-[var(--stroke-soft)] bg-[var(--bg-layer)]/80 p-6 space-y-4 shadow-xl">
							{/* Success Message */}
							{success && (
								<div className="rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-300">
									✓ {t("password.success") || "Password changed successfully! Redirecting..."}
								</div>
							)}

							{/* Error Message */}
							{error && (
								<div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
									{error}
								</div>
							)}

							{/* Current Password */}
							<div className="space-y-2">
								<label htmlFor="current-password" className="block text-sm font-medium text-[var(--color-foreground)]">
									{t("password.currentPassword") || "Current Password"}
								</label>
								<input
									id="current-password"
									type="password"
									value={currentPassword}
									onChange={(e) => setCurrentPassword(e.target.value)}
									className="w-full rounded-lg border border-[var(--stroke-soft)] bg-[var(--bg-surface)] px-4 py-2.5 text-[var(--color-foreground)] placeholder:text-[var(--color-muted)] focus:border-[var(--accent-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20"
									placeholder="Enter your current password"
									disabled={loading}
									autoComplete="current-password"
								/>
							</div>

							{/* New Password */}
							<div className="space-y-2">
								<label htmlFor="new-password" className="block text-sm font-medium text-[var(--color-foreground)]">
									{t("password.newPassword") || "New Password"}
								</label>
								<input
									id="new-password"
									type="password"
									value={newPassword}
									onChange={(e) => setNewPassword(e.target.value)}
									className="w-full rounded-lg border border-[var(--stroke-soft)] bg-[var(--bg-surface)] px-4 py-2.5 text-[var(--color-foreground)] placeholder:text-[var(--color-muted)] focus:border-[var(--accent-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20"
									placeholder="Enter your new password (min 8 characters)"
									disabled={loading}
									autoComplete="new-password"
									minLength={8}
								/>
								<p className="text-xs text-[var(--color-muted)]">
									{t("password.hint") || "Must be at least 8 characters"}
								</p>
							</div>

							{/* Confirm New Password */}
							<div className="space-y-2">
								<label htmlFor="confirm-password" className="block text-sm font-medium text-[var(--color-foreground)]">
									{t("password.confirmPassword") || "Confirm New Password"}
								</label>
								<input
									id="confirm-password"
									type="password"
									value={confirmPassword}
									onChange={(e) => setConfirmPassword(e.target.value)}
									className="w-full rounded-lg border border-[var(--stroke-soft)] bg-[var(--bg-surface)] px-4 py-2.5 text-[var(--color-foreground)] placeholder:text-[var(--color-muted)] focus:border-[var(--accent-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20"
									placeholder="Confirm your new password"
									disabled={loading}
									autoComplete="new-password"
								/>
							</div>

							{/* Submit Button */}
							<button
								type="submit"
								disabled={loading}
								className="w-full rounded-lg bg-[var(--accent-primary)] px-4 py-3 font-semibold text-white hover:bg-[var(--accent-primary)]/90 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
							>
								{loading ? (t("password.changing") || "Changing Password...") : (t("password.changeButton") || "Change Password")}
							</button>
						</div>

						{/* Cancel Link */}
						<div className="text-center">
							<Link
								href="/account"
								className="text-sm text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors"
							>
								← {t("password.cancel") || "Cancel"}
							</Link>
						</div>
					</form>
				)}
			</div>
		</div>
	);
}
