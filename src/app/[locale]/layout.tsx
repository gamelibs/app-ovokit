import type { Metadata, Viewport } from "next";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { inter, kalam, notoSerif } from "@/lib/fonts";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import { getSiteOrigin, siteConfig } from "@/lib/site/config";
import { routing } from "@/i18n/routing";
import "../globals.css";

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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    metadataBase: new URL(getSiteOrigin()),
    title: metaTitle,
    description: metaDescription,
    keywords: metaKeywords,
    alternates: {
      // 默认 hreflang：首页双语互链；内页应在各自 page 的 metadata 里
      // 用页面级 languages 覆盖（如 play 详情页），避免指向错误 URL。
      languages: {
        "zh-CN": "/",
        en: "/en",
        "x-default": "/",
      },
    },
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      type: "website",
      locale: locale === "en" ? "en_US" : "zh_CN",
      siteName: siteConfig.name,
    },
    twitter: {
      card: "summary_large_image",
      title: metaTitle,
      description: metaDescription,
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${inter.variable} ${kalam.variable} ${notoSerif.variable} bg-paper text-ink antialiased`}
      >
        <GoogleAnalytics gaId={gaId} />
        {/* NextIntlClientProvider 在服务端组件中自动继承 getRequestConfig 的
            locale/messages，供客户端组件 useTranslations 使用 */}
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
