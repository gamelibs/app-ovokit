import {
  getPlayCategoriesForGroupAsync,
  type PlayBrowseGroupKey,
} from "@/lib/content/plays";
import Link from "next/link";

function pillClass(active: boolean) {
  if (active) {
    return "font-kalam inline-flex h-9 flex-none items-center justify-center rounded-full bg-ink px-3 text-[13px] font-semibold text-paper shadow-sm min-[360px]:h-10 min-[360px]:px-4 min-[360px]:text-sm";
  }
  return "font-kalam inline-flex h-9 flex-none items-center justify-center rounded-full px-3 text-[13px] font-semibold text-ink-light hover:bg-ink/5 hover:text-ink min-[360px]:h-10 min-[360px]:px-4 min-[360px]:text-sm";
}

export async function CategoryTabs({
  group,
  selectedKey,
  q,
  showAll,
}: {
  group: PlayBrowseGroupKey;
  selectedKey?: string;
  q?: string;
  showAll?: boolean;
}) {
  const categories = await getPlayCategoriesForGroupAsync(group);
  return (
    <div className="flex items-center gap-2 overflow-x-auto py-1.5 min-[360px]:gap-3 min-[360px]:py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {categories.map((c, idx) => (
        <Link
          key={c.key}
          href={{
            pathname: "/",
            query: {
              ...(q ? { q } : {}),
              group,
              ...(showAll ? { all: "1" } : {}),
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
