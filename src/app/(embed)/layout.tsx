import type { Metadata, Viewport } from "next";
import { inter, kalam, notoSerif } from "@/lib/fonts";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import { getSiteOrigin, siteConfig } from "@/lib/site/config";
import "../globals.css";

// (embed) 组独立 root layout：demo/iframe 页不进入 [locale] 段，固定中文壳。
export const metadata: Metadata = {
  metadataBase: new URL(getSiteOrigin()),
  title: siteConfig.name,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function EmbedLayout({ children }: { children: React.ReactNode }) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${kalam.variable} ${notoSerif.variable} bg-transparent text-ink antialiased`}
      >
        {/* demo 壳 html lang 运行时修正：显式 ?lang=zh → zh-CN，其余一律 en */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{document.documentElement.lang=new URLSearchParams(location.search).get("lang")==="zh"?"zh-CN":"en"}catch(e){document.documentElement.lang="en"}`,
          }}
        />
        <GoogleAnalytics gaId={gaId} />
        <div className="h-dvh w-full overflow-hidden bg-transparent">{children}</div>
      </body>
    </html>
  );
}
