import Link from "next/link";

export default function VerifyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.35em] text-emerald-300">Qiltrack AI</p>
          <h1 className="text-2xl font-semibold">Check your inbox</h1>
          <p className="text-sm text-slate-400">
            We have sent a secure sign-in link to your email address. Please open the message on
            this device and click the magic link to continue.
          </p>
        </div>
        <div className="space-y-2 text-sm text-slate-400">
          <p>If you did not see the email, remember to check the spam folder.</p>
          <p>
            Need to try again?{" "}
            <Link className="text-emerald-300 underline" href="/">
              Go back to Qiltrack AI
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
