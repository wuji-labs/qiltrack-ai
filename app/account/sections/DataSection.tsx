"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useLanguage } from "@/lib/i18n";

export default function DataSection() {
  const { user, signOut, supabase } = useSupabaseAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") {
      setMessage({
        type: "error",
        text: t("account.data.deleteConfirmError"),
      });
      return;
    }

    setDeleting(true);
    setMessage(null);

    try {
      if (!user || !supabase) throw new Error("Not authenticated");

      // Delete user data from profiles table
      const { error: profileError } = await supabase.from("profiles").delete().eq("id", user.id);

      if (profileError) throw profileError;

      // Sign out and redirect
      await signOut();
      router.push("/");
    } catch (error) {
      console.error("Failed to delete account:", error);
      setMessage({
        type: "error",
        text: t("account.data.deleteError"),
      });
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">{t("account.data.title")}</h2>
        <p className="mt-1 text-sm text-subtle">{t("account.data.description")}</p>
      </div>

      {message && (
        <div
          className={`rounded-lg border p-3 text-sm ${
            message.type === "success"
              ? "border-green-500/20 bg-green-500/10 text-green-400"
              : "border-red-500/20 bg-red-500/10 text-red-400"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Report History */}
      <div className="rounded-xl border border-[var(--stroke-soft)] bg-[var(--bg-layer)] p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-semibold">{t("account.data.reportHistory")}</h3>
            <p className="mt-1 text-sm text-subtle">{t("account.data.reportHistoryDescription")}</p>
          </div>
          <Link
            href="/account/history"
            className="px-4 py-2 rounded-lg border border-[var(--stroke-soft)] text-sm font-medium hover:bg-[var(--bg-base)] transition-colors"
          >
            {t("account.data.viewHistory")}
          </Link>
        </div>
      </div>

      {/* Sign Out */}
      <div className="rounded-xl border border-[var(--stroke-soft)] bg-[var(--bg-layer)] p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-semibold">{t("account.data.signOut")}</h3>
            <p className="mt-1 text-sm text-subtle">{t("account.data.signOutDescription")}</p>
          </div>
          <button
            type="button"
            onClick={() => signOut()}
            className="px-4 py-2 rounded-lg border border-[var(--stroke-soft)] text-sm font-medium hover:bg-[var(--bg-base)] transition-colors"
          >
            {t("auth.account.signout")}
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-6 space-y-4">
        <div>
          <h3 className="text-base font-semibold text-red-400">{t("account.data.dangerZone")}</h3>
          <p className="mt-1 text-sm text-subtle">{t("account.data.dangerZoneDescription")}</p>
        </div>

        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium">{t("account.data.deleteAccount")}</p>
            <p className="mt-1 text-sm text-subtle">{t("account.data.deleteAccountWarning")}</p>
          </div>
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-sm font-medium text-red-400 hover:bg-red-500/20 transition-colors whitespace-nowrap"
          >
            {t("account.data.deleteAccountButton")}
          </button>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-red-500/30 bg-[var(--bg-layer)] p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-red-400">
              {t("account.data.deleteAccountConfirm")}
            </h3>
            <p className="mt-2 text-sm text-subtle">{t("account.data.deleteAccountConfirmText")}</p>

            <div className="mt-4 space-y-3">
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3">
                <p className="text-sm text-red-400 font-medium">
                  {t("account.data.deleteAccountConsequences")}
                </p>
                <ul className="mt-2 space-y-1 text-xs text-subtle">
                  <li>• {t("account.data.deleteConsequence1")}</li>
                  <li>• {t("account.data.deleteConsequence2")}</li>
                  <li>• {t("account.data.deleteConsequence3")}</li>
                </ul>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t("account.data.deleteConfirmLabel")}
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="w-full rounded-lg border border-[var(--stroke-soft)] bg-[var(--bg-base)] px-4 py-2.5 text-sm focus:outline-none focus:border-red-500"
                />
                <p className="text-xs text-subtle">{t("account.data.deleteConfirmHint")}</p>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText("");
                }}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 rounded-lg border border-[var(--stroke-soft)] text-sm font-medium hover:bg-[var(--bg-base)] transition-colors disabled:opacity-50"
              >
                {t("common.cancel")}
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleting || deleteConfirmText !== "DELETE"}
                className="flex-1 px-4 py-2.5 rounded-lg bg-red-500 text-sm font-semibold text-white hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? t("common.deleting") : t("account.data.deleteAccountPermanent")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
