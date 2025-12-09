"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import Cropper from "react-easy-crop";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useLanguage } from "@/lib/i18n";

export default function ProfileSection() {
  const { user, supabase } = useSupabaseAuth();
  const { t } = useLanguage();
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [userPlan, setUserPlan] = useState<string>("free");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cropping states
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Load profile data
  useEffect(() => {
    const loadProfile = async () => {
      if (!user || !supabase) return;

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("获取用户资料失败:", error);
          return;
        }

        if (data) {
          setDisplayName(data.display_name || "");
          setAvatarUrl(data.avatar_url || "");
          setUserPlan(data.plan || "free");
        }
      } catch (err) {
        console.error("用户资料查询异常:", err);
      }
    };
    loadProfile();
  }, [user, supabase]);

  const handleSaveProfile = async () => {
    if (!user || !supabase) return;

    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: displayName.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;

      setMessage({ type: "success", text: t("account.profile.updateSuccess") });
    } catch (error) {
      console.error("Failed to update profile:", error);
      setMessage({ type: "error", text: t("account.profile.updateError") });
    } finally {
      setLoading(false);
    }
  };

  // Callback when crop area changes
  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // Create cropped image
  const createCroppedImage = async (
    imageSrc: string,
    pixelCrop: any,
    fileName: string
  ): Promise<File> => {
    const image = new window.Image();
    image.src = imageSrc;
    await new Promise((resolve) => {
      image.onload = resolve;
    });

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Failed to get canvas context");
    }

    // Set canvas size to match the cropped area
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    // Draw the cropped image
    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    // Convert canvas to blob then to file
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Failed to create blob"));
          return;
        }
        const file = new File([blob], fileName, { type: "image/jpeg" });
        resolve(file);
      }, "image/jpeg", 0.95);
    });
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setMessage({ type: "error", text: t("account.profile.invalidFileType") });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: "error", text: t("account.profile.fileTooLarge") });
      return;
    }

    setMessage(null);
    setSelectedFile(file);

    // Create a URL for the image to crop
    const reader = new FileReader();
    reader.onload = () => {
      setImageToCrop(reader.result as string);
      setCropModalOpen(true);
    };
    reader.readAsDataURL(file);

    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCropConfirm = async () => {
    if (!imageToCrop || !croppedAreaPixels || !selectedFile || !user || !supabase) return;

    setUploading(true);
    setCropModalOpen(false);

    try {
      // Create the cropped image
      const croppedFile = await createCroppedImage(
        imageToCrop,
        croppedAreaPixels,
        selectedFile.name
      );

      // Upload to Supabase Storage
      const fileExt = croppedFile.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("user-uploads")
        .upload(filePath, croppedFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage.from("user-uploads").getPublicUrl(filePath);
      const publicUrl = data.publicUrl;

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          avatar_url: publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      setMessage({ type: "success", text: t("account.profile.avatarUpdateSuccess") });
    } catch (error) {
      console.error("Failed to upload avatar:", error);
      setMessage({ type: "error", text: t("account.profile.avatarUpdateError") });
    } finally {
      setUploading(false);
      setImageToCrop(null);
      setSelectedFile(null);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
    }
  };

  const handleCropCancel = () => {
    setCropModalOpen(false);
    setImageToCrop(null);
    setSelectedFile(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  };

  const avatarInitial = user?.email ? user.email.charAt(0).toUpperCase() : "U";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">{t("account.profile.title")}</h2>
        <p className="mt-1 text-sm text-subtle">{t("account.profile.description")}</p>
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

      <div className="rounded-xl border border-[var(--stroke-soft)] bg-[var(--bg-layer)] p-6 space-y-6">
        {/* Avatar and Membership Card */}
        <div className="flex items-start gap-6">
          <div className="relative flex-shrink-0">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt={displayName || user?.email || "Avatar"}
                className="h-24 w-24 rounded-full object-cover border-2 border-[var(--stroke-soft)]"
              />
            ) : (
              <div className="h-24 w-24 rounded-full bg-[var(--accent-emerald)]/20 border-2 border-[var(--stroke-soft)] flex items-center justify-center text-3xl font-semibold text-[var(--accent-emerald)]">
                {avatarInitial}
              </div>
            )}
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-r-transparent" />
              </div>
            )}
          </div>

          <div className="flex-1 flex gap-6">
            <div className="flex-1 space-y-3">
              <div>
                <p className="text-sm font-medium">{t("account.profile.avatar")}</p>
                <p className="text-xs text-subtle mt-1">{t("account.profile.avatarHint")}</p>
              </div>
              <div className="flex gap-3">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="px-4 py-2 rounded-lg border border-[var(--stroke-soft)] text-sm font-medium hover:bg-[var(--bg-base)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t("account.profile.uploadAvatar")}
              </button>
              {avatarUrl && (
                <button
                  type="button"
                  onClick={async () => {
                    if (!user || !supabase) return;
                    setUploading(true);
                    try {
                      await supabase
                        .from("profiles")
                        .update({ avatar_url: null })
                        .eq("id", user.id);
                      setAvatarUrl("");
                      setMessage({ type: "success", text: t("account.profile.avatarRemoved") });
                    } catch (error) {
                      setMessage({ type: "error", text: t("account.profile.avatarRemoveError") });
                    } finally {
                      setUploading(false);
                    }
                  }}
                  disabled={uploading}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t("account.profile.removeAvatar")}
                </button>
              )}
            </div>
          </div>

            {/* Membership Card - Hidden on mobile */}
            <Link
              href="/account"
              onClick={(e) => {
                e.preventDefault();
                // 触发会员订阅标签页的点击
                setTimeout(() => {
                  const membershipButton = document.querySelector('nav button:nth-child(2)') as HTMLButtonElement;
                  if (membershipButton) {
                    membershipButton.click();
                  }
                }, 0);
              }}
              className="hidden lg:flex flex-shrink-0 w-56 rounded-lg border border-[var(--stroke-soft)]/50 bg-[var(--bg-layer)] p-3 hover:border-[var(--stroke-soft)] hover:bg-[var(--bg-base)] transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3 w-full">
                <div className="text-2xl flex-shrink-0">
                  {userPlan === "ultra" ? "👑" : userPlan === "pro" ? "💎" : "🆓"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-subtle uppercase tracking-wide">{t("account.membership.currentPlan") || "当前套餐"}</p>
                  <p className="text-sm font-semibold text-[var(--color-foreground)] truncate">
                    {userPlan === "ultra" ? t("quota.plan.ultra") || "Ultra" : userPlan === "pro" ? t("quota.plan.pro") || "Pro" : t("quota.plan.free") || "Free"}
                  </p>
                </div>
                <svg className="w-4 h-4 text-subtle group-hover:text-[var(--color-foreground)] transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          </div>
        </div>

        <div className="h-px bg-[var(--stroke-soft)]" />

        {/* Email (read-only) */}
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("account.profile.email")}</label>
          <input
            type="email"
            value={user?.email || ""}
            disabled
            className="w-full rounded-lg border border-[var(--stroke-soft)] bg-[var(--bg-base)] px-4 py-2.5 text-sm text-subtle cursor-not-allowed"
          />
          <p className="text-xs text-subtle">{t("account.profile.emailHint")}</p>
        </div>

        {/* Display Name */}
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("account.profile.displayName")}</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder={t("account.profile.displayNamePlaceholder")}
            maxLength={50}
            className="w-full rounded-lg border border-[var(--stroke-soft)] bg-[var(--bg-base)] px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--accent-emerald)]"
          />
          <p className="text-xs text-subtle">{t("account.profile.displayNameHint")}</p>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <button
            type="button"
            onClick={handleSaveProfile}
            disabled={loading}
            className="px-6 py-2.5 rounded-lg bg-[var(--accent-emerald)] text-sm font-semibold text-slate-950 shadow-[0_8px_16px_rgba(91,224,176,0.24)] hover:brightness-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? t("common.saving") : t("common.save")}
          </button>
        </div>
      </div>

      {/* Crop Modal */}
      {cropModalOpen && imageToCrop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl mx-4 bg-[var(--bg-layer)] rounded-2xl border border-[var(--stroke-soft)] overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-[var(--stroke-soft)]">
              <h3 className="text-lg font-semibold">
                {t("account.profile.cropAvatar") || "Crop Avatar"}
              </h3>
              <p className="text-sm text-subtle mt-1">
                {t("account.profile.cropAvatarHint") || "Adjust the image to fit the circle"}
              </p>
            </div>

            {/* Cropper */}
            <div className="relative h-96 bg-black">
              <Cropper
                image={imageToCrop}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>

            {/* Zoom Control */}
            <div className="px-6 py-4 border-b border-[var(--stroke-soft)]">
              <label className="text-sm font-medium block mb-2">
                {t("account.profile.zoom") || "Zoom"}
              </label>
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full h-2 bg-[var(--bg-base)] rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--accent-emerald)] [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[var(--accent-emerald)] [&::-moz-range-thumb]:border-0"
              />
            </div>

            {/* Actions */}
            <div className="px-6 py-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCropCancel}
                className="px-6 py-2.5 rounded-lg border border-[var(--stroke-soft)] text-sm font-medium hover:bg-[var(--bg-base)] transition-colors"
              >
                {t("common.cancel") || "Cancel"}
              </button>
              <button
                type="button"
                onClick={handleCropConfirm}
                className="px-6 py-2.5 rounded-lg bg-[var(--accent-emerald)] text-sm font-semibold text-slate-950 shadow-[0_8px_16px_rgba(91,224,176,0.24)] hover:brightness-105 transition-all"
              >
                {t("common.confirm") || "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
