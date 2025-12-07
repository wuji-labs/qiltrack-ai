import { NextRequest, NextResponse } from "next/server";

interface TurnstileVerifyResponse {
  success: boolean;
  "error-codes"?: string[];
  challenge_ts?: string;
  hostname?: string;
  action?: string;
  cdata?: string;
}

export const runtime = "edge";

export async function POST(request: NextRequest) {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  if (!secretKey) {
    return NextResponse.json(
      { success: true, message: "Turnstile not configured; skipping verification" },
      { status: 200 }
    );
  }

  let token: string | undefined;
  try {
    const body = await request.json();
    if (body && typeof body.token === "string") {
      token = body.token;
    }
  } catch {
    token = undefined;
  }

  if (!token) {
    return NextResponse.json(
      { success: false, code: "turnstile_missing", error: "Turnstile token required" },
      { status: 400 }
    );
  }

  const formData = new FormData();
  formData.append("secret", secretKey);
  formData.append("response", token);

  const remoteIp =
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (remoteIp) {
    formData.append("remoteip", remoteIp);
  }

  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: formData,
    });

    const result = (await response.json()) as TurnstileVerifyResponse;

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          code: "turnstile_failed",
          error: result["error-codes"]?.[0] || "Turnstile verification failed",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[TURNSTILE_VERIFY_ERROR]", error);
    return NextResponse.json(
      { success: false, code: "turnstile_failed", error: "Verification request failed" },
      { status: 500 }
    );
  }
}
