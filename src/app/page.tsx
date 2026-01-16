import { CategoryTabs } from "@/components/plays/CategoryTabs";
import { PlayCard } from "@/components/plays/PlayCard";
import { RightSidebar } from "@/components/plays/RightSidebar";
import { listPlays, playCategories, type PlayTag } from "@/lib/content/plays";
import Link from "next/link";
import { InteractiveHero } from "@/components/home/InteractiveHero";
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
    page?: string | string[];
    all?: string | string[];
  }>;
}) {
  const sp = searchParams ? await searchParams : {};
  const q = normalizeQueryParam(sp.q)?.trim() ?? "";
  const catKey = normalizeQueryParam(sp.cat) ?? "for-you";
  const page = Math.max(1, Number.parseInt(normalizeQueryParam(sp.page) ?? "1", 10) || 1);
  const showAll = normalizeQueryParam(sp.all) === "1";
  const pageSize = 12;

  const plays = await listPlays();

  const selectedTags =
    catKey === "for-you"
      ? null
      : playCategories.find((c) => c.key === catKey)?.filterTags ?? null;

  const filtered = plays.filter((p) => {
    if (
      selectedTags &&
      !selectedTags.some((t) => p.tags.includes(t as PlayTag))
    ) {
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
        ...(catKey === "for-you" ? {} : { cat: catKey }),
        ...(showAll ? { all: "1" } : {}),
        ...(nextPage <= 1 ? {} : { page: String(nextPage) }),
      },
    };
  }

  const isDefaultLanding = !showAll && catKey === "for-you" && !q;
  const featured = plays.slice(0, 8);
  const heroPlay = featured[0] ?? plays[0];
  const canEdit = await isModerator();

  if (isDefaultLanding) {
    return (
      <main className="mx-auto w-full max-w-6xl px-3 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-4 min-[360px]:px-4">
        {heroPlay && (
          <InteractiveHero playSlug={heroPlay.slug} playTitle={heroPlay.title} showEditorCta={canEdit} />
        )}

        <section id="featured-plays" className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">精选玩法</p>
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">上手最快的 8 个 Demo</h2>
            </div>
            <Link
              href={{ pathname: "/", query: { all: "1" } }}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
            >
              查看全部玩法
            </Link>
          </div>

          <div className="columns-1 gap-4 min-[420px]:columns-2 lg:columns-2 2xl:columns-3">
            {featured.map((p) => (
              <PlayCard key={p.slug} play={p} />
            ))}
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-3 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-4 min-[360px]:px-4">
      <CategoryTabs selectedKey={catKey} q={q || undefined} />

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px] lg:items-start">
        <section className="columns-1 gap-4 min-[420px]:columns-2 lg:columns-2 2xl:columns-3">
          {pageItems.length > 0 ? (
            pageItems.map((p) => <PlayCard key={p.slug} play={p} />)
          ) : (
            <div className="mb-4 break-inside-avoid rounded-2xl border border-zinc-200 bg-white p-5 text-sm text-zinc-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
              暂无匹配结果{q ? `：${q}` : ""}
            </div>
          )}
        </section>

        <RightSidebar plays={plays} />
      </div>

      {total > 0 ? (
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-zinc-500 dark:text-zinc-400">
            第 {currentPage} / {totalPages} 页 · 共 {total} 条
          </div>
          <div className="grid grid-cols-2 gap-3 sm:flex sm:gap-2">
            {currentPage > 1 ? (
              <Link
                href={pageHref(currentPage - 1)}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 min-[360px]:px-4 dark:border-white/10 dark:bg-white/5 dark:text-zinc-50 dark:hover:bg-white/10"
              >
                上一页
              </Link>
            ) : (
              <span className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-400 opacity-60 min-[360px]:px-4 dark:border-white/10 dark:bg-white/5 dark:text-white/40">
                上一页
              </span>
            )}
            {currentPage < totalPages ? (
              <Link
                href={pageHref(currentPage + 1)}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 min-[360px]:px-4 dark:border-white/10 dark:bg-white/5 dark:text-zinc-50 dark:hover:bg-white/10"
              >
                下一页
              </Link>
            ) : (
              <span className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-400 opacity-60 min-[360px]:px-4 dark:border-white/10 dark:bg-white/5 dark:text-white/40">
                下一页
              </span>
            )}
          </div>
        </div>
      ) : null}
    </main>
  );
}
