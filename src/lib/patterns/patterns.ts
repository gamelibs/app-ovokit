/**
 * 5 种核心玩法原型（Core Gameplay Pattern）
 *
 * 这是从编辑器架构角度对小游戏的归纳，与 12 种母型玩法（Archetype）并存：
 * - 母型：面向学习者，回答"这是什么玩法感受"
 * - 核心原型：面向实现者，回答"底层循环和数据结构是什么"
 */

export const corePatternKeys = [
  "action",
  "spatial",
  "merge",
  "management",
  "strategy",
] as const;

export type CorePatternKey = (typeof corePatternKeys)[number];

export function isCorePatternKey(v: string): v is CorePatternKey {
  return (corePatternKeys as readonly string[]).includes(v);
}

export type CorePatternMeta = {
  key: CorePatternKey;
  name: string;
  nameEn: string;
  subtitle: string;
  loop: string;
  abstractions: string[];
  cases: string[];
};

export const corePatterns: CorePatternMeta[] = [
  {
    key: "action",
    name: "动作敏捷",
    nameEn: "Action / Dexterity",
    subtitle: "感知 → 操作 → 即时反馈",
    loop: "Input → Avatar → Physics → Score",
    abstractions: ["反应速度", "手眼协调", "实时操作"],
    cases: ["Flappy Bird", "Temple Run", "Fruit Ninja"],
  },
  {
    key: "spatial",
    name: "空间布局",
    nameEn: "Spatial / Puzzle",
    subtitle: "观察 → 思考 → 放置 → 验证",
    loop: "Board → Cell → Rule → State Change",
    abstractions: ["棋盘", "网格", "路径", "位置关系"],
    cases: ["Candy Crush", "2048", "华容道"],
  },
  {
    key: "merge",
    name: "合成成长",
    nameEn: "Merge / Incremental",
    subtitle: "获得 → 合并 → 升级 → 更高产出",
    loop: "Resource → Merge → Level Up → Production",
    abstractions: ["资源", "合并规则", "等级", "产出节拍"],
    cases: ["Merge Dragons!", "Triple Town", "合成大西瓜"],
  },
  {
    key: "management",
    name: "经营模拟",
    nameEn: "Management / Simulation",
    subtitle: "建造 → 生产 → 消耗 → 扩张",
    loop: "Building → Production → Economy → Growth",
    abstractions: ["建筑", "生产链", "经济", "扩张"],
    cases: ["Hay Day", "SimCity BuildIt", "餐厅经营"],
  },
  {
    key: "strategy",
    name: "数值策略",
    nameEn: "Strategy / RPG",
    subtitle: "配置 → 对抗 → 计算 → 成长",
    loop: "Unit → Stats → Combat → Reward",
    abstractions: ["单位", "属性", "战斗", "奖励"],
    cases: ["Clash Royale", "Plants vs. Zombies", "塔防"],
  },
];

export const corePatternByKey: Record<CorePatternKey, CorePatternMeta> =
  Object.fromEntries(corePatterns.map((p) => [p.key, p])) as Record<
    CorePatternKey,
    CorePatternMeta
  >;
