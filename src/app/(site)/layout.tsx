import { SiteFrame } from "@/components/site/SiteFrame";
import { FavoritesProvider } from "@/components/favorites/FavoritesProvider";
import { CookieConsent } from "@/components/cookie/CookieConsent";
import { CloudflareAnalytics } from "@/components/analytics/CloudflareAnalytics";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  const cfToken = process.env.NEXT_PUBLIC_CF_ANALYTICS_TOKEN;

  return (
    <FavoritesProvider>
      <SiteFrame>{children}</SiteFrame>
      <CookieConsent />
      <CloudflareAnalytics token={cfToken} />
    </FavoritesProvider>
  );
}
