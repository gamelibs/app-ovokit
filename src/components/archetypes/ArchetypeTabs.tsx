import type { PlayArchetypeKey } from "@/lib/archetypes/archetypes";
import Link from "next/link";

function pillClass(active: boolean) {
  if (active) {
    return "inline-flex h-9 flex-none items-center justify-center rounded-full bg-zinc-900 px-3 text-[13px] font-semibold text-white shadow-sm min-[360px]:h-10 min-[360px]:px-4 min-[360px]:text-sm dark:bg-white/10 dark:text-zinc-50";
  }
  return "inline-flex h-9 flex-none items-center justify-center rounded-full px-3 text-[13px] font-semibold text-zinc-600 hover:bg-black/5 hover:text-zinc-900 min-[360px]:h-10 min-[360px]:px-4 min-[360px]:text-sm dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-zinc-50";
}

export function ArchetypeTabs({
  selectedKey,
  items,
}: {
  selectedKey: PlayArchetypeKey;
  items: Array<{ key: PlayArchetypeKey; label: string }>;
}) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto py-1.5 min-[360px]:gap-3 min-[360px]:py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {items.map((a) => (
        <Link
          key={a.key}
          href={{ pathname: "/archetypes", query: { key: a.key } }}
          className={pillClass(selectedKey === a.key)}
          aria-current={selectedKey === a.key ? "page" : undefined}
        >
          <span className="whitespace-nowrap">{a.label}</span>
        </Link>
      ))}
    </div>
  );
}
