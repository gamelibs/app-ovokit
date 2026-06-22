"use client";

import Link from "next/link";

function pillClass(active: boolean) {
  if (active) {
    return "inline-flex h-9 flex-none items-center justify-center rounded-full bg-ink px-3 text-[13px] font-semibold text-paper shadow-sm min-[360px]:h-10 min-[360px]:px-4 min-[360px]:text-sm";
  }
  return "inline-flex h-9 flex-none items-center justify-center rounded-full px-3 text-[13px] font-semibold text-ink-light hover:bg-ink/5 hover:text-ink min-[360px]:h-10 min-[360px]:px-4 min-[360px]:text-sm";
}

export function PatternTabs({
  selectedKey,
  items,
}: {
  selectedKey: string;
  items: { key: string; label: string }[];
}) {
  return (
    <nav className="flex items-center gap-2 overflow-x-auto py-1.5 min-[360px]:gap-3 min-[360px]:py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {items.map((item) => {
        const active = item.key === selectedKey;
        return (
          <Link
            key={item.key}
            href={`/patterns/${encodeURIComponent(item.key)}`}
            className={pillClass(active)}
            aria-current={active ? "page" : undefined}
          >
            <span className="whitespace-nowrap">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
