import { playCategories } from "@/lib/content/plays";
import Link from "next/link";

function pillClass(active: boolean) {
  if (active) {
    return "inline-flex h-9 flex-none items-center justify-center rounded-full bg-zinc-900 px-3 text-[13px] font-semibold text-white shadow-sm min-[360px]:h-10 min-[360px]:px-4 min-[360px]:text-sm dark:bg-white/10 dark:text-zinc-50";
  }
  return "inline-flex h-9 flex-none items-center justify-center rounded-full px-3 text-[13px] font-semibold text-zinc-600 hover:bg-black/5 hover:text-zinc-900 min-[360px]:h-10 min-[360px]:px-4 min-[360px]:text-sm dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-zinc-50";
}

export function CategoryTabs({
  selectedKey,
  q,
}: {
  selectedKey?: string;
  q?: string;
}) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto py-1.5 min-[360px]:gap-3 min-[360px]:py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {playCategories.map((c, idx) => (
        <Link
          key={c.key}
          href={{
            pathname: "/",
            query: {
              ...(q ? { q } : {}),
              ...(c.key === "for-you" ? {} : { cat: c.key }),
            },
          }}
          className={pillClass(
            (selectedKey ?? "for-you") === c.key || (idx === 0 && !selectedKey),
          )}
          aria-current={(selectedKey ?? "for-you") === c.key ? "page" : undefined}
        >
          <span className="whitespace-nowrap">{c.label}</span>
        </Link>
      ))}
    </div>
  );
}
