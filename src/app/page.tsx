import { CategoryTabs } from "@/components/plays/CategoryTabs";
import { PlayCard } from "@/components/plays/PlayCard";
import { RightSidebar } from "@/components/plays/RightSidebar";
import { listPlays, playCategories, type PlayTag } from "@/lib/content/plays";

function normalizeQueryParam(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string | string[]; cat?: string | string[] }>;
}) {
  const sp = searchParams ? await searchParams : {};
  const q = normalizeQueryParam(sp.q)?.trim() ?? "";
  const catKey = normalizeQueryParam(sp.cat) ?? "for-you";

  const plays = await listPlays();

  const selectedLabel =
    catKey === "for-you"
      ? null
      : playCategories.find((c) => c.key === catKey)?.label ?? null;

  const filtered = plays.filter((p) => {
    if (selectedLabel && !p.tags.includes(selectedLabel as PlayTag)) return false;
    if (!q) return true;
    const haystack = [
      p.title,
      p.subtitle,
      p.tags.join(" "),
      p.techStack.join(" "),
      p.corePoints.join(" "),
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q.toLowerCase());
  });

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-4">
      <CategoryTabs selectedKey={catKey} q={q || undefined} />

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px] lg:items-start">
        <section className="columns-1 gap-4 min-[420px]:columns-2 lg:columns-2 2xl:columns-3">
          {filtered.length > 0 ? (
            filtered.map((p) => <PlayCard key={p.slug} play={p} />)
          ) : (
            <div className="mb-4 break-inside-avoid rounded-2xl border border-zinc-200 bg-white p-5 text-sm text-zinc-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
              暂无匹配结果{q ? `：${q}` : ""}
            </div>
          )}
        </section>

        <RightSidebar plays={plays} />
      </div>
    </main>
  );
}
