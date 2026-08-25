import { notFound } from "next/navigation";
import { promises as fs } from "node:fs";
import path from "node:path";
import { isCorePatternKey } from "@/lib/patterns/patterns";
import { ServerDemoPlayer } from "@/components/demos/ServerDemoPlayer";

const ATOMIC_KEY_RE = /^[a-z0-9][a-z0-9-]*$/;

/** 核心循环 → 原子 demo 目录（public/demos/atomic/<dir>/） */
const PATTERN_TO_ATOMIC: Record<string, string> = {
  action: "dodge-avoid",
  spatial: "match-clear",
  merge: "merge-unit",
  management: "management",
  strategy: "turn-duel",
  narrative: "narrative",
};

async function atomicDemoDir(key: string): Promise<string | null> {
  if (!ATOMIC_KEY_RE.test(key)) return null;
  const dir = PATTERN_TO_ATOMIC[key];
  if (!dir) return null;
  try {
    await fs.access(path.join(process.cwd(), "public", "demos", "atomic", dir, "index.html"));
    return dir;
  } catch {
    return null;
  }
}

export default async function EmbedPatternDemoPage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = await params;
  if (!isCorePatternKey(key)) notFound();

  // 真原子 demo 优先（替换旧服务端文本仪表盘）
  const atomicDir = await atomicDemoDir(key);
  if (atomicDir) {
    return (
      <main className="h-dvh w-full overflow-hidden bg-paper p-0">
        <iframe
          src={`/demos/atomic/${atomicDir}/index.html`}
          title={`${key} 核心循环 demo`}
          className="block h-full w-full border-0"
        />
      </main>
    );
  }

  return (
    <main className="h-dvh w-full overflow-hidden bg-paper p-0">
      <div className="h-full w-full p-2 sm:p-3">
        <ServerDemoPlayer demoId={`pattern-${key}`} initInput={{ difficulty: "normal" }} />
      </div>
    </main>
  );
}
