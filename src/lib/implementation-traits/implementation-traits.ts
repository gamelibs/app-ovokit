/**
 * 工程实现特征（Implementation Trait）
 *
 * 工程实现特征描述一款游戏在工程层面的实现特点（如程序化生成、状态机驱动），
 * 与玩法行为/核心循环/玩法特征正交，来源于 ovo_system taxonomy.v1.json
 * implementationTraits 层。原「玩法特征」中的 generation / state-machine
 * 已于 2026-09-20 迁入本层（路由 /implementation-traits/{key}）。
 *
 * key 列表是代码常量（稳定分类），文案内容从
 * `content/implementation-traits/<key>/meta.json` 读取，便于版主后续在线管理。
 */

export const implementationTraitKeys = [
  "generation",
  "state-machine",
] as const;

export type ImplementationTraitKey = (typeof implementationTraitKeys)[number];

export function isImplementationTraitKey(v: string): v is ImplementationTraitKey {
  return (implementationTraitKeys as readonly string[]).includes(v);
}

export type ImplementationTraitCombo = {
  formula: string;
  effect: string;
  href?: string;
};

export type ImplementationTraitMeta = {
  key: ImplementationTraitKey;
  name: string;
  nameEn: string;
  subtitle: string;
  concept: string;
  role: string;
  significance: string;
  filterTags: string[];
  cases: string[];
  problemsSolved: string[];
  learningGoals: string[];
  minimalRules: string[];
  combos: ImplementationTraitCombo[];
  advancedWarnings: string[];
  advancedAlgoRefs: string[];
};

export const fallbackImplementationTraits: ImplementationTraitMeta[] = [
  {
    key: "generation",
    name: "生成",
    nameEn: "Generation",
    subtitle: "用程序化方法创造游戏内容",
    concept:
      "生成特征指通过算法而非手工设计来创造关卡、地图、敌人、道具等内容。它让每次游戏体验都有所不同，大幅提升重玩价值。生成的本质是「有约束的随机」：纯随机产出的是噪声，加入规则与校验后才成为内容。实践中常用的技术包括噪声函数地形、房间-走廊地牢、约束求解与波函数坍缩。生成设计的核心矛盾是可控性与新鲜感的平衡——太可控，玩家很快看穿套路；太随机，又会出现无趣或不公平的局面。因此成熟的生成系统一定附带验证机制，先证明内容可玩，再交给玩家。",
    role:
      "生成用于解决内容生产瓶颈，为玩家提供无限变化。它是 Roguelike、开放世界和沙盒游戏的核心技术特征。",
    significance:
      "掌握生成特征，有助于理解随机性、约束满足和涌现设计。它是从“固定内容”走向“无限内容”的关键。",
    filterTags: ["生成"],
    cases: ["Minecraft", "Spelunky", "No Man's Sky"],
    problemsSolved: [
      "降低手工内容生产成本",
      "通过随机性提升重玩价值",
      "创造涌现式的玩家故事",
    ],
    learningGoals: [
      "掌握噪声、图分区和约束求解等生成技术",
      "设计可控的随机性参数",
      "平衡随机内容与玩家公平性",
    ],
    minimalRules: [
      "存在算法化的内容生成过程",
      "生成结果需要可玩/有效",
      "玩家能感受到每次体验的不同",
    ],
    combos: [
      { formula: "生成 + 关卡", effect: "每次进入关卡布局不同" },
      { formula: "生成 + Roguelike", effect: "用随机遗物和地图构建多样性" },
      { formula: "生成 + 数值", effect: "动态调整难度与奖励" },
    ],
    advancedWarnings: [
      "纯随机生成可能产生无趣或不公平的结果",
      "生成内容需要验证机制确保可玩",
      "生成算法复杂度过高会影响性能",
    ],
    advancedAlgoRefs: [
      "Perlin/Simplex 噪声与地形生成",
      "房间-走廊地牢生成",
      "约束满足与波函数坍缩",
    ],
  },
  {
    key: "state-machine",
    name: "状态机",
    nameEn: "State Machine",
    subtitle: "用状态切换驱动角色或系统行为",
    concept:
      "状态机特征强调角色、敌人或游戏系统在不同状态之间的切换。每个状态有明确的进入条件、行为和退出条件，使复杂行为变得可预测、可调试。它是 AI、角色控制和全局流程管理的基础工程结构：菜单到对局到结算的切换是状态机，敌人的巡逻/追击/攻击循环也是状态机。状态机最大的敌人是状态膨胀——当状态数量上去后，迁移条件互相冲突、调试困难，此时应考虑层级状态机或行为树。判断一个系统该不该用状态机，标准只有一个：它的行为能否被拆成有限个「互斥且明确」的阶段。",
    role:
      "状态机用于管理复杂行为逻辑，让玩家和开发者都能理解“当前在什么阶段、会发生什么”。它是 AI、角色控制和流程管理的基础。",
    significance:
      "掌握状态机特征，有助于理解状态模式、行为树和事件驱动架构。它是从简单脚本走向复杂系统的必经之路。",
    filterTags: ["状态机"],
    cases: ["Dark Souls 敌人 AI", "Hollow Knight", "格斗游戏"],
    problemsSolved: [
      "把复杂行为拆分为可管理的状态",
      "让角色/敌人行为可预测且可扩展",
      "防止多条件判断导致的逻辑混乱",
    ],
    learningGoals: [
      "设计有限状态机（FSM）",
      "掌握状态切换条件与回调",
      "用层级状态机或行为树扩展复杂度",
    ],
    minimalRules: [
      "系统/角色有有限个明确状态",
      "状态之间有明确的切换条件",
      "每个状态定义特定的行为",
    ],
    combos: [
      { formula: "状态机 + AI", effect: "让敌人表现出有节奏的攻击/巡逻/受击行为" },
      { formula: "状态机 + 动画", effect: "用状态驱动动画切换，保证一致性" },
      { formula: "状态机 + 流程", effect: "管理游戏全局流程（菜单→游戏→结算）" },
    ],
    advancedWarnings: [
      "状态过多时 FSM 会变得难以维护",
      "状态切换条件冲突可能导致死锁",
      "复杂 AI 建议迁移到行为树或分层 FSM",
    ],
    advancedAlgoRefs: [
      "有限状态机（FSM）实现",
      "层级状态机（HFSM）",
      "行为树与状态机结合",
    ],
  },
];

export const fallbackImplementationTraitByKey: Record<
  ImplementationTraitKey,
  ImplementationTraitMeta
> = Object.fromEntries(
  fallbackImplementationTraits.map((t) => [t.key, t])
) as Record<ImplementationTraitKey, ImplementationTraitMeta>;
