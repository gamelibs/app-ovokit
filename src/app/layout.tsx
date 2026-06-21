import type { Metadata, Viewport } from "next";
import { inter, kalam } from "@/lib/fonts";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import { CookieConsent } from "@/components/cookie/CookieConsent";
import "./globals.css";

export const metadata: Metadata = {
  title: "OVO - 游戏玩法分享与学习",
  description: "面向所有游戏爱好者的玩法分享站点：拆解经典机制、理解规则循环、试玩最小 Demo、发现设计乐趣。",
  openGraph: {
    title: "OVO - 游戏玩法分享与学习",
    description: "面向所有游戏爱好者的玩法分享站点：拆解经典机制、理解规则循环、试玩最小 Demo、发现设计乐趣。",
    type: "website",
    locale: "zh_CN",
    siteName: "OVO",
  },
  twitter: {
    card: "summary_large_image",
    title: "OVO - 游戏玩法分享与学习",
    description: "面向所有游戏爱好者的玩法分享站点：拆解经典机制、理解规则循环、试玩最小 Demo、发现设计乐趣。",
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
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/lxgw-wenkai-webfont@1.7.0/style.css"
        />
      </head>
      <body
        className={`${inter.variable} ${kalam.variable} bg-paper text-ink antialiased`}
      >
        <GoogleAnalytics gaId={gaId} />
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
