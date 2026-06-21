import { promises as fs } from "node:fs";
import path from "node:path";
import { isPlayArchetypeKey, type PlayArchetypeKey } from "@/lib/archetypes/archetypes";

export async function listArchetypeImages(key: PlayArchetypeKey): Promise<string[]> {
  if (!isPlayArchetypeKey(key)) return [];
  const dir = path.join(process.cwd(), "public", "archetypes", key);
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
