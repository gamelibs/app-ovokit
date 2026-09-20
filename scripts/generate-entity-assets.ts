#!/usr/bin/env tsx
/**
 * 批量生成母型 / 核心循环 / 玩法特征的说明图（480×360 webp）。
 *
 * 渲染管线：src/lib/sketch-svg/generator.ts 的场景系统（generateEntitySceneSvg）
 *   → sharp 转 webp → 覆盖写入 public/{archetypes|patterns|features|implementation-traits}/{key}/。
 *
 * 硬性规则（与生成器场景系统一致）：
 * - 画布 480×360（4:3），内容四边安全边距 ≥ 8%
 * - 图内无边框 / 无文字；背景为站点纸色 #faf7ef
 * - 每个 key 的图必须贴合其核心机制（下方 ENTITY_SCENES 映射即唯一真相源，
 *   新增 key 时必须显式登记映射，否则脚本直接报错）
 * - patterns 额外生成 loop.webp（核心循环图，供 PatternPage「核心循环流程图」位使用）
 *
 * 用法：
 *   pnpm tsx scripts/generate-entity-assets.ts
 *   pnpm tsx scripts/generate-entity-assets.ts --dry-run
 *   pnpm tsx scripts/generate-entity-assets.ts --only=patterns
 *   pnpm tsx scripts/generate-entity-assets.ts --only=archetypes --key=match-clear
 *   pnpm tsx scripts/generate-entity-assets.ts --only=implementation-traits --key=generation
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import {
  generateEntitySceneSvg,
  isEntitySceneType,
  ENTITY_SCENE_WIDTH,
  ENTITY_SCENE_HEIGHT,
  type EntitySceneType,
} from "../src/lib/sketch-svg/generator";
import { playArchetypeKeys } from "../src/lib/archetypes/archetypes";
import { corePatternKeys } from "../src/lib/patterns/patterns";
import { featureKeys } from "../src/lib/features/features";
import { implementationTraitKeys } from "../src/lib/implementation-traits/implementation-traits";

type EntityKind = "archetype" | "pattern" | "feature" | "implementation-trait";

interface SlotScenes {
  hero: EntitySceneType;
  interaction: EntitySceneType;
  rule: EntitySceneType;
  advanced: EntitySceneType;
  /** 仅 patterns：核心循环图 */
  loop?: EntitySceneType;
}

/** 母型 → 场景映射（每槽画该母型的核心机制） */
const ARCHETYPE_SCENES: Record<string, SlotScenes> = {
  "match-clear": { hero: "match-row", interaction: "gem-swap", rule: "clear-drop", advanced: "cascade-chain" },
  "merge-unit": { hero: "merge-basic", interaction: "merge-drag", rule: "merge-chain", advanced: "merge-tiers" },
  "dodge-avoid": { hero: "dodge-field", interaction: "dodge-move", rule: "dodge-gap", advanced: "dodge-density" },
  runner: { hero: "runner-lane", interaction: "runner-jump", rule: "runner-lanes", advanced: "runner-speed" },
  "shoot-aim": { hero: "aim-target", interaction: "aim-trajectory", rule: "aim-hit", advanced: "aim-lead" },
  combat: { hero: "combat-clash", interaction: "combat-strike", rule: "combat-trade", advanced: "combat-cooldown" },
  "turn-duel": { hero: "turn-board", interaction: "turn-place", rule: "turn-cycle", advanced: "turn-win" },
  placement: { hero: "place-tower", interaction: "place-ghost", rule: "place-wave", advanced: "place-cover" },
  "choice-strategy": { hero: "choice-cards", interaction: "choice-pick", rule: "choice-branch", advanced: "choice-scale" },
  physics: { hero: "physics-stack", interaction: "physics-drop", rule: "physics-seesaw", advanced: "physics-domino" },
  puzzle: { hero: "puzzle-fit", interaction: "puzzle-try", rule: "puzzle-reveal", advanced: "puzzle-path" },
  progression: { hero: "prog-stairs", interaction: "prog-collect", rule: "prog-curve", advanced: "prog-prestige" },
  simulation: { hero: "sim-town", interaction: "sim-harvest", rule: "sim-cycle", advanced: "sim-network" },
  timing: { hero: "timing-gauge", interaction: "timing-tap", rule: "timing-window", advanced: "timing-combo" },
};

/** 核心循环 → 场景映射（多一个 loop 槽：核心循环流程图） */
const PATTERN_SCENES: Record<string, SlotScenes> = {
  action: { hero: "act-reflex", interaction: "tap-fast", rule: "loop-act", advanced: "act-chain", loop: "loop-action" },
  spatial: { hero: "sp-board", interaction: "sp-place", rule: "sp-validate", advanced: "sp-fill", loop: "loop-spatial" },
  merge: { hero: "merge-cycle", interaction: "merge-drag-gem", rule: "merge-chain-gem", advanced: "merge-income", loop: "loop-merge" },
  management: { hero: "mgmt-base", interaction: "mgmt-build", rule: "mgmt-flow", advanced: "mgmt-expand", loop: "loop-management" },
  strategy: { hero: "strat-formation", interaction: "strat-arrange", rule: "strat-resolve", advanced: "strat-tree", loop: "loop-strategy" },
  narrative: { hero: "nar-tree", interaction: "nar-choice", rule: "nar-consequence", advanced: "nar-endings", loop: "loop-narrative" },
};

