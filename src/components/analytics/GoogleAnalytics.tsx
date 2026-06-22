"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { hasAnalyticsConsent } from "@/lib/cookies/consent";
import { useClientValue } from "@/lib/hooks/useClientValue";

/**
 * 监听 Next.js 客户端路由变化，手动补发 page_view。
 * GA4 的 `send_page_view: true` 只会捕获初始页面加载，
 * App Router 的 `<Link>` 跳转不会自动触发新的 page_view。
 */
function RouteTracker({ gaId }: { gaId: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (typeof window.gtag !== "function") return;

    const query = searchParams?.toString();
    const pagePath = pathname + (query ? `?${query}` : "");

    window.gtag("event", "page_view", {
      page_path: pagePath,
      page_title: document.title,
      page_location: window.location.href,
      send_to: gaId,
    });
  }, [pathname, searchParams, gaId]);

  return null;
}

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
      <RouteTracker gaId={gaId} />
    </>
  );
}
