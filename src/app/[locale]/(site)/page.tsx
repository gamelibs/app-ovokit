import { BrowseGroupTabs } from "@/components/plays/BrowseGroupTabs";
import { CategoryTabs } from "@/components/plays/CategoryTabs";
import { PlayCard } from "@/components/plays/PlayCard";
import { RightSidebar } from "@/components/plays/RightSidebar";
import { getPlayCategory, listPlays, listPlaySearchIndex, resolvePlayBrowseState, type ContentLocale, type PlayBrowseGroupKey, type PlayTag } from "@/lib/content/plays";
import { filterPlaysBySearchResults, POPULAR_SEARCH_TERMS, searchPlayDocs, sortPlaysBySearchResults } from "@/lib/search/match";
import { HandDrawnHero } from "@/components/home/HandDrawnHero";
import { HotPlaysSection } from "@/components/home/HotPlaysSection";
import { LatestPlaysSection } from "@/components/home/LatestPlaysSection";
import { ArchetypeQuickNav } from "@/components/home/ArchetypeQuickNav";
import { PatternQuickNav } from "@/components/home/PatternQuickNav";
import { FeatureQuickNav } from "@/components/home/FeatureQuickNav";
import { PlayListItem } from "@/components/home/PlayListItem";
import { DevToolsPanel } from "@/components/home/DevToolsPanel";
import { isModerator } from "@/lib/mod/auth";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import type { Metadata } from "next";

// 首页自引用 canonical + 双语 hreflang；内页如需 canonical 应在各自 page 中显式声明，
// 不放在根 layout 的 canonical（否则全站页面都会指向首页，反而伤害收录）
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    alternates: {
      canonical: locale === "en" ? "/en" : "/",
      languages: {
        "zh-CN": "/",
        en: "/en",
        "x-default": "/",
      },
    },
  };
}

