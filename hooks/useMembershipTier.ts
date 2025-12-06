"use client";

import { useEffect, useState, useCallback } from "react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

export type MembershipTier = "free" | "pro" | "ultra";

type ProfileData = {
  plan?: string;
  subscription_status?: string;
  subscription_expires_at?: string | null;
};

export interface MembershipInfo {
  tier: MembershipTier;
  loading: boolean;
  isActive: boolean;
  expiresAt: string | null;
  // 便捷的权限检查
  isFree: boolean;
  isPro: boolean;
  isUltra: boolean;
  isPremium: boolean; // pro or ultra
  // 功能权限
  canExport: boolean;
  canExportDocx: boolean;
  canExportPdf: boolean;
  canBatchGenerate: boolean;
  canUseAPI: boolean;
  canAccessAllReports: boolean;
  // 检查是否可以访问指定等级的内容
  canAccessContent: (accessLevel: "timed-free" | "pro" | "ultra") => boolean;
}

export function useMembershipTier(): MembershipInfo {
  const { user, getUserProfile, isAuthenticated } = useSupabaseAuth();
  const [tier, setTier] = useState<MembershipTier>("free");
  const [subscriptionStatus, setSubscriptionStatus] = useState("inactive");
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMembership = async () => {
      if (!isAuthenticated || !user) {
        setTier("free");
        setSubscriptionStatus("inactive");
        setExpiresAt(null);
        setLoading(false);
        return;
      }

      try {
        const profile = await getUserProfile() as ProfileData | null;

        if (profile) {
          setTier((profile.plan as MembershipTier) || "free");
          setSubscriptionStatus(profile.subscription_status || "inactive");
          setExpiresAt(profile.subscription_expires_at || null);
        } else {
          setTier("free");
          setSubscriptionStatus("inactive");
          setExpiresAt(null);
        }
      } catch (err) {
        console.error("Failed to load membership:", err);
        setTier("free");
        setSubscriptionStatus("inactive");
        setExpiresAt(null);
      } finally {
        setLoading(false);
      }
    };

    loadMembership();
  }, [user, isAuthenticated, getUserProfile]);

  const canAccessContent = useCallback(
    (accessLevel: "timed-free" | "pro" | "ultra"): boolean => {
      // 限时免费：所有人可以访问
      if (accessLevel === "timed-free") return true;

      // 订阅未激活，视为免费用户
      if (subscriptionStatus !== "active") return false;

      // Pro 内容：Pro 和 Ultra 用户可以访问
      if (accessLevel === "pro") {
        return tier === "pro" || tier === "ultra";
      }

      // Ultra 内容：仅 Ultra 用户可以访问
      if (accessLevel === "ultra") {
        return tier === "ultra";
      }

      return false;
    },
    [tier, subscriptionStatus]
  );

  const isActive = subscriptionStatus === "active";
  const isFree = tier === "free";
  const isPro = tier === "pro";
  const isUltra = tier === "ultra";
  const isPremium = isPro || isUltra;

  return {
    tier,
    loading,
    isActive,
    expiresAt,
    isFree,
    isPro,
    isUltra,
    isPremium,
    // 功能权限
    canExport: isPremium && isActive, // 兼容性：保留原有属性
    canExportDocx: isPremium && isActive, // Pro+ 可导出 DOCX
    canExportPdf: isUltra && isActive, // 仅 Ultra 可导出 PDF
    canBatchGenerate: isUltra && isActive,
    canUseAPI: isUltra && isActive,
    canAccessAllReports: isUltra && isActive,
    canAccessContent,
  };
}
