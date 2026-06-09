import { notFound } from "next/navigation";
import { isPlayArchetypeKey } from "@/lib/archetypes/archetypes";
import { ServerDemoPlayer } from "@/components/demos/ServerDemoPlayer";

function demoIdFromKey(key: string) {
  switch (key) {
    case "match-clear":
      return "arch-match-clear";
    case "dodge-avoid":
      return "arch-dodge-avoid";
    case "runner":
      return "arch-runner";
    case "shoot-aim":
      return "arch-shoot-aim";
    case "combat":
      return "arch-combat";
    case "placement":
      return "arch-placement";
    case "choice-strategy":
      return "arch-choice-strategy";
    case "physics":
      return "arch-physics";
    case "puzzle":
      return "arch-puzzle";
    case "progression":
      return "arch-progression";
    case "simulation":
      return "arch-simulation";
    case "timing":
      return "arch-timing";
    default:
      return null;
  }
}

export default async function EmbedArchetypeDemoPage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = await params;
  if (!isPlayArchetypeKey(key)) notFound();
  const demoId = demoIdFromKey(key);
  if (!demoId) notFound();

  return (
    <main className="h-full w-full">
      <div className="h-full w-full overflow-hidden bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
        <div className="h-full p-4">
          <ServerDemoPlayer demoId={demoId} initInput={{ difficulty: "normal" }} />
        </div>
      </div>
    </main>
  );
}

