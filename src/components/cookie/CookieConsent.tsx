"use client";

import { useState } from "react";
import Link from "next/link";
import { SketchButton } from "@/components/sketch/SketchButton";
import { getCookieConsent, setCookieConsent } from "@/lib/cookies/consent";
import { useClientValue } from "@/lib/hooks/useClientValue";

/**
 * Cookie 同意横幅。
 *
 * - 首次访问时固定在页面底部显示。
 * - 用户选择后写入 localStorage 并隐藏。
 * - 同意分析 Cookie 后，Google Analytics 才会加载。
 */
export function CookieConsent() {
  const [dismissed, setDismissed] = useState(false);
  const needsConsent = useClientValue(() => !getCookieConsent(), false);

  const visible = !dismissed && needsConsent;

  const handleAccept = () => {
    setCookieConsent({ analytics: true });
    setDismissed(true);
    // 如果 GA 已经因为拒绝而未加载，刷新页面让 GA 重新评估。
    window.location.reload();
  };

  const handleNecessaryOnly = () => {
    setCookieConsent({ analytics: false });
    setDismissed(true);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-ink-faint bg-paper/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-1 px-3 py-2 text-xs sm:px-4">
        <p className="text-ink-light">
          🍪 我们使用 Cookie 提供必要功能，并借助 Google Analytics 了解访问情况。
          <Link href="/privacy" className="font-kalam underline decoration-dotted hover:text-ink">
            隐私政策
          </Link>
        </p>
        <div className="flex shrink-0 items-center gap-2">
          {/* min-h-11 保证触控目标 ≥44px（Apple HIG），视觉尺寸由 SketchBorder 决定不变 */}
          <SketchButton variant="secondary" onClick={handleNecessaryOnly} className="inline-flex min-h-11 min-w-11 items-center justify-center">
            仅必要
          </SketchButton>
          <SketchButton variant="primary" onClick={handleAccept} className="inline-flex min-h-11 min-w-11 items-center justify-center">
            同意全部
          </SketchButton>
        </div>
      </div>
    </div>
  );
}
