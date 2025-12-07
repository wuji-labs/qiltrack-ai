import { Suspense } from "react";

import AccountClient from "./AccountClient";

// Account is user-specific; render dynamically to avoid stale caches.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type SearchParams = { [key: string]: string | string[] | undefined };

export default function AccountPage({ searchParams }: { searchParams?: SearchParams }) {
  const paymentSuccess = searchParams?.success === "true";

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
          <div className="text-slate-400 text-sm">Loading account…</div>
        </div>
      }
    >
      <AccountClient paymentSuccess={paymentSuccess} />
    </Suspense>
  );
}
