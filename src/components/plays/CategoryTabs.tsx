import {
  getPlayCategoriesForGroupAsync,
  type ComplexityTierKey,
  type PlayBrowseGroupKey,
} from "@/lib/content/plays";
import { Link } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";

function pillClass(active: boolean) {
  if (active) {
    return "font-kalam inline-flex h-8 flex-none items-center justify-center rounded-full bg-ink px-3 text-xs font-semibold text-paper";
  }
  return "font-kalam inline-flex h-8 flex-none items-center justify-center rounded-full px-3 text-xs font-semibold text-ink-light hover:bg-ink/5 hover:text-ink";
}

export async function CategoryTabs({
  group,
  selectedKey,
  q,
  showAll,
  tier,
}: {
  group: PlayBrowseGroupKey;
  selectedKey?: string;
  q?: string;
  showAll?: boolean;
  /** 实现复杂度筛选：切换分类时保留 */
  tier?: ComplexityTierKey | null;
}) {
  const locale = await getLocale();
  const categories = await getPlayCategoriesForGroupAsync(group, locale);
  return (
    <div className="flex items-center gap-2 overflow-x-auto py-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
              ...(tier ? { tier } : {}),
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
