import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
	try {
		const responseCookies: Array<{ name: string; value: string; options?: unknown }> = [];
		const supabase = createServerClient(request.cookies, (cookies) => {
			responseCookies.push(...cookies);
		});

		// Get user session
		const {
			data: { session },
			error: sessionError,
		} = await supabase.auth.getSession();

		if (sessionError || !session?.user?.id) {
			const response = NextResponse.json(
				{ error: "Unauthorized", code: "unauthorized" },
				{ status: 401 }
			);
			responseCookies.forEach(({ name, value }) =>
				response.headers.append("Set-Cookie", `${name}=${value}`)
			);
			return response;
		}

		// Parse request body
		const body = await request.json().catch(() => null);
		if (!body || !body.newPassword) {
			const response = NextResponse.json(
				{ error: "Missing required fields", code: "invalid_payload" },
				{ status: 400 }
			);
			responseCookies.forEach(({ name, value }) =>
				response.headers.append("Set-Cookie", `${name}=${value}`)
			);
			return response;
		}

		const { currentPassword, newPassword, isRecovery } = body;

		// If not recovery mode, current password is required
		if (!isRecovery && !currentPassword) {
			const response = NextResponse.json(
				{ error: "Current password is required", code: "invalid_payload" },
				{ status: 400 }
			);
			responseCookies.forEach(({ name, value }) =>
				response.headers.append("Set-Cookie", `${name}=${value}`)
			);
			return response;
		}

		// Validate new password length
		if (newPassword.length < 8) {
			const response = NextResponse.json(
				{ error: "New password must be at least 8 characters", code: "password_too_short" },
				{ status: 400 }
			);
			responseCookies.forEach(({ name, value }) =>
				response.headers.append("Set-Cookie", `${name}=${value}`)
			);
			return response;
		}

		// Only verify current password if not in recovery mode
		if (!isRecovery) {
			// Get user email to verify current password
			const userEmail = session.user.email;
			if (!userEmail) {
				const response = NextResponse.json(
					{ error: "User email not found", code: "user_email_missing" },
					{ status: 400 }
				);
				responseCookies.forEach(({ name, value }) =>
					response.headers.append("Set-Cookie", `${name}=${value}`)
				);
				return response;
			}

			// Verify current password by attempting to sign in
			// This is the recommended way to verify password in Supabase
			const { error: verifyError } = await supabase.auth.signInWithPassword({
				email: userEmail,
				password: currentPassword,
			});

			if (verifyError) {
				console.warn(`[PASSWORD_VERIFY_FAILED] user_id: ${session.user.id}, error: ${verifyError.message}`);
				const response = NextResponse.json(
					{ error: "Current password is incorrect", code: "invalid_current_password" },
					{ status: 401 }
				);
				responseCookies.forEach(({ name, value }) =>
					response.headers.append("Set-Cookie", `${name}=${value}`)
				);
				return response;
			}
		}

		// Update password
		const { error: updateError } = await supabase.auth.updateUser({
			password: newPassword,
		});

		if (updateError) {
			console.error(`[PASSWORD_UPDATE_FAILED] user_id: ${session.user.id}, error: ${updateError.message}`);
			const response = NextResponse.json(
				{ error: "Failed to update password", code: "update_failed" },
				{ status: 500 }
			);
			responseCookies.forEach(({ name, value }) =>
				response.headers.append("Set-Cookie", `${name}=${value}`)
			);
			return response;
		}

		console.info(`[PASSWORD_CHANGED] user_id: ${session.user.id}`);

		const response = NextResponse.json({
			success: true,
			message: "Password changed successfully",
		});

		responseCookies.forEach(({ name, value }) =>
			response.headers.append("Set-Cookie", `${name}=${value}`)
		);
		return response;
	} catch (err) {
		console.error("Change password API error:", err);
		return NextResponse.json(
			{ error: "Internal server error", code: "internal_error" },
			{ status: 500 }
		);
	}
}
