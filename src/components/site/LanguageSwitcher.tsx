"use client";

import { Suspense } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

const LOCALE_LABELS: Record<string, string> = {
  "zh-CN": "中",
  en: "EN",
  ja: "日",
  ko: "한",
  es: "ES",
  pt: "PT",
};

const LOCALE_NAMES: Record<string, string> = {
  "zh-CN": "中文",
  en: "English",
  ja: "日本語",
  ko: "한국어",
  es: "Español",
  pt: "Português",
};

function LanguageSwitcherInner() {
  const t = useTranslations("langSwitch");
  const locale = useLocale();
  const router = useRouter();
  // next-intl 的 usePathname 返回不含 locale 前缀的路径，Link 换 locale 时保持当前路径
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const qs = searchParams.toString();
  const href = qs ? `${pathname}?${qs}` : pathname;

  return (
    <>
      {/* 桌面/宽屏：行内语言链接（sm 及以上） */}
      <div
        className="hidden items-center gap-0.5 font-kalam text-sm font-semibold sm:flex"
        aria-label={t("label")}
      >
        {routing.locales.map((l, idx) => (
          <span key={l} className="flex items-center gap-0.5">
            {idx > 0 ? <span className="text-ink-muted">/</span> : null}
            <Link
              href={href}
              locale={l}
              aria-current={locale === l ? "true" : undefined}
              className={`inline-flex h-9 items-center justify-center rounded-xl px-1.5 transition ${
                locale === l
                  ? "text-ink underline decoration-2 underline-offset-4"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              {LOCALE_LABELS[l] ?? l}
            </Link>
          </span>
        ))}
      </div>

      {/* 移动端/窄屏：下拉选择（不占顶栏宽度） */}
      <div className="flex items-center sm:hidden">
        <select
          value={locale}
          onChange={(e) => {
            router.replace(href, { locale: e.target.value as (typeof routing.locales)[number] });
          }}
          aria-label={t("label")}
          className="h-11 max-w-[7.5rem] cursor-pointer appearance-none rounded-lg bg-transparent px-1 font-kalam text-sm font-semibold text-ink outline-none transition hover:bg-ink/5"
        >
          {routing.locales.map((l) => (
            <option key={l} value={l}>
              {LOCALE_NAMES[l] ?? l}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}

export function LanguageSwitcher() {
  return (
    <Suspense fallback={null}>
      <LanguageSwitcherInner />
    </Suspense>
  );
}
