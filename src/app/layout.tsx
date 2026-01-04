import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SiteFrame } from "@/components/site/SiteFrame";

export const metadata: Metadata = {
  title: "OVOKIT - 游戏玩法技术分享",
  description: "结构化拆解游戏玩法 + 技术实现 + 可试玩 Demo（MVP）",
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
      <body className="antialiased">
        <SiteFrame>{children}</SiteFrame>
      </body>
    </html>
  );
}
