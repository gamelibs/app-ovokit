import { notFound } from "next/navigation";
import { getPlayBySlug } from "@/lib/content/plays";
import { PlayMiniDemo } from "@/components/demos/PlayMiniDemo";

export default async function EmbedPlayDemoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const play = await getPlayBySlug(slug);
  if (!play) notFound();

  return (
    <main className="h-full w-full">
      <div className="h-full w-full overflow-hidden bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
        <div className="flex h-full flex-col">
          <header className="border-b border-zinc-200 px-4 py-3 dark:border-white/10">
            <div className="text-sm font-semibold leading-5">{play.title}</div>
            <div className="mt-1 line-clamp-2 text-xs text-zinc-600 dark:text-zinc-300">
              {play.subtitle}
            </div>
          </header>
          <div className="min-h-0 flex-1 p-4">
            <PlayMiniDemo slug={slug} />
          </div>
        </div>
      </div>
    </main>
  );
}

