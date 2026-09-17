"use client";

import { Suspense } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

const LOCALE_LABELS: Record<string, string> = {
  "zh-CN": "中",
  en: "EN",
};

function LanguageSwitcherInner() {
  const t = useTranslations("langSwitch");
  const locale = useLocale();
  // next-intl 的 usePathname 返回不含 locale 前缀的路径，Link 换 locale 时保持当前路径
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const qs = searchParams.toString();
  const href = qs ? `${pathname}?${qs}` : pathname;

  return (
    <div
      className="flex items-center gap-0.5 font-kalam text-sm font-semibold"
      aria-label={t("label")}
    >
      {routing.locales.map((l, idx) => (
        <span key={l} className="flex items-center gap-0.5">
          {idx > 0 ? <span className="text-ink-muted">/</span> : null}
          <Link
            href={href}
            locale={l}
            aria-current={locale === l ? "true" : undefined}
            className={`inline-flex h-11 items-center justify-center rounded-xl px-1.5 transition sm:h-9 ${
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
  );
}

export function LanguageSwitcher() {
  return (
    <Suspense fallback={null}>
      <LanguageSwitcherInner />
    </Suspense>
  );
}
