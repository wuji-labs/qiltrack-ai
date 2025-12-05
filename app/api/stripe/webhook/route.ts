import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripeClient } from "@/lib/stripe/client";
import { createServiceRoleClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PlanKey = "pro" | "annual";

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

  const supabase = createServiceRoleClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const plan = (session.metadata?.plan as PlanKey) || "pro";
        const customerId =
          typeof session.customer === "string"
            ? session.customer
            : session.customer?.id || null;
        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id || null;

        if (!userId) {
          console.warn("[Stripe] checkout.session.completed missing user_id");
          return NextResponse.json({ received: true });
        }

        console.log(`[Stripe] Checkout completed for user ${userId}, plan: ${plan}`);

        // 调用数据库函数升级会员
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: upgradeError } = await (supabase as any).rpc("fn_upgrade_membership", {
          p_user_id: userId,
          p_plan: plan,
          p_stripe_customer_id: customerId,
          p_stripe_subscription_id: subscriptionId,
        });

        if (upgradeError) {
          console.error("[Stripe] Failed to upgrade membership:", upgradeError);
        } else {
          console.log(`[Stripe] Successfully upgraded user ${userId} to ${plan}`);
        }

        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        console.log(`[Stripe] Payment succeeded for customer ${customerId}`);

        // 更新订阅状态
        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            subscription_status: "active",
            updated_at: new Date().toISOString(),
          } as never)
          .eq("stripe_customer_id", customerId);

        if (updateError) {
          console.error("[Stripe] Failed to update subscription status:", updateError);
        }

        // 如果是续费，刷新月度积分
        if (invoice.billing_reason === "subscription_cycle") {
          const { data: profile } = await supabase
            .from("profiles")
            .select("id, plan")
            .eq("stripe_customer_id", customerId)
            .single();

          if (profile) {
            const monthlyQuota = profile.plan === "pro" ? 300 : profile.plan === "annual" ? 600 : 0;

            const { error: creditsError } = await supabase
              .from("report_credits")
              .update({
                credits_available: monthlyQuota,
                last_reset_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              } as never)
              .eq("user_id", profile.id);

            if (!creditsError) {
              console.log(`[Stripe] Refreshed credits for user ${profile.id}`);
            }
          }
        }

        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        await supabase
          .from("profiles")
          .update({
            subscription_status: "past_due",
            updated_at: new Date().toISOString(),
          } as never)
          .eq("stripe_customer_id", customerId);

        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from("profiles") as any)
          .update({
            subscription_status: subscription.status as string,
            subscription_expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_customer_id", customerId);

        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // 取消订阅
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (profile) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any).rpc("fn_cancel_membership", {
            p_user_id: (profile as { id: string }).id,
            p_immediate: false,
          });
        }

        break;
      }

      default:
        console.log(`[Stripe] Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error("[Stripe] Webhook handling error", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
