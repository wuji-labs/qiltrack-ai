"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Command, X } from "lucide-react";

/**
 * Keyboard shortcuts handler component
 * Implements global keyboard shortcuts for improved navigation
 */
export function KeyboardShortcuts() {
  const router = useRouter();
  const pathname = usePathname();
  const [showHelp, setShowHelp] = useState(false);
  const [lastKey, setLastKey] = useState<string | null>(null);
  const [sequenceTimeout, setSequenceTimeout] = useState<NodeJS.Timeout | null>(null);

  // Detect if user is on Mac
  const isMac = typeof navigator !== "undefined" && /Mac/.test(navigator.platform);
  const modKey = isMac ? "⌘" : "Ctrl";

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      const isModKey = e.metaKey || e.ctrlKey;

      // Mod + K: Focus search (if exists)
      if (isModKey && e.key === "k") {
        e.preventDefault();
        const searchInput = document.querySelector<HTMLInputElement>(
          'input[type="search"], input[placeholder*="搜索"], input[placeholder*="Search"]'
        );
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
        return;
      }

      // Mod + /: Show shortcuts help
      if (isModKey && e.key === "/") {
        e.preventDefault();
        setShowHelp((prev) => !prev);
        return;
      }

      // Escape: Close help dialog
      if (e.key === "Escape" && showHelp) {
        e.preventDefault();
        setShowHelp(false);
        return;
      }

      // Sequential shortcuts (g + key)
      if (!isModKey) {
        // First key in sequence
        if (e.key === "g" && !lastKey) {
          e.preventDefault();
          setLastKey("g");

          // Clear sequence after 2 seconds
          if (sequenceTimeout) clearTimeout(sequenceTimeout);
          const timeout = setTimeout(() => setLastKey(null), 2000);
          setSequenceTimeout(timeout);
          return;
        }

        // Second key in sequence
        if (lastKey === "g") {
          e.preventDefault();
          if (sequenceTimeout) clearTimeout(sequenceTimeout);
          setLastKey(null);

          switch (e.key) {
            case "h":
              router.push("/");
              break;
            case "g":
              router.push("/#generator");
              // Scroll to generator section
              setTimeout(() => {
                document.getElementById("generator")?.scrollIntoView({ behavior: "smooth" });
              }, 100);
              break;
            case "p":
              router.push("/pricing");
              break;
            case "a":
              router.push("/account");
              break;
            case "r":
              router.push("/reports");
              break;
          }
          return;
        }

        // ? : Show help (alternative to Mod + /)
        if (e.key === "?" && !lastKey) {
          e.preventDefault();
          setShowHelp((prev) => !prev);
          return;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (sequenceTimeout) clearTimeout(sequenceTimeout);
    };
  }, [router, lastKey, sequenceTimeout, showHelp]);

  // Keyboard shortcuts help dialog
  if (!showHelp) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={() => setShowHelp(false)}
    >
      <div
        className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <Command className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-100">键盘快捷键</h2>
              <p className="text-sm text-slate-400">提升您的使用效率</p>
            </div>
          </div>
          <button
            onClick={() => setShowHelp(false)}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors"
            aria-label="关闭"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Shortcuts list */}
        <div className="space-y-6">
          {/* Navigation */}
          <div>
            <h3 className="text-sm font-semibold text-slate-300 mb-3">导航</h3>
            <div className="space-y-2">
              <ShortcutItem keys={["g", "h"]} description="跳转到首页" />
              <ShortcutItem keys={["g", "g"]} description="跳转到报告生成器" />
              <ShortcutItem keys={["g", "p"]} description="跳转到定价页面" />
              <ShortcutItem keys={["g", "a"]} description="跳转到账户页面" />
              <ShortcutItem keys={["g", "r"]} description="跳转到报告中心" />
            </div>
          </div>

          {/* Actions */}
          <div>
            <h3 className="text-sm font-semibold text-slate-300 mb-3">操作</h3>
            <div className="space-y-2">
              <ShortcutItem keys={[modKey, "K"]} description="聚焦搜索框" />
            </div>
          </div>

          {/* Help */}
          <div>
            <h3 className="text-sm font-semibold text-slate-300 mb-3">帮助</h3>
            <div className="space-y-2">
              <ShortcutItem keys={[modKey, "/"]} description="显示/隐藏快捷键帮助" />
              <ShortcutItem keys={["?"]} description="显示快捷键帮助" />
              <ShortcutItem keys={["Esc"]} description="关闭对话框" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-700">
          <p className="text-xs text-slate-500 text-center">
            提示：按 <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-400">g</kbd>{" "}
            然后按其他键快速导航
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Individual shortcut item component
 */
function ShortcutItem({ keys, description }: { keys: string[]; description: string }) {
  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors">
      <span className="text-sm text-slate-300">{description}</span>
      <div className="flex items-center gap-1">
        {keys.map((key, index) => (
          <span key={index} className="flex items-center gap-1">
            <kbd className="px-2 py-1 min-w-[28px] text-center bg-slate-700 border border-slate-600 rounded text-xs font-medium text-slate-200 shadow-sm">
              {key}
            </kbd>
            {index < keys.length - 1 && (
              <span className="text-slate-500 text-xs">then</span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * Keyboard shortcut indicator (shows when "g" is pressed)
 */
export function KeyboardShortcutIndicator({ visible }: { visible: boolean }) {
  if (!visible) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-slate-900 border border-emerald-500/50 rounded-xl px-4 py-2 shadow-lg shadow-emerald-500/20 z-40 animate-in fade-in slide-in-from-bottom-2">
      <p className="text-sm text-slate-300">
        等待下一个按键... <span className="text-emerald-400">(h/g/p/a/r)</span>
      </p>
    </div>
  );
}
