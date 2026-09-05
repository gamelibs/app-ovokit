import type { Metadata, Viewport } from "next";
import { inter, kalam, notoSerif } from "@/lib/fonts";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import { getSiteOrigin, siteConfig } from "@/lib/site/config";
import "./globals.css";

const metaTitle = `${siteConfig.name} - 游戏玩法分享与学习`;
const metaDescription =
  "GamesLog 是面向游戏爱好者的玩法技术分享站：拆解经典游戏的核心机制与规则循环，用手绘流程图讲清设计原理，并提供可直接试玩的最小 Demo，帮你从玩家视角进阶到设计师视角，理解游戏为什么好玩。";
const metaKeywords = [
  "游戏玩法",
  "玩法拆解",
  "游戏机制",
  "规则循环",
  "游戏设计",
  "玩法 Demo",
  siteConfig.name,
];

export const metadata: Metadata = {
  metadataBase: new URL(getSiteOrigin()),
  title: metaTitle,
  description: metaDescription,
  keywords: metaKeywords,
  openGraph: {
    title: metaTitle,
    description: metaDescription,
    type: "website",
    locale: "zh_CN",
    siteName: siteConfig.name,
  },
  twitter: {
    card: "summary_large_image",
    title: metaTitle,
    description: metaDescription,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${kalam.variable} ${notoSerif.variable} bg-paper text-ink antialiased`}
      >
        <GoogleAnalytics gaId={gaId} />
        {children}
      </body>
    </html>
  );
}
