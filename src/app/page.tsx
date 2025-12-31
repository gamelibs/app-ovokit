import { CategoryTabs } from "@/components/plays/CategoryTabs";
import { PlayCard } from "@/components/plays/PlayCard";
import { RightSidebar } from "@/components/plays/RightSidebar";
import { listPlays } from "@/lib/content/plays";

export default async function Home() {
  const plays = await listPlays();
  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-4">
      <CategoryTabs />

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px] lg:items-start">
        <section className="space-y-4">
          {plays.map((p) => (
            <PlayCard key={p.slug} play={p} />
          ))}
        </section>

        <RightSidebar plays={plays} />
      </div>
    </main>
  );
}
