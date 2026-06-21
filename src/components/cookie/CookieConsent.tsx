"use client";

import { useState } from "react";
import Link from "next/link";
import { SketchBorder } from "@/components/sketch/SketchBorder";
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
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-3xl sm:bottom-6 sm:left-6 sm:right-6">
      <SketchBorder fill="transparent">
        <div className="rounded-xl bg-paper/95 p-4 backdrop-blur-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1 text-sm">
              <p className="font-kalam font-bold">🍪 Cookie 使用说明</p>
              <p className="text-ink-light">
                我们使用 Cookie 提供必要功能，并借助 Google Analytics 了解访问情况。
                更多详情请查看
                <Link href="/privacy" className="font-kalam underline decoration-dotted hover:text-ink">
                  隐私政策
                </Link>
                。
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-3">
              <SketchButton variant="secondary" onClick={handleNecessaryOnly}>
                仅必要
              </SketchButton>
              <SketchButton variant="primary" onClick={handleAccept}>
                同意全部
              </SketchButton>
            </div>
          </div>
        </div>
      </SketchBorder>
    </div>
  );
}
