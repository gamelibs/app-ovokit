"use client";

/**
 * Google Analytics 4 自定义事件上报工具。
 *
 * 使用方式：
 * ```ts
 * import { trackEvent } from "@/lib/analytics/events";
 *
 * trackEvent("play_like", { slug: "match-3" });
 * trackEvent("search", { query: "三消" });
 * ```
 *
 * 只有用户同意分析 Cookie 且 gtag 已加载时才会真正发送。
 */

export type GAEventParams = Record<string, string | number | boolean>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackEvent(eventName: string, params?: GAEventParams): void {
  if (typeof window === "undefined") return;
  if (typeof window.gtag !== "function") return;

  window.gtag("event", eventName, params ?? {});
}
