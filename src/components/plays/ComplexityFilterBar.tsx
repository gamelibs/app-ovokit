import { Link } from "@/i18n/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import {
  complexityTiers,
  type ComplexityTierKey,
  type PlayBrowseGroupKey,
} from "@/lib/content/plays";
import { localizeDifficulty } from "@/lib/content/play-tags";
import { ComplexityFilterBarShell } from "./ComplexityLegendToggle";

function chipClass(active: boolean) {
  if (active) {
    return "font-kalam inline-flex h-7 flex-none items-center justify-center rounded-full bg-highlight-yellow px-2.5 text-xs font-semibold text-ink";
  }
  return "font-kalam inline-flex h-7 flex-none items-center justify-center rounded-full px-2.5 text-xs font-medium text-ink-light hover:bg-ink/5 hover:text-ink";
}

/**
 * 实现复杂度横切筛选条（与浏览组正交，叠加生效）。
 * 视觉层级：次级小控件（小字标签 + 小号 pill），不与 BrowseGroupTabs / CategoryTabs 争层级。
 * chips 为服务端渲染链接（切换 tier 保留 group/cat/q）；外壳 ComplexityFilterBarShell
 * 为客户端组件，承载「级别定义」开关的展开状态（RSC 组合：chips 以 children 传入）。
 */
export async function ComplexityFilterBar({
  group,
  cat,
  q,
  tier,
}: {
  group: PlayBrowseGroupKey;
  cat: string;
  q?: string;
  tier: ComplexityTierKey | null;
}) {
  const locale = await getLocale();
  const t = await getTranslations("browseGroups");

  const hrefFor = (nextTier: ComplexityTierKey | null) => ({
    pathname: "/" as const,
    query: {
      ...(q ? { q } : {}),
      group,
      ...(cat === "for-you" ? {} : { cat }),
      all: "1",
      ...(nextTier ? { tier: nextTier } : {}),
    },
  });

  return (
    <ComplexityFilterBarShell>
      <span className="flex-none whitespace-nowrap text-xs text-ink-muted">
        {t("difficulty")}
      </span>
      <Link href={hrefFor(null)} className={chipClass(!tier)} aria-current={!tier ? "page" : undefined}>
        <span className="whitespace-nowrap">{t("all")}</span>
      </Link>
      {complexityTiers.map((c) => (
        <Link
          key={c.key}
          href={hrefFor(c.key)}
          className={chipClass(tier === c.key)}
          aria-current={tier === c.key ? "page" : undefined}
        >
          <span className="whitespace-nowrap">{localizeDifficulty(c.label, locale)}</span>
        </Link>
      ))}
    </ComplexityFilterBarShell>
  );
}
