import { Suspense } from "react";

import PricingClient from "./PricingClient";

// Pricing uses client hooks; keep dynamic to avoid static prerender issues.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default function PricingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
          <div className="text-slate-400 text-sm">Loading pricing…</div>
        </div>
      }
    >
      <PricingClient />
    </Suspense>
  );
}
