"use client";

import Script from "next/script";
import { hasAnalyticsConsent } from "@/lib/cookies/consent";
import { useClientValue } from "@/lib/hooks/useClientValue";

/**
 * Google Analytics 4 (gtag) 集成组件。
 *
 * - 当 `gaId` 为空时不渲染任何内容，适合本地开发关闭统计。
 * - 只有用户通过 Cookie 横幅同意分析 Cookie 后才会加载。
 * - 建议生产环境在 .env 中配置 NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX。
 */
export function GoogleAnalytics({ gaId }: { gaId?: string }) {
  const canLoad = useClientValue(
    () => Boolean(gaId) && hasAnalyticsConsent(),
    false,
  );

  if (!gaId || !canLoad) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}', {
            send_page_view: true,
          });
        `}
      </Script>
    </>
  );
}
