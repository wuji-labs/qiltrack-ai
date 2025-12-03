import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error("Missing STRIPE_SECRET_KEY for Stripe initialization");
}

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2025-11-17.clover",
});
