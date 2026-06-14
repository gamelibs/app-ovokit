import { promises as fs } from "node:fs";
import path from "node:path";

export const CODE_EXTS = new Set([
  ".js", ".ts", ".tsx", ".jsx", ".html", ".css", ".json", ".md", ".mdx",
]);

export const SKIP_DIRS = new Set([
  "node_modules", ".next", "dist", "build", ".git", "coverage", ".vscode",
  "public", "out", ".vercel", ".turbo", "playwright-report",
]);

export async function readSourceCode(
  dir: string,
  maxFiles = 20,
  maxBytes = 100_000,
): Promise<{ path: string; content: string }[]> {
  const results: { path: string; content: string }[] = [];
  let totalBytes = 0;

  async function walk(current: string, prefix: string) {
    if (results.length >= maxFiles) return;
    const entries = await fs.readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      if (results.length >= maxFiles) return;
      const name = entry.name;
      if (name.startsWith(".")) continue;
      const full = path.join(current, name);
      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(name)) {
          await walk(full, path.join(prefix, name));
        }
        continue;
      }
      const ext = path.extname(name).toLowerCase();
      if (!CODE_EXTS.has(ext)) continue;
      try {
        const stat = await fs.stat(full);
        if (stat.size > 20_000) continue;
        if (totalBytes + stat.size > maxBytes) continue;
        const content = await fs.readFile(full, "utf8");
        results.push({ path: path.join(prefix, name), content });
        totalBytes += content.length;
      } catch {
        // ignore unreadable files
      }
    }
  }

  await walk(dir, "");
  return results;
}

export function parseJsonFromResponse(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    const match = raw.match(/```json\n?([\s\S]*?)\n?```/);
    if (match) return JSON.parse(match[1]);
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(raw.slice(start, end + 1));
    }
    throw new Error("无法解析 JSON 响应");
  }
}

export function makeImageBlock(
  base64: string,
  mimeType: string,
): {
  type: "image";
  source: {
    type: "base64";
    media_type: "image/png" | "image/jpeg" | "image/webp";
    data: string;
  };
} {
  const mediaType: "image/png" | "image/jpeg" | "image/webp" =
    mimeType === "image/jpeg"
      ? "image/jpeg"
      : mimeType === "image/webp"
        ? "image/webp"
        : "image/png";
  return {
    type: "image",
    source: {
      type: "base64",
      media_type: mediaType,
      data: base64,
    },
  };
}
