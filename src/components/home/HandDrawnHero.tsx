"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function HandDrawnHero() {
  const t = useTranslations("home");
  const valuePoints = [
    t("heroPoint1"),
    t("heroPoint2"),
    t("heroPoint3"),
    t("heroPoint4"),
  ];

  return (
    <section className="relative overflow-hidden rounded-2xl sketch-border bg-paper/70 p-3 shadow-sm sm:rounded-3xl sm:p-6">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:gap-6">
        {/* 左侧文字 */}
        <div className="min-w-0 space-y-3 lg:space-y-5">
          <div className="relative">
            <h1 className="font-kalam text-xl font-bold leading-tight text-ink sm:text-3xl lg:text-4xl">
              {t("heroTitleA")}
              <span className="hidden lg:inline">
                <br />
                {t("heroTitleB")}
              </span>
              <span className="lg:hidden">{t("heroTitleMobileJoin")}{t("heroTitleB")}</span>
            </h1>
            {/* 标题下划线高亮 */}
            <div className="mt-1 h-1.5 w-32 sketch-divider sm:h-2 sm:w-48" />
          </div>

          <p className="hidden text-sm leading-relaxed text-ink-light lg:block">
            {t("heroSubtitle")}
          </p>

          <p className="text-xs leading-relaxed text-ink-light lg:hidden">
            {t("heroSubtitleMobile")}
          </p>

          <ul className="hidden space-y-2 lg:block">
            {valuePoints.map((text) => (
              <li key={text} className="flex items-start gap-2 text-sm text-ink-light">
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-highlight-yellow text-xs font-bold text-ink">
                  ✓
                </span>
                <span>{text}</span>
              </li>
            ))}
          </ul>

          <div className="hidden flex-wrap gap-3 lg:flex">
            <Link href="/patterns" className="sketch-button">
              {t("heroBrowse")}
            </Link>
            <Link
              href="/about"
              className="sketch-button sketch-button-secondary"
            >
              {t("heroLearnMore")}
            </Link>
          </div>
        </div>

        {/* 右侧手绘插图组合 */}
        <div className="relative hidden items-center justify-center lg:flex">
          <div className="relative w-full max-w-[360px]">
            {/* 流程图主体 */}
            <img
              src="/hero/flowchart.webp"
              alt=""
              className="w-full"
              loading="eager"
            />
            {/* 游戏手柄 - 左下 */}
            <img
              src="/hero/gamepad.webp"
              alt=""
              className="absolute -left-4 bottom-0 w-20 -rotate-12"
              loading="eager"
            />
            {/* 便签 - 右上 */}
            <img
              src="/hero/note.webp"
              alt=""
              className="absolute -right-2 -top-2 w-14 rotate-6"
              loading="eager"
            />
            {/* 太阳 - 右上远处 */}
            <img
              src="/hero/sun.webp"
              alt=""
              className="absolute -right-6 top-4 w-10"
              loading="eager"
            />
            {/* 问号 - 右下 */}
            <img
              src="/hero/question-mark.webp"
              alt=""
              className="absolute -right-4 bottom-8 w-10 rotate-12"
              loading="eager"
            />
            {/* 星星装饰 */}
            <img
              src="/hero/sparkle.webp"
              alt=""
              className="absolute left-1/2 top-0 w-8 -translate-x-1/2"
              loading="eager"
            />
            {/* 硬币 - 底部 */}
            <img
              src="/hero/coin.webp"
              alt=""
              className="absolute bottom-0 left-1/3 w-10 -rotate-6"
              loading="eager"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
