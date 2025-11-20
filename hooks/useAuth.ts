"use client";

import { useState } from "react";
import { signOut, useSession } from "next-auth/react";

export function useAuth() {
	const { data: session, status, update } = useSession();
	const enableDevLogin = process.env.NEXT_PUBLIC_ENABLE_DEV_LOGIN === "true";
	const [devEmail, setDevEmail] = useState<string | null>(() => {
		if (!enableDevLogin || typeof window === "undefined") return null;
		try {
			return window.localStorage.getItem("dev-login-email");
		} catch {
			return null;
		}
	});

	const isAuthenticated =
		(!!devEmail && enableDevLogin) ||
		(status === "authenticated" && Boolean(session?.user?.id));
	const plan = devEmail ? "free" : session?.user?.plan ?? "free";
	const remainingQuotaRaw = devEmail
		? 1
		: typeof session?.user?.remainingQuota === "number"
			? session.user.remainingQuota
			: 0;
	const remainingQuota = Math.max(remainingQuotaRaw, 0);
	const userEmail = devEmail ?? session?.user?.email ?? null;
	const userImage = devEmail ? null : session?.user?.image ?? null;

	const refreshSession = async () => {
		if (devEmail) return;
		try {
			await update?.();
		} catch (err) {
			console.warn("刷新会话失败", err);
		}
	};

	const handleSignOut = async () => {
		if (devEmail) {
			try {
				window.localStorage.removeItem("dev-login-email");
			} catch {
				// ignore
			}
			setDevEmail(null);
		}
		await signOut({ callbackUrl: "/" });
	};

	return {
		session,
		status,
		isAuthenticated,
		plan,
		remainingQuota,
		userEmail,
		userImage,
		refreshSession,
		signOut: handleSignOut,
	};
}
