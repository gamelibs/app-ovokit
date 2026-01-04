import Link from "next/link";
import { isModerator } from "@/lib/mod/auth";
import { listPlaySlugs, readPlayMeta } from "@/lib/content/plays";
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
  searchParams?: Promise<{ sort?: string | string[]; dir?: string | string[] }>;
}) {
  const ok = await isModerator();
  if (!ok) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-6">
        <h1 className="text-xl font-semibold">内容管理</h1>
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">
          你还没有进入版主模式。请点击右上角菜单，使用口令登录后再访问。
        </p>
      </main>
    );
  }

  const sp = searchParams ? await searchParams : {};
  const sort = (normalizeQueryParam(sp.sort) as SortKey | undefined) ?? "created";
  const dir = (normalizeQueryParam(sp.dir) as SortDir | undefined) ?? "desc";

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

  function sortHref(key: SortKey) {
    const nextDir = sort === key ? toggleDir(dir) : "desc";
    return { pathname: "/mod", query: { sort: key, dir: nextDir } };
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold">内容管理</h1>
        <Link
          href="/mod/new"
          className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white sm:h-10 sm:w-auto"
        >
          新建玩法
        </Link>
      </div>

      <div className="mt-4 sm:hidden">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Link
            href={sortHref("created")}
            className="whitespace-nowrap rounded-full bg-white px-3 py-1 text-xs font-semibold text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-50 dark:bg-white/5 dark:text-zinc-200 dark:ring-white/10 dark:hover:bg-white/10"
          >
            发布时间
            {sortIndicator(sort, dir, "created")
              ? ` ${sortIndicator(sort, dir, "created")}`
              : ""}
          </Link>
          <Link
            href={sortHref("views")}
            className="whitespace-nowrap rounded-full bg-white px-3 py-1 text-xs font-semibold text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-50 dark:bg-white/5 dark:text-zinc-200 dark:ring-white/10 dark:hover:bg-white/10"
          >
            浏览
            {sortIndicator(sort, dir, "views") ? ` ${sortIndicator(sort, dir, "views")}` : ""}
          </Link>
          <Link
            href={sortHref("likes")}
            className="whitespace-nowrap rounded-full bg-white px-3 py-1 text-xs font-semibold text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-50 dark:bg-white/5 dark:text-zinc-200 dark:ring-white/10 dark:hover:bg-white/10"
          >
            喜欢
            {sortIndicator(sort, dir, "likes") ? ` ${sortIndicator(sort, dir, "likes")}` : ""}
          </Link>
        </div>

        <div className="space-y-3">
          {sorted.map(({ meta: p, createdAt }) => (
            <div
              key={p.slug}
              className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5"
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{p.title}</div>
                <div className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                  /play/{p.slug}
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-zinc-700 dark:text-zinc-200">
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                    发布时间
                  </div>
                  <div className="truncate font-semibold">
                    {createdAt ? formatDateTime(createdAt) : "-"}
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                    浏览 / 喜欢
                  </div>
                  <div className="truncate font-semibold">
                    {p.stats.views} / {p.stats.likes}
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-3 text-sm">
                <Link
                  href={`/mod/edit/${p.slug}`}
                  className="font-semibold text-blue-600 hover:underline dark:text-blue-300"
                >
                  编辑
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 hidden overflow-hidden rounded-2xl border border-zinc-200 bg-white sm:block dark:border-white/10 dark:bg-white/5">
        <div className="grid grid-cols-[1fr_160px_120px_120px] gap-3 border-b border-zinc-200 px-4 py-3 text-xs font-semibold text-zinc-500 dark:border-white/10 dark:text-zinc-400">
          <div>玩法</div>
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
        </div>
        <div className="divide-y divide-zinc-200 dark:divide-white/10">
          {sorted.map(({ meta: p, createdAt }) => (
            <div
              key={p.slug}
              className="grid grid-cols-[1fr_160px_120px_120px] items-center gap-3 px-4 py-3"
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{p.title}</div>
                <div className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                  /play/{p.slug}
                </div>
                <div className="mt-1 flex items-center gap-3 text-xs">
                  <Link
                    href={`/mod/edit/${p.slug}`}
                    className="font-semibold text-blue-600 hover:underline dark:text-blue-300"
                  >
                    编辑
                  </Link>
                </div>
              </div>
              <div className="text-right text-sm text-zinc-700 dark:text-zinc-200">
                {createdAt ? formatDateTime(createdAt) : "-"}
              </div>
              <div className="text-right text-sm text-zinc-700 dark:text-zinc-200">
                {p.stats.views}
              </div>
              <div className="text-right text-sm text-zinc-700 dark:text-zinc-200">
                {p.stats.likes}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

