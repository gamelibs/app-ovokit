#!/usr/bin/env tsx
/**
 * 批量生成母型 / 核心原型 / 玩法特征的说明图 SVG
 *
 * 为每个 key 生成 4 张图：hero.svg、interaction.svg、rule.svg、advanced.svg
 * 保持手绘风格，使用 src/lib/sketch-svg/generator.ts。
 *
 * 用法：
 *   pnpm tsx scripts/generate-entity-assets.ts
 *   pnpm tsx scripts/generate-entity-assets.ts --dry-run
 *   pnpm tsx scripts/generate-entity-assets.ts --only=archetypes
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import {
  generateSketchSvg,
  type SketchSvgType,
} from "../src/lib/sketch-svg/generator";
import { playArchetypeKeys } from "../src/lib/archetypes/archetypes";
import { corePatternKeys } from "../src/lib/patterns/patterns";
import { featureKeys } from "../src/lib/features/features";

type EntityKind = "archetype" | "pattern" | "feature";

interface EntityConfig {
  kind: EntityKind;
  key: string;
  hero: SketchSvgType;
  interaction: SketchSvgType;
  rule: SketchSvgType;
  advanced: SketchSvgType;
}

const ARCHETYPE_HERO: Record<string, SketchSvgType> = {
  "match-clear": "blocks",
  "dodge-avoid": "runner",
  runner: "runner",
  "shoot-aim": "gamepad",
  combat: "skull",
  placement: "tower",
  "choice-strategy": "card",
  physics: "puzzle",
  puzzle: "puzzle",
  progression: "gem",
  simulation: "tower",
  timing: "clock",
};

const ARCHETYPE_INTERACTION: Record<string, SketchSvgType> = {
  "match-clear": "tap",
  "dodge-avoid": "runner",
  runner: "runner",
  "shoot-aim": "gamepad",
  combat: "gamepad",
  placement: "tap",
  "choice-strategy": "card",
  physics: "puzzle",
  puzzle: "tap",
  progression: "gem",
  simulation: "tower",
  timing: "clock",
};

const ARCHETYPE_RULE: Record<string, SketchSvgType> = {
  "match-clear": "flow-decision",
  "dodge-avoid": "flow-process",
  runner: "flow-process",
  "shoot-aim": "flow-process",
  combat: "flow-decision",
  placement: "flow-process",
  "choice-strategy": "flow-decision",
  physics: "flow-decision",
  puzzle: "flow-decision",
  progression: "flow-process",
  simulation: "flow-process",
  timing: "flow-process",
};

const ARCHETYPE_ADVANCED: Record<string, SketchSvgType> = {
  "match-clear": "grid",
  "dodge-avoid": "runner",
  runner: "runner",
  "shoot-aim": "gamepad",
  combat: "skull",
  placement: "tower",
  "choice-strategy": "card",
  physics: "puzzle",
  puzzle: "puzzle",
  progression: "gem",
  simulation: "tower",
  timing: "clock",
};

const PATTERN_HERO: Record<string, SketchSvgType> = {
  action: "gamepad",
  spatial: "grid",
  merge: "blocks",
  management: "tower",
  strategy: "card",
};

const PATTERN_INTERACTION: Record<string, SketchSvgType> = {
  action: "tap",
  spatial: "tap",
  merge: "tap",
  management: "tap",
  strategy: "tap",
};

const PATTERN_RULE: Record<string, SketchSvgType> = {
  action: "flow-process",
  spatial: "flow-decision",
  merge: "flow-process",
  management: "flow-process",
  strategy: "flow-decision",
};

const PATTERN_ADVANCED: Record<string, SketchSvgType> = {
  action: "runner",
  spatial: "puzzle",
  merge: "blocks",
  management: "tower",
  strategy: "card",
};

const FEATURE_HERO: Record<string, SketchSvgType> = {
  merge: "blocks",
  idle: "clock",
  click: "tap",
  grid: "grid",
  levels: "card",
  numbers: "dice",
  generation: "puzzle",
  roguelike: "skull",
  "state-machine": "flow-process",
};

const FEATURE_INTERACTION: Record<string, SketchSvgType> = {
  merge: "tap",
  idle: "clock",
  click: "tap",
  grid: "tap",
  levels: "tap",
  numbers: "dice",
  generation: "tap",
  roguelike: "tap",
  "state-machine": "tap",
};

const FEATURE_RULE: Record<string, SketchSvgType> = {
  merge: "flow-process",
  idle: "flow-process",
  click: "flow-process",
  grid: "flow-decision",
  levels: "flow-decision",
  numbers: "flow-decision",
  generation: "flow-decision",
  roguelike: "flow-decision",
  "state-machine": "flow-process",
};

const FEATURE_ADVANCED: Record<string, SketchSvgType> = {
  merge: "blocks",
  idle: "clock",
  click: "tap",
  grid: "grid",
  levels: "card",
  numbers: "dice",
  generation: "puzzle",
  roguelike: "skull",
  "state-machine": "flow-process",
};

function buildConfigs(only?: EntityKind): EntityConfig[] {
  const configs: EntityConfig[] = [];

  const shouldInclude = (kind: EntityKind) => !only || only === kind;

  if (shouldInclude("archetype")) {
    for (const key of playArchetypeKeys) {
      configs.push({
        kind: "archetype",
        key,
        hero: ARCHETYPE_HERO[key] ?? "puzzle",
        interaction: ARCHETYPE_INTERACTION[key] ?? "tap",
        rule: ARCHETYPE_RULE[key] ?? "flow-process",
        advanced: ARCHETYPE_ADVANCED[key] ?? "puzzle",
      });
    }
  }

  if (shouldInclude("pattern")) {
    for (const key of corePatternKeys) {
      configs.push({
        kind: "pattern",
        key,
        hero: PATTERN_HERO[key] ?? "puzzle",
        interaction: PATTERN_INTERACTION[key] ?? "tap",
        rule: PATTERN_RULE[key] ?? "flow-process",
        advanced: PATTERN_ADVANCED[key] ?? "puzzle",
      });
    }
  }

  if (shouldInclude("feature")) {
    for (const key of featureKeys) {
      configs.push({
        kind: "feature",
        key,
        hero: FEATURE_HERO[key] ?? "puzzle",
        interaction: FEATURE_INTERACTION[key] ?? "tap",
        rule: FEATURE_RULE[key] ?? "flow-process",
        advanced: FEATURE_ADVANCED[key] ?? "puzzle",
      });
    }
  }

  return configs;
}

const SIZES = {
  hero: { width: 960, height: 420 },
  interaction: { width: 900, height: 320 },
  rule: { width: 900, height: 320 },
  advanced: { width: 900, height: 300 },
};

function generateEntitySvg(type: SketchSvgType, width: number, height: number): string {
  return generateSketchSvg({
    type,
    width,
    height,
    roughness: 2,
    bowing: 1,
    stroke: "#202020",
    strokeWidth: 2,
    fill: "#faf7ef",
    fillStyle: "hachure",
    padding: 0,
  });
}

function outDirFor(config: EntityConfig): string {
  return path.join(process.cwd(), "public", config.kind === "archetype" ? "archetypes" : config.kind === "pattern" ? "patterns" : "features", config.key);
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const onlyArg = args.find((a) => a.startsWith("--only="));
  const only = onlyArg ? (onlyArg.slice("--only=".length) as EntityKind) : undefined;

  const configs = buildConfigs(only);
  let generated = 0;
  let skipped = 0;

  for (const config of configs) {
    const outDir = outDirFor(config);
    if (!dryRun) {
      await fs.mkdir(outDir, { recursive: true });
    }

    for (const slot of ["hero", "interaction", "rule", "advanced"] as const) {
      const filePath = path.join(outDir, `${slot}.svg`);
      const exists = await fs.stat(filePath).then(() => true).catch(() => false);

      if (exists) {
        skipped++;
        continue;
      }

      const type = config[slot];
      const { width, height } = SIZES[slot];
      const svg = generateEntitySvg(type, width, height);

      if (dryRun) {
        console.log(`[dry-run] 将生成 ${outDir}/${slot}.svg (${type} ${width}x${height})`);
      } else {
        await fs.writeFile(filePath, svg, "utf8");
      }
      generated++;
    }
  }

  console.log(`✅ 完成：生成 ${generated} 张，跳过 ${skipped} 张（已存在）`);
}

main().catch((err) => {
  console.error("❌ 生成失败：", err instanceof Error ? err.message : err);
  process.exit(1);
});
