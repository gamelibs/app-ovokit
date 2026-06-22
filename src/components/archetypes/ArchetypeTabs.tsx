import type { PlayArchetypeKey } from "@/lib/archetypes/archetypes";
import Link from "next/link";

function pillClass(active: boolean) {
  if (active) {
    return "inline-flex h-9 flex-none items-center justify-center rounded-full bg-ink px-3 text-[13px] font-semibold text-paper shadow-sm min-[360px]:h-10 min-[360px]:px-4 min-[360px]:text-sm";
  }
  return "inline-flex h-9 flex-none items-center justify-center rounded-full px-3 text-[13px] font-semibold text-ink-light hover:bg-ink/5 hover:text-ink min-[360px]:h-10 min-[360px]:px-4 min-[360px]:text-sm";
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
          href={`/archetypes/${encodeURIComponent(a.key)}`}
          className={pillClass(selectedKey === a.key)}
          aria-current={selectedKey === a.key ? "page" : undefined}
        >
          <span className="whitespace-nowrap">{a.label}</span>
        </Link>
      ))}
    </div>
  );
}
