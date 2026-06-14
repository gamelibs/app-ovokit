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
    <main className="h-dvh w-full overflow-hidden bg-paper p-0">
      <div className="h-full w-full p-2 sm:p-3">
        <ServerDemoPlayer demoId={`pattern-${key}`} initInput={{ difficulty: "normal" }} />
      </div>
    </main>
  );
}
