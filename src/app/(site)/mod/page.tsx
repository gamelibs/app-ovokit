import Link from "next/link";
import { isModerator } from "@/lib/mod/auth";
import { listPlaySlugs, readPlayMeta } from "@/lib/content/plays";
import { DeletePlayButton } from "@/components/mod/DeletePlayButton";
import { TogglePublishButton } from "@/components/mod/TogglePublishButton";
import { promises as fs } from "node:fs";
import path from "node:path";


export const dynamic = "force-dynamic";
export const revalidate = 0;

function playsRootDir() {
  return path.join(process.cwd(), "content", "plays");
}

function normalizeQueryParam(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

type SortKey = "created" | "views" | "likes";
type SortDir = "asc" | "desc";

function toggleDir(current: SortDir) {
  return current === "asc" ? "desc" : "asc";
}

function sortIndicator(sort: SortKey, dir: SortDir, key: SortKey) {
  if (sort !== key) return null;
  return dir === "asc" ? "↑" : "↓";
}

function formatDateTime(ms: number) {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

export default async function ModHomePage({
  searchParams,
}: {
  searchParams?: Promise<{
    sort?: string | string[];
    dir?: string | string[];
    page?: string | string[];
  }>;
}) {
  const ok = await isModerator();
  if (!ok) {
    return (
      <main className="mx-auto w-full max-w-3xl px-3 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-6 min-[360px]:px-4">
        <h1 className="text-xl font-semibold font-kalam">内容管理</h1>
        <p className="mt-3 text-sm text-ink-light">
          你还没有权限访问此页面。请登录后再试。
        </p>
      </main>
    );
  }

  const sp = searchParams ? await searchParams : {};
  const sort = (normalizeQueryParam(sp.sort) as SortKey | undefined) ?? "created";
  const dir = (normalizeQueryParam(sp.dir) as SortDir | undefined) ?? "desc";
  const page = Math.max(
    1,
    Number.parseInt(normalizeQueryParam(sp.page) ?? "1", 10) || 1,
  );
  const pageSize = 10;

  const slugs = await listPlaySlugs();
  const plays = await Promise.all(
    slugs.map(async (slug) => {
      const meta = await readPlayMeta(slug);
      if (!meta) return null;
      const metaPath = path.join(playsRootDir(), slug, "meta.json");
      const stat = await fs.stat(metaPath).catch(() => null);
      const createdAt = stat?.mtimeMs ?? 0;
      return { meta, createdAt };
    }),
  ).then((xs) => xs.filter((x): x is NonNullable<typeof x> => Boolean(x)));

  const sorted = [...plays].sort((a, b) => {
    const mul = dir === "asc" ? 1 : -1;
    if (sort === "views") return mul * (a.meta.stats.views - b.meta.stats.views);
    if (sort === "likes") return mul * (a.meta.stats.likes - b.meta.stats.likes);
    return mul * (a.createdAt - b.createdAt);
  });
  const idPad = Math.max(2, String(sorted.length).length);
  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const pageItems = sorted.slice(start, start + pageSize);

  function sortHref(key: SortKey) {
    const nextDir = sort === key ? toggleDir(dir) : "desc";
    return { pathname: "/mod", query: { sort: key, dir: nextDir, page: "1" } };
  }

  function pageHref(nextPage: number) {
    return {
      pathname: "/mod",
      query: {
        sort,
        dir,
        page: String(nextPage),
      },
    };
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-3 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-6 min-[360px]:px-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="min-w-0 truncate text-xl font-semibold font-kalam">内容管理</h1>
        <Link
          href="/mod/new"
          className="inline-flex h-10 shrink-0 items-center justify-center whitespace-nowrap rounded-xl bg-highlight-blue px-4 text-sm font-semibold text-ink hover:bg-highlight-blue/90 min-[360px]:min-w-[120px]"
        >
          新建玩法
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href="/mod/archetypes"
          className="inline-flex h-9 items-center justify-center rounded-xl sketch-border bg-paper px-3 text-sm font-semibold text-ink hover:bg-paper-warm"
        >
          母型玩法管理
        </Link>
        <Link
          href="/mod/patterns"
          className="inline-flex h-9 items-center justify-center rounded-xl sketch-border bg-paper px-3 text-sm font-semibold text-ink hover:bg-paper-warm"
        >
          核心玩法管理
        </Link>
        <Link
          href="/mod/features"
          className="inline-flex h-9 items-center justify-center rounded-xl sketch-border bg-paper px-3 text-sm font-semibold text-ink hover:bg-paper-warm"
        >
          玩法特征管理
        </Link>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl sketch-border bg-paper">
        {/* Desktop header */}
        <div className="hidden sm:grid sm:grid-cols-[56px_1fr_100px_120px_120px_120px_140px] sm:gap-3 sm:border-b sm:border-ink-light/20 sm:px-4 sm:py-3 sm:text-xs sm:font-semibold sm:text-ink-muted">
          <div>ID</div>
          <div>玩法</div>
          <div className="text-center">状态</div>
          <div className="text-right">
            <Link href={sortHref("created")} className="hover:underline">
              发布时间
              {sortIndicator(sort, dir, "created")
                ? ` ${sortIndicator(sort, dir, "created")}`
                : ""}
            </Link>
          </div>
          <div className="text-right">
            <Link href={sortHref("views")} className="hover:underline">
              浏览
              {sortIndicator(sort, dir, "views") ? ` ${sortIndicator(sort, dir, "views")}` : ""}
            </Link>
          </div>
          <div className="text-right">
            <Link href={sortHref("likes")} className="hover:underline">
              喜欢
              {sortIndicator(sort, dir, "likes") ? ` ${sortIndicator(sort, dir, "likes")}` : ""}
            </Link>
          </div>
          <div className="text-right">操作</div>
        </div>

        <div className="divide-y divide-ink-light/20">
          {/* Mobile header */}
          <div className="px-3 py-3 sm:hidden min-[360px]:px-4">
            <div className="grid grid-cols-[64px_1fr] items-center gap-3 text-xs font-semibold text-ink-muted font-kalam">
              <span>排序</span>
              <div className="grid grid-cols-3 gap-2 text-right">
                <Link href={sortHref("created")} className="hover:underline">
                  时间
                  {sortIndicator(sort, dir, "created")
                    ? ` ${sortIndicator(sort, dir, "created")}`
                    : ""}
                </Link>
                <Link href={sortHref("views")} className="hover:underline">
                  浏览
                  {sortIndicator(sort, dir, "views")
                    ? ` ${sortIndicator(sort, dir, "views")}`
                    : ""}
                </Link>
                <Link href={sortHref("likes")} className="hover:underline">
                  喜欢
                  {sortIndicator(sort, dir, "likes")
                    ? ` ${sortIndicator(sort, dir, "likes")}`
                    : ""}
                </Link>
              </div>
            </div>
          </div>
          {pageItems.map(({ meta: p, createdAt }, idx) => {
            const id = String(start + idx + 1).padStart(idPad, "0");
            return (
            <div key={p.slug}>
              <div className="px-3 py-3 sm:hidden min-[360px]:px-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="shrink-0 rounded-full bg-paper-warm px-2 py-0.5 text-xs font-semibold tabular-nums text-ink-light">
                        #{id}
                      </span>
                      <div className="min-w-0 truncate text-sm font-semibold">
                        {p.title}
                      </div>
                    </div>
                    <div className="mt-0.5 truncate text-xs text-ink-muted">
                      /play/{p.slug}
                    </div>
                    <div className="mt-1.5">
                      <TogglePublishButton slug={p.slug} published={p.published !== false} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/mod/edit/${p.slug}`}
                      className="shrink-0 rounded-full sketch-border bg-paper px-3 py-1 text-xs font-semibold hover:bg-paper-warm"
                    >
                      编辑
                    </Link>
                    <DeletePlayButton slug={p.slug} />
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-[64px_1fr] items-center gap-3 text-xs text-ink-light">
                  <span className="font-semibold text-ink-muted">
                    数据
                  </span>
                  <div className="grid grid-cols-3 gap-2 text-right tabular-nums">
                    <span className="truncate whitespace-nowrap">
                      {formatDateTime(createdAt)}
                    </span>
                    <span>{p.stats.views}</span>
                    <span>{p.stats.likes}</span>
                  </div>
                </div>
              </div>

              {/* Desktop table */}
              <div className="hidden sm:grid sm:grid-cols-[56px_1fr_100px_120px_120px_120px_140px] sm:items-center sm:gap-3 sm:px-4 sm:py-3">
                <div className="text-xs font-semibold tabular-nums text-ink-muted">
                  #{id}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{p.title}</div>
                  <div className="truncate text-xs text-ink-muted">
                    /play/{p.slug}
                  </div>
                </div>
                <div className="flex justify-center">
                  <TogglePublishButton slug={p.slug} published={p.published !== false} />
                </div>
                <div className="text-right text-sm text-ink-light">
                  {createdAt ? formatDateTime(createdAt) : "-"}
                </div>
                <div className="text-right text-sm text-ink-light">
                  {p.stats.views}
                </div>
                <div className="text-right text-sm text-ink-light">
                  {p.stats.likes}
                </div>
                <div className="flex items-center justify-end gap-2">
                  <Link
                    href={`/mod/edit/${p.slug}`}
                    className="inline-flex h-9 items-center justify-center rounded-full sketch-border bg-paper px-4 text-xs font-semibold hover:bg-paper-warm"
                  >
                    编辑
                  </Link>
                  <DeletePlayButton slug={p.slug} />
                </div>
              </div>
            </div>
            );
          })}
        </div>
      </div>

      {total > 0 ? (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-ink-muted">
            第 {currentPage} / {totalPages} 页 · 共 {total} 条
          </div>
          <div className="grid grid-cols-2 gap-3 sm:flex sm:gap-2">
            {currentPage > 1 ? (
              <Link
                href={pageHref(currentPage - 1)}
                className="inline-flex h-10 items-center justify-center rounded-xl sketch-border bg-paper px-3 text-sm font-semibold text-ink hover:bg-paper-warm min-[360px]:px-4"
              >
                上一页
              </Link>
            ) : (
              <span className="inline-flex h-10 items-center justify-center rounded-xl sketch-border bg-paper px-3 text-sm font-semibold text-ink-muted opacity-60 min-[360px]:px-4">
                上一页
              </span>
            )}
            {currentPage < totalPages ? (
              <Link
                href={pageHref(currentPage + 1)}
                className="inline-flex h-10 items-center justify-center rounded-xl sketch-border bg-paper px-3 text-sm font-semibold text-ink hover:bg-paper-warm min-[360px]:px-4"
              >
                下一页
              </Link>
            ) : (
              <span className="inline-flex h-10 items-center justify-center rounded-xl sketch-border bg-paper px-3 text-sm font-semibold text-ink-muted opacity-60 min-[360px]:px-4">
                下一页
              </span>
            )}
          </div>
        </div>
      ) : null}
    </main>
  );
}
