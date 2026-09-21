import { z } from "zod";

/** demo 语言：显式 zh 才中文，其余/缺失一律英文（用户硬规则） */
export type DemoLang = "zh" | "en";

export function pickLang(v: unknown): DemoLang {
  return v === "zh" ? "zh" : "en";
}

/** L(lang, zh, en)：服务端 demo 文案双语包裹 */
export function L(lang: DemoLang, zh: string, en: string): string {
  return lang === "zh" ? zh : en;
}

export const archetypeInitSchema = z.object({
  seed: z.number().int().optional(),
  difficulty: z.enum(["easy", "normal", "hard"]).optional(),
  lang: z.enum(["zh", "en"]).optional(),
});

export type ArchetypeInit = z.infer<typeof archetypeInitSchema>;

export const archetypeActionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("reset") }),
  z.object({ type: z.literal("tick") }),
  z.object({ type: z.literal("primary") }),
  z.object({ type: z.literal("secondary") }),
  z.object({ type: z.literal("choice"), option: z.number().int().min(0).max(8) }),
  z.object({ type: z.literal("set"), key: z.string().min(1), value: z.number() }),
]);

export type ArchetypeAction = z.infer<typeof archetypeActionSchema>;

export type ArchetypeState = {
  seed: number;
  difficulty: "easy" | "normal" | "hard";
  /** 由 init input.lang 写入并随 state 传递（step 的 view 文案按它出文） */
  lang: DemoLang;
  step: number;
  // freeform per demo
  data: Record<string, unknown>;
};

export type DemoControl =
  | { kind: "button"; label: string; action: ArchetypeAction }
  | { kind: "choices"; label: string; options: string[] }
  | { kind: "slider"; label: string; key: string; min: number; max: number; step?: number; value: number };

export type ArchetypeView = {
  title: string;
  goal: string;
  status: string[];
  metrics: Array<{ label: string; value: string }>;
  controls: DemoControl[];
};

/** 公共控件（重开/推进/难度/难度滑块）双语标签 */
export function commonControlLabels(lang: DemoLang) {
  return {
    reset: L(lang, "重开", "Restart"),
    tick: L(lang, "推进 1 步", "Advance 1 Step"),
    difficulty: L(lang, "难度", "Difficulty"),
    difficultySlider: L(lang, "难度(滑块)", "Difficulty (slider)"),
  };
}

export function normalizeDifficulty(v: ArchetypeInit["difficulty"]): ArchetypeState["difficulty"] {
  return v ?? "normal";
}

export function toSeed(seed: number | undefined, fallback: number) {
  const n = typeof seed === "number" && Number.isFinite(seed) ? Math.floor(seed) : fallback;
  return Math.max(1, n);
}

// Deterministic pseudo-random generator
export function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    // xorshift32
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 1_000_000) / 1_000_000;
  };
}

