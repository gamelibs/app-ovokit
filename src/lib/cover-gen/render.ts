import sharp from "sharp";
import { composeCoverSvg } from "./compose";

/**
 * SVG → webp 渲染（小尺寸多档）。
 */

export const COVER_SIZES = {
  /** 卡片封面 480×360 */
  card: { width: 480, height: 360, quality: 78 },
  /** 卡片 Retina 2x */
  card2x: { width: 960, height: 720, quality: 75 },
  /** 详情头图 600×450 */
  wide: { width: 600, height: 450, quality: 78 },
} as const;

export async function renderCoverWebp(
  slug: string,
  archetype: string,
  size: keyof typeof COVER_SIZES,
  variant = 0,
): Promise<Buffer> {
  const svg = composeCoverSvg(slug, archetype, variant);
  const { width, height, quality } = COVER_SIZES[size];
  return sharp(Buffer.from(svg), { density: 150 })
    .resize(width, height, { fit: "fill" })
    .webp({ quality })
    .toBuffer();
}

/** 从帖子标签推断母型（首命中优先；fallback puzzle） */
const TAG_TO_ARCHETYPE: [RegExp, string][] = [
  [/回合博弈|棋盘/, "turn-duel"],
  [/消除/, "match-clear"],
  [/合成/, "merge-unit"],
  [/躲避/, "dodge-avoid"],
  [/跑酷|行进/, "runner"],
  [/射击/, "shoot-aim"],
  [/战斗/, "combat"],
  [/策略|塔防/, "choice-strategy"],
  [/物理/, "physics"],
  [/解谜|找茬|滑块/, "puzzle"],
  [/成长|数值|点击|放置产出|idle/i, "progression"],
  [/模拟/, "simulation"],
  [/时机|节奏/, "timing"],
  [/建造|放置/, "placement"],
];

export function inferArchetypeFromTags(tags: string[], slug = ""): string {
  const hay = [...tags, slug].join("|");
  for (const [re, key] of TAG_TO_ARCHETYPE) {
    if (re.test(hay)) return key;
  }
  return "puzzle";
}
