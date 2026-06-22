"use client";

import Script from "next/script";

/**
 * Cloudflare Web Analytics（隐私友好、无 Cookie）。
 *
 * - 不需要 Cookie 同意横幅。
 * - 在 Cloudflare 控制台 → Analytics & Logs → Web Analytics 中创建站点后，
 *   复制 token，配置为 NEXT_PUBLIC_CF_ANALYTICS_TOKEN。
 * - 未配置 token 时不渲染任何内容。
 */
export function CloudflareAnalytics({ token }: { token?: string }) {
  if (!token) return null;

  return (
    <Script
      defer
      src="https://static.cloudflareinsights.com/beacon.min.js"
      data-cf-beacon={`{"token": "${token}"}`}
      strategy="afterInteractive"
    />
  );
}
