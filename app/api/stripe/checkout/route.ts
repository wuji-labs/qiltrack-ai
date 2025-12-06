import { NextRequest, NextResponse } from "next/server";
import { getStripeClient } from "@/lib/stripe/client";
import { cookies } from "next/headers";
import { createServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PlanKey = "pro" | "ultra";

function getPriceId(plan: PlanKey) {
  const prices: Record<PlanKey, string | undefined> = {
    pro: process.env.STRIPE_PRICE_PRO,
    ultra: process.env.STRIPE_PRICE_ULTRA,
  };

  const priceId = prices[plan];

  if (!priceId) {
    throw new Error(`Missing Stripe price id for plan: ${plan}`);
  }

  return priceId;
}

function getBaseUrl() {
  const url = process.env.NEXTAUTH_URL;

  if (!url) {
    throw new Error("Missing NEXTAUTH_URL for Stripe redirects");
  }

  return url.replace(/\/$/, "");
}

export async function POST(req: NextRequest) {
  try {
    // 获取用户session - 使用新的 @supabase/ssr
    const cookieStore = await cookies();
    const supabase = createServerClient(cookieStore);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const stripe = getStripeClient();
    const { plan } = (await req.json()) as { plan?: PlanKey };

    if (plan !== "pro" && plan !== "ultra") {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const priceId = getPriceId(plan);
    const baseUrl = getBaseUrl();

    const checkoutSession = await stripe.checkout.sessions.create({
      customer_email: user.email,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/account?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing?canceled=true`,
      metadata: {
        user_id: user.id,
        plan,
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          plan,
        },
      },
    });

    if (!checkoutSession.url) {
      throw new Error("Stripe did not return a checkout URL");
    }

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("[Stripe] Checkout session error", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 },
    );
  }
}
