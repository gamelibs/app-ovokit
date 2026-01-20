import { playBrowseGroups, type PlayBrowseGroupKey } from "@/lib/content/plays";
import Link from "next/link";

function tabClass(active: boolean) {
  if (active) {
    return "inline-flex h-9 flex-none items-center justify-center rounded-full bg-blue-600 px-3 text-[13px] font-semibold text-white shadow-sm min-[360px]:h-10 min-[360px]:px-4 min-[360px]:text-sm dark:bg-blue-500/20 dark:text-blue-100";
  }
  return "inline-flex h-9 flex-none items-center justify-center rounded-full border border-zinc-200 bg-white px-3 text-[13px] font-semibold text-zinc-700 hover:bg-zinc-50 min-[360px]:h-10 min-[360px]:px-4 min-[360px]:text-sm dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10";
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
