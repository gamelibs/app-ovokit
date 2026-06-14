import { notFound } from "next/navigation";
import { isCorePatternKey } from "@/lib/patterns/patterns";
import { ServerDemoPlayer } from "@/components/demos/ServerDemoPlayer";

export default async function EmbedPatternDemoPage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = await params;
  if (!isCorePatternKey(key)) notFound();

  return (
    <main className="h-full w-full">
      <div className="h-full w-full overflow-hidden bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
        <div className="h-full p-4">
          <ServerDemoPlayer demoId={`pattern-${key}`} initInput={{ difficulty: "normal" }} />
        </div>
      </div>
    </main>
  );
}