function normalizeQueryParam(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

export default async function Home({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{
    q?: string | string[];
    cat?: string | string[];
    group?: string | string[];
    page?: string | string[];
    all?: string | string[];
  }>;
}) {
  const { locale: rawLocale } = await params;
  if (!hasLocale(routing.locales, rawLocale)) {
    // [locale]/layout.tsx 已拦截非法 locale，这里仅为类型收窄
    throw new Error(`Unknown locale: ${rawLocale}`);
  }
  const locale: ContentLocale = rawLocale;
  setRequestLocale(locale);
  const t = await getTranslations("home");

  const sp = searchParams ? await searchParams : {};
  const q = normalizeQueryParam(sp.q)?.trim() ?? "";
  const rawCatKey = normalizeQueryParam(sp.cat);
  const rawGroupKey = normalizeQueryParam(sp.group);
  const page = Math.max(1, Number.parseInt(normalizeQueryParam(sp.page) ?? "1", 10) || 1);
  const showAll = normalizeQueryParam(sp.all) === "1";
  const pageSize = 12;

  const [plays, searchDocs] = await Promise.all([
    listPlays(locale),
    q ? listPlaySearchIndex(locale) : Promise.resolve(null),
  ]);

  const isDefaultLanding =
    !showAll && !rawGroupKey && (!rawCatKey || rawCatKey === "for-you") && !q;

  const browseState = resolvePlayBrowseState({
    group: rawGroupKey ?? undefined,
    cat: rawCatKey ?? undefined,
  });
  const browseGroup: PlayBrowseGroupKey = browseState.group;
  const catKey = browseState.cat;
  const selectedCategory = getPlayCategory(browseGroup, catKey);
  const selectedTags = selectedCategory?.filterTags ?? null;
  const selectedDifficulty = selectedCategory?.filterDifficulty ?? null;
  const selectedPattern = selectedCategory?.filterPattern ?? null;

  let filtered = plays.filter((p) => {
    if (selectedPattern && p.pattern !== selectedPattern) {
      return false;
    }
    if (selectedTags && !selectedTags.some((t) => p.tags.includes(t as PlayTag))) {
      return false;
    }
    if (selectedDifficulty && p.difficulty !== selectedDifficulty) {
      return false;
    }
    return true;
  });

  if (q && searchDocs) {
    const results = searchPlayDocs(searchDocs, q);
    filtered = sortPlaysBySearchResults(
      filterPlaysBySearchResults(filtered, results),
      results,
    );
  }

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const pageItems = filtered.slice(start, start + pageSize);

  function pageHref(nextPage: number) {
    return {
      pathname: "/",
      query: {
        ...(q ? { q } : {}),
        ...(browseGroup ? { group: browseGroup } : {}),
        ...(catKey === "for-you" ? {} : { cat: catKey }),
        all: "1",
        ...(nextPage <= 1 ? {} : { page: String(nextPage) }),
      },
    };
  }

  const featured = plays.slice(0, 8);
  const canEdit = await isModerator();
  const tb = await getTranslations("browseGroups");

  if (isDefaultLanding) {
    return (
      <main className="mx-auto w-full max-w-6xl px-3 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-4 min-[360px]:px-4">
        <HandDrawnHero />
        <LatestPlaysSection />
        <HotPlaysSection />
        <ArchetypeQuickNav />
        <PatternQuickNav />
        <FeatureQuickNav />

        <div className="sketch-divider-wavy mt-8" />

        {/* 更多玩法 + 开发者工具箱 */}
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-kalam text-xs font-semibold uppercase tracking-wide text-highlight-blue">{t("moreKicker")}</p>
                <h2 className="font-kalam text-xl font-semibold text-ink">{t("moreTitle")}</h2>
              </div>
              <Link
                href={{ pathname: "/", query: { all: "1", group: "archetype" } }}
                className="sketch-button sketch-button-secondary"
              >
                {t("viewAll")}
              </Link>
            </div>
            <div className="sketch-card p-3">
              <div className="divide-y divide-ink-light/10">
                {featured.slice(0, 6).map((p) => (
                  <PlayListItem key={p.slug} play={p} />
                ))}
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            {canEdit ? <DevToolsPanel /> : null}
          </aside>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-3 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-4 min-[360px]:px-4">
      <BrowseGroupTabs selectedGroup={browseGroup} q={q || undefined} />
      <CategoryTabs group={browseGroup} selectedKey={catKey} q={q || undefined} showAll />

      {/* 实现复杂度组：三级锚点定义说明卡（读者可查判定标准） */}
      {browseGroup === "difficulty" ? (
        <div className="mt-3 sketch-border bg-paper-warm/60 p-3">
          <div className="font-kalam text-xs font-semibold text-ink-muted">{tb("complexityLegendTitle")}</div>
          <ul className="mt-2 space-y-1 text-sm leading-relaxed text-ink-light">
            <li>· {tb("complexityBeginner")}</li>
            <li>· {tb("complexityAdvanced")}</li>
            <li>· {tb("complexityHardcore")}</li>
          </ul>
        </div>
      ) : null}

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px] lg:items-start">
        <section className="grid grid-cols-2 gap-4 2xl:grid-cols-3">
          {pageItems.length > 0 ? (
            pageItems.map((p) => <PlayCard key={p.slug} play={p} highlightQuery={q} />)
          ) : (
            <div className="col-span-full">
              <div className="sketch-card p-5 text-sm text-ink-light">
                <p className="font-kalam text-base font-semibold text-ink">
                  {t("noResults")}{q ? `：${q}` : ""}
                </p>
                {q ? (
                  <>
                    <p className="mt-2">{t("tryPopular")}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {POPULAR_SEARCH_TERMS.slice(0, 8).map((term) => (
                        <Link
                          key={term}
                          href={{ pathname: "/", query: { q: term, all: "1" } }}
                          className="inline-flex rounded-full bg-paper-warm px-3 py-1 text-xs font-medium text-ink hover:bg-highlight-yellow/60"
                        >
                          {term}
                        </Link>
                      ))}
                    </div>
                    <p className="mt-4 text-ink-muted">{t("orBrowseLatest")}</p>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      {plays.slice(0, 4).map((p) => (
                        <Link
                          key={p.slug}
                          href={`/play/${p.slug}`}
                          className="rounded-lg bg-paper-warm px-3 py-2 text-xs text-ink hover:bg-highlight-yellow/40"
                        >
                          {p.title}
                        </Link>
                      ))}
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          )}
        </section>

        <RightSidebar plays={plays} />
      </div>

      {total > 0 ? (
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-ink-muted">
            {t("pageInfo", { current: currentPage, total: totalPages, count: total })}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:flex sm:gap-2">
            {currentPage > 1 ? (
              <Link
                href={pageHref(currentPage - 1)}
                className="sketch-button sketch-button-secondary min-[360px]:px-4"
              >
                {t("prevPage")}
              </Link>
            ) : (
              <span className="sketch-button sketch-button-secondary opacity-60 min-[360px]:px-4">
                {t("prevPage")}
              </span>
            )}
            {currentPage < totalPages ? (
              <Link
                href={pageHref(currentPage + 1)}
                className="sketch-button sketch-button-secondary min-[360px]:px-4"
              >
                {t("nextPage")}
              </Link>
            ) : (
              <span className="sketch-button sketch-button-secondary opacity-60 min-[360px]:px-4">
                {t("nextPage")}
              </span>
            )}
          </div>
        </div>
      ) : null}
    </main>
  );
}
