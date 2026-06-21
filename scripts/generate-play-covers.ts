/**
 * 批量生成玩法帖子封面 SVG
 *
 * 把 imgs/compressed/ 下的概念图转换成手绘风格 SVG，并对应到 30 个玩法帖子。
 * 同时更新每个玩法的 meta.json 中的 cover / coverWide 字段。
 *
 * 用法：
 *   # AI 模式（基于概念图调用 Kimi API，需要本地服务运行并已配置 MOD_PASSWORD）
 *   pnpm tsx scripts/generate-play-covers.ts
 *
 *   # 程序化模式（本地 RoughJS 快速生成抽象封面，不调用 API）
 *   pnpm tsx scripts/generate-play-covers.ts --mode=programmatic
 *
 *   # 仅生成指定玩法
 *   pnpm tsx scripts/generate-play-covers.ts --slug=match-3-retention-and-pacing
 *
 *   # 预览不保存
 *   pnpm tsx scripts/generate-play-covers.ts --dry-run
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import sharp from "sharp";
import {
  generateSketchSvg,
  type SketchSvgType,
} from "../src/lib/sketch-svg/generator";

dotenv.config({ path: ".env.local" });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:13100";
const MOD_PASSWORD = process.env.MOD_PASSWORD;

interface Options {
  mode: "ai" | "programmatic";
  inputDir: string;
  outputDir: string;
  dryRun: boolean;
  slug?: string;
  quality: number;
}

interface PlayMeta {
  slug: string;
  title: string;
  subtitle?: string;
  tags: string[];
  pattern?: string;
  cover?: { src?: string; alt?: string };
  coverWide?: { src?: string; alt?: string };
}

function parseArgs(): Options {
  const args = process.argv.slice(2);
  const get = (key: string, fallback: string) => {
    const found = args.find((a) => a.startsWith(`${key}=`));
    return found ? found.slice(key.length + 1) : fallback;
  };
  const has = (key: string) => args.includes(key);

  return {
    mode: (get("--mode", "ai") as "ai") || "ai",
    inputDir: get("--input-dir", "imgs/compressed"),
    outputDir: get("--output-dir", "public/plays"),
    dryRun: has("--dry-run"),
    slug: get("--slug", ""),
    quality: Number.parseInt(get("--quality", "80"), 10),
  };
}

async function loadPlays(): Promise<PlayMeta[]> {
  const playsDir = path.join(process.cwd(), "content", "plays");
  const entries = await fs.readdir(playsDir, { withFileTypes: true });
  const plays: PlayMeta[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const metaPath = path.join(playsDir, entry.name, "meta.json");
    try {
      const raw = await fs.readFile(metaPath, "utf8");
      const meta = JSON.parse(raw) as PlayMeta;
      meta.slug = entry.name;
      plays.push(meta);
    } catch {
      // ignore
    }
  }

  return plays.sort((a, b) => a.slug.localeCompare(b.slug));
}

async function loadImages(inputDir: string): Promise<{ vertical: string[]; horizontal: string[] }> {
  const dir = path.resolve(process.cwd(), inputDir);
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = entries
    .filter((e) => e.isFile() && /\.(png|jpg|jpeg|webp|gif)$/i.test(e.name))
    .map((e) => path.join(dir, e.name))
    .sort();

  const vertical: string[] = [];
  const horizontal: string[] = [];

  for (const file of files) {
    const metadata = await sharp(file).metadata();
    const w = metadata.width ?? 0;
    const h = metadata.height ?? 0;
    if (w > h) {
      horizontal.push(file);
    } else {
      vertical.push(file);
    }
  }

  return { vertical, horizontal };
}

async function login(): Promise<string> {
  if (!MOD_PASSWORD) {
    throw new Error("请在 .env.local 中配置 MOD_PASSWORD");
  }

  const res = await fetch(`${SITE_URL}/api/mod/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: MOD_PASSWORD }),
  });

  if (!res.ok) {
    throw new Error(`登录失败：${res.status} ${await res.text()}`);
  }

  const setCookie = res.headers.get("set-cookie") ?? "";
  const match = /mod_session=([^;]+)/.exec(setCookie);
  if (!match) {
    throw new Error("无法获取登录 cookie");
  }

  return `mod_session=${match[1]}`;
}

async function imageToBase64(filePath: string, quality: number): Promise<{ base64: string; mimeType: string }> {
  const ext = path.extname(filePath).toLowerCase();
  const mimeType = ext === ".png" ? "image/png" : ext === ".gif" ? "image/gif" : "image/webp";

  // AI 接口对图片尺寸和体积敏感，先缩放到 360px 宽，再转 webp 降低体积
  const buffer = await sharp(filePath)
    .resize(360, 480, { fit: "inside", withoutEnlargement: true })
    .webp({ quality })
    .toBuffer();

  return { base64: buffer.toString("base64"), mimeType: "image/webp" };
}

async function generateAiCover(
  cookie: string,
  imagePath: string,
  title: string,
  quality: number,
): Promise<string> {
  const { base64, mimeType } = await imageToBase64(imagePath, quality);

  const res = await fetch(`${SITE_URL}/api/ai/generate-cover`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookie,
    },
    body: JSON.stringify({
      imageBase64: base64,
      mimeType,
      title,
      style: "sketch",
    }),
  });

  const data = (await res.json()) as { ok?: boolean; svg?: string; error?: string };
  if (!res.ok || !data.ok) {
    throw new Error(data.error || `AI 生成失败：${res.status}`);
  }

  return data.svg || "";
}

// 玩法 slug → 手绘图形的精确映射。
// 优先按帖子主题直接指定图形，避免纯关键词推断带来的不相关。
const slugToSketchType: Record<string, SketchSvgType> = {
  "2048-variant-probability-control": "blocks",        // 数字方块合成
  "clicker-feedback-and-inflation": "tap",             // 点击反馈
  "drag-idle-manual-vs-offline": "sun",                // 放置/离线收益
  "finite-state-machine-for-combat": "flow-process",   // 状态机流程
  "gacha-pity-and-psychology": "gem",                  // 抽卡/宝石
  "grid-movement-and-collision": "grid",               // 网格移动
  "infinite-upgrades-cost-curves": "arrow",            // 升级曲线
  "line-connect-scoring-and-limits": "line",           // 连线
  "match-3-retention-and-pacing": "gem",               // 三消宝石
  "merge-chain-and-gates": "blocks",                   // 合成
  "merge-level-core-loop": "blocks",                   // 合成
  "meta-progression-permanent-growth": "skull",        // Roguelike 成长
  "multiple-endings-triggers-and-guidance": "flow-decision", // 多分支
  "one-stroke-generation-and-grading": "line",         // 一笔画
  "path-planning-pseudo-puzzle": "arrow",              // 路径规划
  "physics-cut-hit-test-and-performance": "line",      // 物理切割
  "play-1677a241": "blocks",                           // 合成
  "pull-the-pin-punish-and-fake-difficulty": "puzzle", // 拉针解谜
  "random-affixes-pool-and-scaling": "card",           // 装备词条
  "random-events-balance-and-pity": "dice",            // 随机事件
  "roguelike-horde-density-and-readability": "skull",  // 肉鸽割草
  "roguelike-level-pools-and-builds": "skull",         // 肉鸽 Build
  "skill-draft-weights-and-protection": "card",        // 技能选择
  "sliding-puzzle-3d-photo": "puzzle",                 // 滑块拼图
  "spot-the-difference-design-and-anti-skip": "note",  // 找不同/便签对比
  "survival-countdown-design": "clock",                // 生存倒计时
  "talent-tree-real-choice-and-respec": "lightbulb",   // 天赋树
  "tap-dodge-forgiveness-and-speed": "tap",             // 点击躲避
  "td-waves-and-ai-scaling": "tower",                  // 塔防
  "wave-defense-difficulty-curve": "tower",            // 波次防守
};

function chooseSketchType(meta: PlayMeta): SketchSvgType {
  const explicit = slugToSketchType[meta.slug];
  if (explicit) return explicit;

  const tags = new Set(meta.tags.map((t) => t.toLowerCase()));
  const title = meta.title.toLowerCase();

  if (tags.has("消除") || title.includes("match")) return "gem";
  if (tags.has("合成") || title.includes("merge")) return "blocks";
  if (tags.has("放置") || title.includes("idle")) return "sun";
  if (tags.has("点击") || title.includes("click")) return "gamepad";
  if (tags.has("roguelike") || title.includes("rogue")) return "skull";
  if (tags.has("塔防") || title.includes("tower") || title.includes("defense")) return "tower";
  if (tags.has("跑酷") || title.includes("run") || title.includes("dodge")) return "runner";
  if (tags.has("卡牌") || title.includes("deck") || title.includes("draft")) return "card";
  if (tags.has("物理") || title.includes("physics")) return "blocks";
  if (tags.has("解谜") || title.includes("puzzle")) return "puzzle";
  if (title.includes("state") || title.includes("状态机")) return "flow-process";
  if (title.includes("talent") || title.includes("天赋")) return "lightbulb";
  if (title.includes("gacha") || title.includes("抽卡")) return "gem";

  const defaults: SketchSvgType[] = ["note", "star", "sparkle", "question-mark", "lightbulb"];
  const idx = meta.slug.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % defaults.length;
  return defaults[idx];
}

function generateProgrammaticCover(meta: PlayMeta): string {
  const type = chooseSketchType(meta);
  // 内容区 420×294，加上 8px padding，最终输出 436×310。
  // 比例仍接近 4:3，但图形在画布中占比更大，缩小到卡片尺寸时更清晰。
  return generateSketchSvg({
    type,
    width: 420,
    height: 294,
    padding: 8,
    roughness: 2,
    stroke: "#202020",
    strokeWidth: 3,
    fill: "#faf7ef",
    fillStyle: "hachure",
  });
}

function generateProgrammaticCoverWide(meta: PlayMeta): string {
  const type = chooseSketchType(meta);
  return generateSketchSvg({
    type,
    width: 420,
    height: 294,
    padding: 8,
    roughness: 2,
    stroke: "#202020",
    strokeWidth: 3,
    fill: "#faf7ef",
    fillStyle: "hachure",
  });
}

function postProcessSvg(svg: string, width: number, height: number): string {
  // 输出统一为 436×310 的 4:3 横版，图形占比更大
  if (!svg.includes("viewBox")) {
    svg = svg.replace(
      /<svg/,
      `<svg viewBox="0 0 436 310" width="436" height="310"`,
    );
  }
  return svg;
}

async function updateMetaJson(slug: string, coverPath: string, coverWidePath?: string) {
  const metaPath = path.join(process.cwd(), "content", "plays", slug, "meta.json");
  const raw = await fs.readFile(metaPath, "utf8");
  const meta = JSON.parse(raw) as PlayMeta;

  meta.cover = { src: coverPath, alt: meta.title };
  if (coverWidePath) {
    meta.coverWide = { src: coverWidePath, alt: meta.title };
  }

  await fs.writeFile(metaPath, JSON.stringify(meta, null, 2) + "\n", "utf8");
}

async function main() {
  const opts = parseArgs();
  const plays = await loadPlays();
  const targetPlays = opts.slug ? plays.filter((p) => p.slug === opts.slug) : plays;

  if (targetPlays.length === 0) {
    console.log("未找到目标玩法。");
    return;
  }

  let verticalImages: string[] = [];
  let horizontalImages: string[] = [];

  if (opts.mode === "ai") {
    const imgs = await loadImages(opts.inputDir);
    verticalImages = imgs.vertical;
    horizontalImages = imgs.horizontal;
    console.log(`\n找到 ${verticalImages.length} 张竖版图，${horizontalImages.length} 张横版图。`);
    console.log(`目标玩法：${targetPlays.length} 个。\n`);
  }

  if (verticalImages.length < targetPlays.length && opts.mode === "ai") {
    console.warn(`警告：竖版图数量（${verticalImages.length}）少于玩法数量（${targetPlays.length}），将循环复用。`);
  }

  let cookie = "";
  if (opts.mode === "ai") {
    cookie = await login();
    console.log("已登录并获取 cookie。\n");
  }

  const outputRoot = path.resolve(process.cwd(), opts.outputDir);

  for (let i = 0; i < targetPlays.length; i++) {
    const play = targetPlays[i];
    const playDir = path.join(outputRoot, play.slug);
    const coverPath = `/plays/${play.slug}/cover.svg`;
    const coverWidePath = `/plays/${play.slug}/cover-wide.svg`;

    console.log(`[${i + 1}/${targetPlays.length}] ${play.slug}`);

    let coverSvg = "";
    let coverWideSvg = "";

    if (opts.mode === "ai") {
      const imageIndex = i % verticalImages.length;
      const imagePath = verticalImages[imageIndex];
      if (!imagePath) {
        console.log("  跳过：无可用图片");
        continue;
      }
      console.log(`  使用图片：${path.basename(imagePath)}`);

      try {
        coverSvg = await generateAiCover(cookie, imagePath, play.title, opts.quality);
        coverSvg = postProcessSvg(coverSvg, 360, 480);
      } catch (err) {
        console.error(`  AI cover 生成失败：${err instanceof Error ? err.message : String(err)}`);
        console.log("  降级为程序化生成...");
        coverSvg = generateProgrammaticCover(play);
      }

      // 横版图不足时也循环复用
      const wideIndex = i % Math.max(horizontalImages.length, 1);
      if (horizontalImages[wideIndex]) {
        try {
          coverWideSvg = await generateAiCover(cookie, horizontalImages[wideIndex], play.title, opts.quality);
          coverWideSvg = postProcessSvg(coverWideSvg, 480, 360);
        } catch (err) {
          console.error(`  AI coverWide 生成失败：${err instanceof Error ? err.message : String(err)}`);
          coverWideSvg = generateProgrammaticCoverWide(play);
        }
      } else {
        coverWideSvg = generateProgrammaticCoverWide(play);
      }
    } else {
      coverSvg = generateProgrammaticCover(play);
      coverWideSvg = generateProgrammaticCoverWide(play);
    }

    if (!opts.dryRun) {
      await fs.mkdir(playDir, { recursive: true });
      await fs.writeFile(path.join(playDir, "cover.svg"), coverSvg, "utf8");
      await fs.writeFile(path.join(playDir, "cover-wide.svg"), coverWideSvg, "utf8");
      await updateMetaJson(play.slug, coverPath, coverWidePath);
      console.log("  ✓ 已保存 cover.svg / cover-wide.svg 并更新 meta.json");
    } else {
      console.log("  （预览模式，未保存）");
    }

    // AI 模式每次调用后短暂休息，降低速率限制风险
    if (opts.mode === "ai" && i < targetPlays.length - 1) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  console.log("\n✅ 封面生成完成");
  if (opts.dryRun) {
    console.log("（预览模式，未写入文件，去掉 --dry-run 后正式执行）");
  }
}

main().catch((err) => {
  console.error("\n脚本执行失败：", err);
  process.exit(1);
});
