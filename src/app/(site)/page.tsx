import { BrowseGroupTabs } from "@/components/plays/BrowseGroupTabs";
import { CategoryTabs } from "@/components/plays/CategoryTabs";
import { PlayCard } from "@/components/plays/PlayCard";
import { RightSidebar } from "@/components/plays/RightSidebar";
import { getPlayCategory, listPlays, resolvePlayBrowseState, type PlayBrowseGroupKey, type PlayTag } from "@/lib/content/plays";
import Link from "next/link";
import { HandDrawnHero } from "@/components/home/HandDrawnHero";
import { HotPlaysSection } from "@/components/home/HotPlaysSection";
import { ArchetypeQuickNav } from "@/components/home/ArchetypeQuickNav";
import { PatternQuickNav } from "@/components/home/PatternQuickNav";
import { FeatureQuickNav } from "@/components/home/FeatureQuickNav";
import { PlayListItem } from "@/components/home/PlayListItem";
import { DevToolsPanel } from "@/components/home/DevToolsPanel";
import { isModerator } from "@/lib/mod/auth";

function normalizeQueryParam(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<{
    q?: string | string[];
    cat?: string | string[];
    group?: string | string[];
    page?: string | string[];
    all?: string | string[];
  }>;
}) {
  const sp = searchParams ? await searchParams : {};
  const q = normalizeQueryParam(sp.q)?.trim() ?? "";
  const rawCatKey = normalizeQueryParam(sp.cat);
  const rawGroupKey = normalizeQueryParam(sp.group);
  const page = Math.max(1, Number.parseInt(normalizeQueryParam(sp.page) ?? "1", 10) || 1);
  const showAll = normalizeQueryParam(sp.all) === "1";
  const pageSize = 12;

  const plays = await listPlays();

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

  const filtered = plays.filter((p) => {
    if (selectedPattern && p.pattern !== selectedPattern) {
      return false;
    }
    if (selectedTags && !selectedTags.some((t) => p.tags.includes(t as PlayTag))) {
      return false;
    }
    if (selectedDifficulty && p.difficulty !== selectedDifficulty) {
      return false;
    }
    if (!q) return true;
    const haystack = [
      p.title,
      p.subtitle,
      p.tags.join(" "),
      p.techStack.join(" "),
      p.corePoints.join(" "),
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q.toLowerCase());
  });

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
  const heroPlay =
    plays.find((p) => p.slug === "match-3-retention-and-pacing") ??
    featured[0] ??
    plays[0];
  const canEdit = await isModerator();

  if (isDefaultLanding) {
    return (
      <main className="mx-auto w-full max-w-6xl px-3 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-4 min-[360px]:px-4">
        <HandDrawnHero />
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
                <p className="font-kalam text-xs font-semibold uppercase tracking-wide text-highlight-blue">精选玩法</p>
                <h2 className="font-kalam text-xl font-semibold text-ink">更多玩法技术拆解</h2>
              </div>
              <Link
                href={{ pathname: "/", query: { all: "1", group: "archetype" } }}
                className="sketch-button sketch-button-secondary"
              >
                查看全部
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

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px] lg:items-start">
        <section className="grid grid-cols-2 gap-4 2xl:grid-cols-3">
          {pageItems.length > 0 ? (
            pageItems.map((p) => <PlayCard key={p.slug} play={p} />)
          ) : (
            <div className="mb-4 break-inside-avoid sketch-card p-5 text-sm text-ink-light">
              暂无匹配结果{q ? `：${q}` : ""}
            </div>
          )}
        </section>

        <RightSidebar plays={plays} />
      </div>

      {total > 0 ? (
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-ink-muted">
            第 {currentPage} / {totalPages} 页 · 共 {total} 条
          </div>
          <div className="grid grid-cols-2 gap-3 sm:flex sm:gap-2">
            {currentPage > 1 ? (
              <Link
                href={pageHref(currentPage - 1)}
                className="sketch-button sketch-button-secondary min-[360px]:px-4"
              >
                上一页
              </Link>
            ) : (
              <span className="sketch-button sketch-button-secondary opacity-60 min-[360px]:px-4">
                上一页
              </span>
            )}
            {currentPage < totalPages ? (
              <Link
                href={pageHref(currentPage + 1)}
                className="sketch-button sketch-button-secondary min-[360px]:px-4"
              >
                下一页
              </Link>
            ) : (
              <span className="sketch-button sketch-button-secondary opacity-60 min-[360px]:px-4">
                下一页
              </span>
            )}
          </div>
        </div>
      ) : null}
    </main>
  );
}
