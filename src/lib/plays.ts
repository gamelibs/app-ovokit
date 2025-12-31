export type PlayDifficulty = "入门" | "进阶" | "硬核";

export type PlayTag =
  | "推荐"
  | "移动与空间"
  | "交互与碰撞"
  | "战斗"
  | "战斗与对抗"
  | "合成"
  | "放置"
  | "Roguelike"
  | "塔防"
  | "数值与成长"
  | "规则与状态"
  | "状态机"
  | "随机与生成";

export type PlayCodeSnippet = {
  title: string;
  language: "ts" | "tsx" | "js" | "glsl" | "json";
  code: string;
};

export type PlayDemo = {
  iframeSrc?: string;
  note?: string;
};

export type Play = {
  slug: string;
  title: string;
  subtitle: string;
  tags: PlayTag[];
  difficulty: PlayDifficulty;
  techStack: string[];
  corePoints: string[];
  stats: {
    views: number;
    likes: number;
  };
  breakdown: {
    title: string;
    bullets: string[];
  }[];
  codeSnippets: PlayCodeSnippet[];
  demo: PlayDemo;
};

export const playCategories: { key: string; label: string }[] = [
  { key: "for-you", label: "推荐" },
  { key: "movement", label: "移动与空间" },
  { key: "interaction", label: "交互与碰撞" },
  { key: "combat", label: "战斗与对抗" },
  { key: "numbers", label: "数值与成长" },
  { key: "rules", label: "规则与状态" },
  { key: "random", label: "随机与生成" },
];

const plays: Play[] = [
  {
    slug: "merge-level-core-loop",
    title: "合成 & 升级玩法核心逻辑",
    subtitle: "拆解“合成升级”的节奏、产出与反馈，并给出可复用的数据结构。",
    tags: ["推荐", "合成", "放置", "数值与成长"],
    difficulty: "入门",
    techStack: ["TypeScript", "Next.js", "Canvas(占位)"],
    corePoints: ["合并规则", "产出节奏", "局内反馈"],
    stats: { views: 6780, likes: 5238 },
    breakdown: [
      {
        title: "玩法目标",
        bullets: ["让玩家持续做“更优选择”", "用可视化反馈放大小收益"],
      },
      {
        title: "核心循环",
        bullets: ["产出资源 → 合成升级 → 解锁新单位 → 提升产出"],
      },
      {
        title: "实现要点",
        bullets: [
          "合并表驱动：由配置决定升级结果",
          "可撤销的操作：用事件日志回放",
          "将“节奏”写进数值曲线：每 N 次合成给强反馈",
        ],
      },
    ],
    codeSnippets: [
      {
        title: "合并规则（表驱动）",
        language: "ts",
        code: `type UnitId = string;

type MergeRule = { from: UnitId; to: UnitId; cost: number };

export const mergeRules: MergeRule[] = [
  { from: "u_1", to: "u_2", cost: 2 },
  { from: "u_2", to: "u_3", cost: 2 },
];
`,
      },
    ],
    demo: { note: "MVP 阶段：后续通过 iframe 嵌入可试玩 Demo。" },
  },
  {
    slug: "td-waves-and-ai-scaling",
    title: "塔防波次生成与敌人调度",
    subtitle: "用简单的波次 DSL + 调度器，控制压力曲线与变体组合。",
    tags: ["塔防", "随机与生成", "数值与成长"],
    difficulty: "进阶",
    techStack: ["TypeScript", "状态机(占位)", "Pixi.js(占位)"],
    corePoints: ["波次 DSL", "压力曲线", "刷怪调度"],
    stats: { views: 4502, likes: 378 },
    breakdown: [
      {
        title: "波次结构",
        bullets: ["预热 → 爬坡 → 高潮 → 缓冲", "变体用于制造“识别与对策”"],
      },
      {
        title: "调度策略",
        bullets: ["预算制：每波次按预算选敌人", "节拍器：按节拍分批出怪"],
      },
    ],
    codeSnippets: [
      {
        title: "波次预算（简化）",
        language: "ts",
        code: `type EnemyId = string;
type Enemy = { id: EnemyId; cost: number };

export function pickWave(enemies: Enemy[], budget: number) {
  const picked: Enemy[] = [];
  let remaining = budget;
  for (const enemy of enemies) {
    while (remaining >= enemy.cost) {
      picked.push(enemy);
      remaining -= enemy.cost;
    }
  }
  return picked;
}
`,
      },
    ],
    demo: { note: "MVP：Demo 区先留占位。" },
  },
  {
    slug: "finite-state-machine-for-combat",
    title: "用状态机组织战斗单位行为",
    subtitle: "把单位行为拆成可测试、可组合的状态，减少 if-else 爆炸。",
    tags: ["战斗", "状态机", "规则与状态"],
    difficulty: "进阶",
    techStack: ["TypeScript", "XState(占位)"],
    corePoints: ["行为解耦", "可视化调试", "可扩展性"],
    stats: { views: 4761, likes: 195 },
    breakdown: [
      { title: "为什么需要状态机", bullets: ["复杂行为可读性差", "需求变化导致分支膨胀"] },
      { title: "拆分建议", bullets: ["Idle/Move/Attack/Hitstun/Dead", "状态间用事件驱动"] },
    ],
    codeSnippets: [
      {
        title: "事件驱动（简化）",
        language: "ts",
        code: `type State = "idle" | "move" | "attack";
type Event = { type: "SEE_TARGET" } | { type: "IN_RANGE" } | { type: "LOST_TARGET" };

export function transition(state: State, event: Event): State {
  if (state === "idle" && event.type === "SEE_TARGET") return "move";
  if (state === "move" && event.type === "IN_RANGE") return "attack";
  if (state === "attack" && event.type === "LOST_TARGET") return "idle";
  return state;
}
`,
      },
    ],
    demo: { note: "MVP：后续接入可视化状态机调试器。" },
  },
  {
    slug: "grid-movement-and-collision",
    title: "格子移动与碰撞：从规则到实现",
    subtitle: "用统一的“占用/可达”模型，处理推箱子、位移技能与阻挡。",
    tags: ["移动与空间", "交互与碰撞", "规则与状态"],
    difficulty: "入门",
    techStack: ["TypeScript", "Canvas(占位)"],
    corePoints: ["占用表", "可达性", "碰撞分层"],
    stats: { views: 3810, likes: 612 },
    breakdown: [
      {
        title: "数据模型",
        bullets: ["占用表 occupancy[x,y] → entityId", "层级：地形/单位/投射物"],
      },
      { title: "移动判定", bullets: ["先算意图，再做 resolve", "支持链式推动（可选）"] },
    ],
    codeSnippets: [
      {
        title: "占用表（简化）",
        language: "ts",
        code: `export type Pos = { x: number; y: number };

export class Occupancy {
  private map = new Map<string, string>();
  private key(p: Pos) { return \`\${p.x},\${p.y}\`; }
  get(p: Pos) { return this.map.get(this.key(p)); }
  set(p: Pos, id: string) { this.map.set(this.key(p), id); }
  clear(p: Pos) { this.map.delete(this.key(p)); }
}
`,
      },
    ],
    demo: { note: "MVP：Demo 先留 iframe 容器。" },
  },
];

export function listPlays() {
  return plays;
}

export function getPlayBySlug(slug: string) {
  return plays.find((p) => p.slug === slug) ?? null;
}
