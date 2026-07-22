import Link from "next/link";
import { listPlays } from "@/lib/content/plays";

const featuredArchetypes = [
  {
    key: "match-3",
    route: "/archetypes/match-clear",
    label: "Match-3",
    icon: "/icons/match-3.webp",
    matchTags: ["消除"],
  },
  {
    key: "deck-builder",
    route: "/archetypes/choice-strategy",
    label: "Deck Builder",
    icon: "/icons/deck-builder.webp",
    matchTags: ["策略决策"],
  },
  {
    key: "roguelike",
    route: "/archetypes/runner",
    label: "Roguelike",
    icon: "/icons/roguelike.webp",
    matchTags: ["Roguelike", "行进 / 跑酷"],
  },
  {
    key: "shoot-em-up",
    route: "/archetypes/shoot-aim",
    label: "Shoot 'em up",
    icon: "/icons/shoot-em-up.webp",
    matchTags: ["射击"],
  },
  {
    key: "platformer",
    route: "/archetypes/runner",
    label: "Platformer",
    icon: "/icons/platformer.webp",
    matchTags: ["行进 / 跑酷", "动作"],
  },
];

export async function ArchetypeQuickNav() {
  const plays = await listPlays();

  const archetypesWithCount = featuredArchetypes.map((a) => {
    const count = plays.filter((p) =>
      a.matchTags.some((tag) => p.tags.includes(tag as never)),
    ).length;
    return { ...a, count };
  });

  return (
    <section className="mt-8 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-kalam text-xl font-semibold text-ink">玩法行为</h2>
        <Link
          href="/archetypes"
          className="font-kalam text-sm font-semibold text-ink-light hover:text-ink hover:underline"
        >
          查看全部 →
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {archetypesWithCount.map((a) => (
          <Link
            key={a.key}
            href={a.route}
            className="sketch-border bg-paper px-3 py-2 transition hover:bg-paper-warm"
          >
            <div className="flex items-center gap-2">
              <img
                src={a.icon}
                alt={a.label}
                className="h-6 w-6"
                loading="lazy"
              />
              <div>
                <div className="font-kalam text-sm font-semibold text-ink">
                  {a.label}
                </div>
                <div className="text-[10px] text-ink-muted">★ {a.count} 篇</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