/** 玩法特征 → 场景映射（taxonomy features 8 项；工程实现特征见 TRAIT_SCENES） */
const FEATURE_SCENES: Record<string, SlotScenes> = {
  "merge-mechanic": { hero: "merge-basic-gem", interaction: "merge-drag-gem", rule: "merge-chain-gem", advanced: "merge-tiers-gem" },
  idle: { hero: "idle-coins", interaction: "idle-collect", rule: "idle-offline", advanced: "idle-multi" },
  click: { hero: "click-target", interaction: "click-tap", rule: "click-reward", advanced: "click-frenzy" },
  grid: { hero: "grid-board", interaction: "grid-move", rule: "grid-valid", advanced: "grid-path" },
  levels: { hero: "levels-path", interaction: "levels-enter", rule: "levels-gate", advanced: "levels-branch" },
  numbers: { hero: "num-bars", interaction: "num-upgrade", rule: "num-curve", advanced: "num-prestige" },
  roguelike: { hero: "rogue-map", interaction: "rogue-door", rule: "rogue-death", advanced: "rogue-meta" },
  timed: { hero: "timing-gauge", interaction: "timing-tap", rule: "timing-window", advanced: "timing-combo" },
};

/** 工程实现特征 → 场景映射（taxonomy implementationTraits 层，2026-09-20 从 features 迁出） */
const TRAIT_SCENES: Record<string, SlotScenes> = {
  generation: { hero: "gen-dice", interaction: "gen-roll", rule: "gen-variety", advanced: "gen-biome" },
  "state-machine": { hero: "sm-states", interaction: "sm-event", rule: "sm-guard", advanced: "sm-nested" },
};

const KIND_DIR: Record<EntityKind, string> = {
  archetype: "archetypes",
  pattern: "patterns",
  feature: "features",
  "implementation-trait": "implementation-traits",
};

const KIND_TABLE: Record<EntityKind, Record<string, SlotScenes>> = {
  archetype: ARCHETYPE_SCENES,
  pattern: PATTERN_SCENES,
  feature: FEATURE_SCENES,
  "implementation-trait": TRAIT_SCENES,
};

const KIND_KEYS: Record<EntityKind, readonly string[]> = {
  archetype: playArchetypeKeys,
  pattern: corePatternKeys,
  feature: featureKeys,
  "implementation-trait": implementationTraitKeys,
};

/** 强校验：内容注册表里的每个 key 都必须在映射表中显式登记，且场景名必须存在 */
function collectJobs(only: EntityKind | undefined, keyFilter: string | undefined) {
  const kinds: EntityKind[] = only
    ? [only]
    : ["archetype", "pattern", "feature", "implementation-trait"];
  const jobs: { kind: EntityKind; key: string; slot: string; scene: EntitySceneType }[] = [];
  for (const kind of kinds) {
    for (const key of KIND_KEYS[kind]) {
      if (keyFilter && key !== keyFilter) continue;
      const scenes = KIND_TABLE[kind][key];
      if (!scenes) {
        throw new Error(`映射缺失：${kind}/${key} 未在 ENTITY_SCENES 映射表中登记`);
      }
      const slots = ["hero", "interaction", "rule", "advanced", "loop"] as const;
      for (const slot of slots) {
        const scene = scenes[slot];
        if (!scene) continue;
        if (!isEntitySceneType(scene)) {
          throw new Error(`映射错误：${kind}/${key}.${slot} 指向未知场景 "${scene}"`);
        }
        jobs.push({ kind, key, slot, scene });
      }
    }
  }
  return jobs;
}

async function renderWebp(scene: EntitySceneType): Promise<Buffer> {
  const svg = generateEntitySceneSvg(scene);
  return sharp(Buffer.from(svg), { density: 120 })
    .resize(ENTITY_SCENE_WIDTH, ENTITY_SCENE_HEIGHT, { fit: "fill" })
    .webp({ quality: 82 })
    .toBuffer();
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const onlyArg = args.find((a) => a.startsWith("--only="));
  const onlyRaw = onlyArg ? onlyArg.slice("--only=".length) : undefined;
  // 兼容单复数写法（--only=pattern / --only=patterns）
  const onlyNorm = onlyRaw?.replace(/s$/, "");
  if (
    onlyNorm &&
    !(["archetype", "pattern", "feature", "implementation-trait"] as const).includes(
      onlyNorm as EntityKind
    )
  ) {
    throw new Error(
      `未知 --only 取值: ${onlyRaw}（可选 archetype|pattern|feature|implementation-trait）`
    );
  }
  const only = onlyNorm as EntityKind | undefined;
  const keyArg = args.find((a) => a.startsWith("--key="));
  const keyFilter = keyArg ? keyArg.slice("--key=".length) : undefined;

  const jobs = collectJobs(only, keyFilter);
  let generated = 0;

  for (const job of jobs) {
    const outDir = path.join(process.cwd(), "public", KIND_DIR[job.kind], job.key);
    const outPath = path.join(outDir, `${job.slot}.webp`);
    if (dryRun) {
      console.log(`[dry-run] ${KIND_DIR[job.kind]}/${job.key}/${job.slot}.webp ← ${job.scene}`);
      generated++;
      continue;
    }
    await fs.mkdir(outDir, { recursive: true });
    const buf = await renderWebp(job.scene);
    await fs.writeFile(outPath, buf);
    // 清理同槽位的旧格式残留（svg/png/jpg）
    for (const ext of ["svg", "png", "jpg", "jpeg", "gif"]) {
      await fs.rm(path.join(outDir, `${job.slot}.${ext}`), { force: true });
    }
    generated++;
  }

  console.log(`✅ 完成：生成 ${generated} 张（480×360 webp，全量覆盖）`);
}

main().catch((err) => {
  console.error("❌ 生成失败：", err instanceof Error ? err.message : err);
  process.exit(1);
});
