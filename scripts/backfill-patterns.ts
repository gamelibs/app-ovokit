/**
 * 回填全部帖子的 meta.pattern（按 tags 推断核心循环）。
 * 与 src/lib/content/plays.ts 的 inferPatternFromTags 规则一致。
 * 用法：npx tsx scripts/backfill-patterns.ts
 */
import { promises as fs } from "node:fs";
import path from "node:path";

function infer(tags: string[]): string | null {
  const t = new Set(tags);
  if (t.has("消除") || t.has("解谜") || t.has("网格")) return "spatial";
  if (t.has("合成")) return "merge";
  if (
    t.has("动作") || t.has("点击") || t.has("时机 / 反应") || t.has("躲避") ||
    t.has("行进 / 跑酷") || t.has("射击") || t.has("物理")
  ) return "action";
  if (t.has("放置 / 建造") || t.has("建造布局") || t.has("模拟")) return "management";
  if (
    t.has("塔防") || t.has("策略决策") || t.has("Roguelike") || t.has("状态机") ||
    t.has("战斗") || t.has("战斗对抗") || t.has("回合博弈")
  ) return "strategy";
  if (t.has("数值") || t.has("成长 / 数值")) {
    if (t.has("合成") || t.has("放置")) return "merge";
    return "merge";
  }
  if (t.has("放置")) return "management";
  return null;
}

async function main() {
  const root = path.join(process.cwd(), "content", "plays");
  const slugs = await fs.readdir(root);
  const counts: Record<string, number> = {};
  for (const slug of slugs) {
    if (slug.startsWith("_")) continue;
    const metaPath = path.join(root, slug, "meta.json");
    let meta;
    try {
      meta = JSON.parse(await fs.readFile(metaPath, "utf8"));
    } catch {
      continue;
    }
    const pattern = infer(meta.tags ?? []);
    if (pattern && meta.pattern !== pattern) {
      meta.pattern = pattern;
      await fs.writeFile(metaPath, JSON.stringify(meta, null, 2) + "\n", "utf8");
    }
    const final = meta.pattern ?? "(none)";
    counts[final] = (counts[final] ?? 0) + 1;
    if (pattern) console.log(`${slug} → ${pattern}`);
  }
  console.log("\npattern 分布:", counts);
}

main().catch((e) => { console.error(e); process.exit(1); });
