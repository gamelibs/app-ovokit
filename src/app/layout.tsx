import type { Metadata, Viewport } from "next";
import { inter, kalam } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "OVOKIT - 游戏玩法技术分享",
  description: "结构化拆解游戏玩法 + 技术实现 + 可试玩 Demo",
  openGraph: {
    title: "OVOKIT - 游戏玩法技术分享",
    description: "结构化拆解游戏玩法 + 技术实现 + 可试玩 Demo",
    type: "website",
    locale: "zh_CN",
    siteName: "OVOKIT",
  },
  twitter: {
    card: "summary_large_image",
    title: "OVOKIT - 游戏玩法技术分享",
    description: "结构化拆解游戏玩法 + 技术实现 + 可试玩 Demo",
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
  return (
    <html lang="zh-CN">
      <body
        className={`${inter.variable} ${kalam.variable} bg-paper text-ink antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
