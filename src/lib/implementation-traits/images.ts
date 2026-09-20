import { promises as fs } from "node:fs";
import path from "node:path";
import {
  isImplementationTraitKey,
  type ImplementationTraitKey,
} from "@/lib/implementation-traits/implementation-traits";

export async function listImplementationTraitImages(
  key: ImplementationTraitKey
): Promise<string[]> {
  if (!isImplementationTraitKey(key)) return [];
  const dir = path.join(process.cwd(), "public", "implementation-traits", key);
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
