#!/usr/bin/env node
/**
 * 从 ovo_system runtime-gateway 同步分类协议词表到本地副本。
 * 用法：node scripts/sync-taxonomy.mjs [gatewayBase]
 * 默认 gatewayBase = http://127.0.0.1:19527
 * 输出：src/lib/taxonomy/taxonomy.json（提交入仓库，站点可独立运行）
 */
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const gateway = process.argv[2] || process.env.OVO_GATEWAY_BASE || "http://127.0.0.1:19527";

const res = await fetch(`${gateway}/api/taxonomy`, { cache: "no-store" });
const json = await res.json();
if (!json?.ok) {
  console.error("同步失败：", json?.message || res.status);
  process.exit(1);
}
const out = path.join(process.cwd(), "src", "lib", "taxonomy", "taxonomy.json");
await mkdir(path.dirname(out), { recursive: true });
await writeFile(out, JSON.stringify(json.data, null, 2) + "\n", "utf8");
console.log(`已同步 taxonomy v${json.data.version} → ${out}`);
console.log(`  archetypes=${json.data.archetypes.length} patterns=${json.data.patterns.length} features=${json.data.features.length}`);
