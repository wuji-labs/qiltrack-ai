import { NextResponse } from "next/server";
import { getStripeClient } from "@/lib/stripe/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PlanKey = "basic" | "pro";

function getPriceId(plan: PlanKey) {
  const prices: Record<PlanKey, string | undefined> = {
    basic: process.env.STRIPE_PRICE_BASIC,
    pro: process.env.STRIPE_PRICE_PRO,
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

export async function POST(req: Request) {
  try {
    const stripe = getStripeClient();
    const { plan } = (await req.json()) as { plan?: PlanKey };

    if (plan !== "basic" && plan !== "pro") {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const priceId = getPriceId(plan);
    const baseUrl = getBaseUrl();

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/account?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing?canceled=true`,
      metadata: { plan },
    });

    if (!session.url) {
      throw new Error("Stripe did not return a checkout URL");
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[Stripe] Checkout session error", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 },
    );
  }
}
