/**
 * 图片压缩脚本
 *
 * 将 `imgs/` 目录下的图片压缩为 WebP 格式，输出到 `imgs/compressed/`。
 * 适合把 AI 生成的大图素材压缩为站点可用的小体积资源。
 *
 * 用法：
 *   pnpm tsx scripts/compress-images.ts
 *   pnpm tsx scripts/compress-images.ts --quality=75 --max-width=1024
 *   pnpm tsx scripts/compress-images.ts --output-dir=public/imgs
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import sharp from "sharp";

interface Options {
  inputDir: string;
  outputDir: string;
  quality: number;
  maxWidth: number;
  maxHeight: number;
  inPlace: boolean;
}

function parseArgs(): Options {
  const args = process.argv.slice(2);
  const get = (key: string, fallback: string) => {
    const found = args.find((a) => a.startsWith(`${key}=`));
    return found ? found.slice(key.length + 1) : fallback;
  };
  const has = (key: string) => args.includes(key);

  return {
    inputDir: get("--input-dir", "imgs"),
    outputDir: get("--output-dir", "imgs/compressed"),
    quality: Number.parseInt(get("--quality", "80"), 10),
    maxWidth: Number.parseInt(get("--max-width", "1200"), 10),
    maxHeight: Number.parseInt(get("--max-height", "1200"), 10),
    inPlace: has("--in-place"),
  };
}

const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".avif"]);

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

async function compressImage(inputPath: string, outputPath: string, opts: Options): Promise<{ before: number; after: number } | null> {
  const beforeStat = await fs.stat(inputPath);
  const beforeSize = beforeStat.size;

  const pipeline = sharp(inputPath, { animated: true })
    .rotate() // 自动根据 EXIF 旋转
    .resize(opts.maxWidth, opts.maxHeight, {
      fit: sharp.fit.inside,
      withoutEnlargement: true,
    });

  const ext = path.extname(inputPath).toLowerCase();

  if (ext === ".png" && !opts.inPlace) {
    // PNG 优先转 WebP，体积通常更小；保留透明通道
    await pipeline.webp({ quality: opts.quality, effort: 6 }).toFile(outputPath);
  } else if (ext === ".gif") {
    // GIF 保持 GIF（sharp 对动画支持有限，只取第一帧）
    await pipeline.gif({ effort: 10 }).toFile(outputPath);
  } else {
    // 其他统一输出 WebP
    await pipeline.webp({ quality: opts.quality, effort: 6 }).toFile(outputPath);
  }

  const afterStat = await fs.stat(outputPath);
  const afterSize = afterStat.size;

  return { before: beforeSize, after: afterSize };
}

async function main() {
  const opts = parseArgs();
  const cwd = process.cwd();
  const inputDir = path.resolve(cwd, opts.inputDir);
  const outputDir = opts.inPlace ? inputDir : path.resolve(cwd, opts.outputDir);

  if (!opts.inPlace) {
    await fs.mkdir(outputDir, { recursive: true });
  }

  const entries = await fs.readdir(inputDir, { withFileTypes: true });
  const imageFiles = entries
    .filter((e) => e.isFile() && IMAGE_EXTENSIONS.has(path.extname(e.name).toLowerCase()))
    .map((e) => e.name)
    .sort();

  if (imageFiles.length === 0) {
    console.log(`未在 ${opts.inputDir} 找到可压缩的图片。`);
    return;
  }

  console.log(`\n🖼️  找到 ${imageFiles.length} 张图片，开始压缩...\n`);
  console.log(`配置：quality=${opts.quality} max=${opts.maxWidth}x${opts.maxHeight} output=${opts.outputDir}\n`);

  let totalBefore = 0;
  let totalAfter = 0;
  let success = 0;
  let failed = 0;

  for (const file of imageFiles) {
    const inputPath = path.join(inputDir, file);
    const outputName = opts.inPlace
      ? file.replace(/\.[^.]+$/, ".webp")
      : `${path.parse(file).name}.webp`;
    const outputPath = path.join(outputDir, outputName);

    try {
      const result = await compressImage(inputPath, outputPath, opts);
      if (!result) continue;

      const ratio = ((1 - result.after / result.before) * 100).toFixed(1);
      totalBefore += result.before;
      totalAfter += result.after;
      success += 1;

      console.log(
        `✅ ${file.padEnd(40)} ${formatBytes(result.before).padStart(10)} → ${formatBytes(result.after).padStart(10)} （↓${ratio}%）`,
      );
    } catch (err) {
      failed += 1;
      console.error(`❌ ${file} 压缩失败：`, err instanceof Error ? err.message : String(err));
    }
  }

  const totalRatio = totalBefore > 0 ? ((1 - totalAfter / totalBefore) * 100).toFixed(1) : "0";

  console.log(`\n────────────────────────────────────────`);
  console.log(`成功：${success} 张，失败：${failed} 张`);
  console.log(`原始大小：${formatBytes(totalBefore)}`);
  console.log(`压缩后：  ${formatBytes(totalAfter)}`);
  console.log(`整体节省：${totalRatio}%`);
  console.log(`────────────────────────────────────────\n`);
}

main().catch((err) => {
  console.error("脚本执行失败：", err);
  process.exit(1);
});
