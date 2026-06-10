import { promises as fs } from "node:fs";
import path from "node:path";
import type { PlayArchetypeKey } from "@/lib/archetypes/archetypes";

export type ArchetypeImageKind = "hero" | "interaction" | "rule" | "advanced";

const extensions = ["svg", "webp", "png", "jpg", "jpeg"] as const;

async function firstExistingPublicAssetPath(relativePaths: string[]) {
  for (const rel of relativePaths) {
    const abs = path.join(process.cwd(), "public", rel);
    try {
      await fs.access(abs);
      return `/${rel}`.replaceAll("//", "/");
    } catch {
      continue;
    }
  }
  return null;
}

export async function getArchetypeImageSrc(key: PlayArchetypeKey, kind: ArchetypeImageKind) {
  const candidates = extensions.map((ext) => `archetypes/${key}/${kind}.${ext}`);
  return await firstExistingPublicAssetPath(candidates);
}

export async function getArchetypeImageSet(key: PlayArchetypeKey) {
  const [hero, interaction, rule, advanced] = await Promise.all([
    getArchetypeImageSrc(key, "hero"),
    getArchetypeImageSrc(key, "interaction"),
    getArchetypeImageSrc(key, "rule"),
    getArchetypeImageSrc(key, "advanced"),
  ]);
  return { hero, interaction, rule, advanced };
}

