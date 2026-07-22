import { notFound } from "next/navigation";
import { promises as fs } from "node:fs";
import path from "node:path";
import { isPlayArchetypeKey } from "@/lib/archetypes/archetypes";
import { ServerDemoPlayer } from "@/components/demos/ServerDemoPlayer";

const ATOMIC_KEY_RE = /^[a-z0-9][a-z0-9-]*$/;

/**
 * public/demos/atomic/<key>/index.html 存在时，母型页直接用真原子 demo（静态 iframe），
 * 替换原来的服务端文本仪表盘；不存在则走原有 ServerDemoPlayer 回退逻辑。
 */
async function hasAtomicDemo(key: string) {
  if (!ATOMIC_KEY_RE.test(key)) return false;
  try {
    await fs.access(
      path.join(process.cwd(), "public", "demos", "atomic", key, "index.html"),
    );
    return true;
  } catch {
    return false;
  }
}

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

  // 原子静态 demo 优先：public/demos/atomic/<key>/ 存在时直接全屏 iframe。
  // 注意：该检查必须在 isPlayArchetypeKey 之前——merge-unit / turn-duel 等
  // 原子母型不在 playArchetypeKeys 里，但仍应可用静态 demo。
  if (await hasAtomicDemo(key)) {
    return (
      <main className="h-dvh w-full overflow-hidden bg-paper p-0">
        <iframe
          src={`/demos/atomic/${key}/index.html`}
          title={`${key} 原子母型 demo`}
          className="block h-full w-full border-0"
        />
      </main>
    );
  }

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
