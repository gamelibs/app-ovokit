import Link from "next/link";
import type { PlayMeta } from "@/lib/content/plays";
import { TagPill } from "./TagPill";

const hotTags = [
  "战斗系统",
  "合成玩法",
  "塔防",
  "放置游戏",
  "随机玩法",
  "随机与生成",
  "弱化与成长",
  "网格系统",
];

function formatCompactNumber(n: number) {
  if (n >= 10000) return `${(n / 10000).toFixed(1).replace(/\.0$/, "")}w`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(n);
}

export function RightSidebar({ plays }: { plays: PlayMeta[] }) {
  return (
    <aside className="hidden lg:block">
      <div className="space-y-4">
        <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            热门标签
          </h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {hotTags.map((t) => (
              <TagPill key={t}>{t}</TagPill>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            新手必读
          </h3>
          <div className="mt-3 space-y-3">
            {plays.slice(0, 3).map((p) => (
              <Link
                key={p.slug}
                href={`/play/${p.slug}`}
                className="group flex gap-3 rounded-xl p-2 hover:bg-zinc-50 dark:hover:bg-white/10"
              >
                <div className="h-14 w-20 flex-none rounded-lg bg-gradient-to-br from-zinc-200 to-zinc-50 dark:from-white/10 dark:to-black" />
                <div className="min-w-0 flex-1">
                  <div className="line-clamp-2 text-sm font-medium text-zinc-900 group-hover:underline dark:text-zinc-50">
                    {p.title}
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                    <span className="inline-flex items-center gap-1">
                      <span className="inline-flex h-4 w-4 items-center justify-center rounded bg-zinc-100 text-[10px] dark:bg-white/10">
                        V
                      </span>
                      {formatCompactNumber(p.stats.views)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="inline-flex h-4 w-4 items-center justify-center rounded bg-zinc-100 text-[10px] dark:bg-white/10">
                        L
                      </span>
                      {formatCompactNumber(p.stats.likes)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </aside>
  );
}
