import { defineRouting } from "next-intl/routing";

/**
 * 全站语言路由定义（M1：zh-CN 默认 + en）。
 * - zh-CN 为默认语言，URL 无前缀（/play/...）
 * - en 使用 /en 前缀
 * - 后续接入 ja/ko 时：在 locales 追加、补 messages/{locale}.json、
 *   并在内容读取层（src/lib/content/plays.ts）映射对应内容目录即可。
 */
export const routing = defineRouting({
  locales: ["zh-CN", "en"],
  defaultLocale: "zh-CN",
  localePrefix: "as-needed",
  // 不按 IP/Accept-Language/Cookie 自动跳转（Google 不建议强跳）：
  // 无前缀 URL 恒为默认语言，语言切换完全交给用户（顶部语言切换器）。
  localeDetection: false,
});

export type SiteLocale = (typeof routing.locales)[number];
