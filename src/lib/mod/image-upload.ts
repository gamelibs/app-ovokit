import { promises as fs } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ALLOWED_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".gif",
  ".svg",
]);

const MAX_UPLOAD_SIZE = 4 * 1024 * 1024;
const MAX_OUTPUT_WIDTH = 1200;
const MAX_OUTPUT_HEIGHT = 1200;
const JPEG_QUALITY = 85;

export function sanitizeImageFilename(name: string): string {
  const base = path.basename(name).replace(/[^a-zA-Z0-9_.\-]/g, "_");
  const ext = path.extname(base).toLowerCase();
  const stem = path.basename(base, ext);
  return `${stem.slice(0, 64)}${ext}`;
}

function assertExtension(ext: string): asserts ext is ".png" | ".jpg" | ".jpeg" | ".webp" | ".gif" | ".svg" {
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    throw new Error(`Unsupported extension: ${ext || "none"}`);
  }
}

/**
 * 处理上传图片：
 * - 限制文件大小（默认 4MB）
 * - 对 png/jpg/webp 进行等比缩放，最大边不超过 1200px
 * - jpg/jpeg 使用 85% 质量压缩
 * - 输出 png 时保留透明通道
 * - svg/gif 原样保存
 */
export async function processUploadedImage(
  file: File,
  targetDir: string
): Promise<{ filename: string; bytes: number }> {
  if (file.size > MAX_UPLOAD_SIZE) {
    throw new Error(`File too large (max ${MAX_UPLOAD_SIZE / 1024 / 1024}MB)`);
  }

  const filename = sanitizeImageFilename(file.name || "image");
  const ext = path.extname(filename).toLowerCase();
  assertExtension(ext);

  if (!ALLOWED_EXTENSIONS.has(ext)) {
    throw new Error(`Unsupported extension: ${ext || "none"}`);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  let outputBuffer: Buffer;
  let outputExt = ext;

  if (ext === ".svg" || ext === ".gif") {
    outputBuffer = buffer;
  } else {
    const pipeline = sharp(buffer).resize(MAX_OUTPUT_WIDTH, MAX_OUTPUT_HEIGHT, {
      fit: "inside",
      withoutEnlargement: true,
    });

    if (ext === ".jpg" || ext === ".jpeg") {
      outputBuffer = await pipeline.jpeg({ quality: JPEG_QUALITY, progressive: true }).toBuffer();
      outputExt = ".jpg";
    } else if (ext === ".png") {
      outputBuffer = await pipeline.png({ compressionLevel: 9 }).toBuffer();
    } else {
      // webp
      outputBuffer = await pipeline.webp({ quality: JPEG_QUALITY }).toBuffer();
    }
  }

  const finalName =
    outputExt !== ext
      ? `${path.basename(filename, ext)}${outputExt}`
      : filename;

  await fs.mkdir(targetDir, { recursive: true });
  const target = path.join(targetDir, finalName);
  await fs.writeFile(target, outputBuffer);

  return { filename: finalName, bytes: outputBuffer.length };
}
