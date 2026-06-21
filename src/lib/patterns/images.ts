import { promises as fs } from "node:fs";
import path from "node:path";
import { isCorePatternKey, type CorePatternKey } from "@/lib/patterns/patterns";

export async function listPatternImages(key: CorePatternKey): Promise<string[]> {
  if (!isCorePatternKey(key)) return [];
  const dir = path.join(process.cwd(), "public", "patterns", key);
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    return entries
      .filter((e) => e.isFile())
      .map((e) => e.name)
      .filter((name) => /\.(png|jpe?g|webp|gif|svg)$/i.test(name))
      .sort();
  } catch {
    return [];
  }
}
