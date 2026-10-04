import { defineRouting } from "next-intl/routing";

/**
 * 全站语言路由定义（zh-CN 默认 + en/ja/ko/es/pt）。
 * - zh-CN 为默认语言，URL 无前缀（/play/...）；其余语言 /en /ja /ko /es /pt 前缀
 * - localeDetection: true：首访按浏览器 Accept-Language 302 跳到匹配语言前缀并写
 *   localeCookie 记住；之后访问与用户手动切换都以 Cookie 为准（不违背用户选择）。
 *   hreflang 已按语言互链，Google 可正常收录各语言版本。
 * - 新增语言时：locales 追加、补 messages/{locale}.json、内容目录 content/*-{locale}
 *   （缺失自动回退 en → zh-CN，页面标「暂未翻译」）。
 */
export const routing = defineRouting({
  locales: ["zh-CN", "en", "ja", "ko", "es", "pt"],
  defaultLocale: "zh-CN",
  localePrefix: "as-needed",
  localeDetection: true,
  // 语言记忆持久化（默认会话级 Cookie 关浏览器即失效，不符合“记住用户选择”）
  localeCookie: { maxAge: 60 * 60 * 24 * 365 },
});

export type SiteLocale = (typeof routing.locales)[number];
