/**
 * 批量生成手绘 SVG 素材
 * 用法: npx tsx scripts/generate-svg-assets.ts
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import {
  generateSketchSvg,
  type SketchSvgType,
} from "../src/lib/sketch-svg/generator";

const OUT = join(process.cwd(), "public", "svg");

mkdirSync(join(OUT, "hero"), { recursive: true });
mkdirSync(join(OUT, "covers"), { recursive: true });
mkdirSync(join(OUT, "icons"), { recursive: true });

function save(name: string, svg: string, dir: string = "hero") {
  const path = join(OUT, dir, `${name}.svg`);
  writeFileSync(path, svg);
  console.log(`✓ ${path}`);
}

// 基础游戏元素
const elements: { name: string; type: SketchSvgType; opts?: Record<string, unknown> }[] = [
  { name: "gamepad", type: "gamepad" },
  { name: "note", type: "note" },
  { name: "sun", type: "sun" },
  { name: "question-mark", type: "question-mark" },
  { name: "sparkle", type: "sparkle" },
  { name: "lightbulb", type: "lightbulb" },
  { name: "gem", type: "gem" },
  { name: "coin", type: "circle", opts: { width: 80, height: 80, fill: "#ffda6a" } },
  { name: "moon", type: "circle", opts: { width: 80, height: 80, fill: "#7dcfff" } },
  { name: "star", type: "star" },
];

for (const el of elements) {
  const svg = generateSketchSvg({
    type: el.type,
    width: 120,
    height: 120,
    roughness: 2,
    stroke: "#202020",
    strokeWidth: 2,
    fill: "#faf7ef",
    fillStyle: "hachure",
    ...el.opts,
  });
  save(el.name, svg, "hero");
}

// 封面图
const covers: { name: string; type: SketchSvgType }[] = [
  { name: "memory-match", type: "flipped-cards" },
  { name: "tower-defense", type: "tower" },
  { name: "endless-runner", type: "runner" },
  { name: "roguelike-dungeon", type: "skull" },
  { name: "physics-puzzle", type: "blocks" },
];

for (const c of covers) {
  const svg = generateSketchSvg({
    type: c.type,
    width: 240,
    height: 180,
    roughness: 2,
    stroke: "#202020",
    strokeWidth: 2,
    fill: "#faf7ef",
    fillStyle: "hachure",
  });
  save(c.name, svg, "covers");
}

// 母型玩法小图标
const archetypeIcons: { name: string; type: SketchSvgType }[] = [
  { name: "match-3", type: "gem" },
  { name: "deck-builder", type: "card" },
  { name: "roguelike", type: "skull" },
  { name: "shoot-em-up", type: "star" },
  { name: "platformer", type: "blocks" },
];

for (const a of archetypeIcons) {
  const svg = generateSketchSvg({
    type: a.type,
    width: 48,
    height: 48,
    roughness: 2,
    stroke: "#202020",
    strokeWidth: 2,
    fill: "#faf7ef",
    fillStyle: "hachure",
  });
  save(a.name, svg, "icons");
}

// 生成组合流程图（Hero 区大图）
function generateFlowchartSvg(): string {
  const w = 320;
  const h = 240;
  const gen = require("roughjs").generator();
  const stroke = "#202020";
  const strokeWidth = 2;
  const fill = "#faf7ef";
  const roughness = 2;

  const common = { roughness, stroke, strokeWidth, fill, fillStyle: "hachure" };

  function opsToPath(ops: any[]): string {
    let path = "";
    for (const op of ops) {
      switch (op.op) {
        case "move":
          path += `M${op.data[0].toFixed(2)} ${op.data[1].toFixed(2)} `;
          break;
        case "bcurveTo":
          path += `C${op.data[0].toFixed(2)} ${op.data[1].toFixed(2)}, ${op.data[2].toFixed(2)} ${op.data[3].toFixed(2)}, ${op.data[4].toFixed(2)} ${op.data[5].toFixed(2)} `;
          break;
        case "lineTo":
          path += `L${op.data[0].toFixed(2)} ${op.data[1].toFixed(2)} `;
          break;
      }
    }
    return path.trim();
  }

  function drawableToSvg(drawable: any, offsetX = 0, offsetY = 0): string {
    let svg = "";
    for (const set of drawable.sets) {
      const d = opsToPath(set.ops);
      if (!d) continue;
      if (set.type === "path") {
        svg += `<path transform="translate(${offsetX},${offsetY})" d="${d}" fill="none" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>`;
      } else if (set.type === "fillSketch" || set.type === "fillPath") {
        svg += `<path transform="translate(${offsetX},${offsetY})" d="${d}" fill="${fill}" stroke="none"/>`;
      }
    }
    return svg;
  }

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">`;

  // 左上绿色方块
  const r1 = gen.rectangle(0, 0, 70, 50, { ...common, fill: "#7dd87d" });
  svg += drawableToSvg(r1);

  // 右上粉色方块
  const r2 = gen.rectangle(150, 0, 70, 50, { ...common, fill: "#ff8b8b" });
  svg += drawableToSvg(r2);

  // 左下空白方块
  const r3 = gen.rectangle(0, 110, 70, 50, common);
  svg += drawableToSvg(r3);

  // 右下黄色星星方块
  const r4 = gen.rectangle(150, 110, 70, 50, { ...common, fill: "#ffda6a" });
  svg += drawableToSvg(r4);

  // 箭头 1: 左上 → 右上
  const a1 = gen.line(75, 25, 145, 25, common);
  svg += drawableToSvg(a1);
  const ah1 = gen.linearPath(
    [[140, 18], [150, 25], [140, 32]],
    { ...common, fill: stroke },
  );
  svg += drawableToSvg(ah1);

  // 箭头 2: 左上 → 左下
  const a2 = gen.line(35, 55, 35, 105, common);
  svg += drawableToSvg(a2);
  const ah2 = gen.linearPath(
    [[28, 100], [35, 110], [42, 100]],
    { ...common, fill: stroke },
  );
  svg += drawableToSvg(ah2);

  // 箭头 3: 左下 → 右下
  const a3 = gen.line(75, 135, 145, 135, common);
  svg += drawableToSvg(a3);
  const ah3 = gen.linearPath(
    [[140, 128], [150, 135], [140, 142]],
    { ...common, fill: stroke },
  );
  svg += drawableToSvg(ah3);

  // 箭头 4: 右上 → 右下
  const a4 = gen.line(185, 55, 185, 105, common);
  svg += drawableToSvg(a4);
  const ah4 = gen.linearPath(
    [[178, 100], [185, 110], [192, 100]],
    { ...common, fill: stroke },
  );
  svg += drawableToSvg(ah4);

  // 底部游戏机图标
  const gamepad = gen.rectangle(120, 180, 80, 40, { ...common, fill: "#faf7ef" });
  svg += drawableToSvg(gamepad);
  // 游戏机按钮
  svg += `<circle cx="145" cy="200" r="6" fill="none" stroke="${stroke}" stroke-width="${strokeWidth}"/>`;
  svg += `<circle cx="175" cy="200" r="6" fill="none" stroke="${stroke}" stroke-width="${strokeWidth}"/>`;

  svg += "</svg>";
  return svg;
}

save("flowchart", generateFlowchartSvg(), "hero");

console.log("\n✅ 所有 SVG 素材生成完毕");
