import Link from "next/link";
import { isModerator } from "@/lib/mod/auth";
import { listPlays } from "@/lib/content/plays";

export default async function ModHomePage() {
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

  const plays = await listPlays();

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

      <div className="mt-4 space-y-3 sm:hidden">
        {plays.map((p) => (
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
            <div className="mt-3 flex items-center justify-between gap-4 text-sm text-zinc-700 dark:text-zinc-200">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  浏览
                </span>
                <span className="font-semibold">{p.stats.views}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  喜欢
                </span>
                <span className="font-semibold">{p.stats.likes}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 hidden overflow-hidden rounded-2xl border border-zinc-200 bg-white sm:block dark:border-white/10 dark:bg-white/5">
        <div className="grid grid-cols-[1fr_120px_120px] gap-3 border-b border-zinc-200 px-4 py-3 text-xs font-semibold text-zinc-500 dark:border-white/10 dark:text-zinc-400">
          <div>玩法</div>
          <div className="text-right">浏览</div>
          <div className="text-right">喜欢</div>
        </div>
        <div className="divide-y divide-zinc-200 dark:divide-white/10">
          {plays.map((p) => (
            <div
              key={p.slug}
              className="grid grid-cols-[1fr_120px_120px] items-center gap-3 px-4 py-3"
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{p.title}</div>
                <div className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                  /play/{p.slug}
                </div>
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
