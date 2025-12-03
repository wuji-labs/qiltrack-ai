import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripeClient } from "@/lib/stripe/client";
import { createServiceRoleClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PlanKey = "basic" | "pro";

export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });
  }

  if (!webhookSecret) {
    return NextResponse.json({ error: "Missing STRIPE_WEBHOOK_SECRET" }, { status: 500 });
  }

  const body = await req.text();

  let event: Stripe.Event;

  try {
    const stripe = getStripeClient();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error("[Stripe] Webhook signature verification failed", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const customerId =
        typeof session.customer === "string"
          ? session.customer
          : session.customer?.id || null;
      const email =
        session.customer_details?.email ||
        session.customer_email ||
        session.metadata?.email ||
        null;
      const plan = (session.metadata?.plan as PlanKey | undefined) ?? "pro";

      if (!email) {
        console.warn("[Stripe] checkout.session.completed missing email");
        return NextResponse.json({ received: true });
      }

      const supabase = createServiceRoleClient();
      const { error } = await supabase
        .from("profiles")
        .update({
          plan,
          stripe_customer_id: customerId,
        })
        .eq("email", email);

      if (error) {
        throw new Error(`Supabase update failed: ${error.message}`);
      }
    }
  } catch (error) {
    console.error("[Stripe] Webhook handling error", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
