/**
 * 全站内容图重绘：母型/原型/特征页 4 图槽 + 首页导航图标 + hero 插图。
 * 全部生成蚀刻报纸风 webp，并删除旧 svg/png/jpg。
 * 用法：npx tsx scripts/regen-content-images.ts
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { renderCoverWebp } from "../src/lib/cover-gen/render";
import sharp from "sharp";
import { composeCoverSvg } from "../src/lib/cover-gen/compose";

const PUBLIC = path.join(process.cwd(), "public");

/** 4 图槽 → 变体号（同母型四张图各不同） */
const SLOTS: [string, number][] = [
  ["hero", 0],
  ["interaction", 1],
  ["rule", 2],
  ["advanced", 3],
];

/** pattern key → 场景母型 */
const PATTERN_SCENE: Record<string, string> = {
  action: "dodge-avoid",
  management: "simulation",
  merge: "merge-unit",
  spatial: "placement",
  strategy: "choice-strategy",
  narrative: "choice-strategy",
};

/** feature key → 场景母型 */
const FEATURE_SCENE: Record<string, string> = {
  click: "timing",
  generation: "simulation",
  grid: "placement",
  idle: "progression",
  levels: "puzzle",
  merge: "merge-unit",
  numbers: "progression",
  roguelike: "combat",
  "state-machine": "turn-duel",
};

async function cleanOldImages(dir: string, keep: Set<string>) {
  try {
    for (const f of await fs.readdir(dir)) {
      if (/\.(svg|png|jpe?g|gif|webp)$/i.test(f) && !keep.has(f)) {
        await fs.rm(path.join(dir, f), { force: true });
      }
    }
  } catch {
    // 目录不存在
  }
}

async function regenSlots(baseDir: string, scene: string, slug: string) {
  await fs.mkdir(baseDir, { recursive: true });
  const keep = new Set<string>();
  for (const [kind, variant] of SLOTS) {
    const buf = await renderCoverWebp(slug, scene, "card", variant);
    const name = `${kind}.webp`;
    await fs.writeFile(path.join(baseDir, name), buf);
    keep.add(name);
  }
  await cleanOldImages(baseDir, keep);
  return keep.size;
}

async function regenIcon(scene: string, slug: string, out: string) {
  const svg = composeCoverSvg(slug, scene, 0);
  const buf = await sharp(Buffer.from(svg), { density: 120 })
    .resize(128, 96, { fit: "fill" })
    .webp({ quality: 80 })
    .toBuffer();
  await fs.mkdir(path.dirname(out), { recursive: true });
  await fs.writeFile(out, buf);
}

async function main() {
  // 1) 母型页（目录存在的 12 个 + turn-duel/merge-unit 若存在）
  const archRoot = path.join(PUBLIC, "archetypes");
  const archKeys = await fs.readdir(archRoot).catch(() => [] as string[]);
  for (const key of archKeys) {
    const n = await regenSlots(path.join(archRoot, key), key, `archetype-${key}`);
    console.log(`archetypes/${key}: ${n} slots`);
  }

  // 2) 原型页
  const patRoot = path.join(PUBLIC, "patterns");
  const patKeys = await fs.readdir(patRoot).catch(() => [] as string[]);
  for (const key of patKeys) {
    const scene = PATTERN_SCENE[key] ?? "puzzle";
    const n = await regenSlots(path.join(patRoot, key), scene, `pattern-${key}`);
    console.log(`patterns/${key}: ${n} slots (scene=${scene})`);
  }

  // 3) 特征页
  const featRoot = path.join(PUBLIC, "features");
  const featKeys = await fs.readdir(featRoot).catch(() => [] as string[]);
  for (const key of featKeys) {
    const scene = FEATURE_SCENE[key] ?? "puzzle";
    const n = await regenSlots(path.join(featRoot, key), scene, `feature-${key}`);
    console.log(`features/${key}: ${n} slots (scene=${scene})`);
  }

  // 4) 首页导航图标（archetypes + patterns + features 全部 key）
  for (const key of archKeys) {
    await regenIcon(key, `icon-${key}`, path.join(PUBLIC, "icons", `${key}.webp`));
  }
  for (const key of patKeys) {
    await regenIcon(PATTERN_SCENE[key] ?? "puzzle", `icon-p-${key}`, path.join(PUBLIC, "icons", `pattern-${key}.webp`));
  }
  for (const key of featKeys) {
    await regenIcon(FEATURE_SCENE[key] ?? "puzzle", `icon-f-${key}`, path.join(PUBLIC, "icons", `feature-${key}.webp`));
  }
  // 兼容 ArchetypeQuickNav 硬编码的旧命名
  const LEGACY_ICON_ALIAS: Record<string, string> = {
    "match-3": "match-clear",
    "deck-builder": "choice-strategy",
    roguelike: "combat",
    "shoot-em-up": "shoot-aim",
    platformer: "runner",
  };
  for (const [alias, scene] of Object.entries(LEGACY_ICON_ALIAS)) {
    await regenIcon(scene, `icon-${alias}`, path.join(PUBLIC, "icons", `${alias}.webp`));
  }
  console.log("icons done");

  // 5) hero 插图（7 个装饰图位，不同母型不同变体）
  const heroPicks: [string, string, number][] = [
    ["flowchart", "turn-duel", 0],
    ["gamepad", "match-clear", 1],
    ["note", "puzzle", 2],
    ["sun", "timing", 3],
    ["question-mark", "choice-strategy", 4],
    ["sparkle", "progression", 5],
    ["coin", "simulation", 6],
  ];
  for (const [name, scene, variant] of heroPicks) {
    const svg = composeCoverSvg(`hero-${name}`, scene, variant);
    const buf = await sharp(Buffer.from(svg), { density: 120 })
      .resize(192, 144, { fit: "fill" })
      .webp({ quality: 80 })
      .toBuffer();
    await fs.mkdir(path.join(PUBLIC, "hero"), { recursive: true });
    await fs.writeFile(path.join(PUBLIC, "hero", `${name}.webp`), buf);
  }
  console.log("hero done");

  // 6) 删除旧 svg 资产目录
  await fs.rm(path.join(PUBLIC, "svg"), { recursive: true, force: true });
  console.log("public/svg removed");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
