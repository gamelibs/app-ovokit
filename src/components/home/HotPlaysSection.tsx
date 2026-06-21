import Link from "next/link";
import { listPlays } from "@/lib/content/plays";

export async function HotPlaysSection() {
  const plays = await listPlays();
  // 首页「热门玩法」由「热门」标签控制，避免按浏览量排序导致重复/不可控
  const topPlays = plays
    .filter((p) => p.tags.includes("热门"))
    .slice(0, 5);

  if (topPlays.length === 0) return null;

  return (
    <section id="featured-plays" className="mt-8 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-kalam text-xl font-semibold text-ink">热门玩法</h2>
        <Link
          href={{ pathname: "/", query: { all: "1", group: "archetype" } }}
          className="font-kalam text-sm font-semibold text-ink-light hover:text-ink hover:underline"
        >
          查看全部 →
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 min-[480px]:grid-cols-3 lg:grid-cols-5">
        {topPlays.map((play, idx) => (
          <Link
            key={play.slug}
            href={`/play/${play.slug}`}
            className={`sketch-card sketch-rotate-${idx % 2 === 0 ? "left" : "right"} block overflow-hidden transition hover:scale-[1.02]`}
          >
            {/* 封面：完整展示，不截断，四周留呼吸边距 */}
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-paper-warm">
              <img
                src={play.cover?.src ?? "/plays/_placeholders/cover.svg"}
                alt={play.title}
                className="h-full w-full object-contain p-4"
                loading="lazy"
              />
            </div>
            {/* 信息 */}
            <div className="p-3 pt-2">
              <h3 className="font-kalam text-sm font-semibold text-ink">
                {play.title}
              </h3>
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="sketch-pill sketch-pill-neutral text-[10px]">
                  {play.tags[0] ?? "玩法"}
                </span>
                <span className="flex items-center gap-0.5 text-xs text-ink-muted">
                  <span>👁</span>
                  <span>
                    {play.stats.views >= 1000
                      ? `${(play.stats.views / 1000).toFixed(1).replace(/\.0$/, "")}k`
                      : play.stats.views}
                  </span>
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
