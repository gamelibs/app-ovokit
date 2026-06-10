import { playBrowseGroups, type PlayBrowseGroupKey } from "@/lib/content/plays";
import Link from "next/link";

function tabClass(active: boolean) {
  if (active) {
    return "font-kalam inline-flex h-9 flex-none items-center justify-center sketch-border bg-highlight-yellow px-3 text-[13px] font-semibold text-ink shadow-sm min-[360px]:h-10 min-[360px]:px-4 min-[360px]:text-sm";
  }
  return "font-kalam inline-flex h-9 flex-none items-center justify-center sketch-border bg-paper px-3 text-[13px] font-semibold text-ink-light hover:bg-paper-warm min-[360px]:h-10 min-[360px]:px-4 min-[360px]:text-sm";
}

export function BrowseGroupTabs({
  selectedGroup,
  q,
}: {
  selectedGroup?: PlayBrowseGroupKey;
  q?: string;
}) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto py-1.5 min-[360px]:gap-3 min-[360px]:py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {playBrowseGroups.map((g) => (
        <Link
          key={g.key}
          href={
            g.key === "archetype"
              ? { pathname: "/archetypes" }
              : {
                  pathname: "/",
                  query: {
                    ...(q ? { q } : {}),
                    group: g.key,
                    all: "1",
                  },
                }
          }
          className={tabClass(selectedGroup === g.key)}
          aria-current={selectedGroup === g.key ? "page" : undefined}
        >
          <span className="whitespace-nowrap">{g.label}</span>
        </Link>
      ))}
    </div>
  );
}
