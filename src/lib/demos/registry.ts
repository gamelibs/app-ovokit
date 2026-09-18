/**
 * Demo 注册表（唯一真相源）：站点内所有可玩 demo 的归属与寻址。
 *
 * 背景：站点 demo 曾散落在硬编码路径里（/embed/demos/archetype/{key} 等），
 * 无从回答"哪些玩法有 demo、demo 是谁生产的"。本注册表把每条 demo 的来源
 * 显式登记，页面一律经 getDemoEntry() 取地址，禁止再写死路径。
 *
 * 来源分层（治理规则）：
 * - atomic：原子教学 demo（public/demos/atomic/{key}/，手写策展内容，共用 core.js 引擎）
 * - server：服务端 ServerDemoPlayer 兜底（无静态包时的降级渲染）
 * - platform：平台产物包（ovo_system 1022 链路导出的真实游戏静态包）
 */

export type DemoKind = "archetype" | "pattern";
export type DemoSource = "atomic" | "server" | "platform";

export interface DemoEntry {
  key: string;
  kind: DemoKind;
  /** 页面 iframe 地址（/embed/demos/... 路由，由路由层决定 atomic/server 渲染） */
  src: string;
  source: DemoSource;
  note?: string;
}

/** 有静态原子包（public/demos/atomic/{key}/index.html）的键 */
const ATOMIC_ARCHETYPE_KEYS = ["dodge-avoid", "match-clear", "merge-unit", "runner", "timing", "turn-duel"] as const;
const ATOMIC_PATTERN_KEYS = ["management", "narrative"] as const;

const ARCHETYPE_KEYS = [
  "match-clear", "merge-unit", "puzzle", "runner", "dodge-avoid", "shoot-aim",
  "combat", "choice-strategy", "turn-duel", "placement", "physics", "timing",
  "progression", "simulation",
] as const;

const PATTERN_KEYS = ["action", "spatial", "merge", "management", "strategy", "narrative"] as const;

export const DEMO_REGISTRY: DemoEntry[] = [
  ...ARCHETYPE_KEYS.map((key) => ({
    key,
    kind: "archetype" as const,
    src: `/embed/demos/archetype/${key}`,
    source: (ATOMIC_ARCHETYPE_KEYS as readonly string[]).includes(key) ? "atomic" as const : "server" as const,
  })),
  ...PATTERN_KEYS.map((key) => ({
    key,
    kind: "pattern" as const,
    src: `/embed/demos/pattern/${key}`,
    source: (ATOMIC_PATTERN_KEYS as readonly string[]).includes(key) ? "atomic" as const : "server" as const,
  })),
];

export function getDemoEntry(kind: DemoKind, key: string): DemoEntry | null {
  return DEMO_REGISTRY.find((e) => e.kind === kind && e.key === key) ?? null;
}

/** 页面取 demo 地址：注册表内 → src；未注册 → null（调用方决定显示兜底或隐藏） */
export function getDemoSrc(kind: DemoKind, key: string): string | null {
  return getDemoEntry(kind, key)?.src ?? null;
}
