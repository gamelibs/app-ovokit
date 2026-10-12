"use client";

import { useEffect } from "react";

/**
 * OVO 站点统计 game_start 埋点（契约：ovo_system docs/task-board/lanes/p2-site-analytics.md §1 SDK v1.1）。
 * 双口径：
 *  a. 页面显式「开始」控件点击 → 调 reportGameStart(slug)；
 *  b. demo iframe 引擎初始化完成消息（demo:ready，或 v2 静态导出包实际发出的 previewReady）→ useGameStartOnDemoReady 自动上报。
 * 去重：sessionStorage 键 ovo_gs_<slug>，同一浏览器会话同 slug 只上报一次（两口径 whichever 先）。
 * OVOT 不存在（SDK 被拦截/未加载）时静默跳过，绝不影响页面。
 */

const KEY_PREFIX = "ovo_gs_";

type OvotApi = { gameStart: (slug: string) => void };

function ovot(): OvotApi | null {
  if (typeof window === "undefined") return null;
  const api = (window as { OVOT?: { gameStart?: (slug: string) => void } }).OVOT;
  return api && typeof api.gameStart === "function" ? { gameStart: api.gameStart } : null;
}

export function reportGameStart(slug: string): void {
  if (!slug) return;
  const api = ovot();
  if (!api) return;
  try {
    if (window.sessionStorage.getItem(KEY_PREFIX + slug)) return;
    window.sessionStorage.setItem(KEY_PREFIX + slug, String(Date.now()));
  } catch {
    // sessionStorage 不可用时放弃去重，仍上报
  }
  try {
    api.gameStart(slug);
  } catch {
    // 绝不影响页面
  }
}

/** demo iframe 引擎初始化完成口径（demo:ready / previewReady，任一先到即算一次启动） */
export function useGameStartOnDemoReady(slug: string | null | undefined): void {
  useEffect(() => {
    if (!slug || typeof window === "undefined") return;
    const handler = (ev: MessageEvent) => {
      const data = ev.data as { type?: unknown } | null;
      if (!data || typeof data !== "object") return;
      if (data.type === "demo:ready" || data.type === "previewReady") {
        reportGameStart(slug);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [slug]);
}
