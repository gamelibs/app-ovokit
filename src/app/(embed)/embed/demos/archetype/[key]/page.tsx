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
    <main className="h-dvh w-full overflow-hidden bg-paper p-0">
      <div className="h-full w-full p-2 sm:p-3">
        <ServerDemoPlayer demoId={demoId} initInput={{ difficulty: "normal" }} />
      </div>
    </main>
  );
}
