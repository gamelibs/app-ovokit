import Link from "next/link";
import Image from "next/image";
import type { PlayMeta } from "@/lib/content/plays";
import { TagPill } from "./TagPill";
import { PlayStats } from "./PlayStats";
import { TAG_ARCHETYPES, TAG_FEATURES, normalizeTags } from "@/lib/content/play-tags";

const CANONICAL_TAGS = new Set([...TAG_ARCHETYPES, ...TAG_FEATURES]);

function isSvg(src: string) {
  return src.endsWith(".svg");
}

function listHotTags(plays: PlayMeta[]) {
  const counts = new Map<string, number>();
  for (const play of plays) {
    // 统一按新词表计数：旧标签先映射，工程概念/运营标记剔除
    for (const tag of normalizeTags(play.tags)) {
      if (!CANONICAL_TAGS.has(tag)) continue;
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 12)
    .map(([tag]) => tag);
}



export function RightSidebar({ plays }: { plays: PlayMeta[] }) {
  const hotTags = listHotTags(plays);
  // 新手必读：按「入门」难度真实选品（无封面的跳过），不再用列表前 3 篇凑数
  const newbiePlays = plays.filter((p) => p.difficulty === "入门" && p.cover?.src).slice(0, 3);
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
            {newbiePlays.map((p) => (
              <Link
                key={p.slug}
                href={`/play/${p.slug}`}
                className="group flex gap-3 rounded-xl p-2 hover:bg-paper-warm"
              >
                <div className="sketch-border relative h-14 w-20 flex-none overflow-hidden rounded-lg bg-paper-warm">
                  {p.cover?.src ? (
                    <Image
                      src={p.cover.src}
                      alt={p.cover.alt ?? p.title}
                      fill
                      sizes="80px"
                      unoptimized={isSvg(p.cover.src)}
                      className="object-contain"
                      loading="lazy"
                    />
                  ) : (
                    <div className="grid h-full place-items-center">
                      <span className="text-xs text-ink-muted">📄</span>
                    </div>
                  )}
                </div>
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
