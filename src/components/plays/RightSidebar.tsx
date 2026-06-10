import Link from "next/link";
import type { PlayMeta } from "@/lib/content/plays";
import { TagPill } from "./TagPill";
import { PlayStats } from "./PlayStats";

function listHotTags(plays: PlayMeta[]) {
  const counts = new Map<string, number>();
  for (const play of plays) {
    for (const tag of play.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .filter(([tag]) => tag !== "推荐")
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 12)
    .map(([tag]) => tag);
}



export function RightSidebar({ plays }: { plays: PlayMeta[] }) {
  const hotTags = listHotTags(plays);
  return (
    <aside className="hidden lg:block">
      <div className="space-y-4">
        <section className="sketch-card p-4 shadow-sm">
          <h3 className="font-kalam text-sm font-semibold text-ink">
            热门标签
          </h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {hotTags.map((t) => (
              <TagPill key={t}>{t}</TagPill>
            ))}
          </div>
        </section>

        <section className="sketch-card p-4 shadow-sm">
          <h3 className="font-kalam text-sm font-semibold text-ink">
            新手必读
          </h3>
          <div className="mt-3 space-y-3">
            {plays.slice(0, 3).map((p) => (
              <Link
                key={p.slug}
                href={`/play/${p.slug}`}
                className="group flex gap-3 rounded-xl p-2 hover:bg-paper-warm"
              >
                <div className="h-14 w-20 flex-none rounded-lg bg-paper-warm" />
                <div className="min-w-0 flex-1">
                  <div className="line-clamp-2 text-sm font-medium text-ink group-hover:underline">
                    {p.title}
                  </div>
                  <div className="mt-1">
                    <PlayStats
                      slug={p.slug}
                      initialViews={p.stats.views}
                      initialLikes={p.stats.likes}
                      size="sm"
                    />
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
