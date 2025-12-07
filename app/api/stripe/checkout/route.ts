import { NextRequest, NextResponse } from "next/server";
import { getStripeClient } from "@/lib/stripe/client";
import { cookies } from "next/headers";
import { createServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PlanKey = "pro" | "ultra";
type BillingCycle = "monthly" | "annual";

/**
 * 获取 Stripe Price ID
 *
 * TODO: 当前只支持单一价格，需要在 Stripe Dashboard 创建月付/年付价格后完善
 *
 * 需要创建的 Stripe Prices:
 * - Pro Monthly (recurring/month)
 * - Pro Annual (recurring/year)
 * - Ultra Monthly (recurring/month)
 * - Ultra Annual (recurring/year)
 *
 * 然后添加环境变量:
 * - STRIPE_PRICE_PRO_MONTHLY=price_xxx
 * - STRIPE_PRICE_PRO_ANNUAL=price_xxx
 * - STRIPE_PRICE_ULTRA_MONTHLY=price_xxx
 * - STRIPE_PRICE_ULTRA_ANNUAL=price_xxx
 */
function getPriceId(plan: PlanKey, billingCycle: BillingCycle): string {
  // 优先使用区分月付/年付的 Price ID
  const detailedPrices: Record<string, string | undefined> = {
    "pro-monthly": process.env.STRIPE_PRICE_PRO_MONTHLY,
    "pro-annual": process.env.STRIPE_PRICE_PRO_ANNUAL,
    "ultra-monthly": process.env.STRIPE_PRICE_ULTRA_MONTHLY,
    "ultra-annual": process.env.STRIPE_PRICE_ULTRA_ANNUAL,
  };

  const detailedKey = `${plan}-${billingCycle}`;
  const detailedPriceId = detailedPrices[detailedKey];

  if (detailedPriceId) {
    return detailedPriceId;
  }

  // 回退到旧的单一 Price ID（兼容现有配置）
  // TODO: 当所有环境变量配置完成后，可以移除此回退逻辑
  const fallbackPrices: Record<PlanKey, string | undefined> = {
    pro: process.env.STRIPE_PRICE_PRO,
    ultra: process.env.STRIPE_PRICE_ULTRA,
  };

  const fallbackPriceId = fallbackPrices[plan];

  if (!fallbackPriceId) {
    throw new Error(
      `Missing Stripe price id for plan: ${plan}, billingCycle: ${billingCycle}. ` +
      `Please set STRIPE_PRICE_${plan.toUpperCase()}_${billingCycle.toUpperCase()} or STRIPE_PRICE_${plan.toUpperCase()}`
    );
  }

  console.warn(
    `[Stripe] Using fallback price for ${plan}. ` +
    `Consider setting STRIPE_PRICE_${plan.toUpperCase()}_${billingCycle.toUpperCase()} for proper monthly/annual pricing.`
  );

  return fallbackPriceId;
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
    const { plan, billingCycle = "annual" } = (await req.json()) as {
      plan?: PlanKey;
      billingCycle?: BillingCycle;
    };

    if (plan !== "pro" && plan !== "ultra") {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    if (billingCycle !== "monthly" && billingCycle !== "annual") {
      return NextResponse.json({ error: "Invalid billing cycle" }, { status: 400 });
    }

    const priceId = getPriceId(plan, billingCycle);
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
        billingCycle,
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          plan,
          billingCycle,
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
