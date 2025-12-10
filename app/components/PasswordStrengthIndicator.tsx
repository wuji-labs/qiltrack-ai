"use client";

import { useMemo } from "react";
import { Check, X } from "lucide-react";

type PasswordRequirement = {
  label: string;
  met: boolean;
};

type PasswordStrengthIndicatorProps = {
  password: string;
  minLength?: number;
};

export function PasswordStrengthIndicator({
  password,
  minLength = 8
}: PasswordStrengthIndicatorProps) {
  const requirements = useMemo<PasswordRequirement[]>(() => {
    return [
      {
        label: `至少${minLength}个字符`,
        met: password.length >= minLength,
      },
      {
        label: "包含大写字母",
        met: /[A-Z]/.test(password),
      },
      {
        label: "包含小写字母",
        met: /[a-z]/.test(password),
      },
      {
        label: "包含数字",
        met: /[0-9]/.test(password),
      },
    ];
  }, [password, minLength]);

  const strength = useMemo(() => {
    const metCount = requirements.filter((r) => r.met).length;
    if (metCount === 0) return { label: "", color: "" };
    if (metCount <= 1) return { label: "弱", color: "text-red-400" };
    if (metCount === 2) return { label: "中等", color: "text-amber-400" };
    if (metCount === 3) return { label: "较强", color: "text-emerald-400" };
    return { label: "强", color: "text-green-400" };
  }, [requirements]);

  const allMet = requirements.every((r) => r.met);

  if (!password) return null;

  return (
    <div className="mt-3 space-y-2.5 p-3 rounded-xl border border-slate-700/50 bg-slate-800/30">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-300">密码强度</span>
        {strength.label && (
          <span className={`text-xs font-semibold ${strength.color}`}>
            {strength.label}
          </span>
        )}
      </div>

      <div className="space-y-1.5">
        {requirements.map((req, index) => (
          <div
            key={index}
            className="flex items-center gap-2 text-xs transition-all duration-200"
          >
            <div
              className={`flex-shrink-0 h-4 w-4 rounded-full flex items-center justify-center transition-all duration-200 ${
                req.met
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-slate-700/50 text-slate-500"
              }`}
            >
              {req.met ? (
                <Check className="h-2.5 w-2.5" strokeWidth={3} />
              ) : (
                <X className="h-2.5 w-2.5" strokeWidth={2} />
              )}
            </div>
            <span
              className={`transition-colors duration-200 ${
                req.met ? "text-slate-200" : "text-slate-400"
              }`}
            >
              {req.label}
            </span>
          </div>
        ))}
      </div>

      {allMet && (
        <div className="mt-2 pt-2 border-t border-emerald-500/20">
          <div className="flex items-center gap-1.5 text-xs text-emerald-400">
            <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
            <span className="font-medium">密码符合所有要求</span>
          </div>
        </div>
      )}
    </div>
  );
}

type ValidationItemProps = {
  valid: boolean;
  text: string;
};

export function ValidationItem({ valid, text }: ValidationItemProps) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <div
        className={`flex-shrink-0 h-4 w-4 rounded-full flex items-center justify-center transition-all ${
          valid
            ? "bg-emerald-500/20 text-emerald-400"
            : "bg-slate-700/50 text-slate-500"
        }`}
      >
        {valid ? (
          <Check className="h-2.5 w-2.5" strokeWidth={3} />
        ) : (
          <X className="h-2.5 w-2.5" strokeWidth={2} />
        )}
      </div>
      <span className={valid ? "text-slate-200" : "text-slate-400"}>{text}</span>
    </div>
  );
}
