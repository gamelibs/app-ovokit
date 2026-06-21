/**
 * 5 种核心玩法原型（Core Gameplay Pattern）
 *
 * 这是从编辑器架构角度对小游戏的归纳，与 12 种母型玩法（Archetype）并存：
 * - 母型：面向学习者，回答"这是什么玩法感受"
 * - 核心原型：面向实现者，回答"底层循环和数据结构是什么"
 *
 * 注意：核心原型的 key 列表是代码常量（稳定分类），但文案内容从
 * `content/patterns/<key>/meta.json` 读取，便于版主后续在线管理。
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

export type CorePatternCombo = {
  formula: string;
  effect: string;
  href?: string;
};

export type CorePatternMeta = {
  key: CorePatternKey;
  name: string;
  nameEn: string;
  subtitle: string;
  /** 概念定义：这个核心玩法是什么，强调底层结构与循环 */
  concept: string;
  /** 作用：它在游戏设计中解决什么问题、提供什么体验 */
  role: string;
  /** 意义：为什么这个模式值得学习，对开发者有什么长期价值 */
  significance: string;
  /** 底层循环的极简表达 */
  loop: string;
  /** 关键抽象/数据结构/机制 */
  abstractions: string[];
  /** 经典案例 */
  cases: string[];
  /** 这个模式擅长解决的设计问题 */
  problemsSolved: string[];
  /** 学习这个模式后应掌握的能力 */
  learningGoals: string[];
  /** 最小可玩规则集 */
  minimalRules: string[];
  /** 系统循环的口语化提示 */
  systemLoopHint: string;
  /** 常见组合与变体 */
  combos: CorePatternCombo[];
  /** 高级设计警告 */
  advancedWarnings: string[];
  /** 相关算法/技术参考 */
  advancedAlgoRefs: string[];
};

/**
 * 默认元数据（用于 content/patterns/<key>/meta.json 缺失时的回退）。
 * 正常运行时应优先从文件读取，见 `src/lib/patterns/spec.ts`。
 */
export const fallbackCorePatterns: CorePatternMeta[] = [
  {
    key: "action",
    name: "动作反应",
    nameEn: "Action",
    subtitle: "感知 → 操作 → 即时反馈",
    concept:
      "动作反应模式关注玩家输入与游戏世界之间的实时反馈。它的核心在于：玩家通过连续、高频的操作（点击、滑动、按键）控制一个或多个实体，在动态环境中躲避障碍、击中目标或完成节奏性动作。其底层结构通常包含输入采样、角色/物体状态、物理或伪物理更新、碰撞检测、分数或生存结算。",
    role:
      "这个模式用于制造紧张感和心流体验。它把玩家的反应速度、预判能力和操作精度直接转化为游戏表现，是最直观、最易于上手的玩法类型之一。在超休闲和街机类游戏中，动作反应模式几乎构成了全部体验。",
    significance:
      "掌握动作反应模式，意味着理解“输入延迟”“碰撞容忍”“难度曲线”等关键设计维度。它是学习实时系统、物理模拟、动画与反馈同步的最佳入口，也是许多复杂玩法（平台跳跃、弹幕射击、节奏游戏）的基础。",
    loop: "Input → Avatar → Physics → Score",
    abstractions: ["反应速度", "手眼协调", "实时操作", "碰撞检测", "输入窗口"],
    cases: ["Flappy Bird", "Temple Run", "Fruit Ninja", "Geometry Dash"],
    problemsSolved: [
      "用最短的反馈循环让玩家立刻理解“我做了什么”",
      "通过速度、密度和节奏变化制造持续紧张感",
      "用简单的单指/单键操作降低上手门槛",
    ],
    learningGoals: [
      "理解输入采样、帧更新与渲染的时序关系",
      "掌握碰撞盒、命中判定与容错设计",
      "设计可扩展的速度/密度难度曲线",
    ],
    minimalRules: [
      "玩家控制一个可移动实体",
      "场景中持续生成障碍物或目标",
      "碰撞/命中会触发即时反馈（得分、失败、特效）",
      "游戏速度或障碍密度随时间递增",
    ],
    systemLoopHint:
      "读取输入 → 更新玩家/物体状态 → 检测碰撞 → 触发反馈 → 结算分数/生存状态 → 进入下一帧",
    combos: [
      { formula: "动作 + 收集", effect: "在躲避/击打之外增加资源目标，改变玩家优先级" },
      { formula: "动作 + 成长", effect: "把表现分数转化为永久升级，延长生命周期" },
      { formula: "动作 + 节奏", effect: "用音乐节拍统一操作窗口，形成“音游”体验" },
    ],
    advancedWarnings: [
      "输入延迟和碰撞判定过严会迅速劝退玩家",
      "纯随机障碍可能产生无解局面，需引入可控生成算法",
      "速度提升过快会让心流变成焦虑，注意难度节奏",
    ],
    advancedAlgoRefs: [
      "固定时间步与帧无关物理更新",
      "AABB / 圆形碰撞检测与空间划分优化",
      "程序化障碍生成与难度曲线控制",
    ],
  },
  {
    key: "spatial",
    name: "空间规划",
    nameEn: "Spatial",
    subtitle: "观察 → 思考 → 放置 → 验证",
    concept:
      "空间规划模式以棋盘、网格、路径或位置关系为核心数据结构。玩家通过观察局面、推断规则、执行移动/交换/放置操作，使系统从当前状态迁移到目标状态。它的乐趣来自“我找到了”的瞬间——在有限的空间约束中发现最优或唯一解。",
    role:
      "这个模式用于把抽象规则具象化为可观察、可操作的空间结构。它让玩家用视觉和空间直觉代替复杂计算，是解谜、消除、合成、路径规划等众多玩法的底层骨架。空间规划游戏通常规则简单但状态空间巨大，容易产生“易上手、难精通”的特质。",
    significance:
      "空间规划模式是理解状态机、搜索算法、组合爆炸和启发式评估的天然教具。开发者可以从中学习如何把复杂的逻辑问题转化为直观的网格操作，以及如何用关卡设计而非代码难度来控制体验曲线。",
    loop: "Board → Cell → Rule → State Change",
    abstractions: ["棋盘", "网格", "路径", "位置关系", "状态空间"],
    cases: ["Candy Crush", "2048", "华容道", "Tetris"],
    problemsSolved: [
      "把抽象规则转化为玩家可以“看见”的空间操作",
      "用有限格子制造丰富的组合与约束",
      "通过局面变化提供持续的新鲜感，而不依赖复杂叙事",
    ],
    learningGoals: [
      "掌握网格/图数据结构及其遍历算法",
      "设计清晰且可扩展的规则判定系统",
      "用关卡生成与难度分级控制玩家体验",
    ],
    minimalRules: [
      "定义游戏空间（网格、棋盘、区域）",
      "定义可交互元素及其放置/移动规则",
      "定义胜负或得分判定条件",
      "每次操作后根据规则更新空间状态",
    ],
    systemLoopHint:
      "观察局面 → 选择操作 → 应用规则 → 更新空间状态 → 判定目标 → 生成新局或下一关",
    combos: [
      { formula: "空间 + 消除", effect: "通过匹配规则制造即时反馈与连锁爽感" },
      { formula: "空间 + 合成", effect: "把位置策略与资源升级结合，形成长期目标" },
      { formula: "空间 + 限制", effect: "用步数、时间或区域约束提升决策密度" },
    ],
    advancedWarnings: [
      "状态空间爆炸可能导致求解或生成困难，需要启发式或约束求解",
      "规则过于复杂会让玩家失去直觉，保持“一眼可懂”",
      "死局检测与提示机制对留存至关重要",
    ],
    advancedAlgoRefs: [
      "二维数组/图表示与 BFS/DFS 遍历",
      "连通块检测与形态匹配",
      "回溯/约束满足问题（CSP）求解",
    ],
  },
  {
    key: "merge",
    name: "合成成长",
    nameEn: "Merge / Incremental",
    subtitle: "获得 → 合并 → 升级 → 更高产出",
    concept:
      "合成成长模式以“低等级资源通过规则合并为高等级资源”为核心循环。玩家不断获得基础单位，按照相同类型或特定配方进行合并，从而解锁更高等级、更强能力或更大产出。它的底层是一种指数或多项式增长曲线，配合等待、决策与惊喜感。",
    role:
      "这个模式用于制造持续的成长感和收藏欲。它把“做小事→得大奖”的反馈放大，并通过升级链条让玩家始终有下一个目标。合成成长非常适合超休闲和中度休闲游戏，也常作为经营、RPG 中的子系统出现。",
    significance:
      "掌握合成成长模式，意味着理解经济曲线、稀缺性设计和进度心理学。开发者可以学习如何用简单的合并规则产生复杂的长期目标，以及如何避免“前期爽、后期肝”的数值陷阱。",
    loop: "Resource → Merge → Level Up → Production",
    abstractions: ["资源", "合并规则", "等级", "产出节拍", "成长曲线"],
    cases: ["Merge Dragons!", "Triple Town", "合成大西瓜", "Cookie Clicker"],
    problemsSolved: [
      "用低频率操作维持高粘性（放置+定时回收）",
      "通过等级链条提供清晰的长期目标",
      "把随机掉落与玩家选择结合，制造惊喜与策略",
    ],
    learningGoals: [
      "设计可扩展的等级/合成配方表",
      "掌握成本曲线、产出曲线与经济平衡",
      "实现自动产出、离线收益与进度保存",
    ],
    minimalRules: [
      "存在可收集的基础资源/单位",
      "相同或符合规则的单位可以合并为更高等级",
      "高等级单位带来更高产出或更强能力",
      "产出或解锁新内容需要等待或主动操作",
    ],
    systemLoopHint:
      "获得资源 → 选择合并对象 → 触发升级 → 提升产出/解锁内容 → 回收资源 → 循环",
    combos: [
      { formula: "合成 + 放置", effect: "让玩家即使离线也能获得成长，降低日活压力" },
      { formula: "合成 + 任务", effect: "用目标引导玩家合并特定单位，避免漫无目的" },
      { formula: "合成 + 空间", effect: "把合并与棋盘位置结合，增加布局策略" },
    ],
    advancedWarnings: [
      "成长曲线过陡会让后期内容遥不可及，过缓则失去爽感",
      "随机掉落若缺乏保底机制，容易产生负面体验",
      "离线收益需要防止被刷取，需设计上限或验证机制",
    ],
    advancedAlgoRefs: [
      "指数/多项式成本与产出曲线设计",
      "随机掉落表与伪随机分布（保底、池子）",
      "离线进度计算与状态同步",
    ],
  },
  {
    key: "management",
    name: "经营模拟",
    nameEn: "Management / Simulation",
    subtitle: "建造 → 生产 → 消耗 → 扩张",
    concept:
      "经营模式以资源的生产、转换、消耗和扩张为核心。玩家通过建造设施、配置生产线、管理库存与需求，逐步扩大自己的“帝国”。它的乐趣来自系统效率的优化——用更少的资源、更短的时间产出更多价值，并看到规模不断增长。",
    role:
      "这个模式用于满足玩家的规划欲、控制欲和成就感。它把现实世界中的经营逻辑抽象为可玩的系统，让玩家在低风险环境中体验“从0到1再到100”的扩张过程。经营模式常常是长周期、高留存游戏的核心。",
    significance:
      "掌握经营模式，意味着理解资源流、瓶颈分析、供需平衡和正反馈循环。它是学习系统动力学、经济模拟和沙盒设计的最佳场景，也是把简单玩法扩展为深度体验的关键。",
    loop: "Building → Production → Economy → Growth",
    abstractions: ["建筑", "生产链", "经济", "扩张", "供需平衡"],
    cases: ["Hay Day", "SimCity BuildIt", "餐厅经营", "Factorio"],
    problemsSolved: [
      "把长期目标拆解为可管理的阶段性建造计划",
      "用资源约束制造有意义的决策",
      "通过扩张和升级提供持续的成长感",
    ],
    learningGoals: [
      "设计生产链、库存与消耗系统",
      "掌握经济平衡与通货膨胀/紧缩控制",
      "用事件、任务和升级维持长期目标感",
    ],
    minimalRules: [
      "玩家可以建造/升级生产设施",
      "设施消耗资源并产出产品或货币",
      "资源有上限或需要被消耗/出售",
      "扩张需要付出成本并解锁新内容",
    ],
    systemLoopHint:
      "建造设施 → 投入资源 → 等待/加速生产 → 获得产出 → 出售/消耗 → 投资扩张 → 解锁新链",
    combos: [
      { formula: "经营 + 时间管理", effect: "用等待和加速创造付费点，同时保持免费进度" },
      { formula: "经营 + 订单系统", effect: "用外部需求引导生产优先级，增加目标感" },
      { formula: "经营 + 随机事件", effect: "通过市场波动或灾害打破稳定，制造挑战" },
    ],
    advancedWarnings: [
      "经济系统容易失控，需设计 sinks（消耗口）防止通货膨胀",
      "生产链过长会让玩家感到疲惫，提供自动化或 shortcut",
      "纯数值扩张容易乏味，需配合视觉/叙事/社交反馈",
    ],
    advancedAlgoRefs: [
      "资源流图与生产链模拟",
      "库存上限、供需曲线与价格弹性",
      "离线收益与跨会话状态恢复",
    ],
  },
  {
    key: "strategy",
    name: "策略成长",
    nameEn: "Strategy",
    subtitle: "配置 → 对抗 → 计算 → 成长",
    concept:
      "策略成长模式以单位、属性、技能和对抗规则为核心。玩家通过配置队伍、选择技能、计算伤害与生存，与 AI 或其他玩家进行策略性对抗。它的底层是一套数值模型：生命值、攻击力、防御、速度、特殊效果等属性相互作用，产生可预测但又有变数的战斗结果。",
    role:
      "这个模式用于把玩家的决策深度前置到“战前配置”和“战中选择”。它强调资源分配、风险评估和对手预测，适合中度策略和 RPG 类游戏。策略成长模式能让简单的战斗场景产生丰富的组合与克制关系。",
    significance:
      "掌握策略成长模式，意味着理解属性设计、战斗公式、克制关系和成长曲线。它是设计 RPG、卡牌、塔防、自走棋等中度游戏的基础，也是把“操作”转化为“思考”的关键。",
    loop: "Unit → Stats → Combat → Reward",
    abstractions: ["单位", "属性", "战斗", "奖励", "克制关系"],
    cases: ["Clash Royale", "Plants vs. Zombies", "塔防", "Slay the Spire"],
    problemsSolved: [
      "用有限的单位和技能创造丰富的策略空间",
      "通过数值成长和解锁维持长期动力",
      "用克制与随机让重复战斗保持新鲜感",
    ],
    learningGoals: [
      "设计属性模型与战斗公式（伤害、防御、速度等）",
      "掌握单位平衡、克制关系与 Meta 循环",
      "实现技能系统、Buff/Debuff 与战斗日志",
    ],
    minimalRules: [
      "存在具有属性的战斗单位",
      "单位可以攻击、施放技能或产生效果",
      "战斗结果由属性与规则计算决定",
      "战斗胜利后获得资源、经验或新单位",
    ],
    systemLoopHint:
      "配置队伍/卡组 → 进入战斗 → 选择行动 → 结算属性与效果 → 判定胜负 → 获得奖励与成长",
    combos: [
      { formula: "策略 + Roguelike", effect: "用随机卡牌/遗物放大策略多样性，提升重玩价值" },
      { formula: "策略 + 塔防", effect: "把单位配置与地形利用结合，强调空间策略" },
      { formula: "策略 + 自动战斗", effect: "减少操作负担，突出战前配置和数值理解" },
    ],
    advancedWarnings: [
      "数值崩坏会迅速破坏策略感，需建立清晰的战斗公式和测试矩阵",
      "随机因素过多会让玩家感觉失控，需在“计算”与“惊喜”间平衡",
      "强克制关系容易固化 Meta，需定期调整或引入动态平衡",
    ],
    advancedAlgoRefs: [
      "属性公式与伤害期望计算",
      "回合制/实时战斗状态机",
      "AI 行为树与难度自适应",
    ],
  },
];

export const fallbackCorePatternByKey: Record<CorePatternKey, CorePatternMeta> =
  Object.fromEntries(fallbackCorePatterns.map((p) => [p.key, p])) as Record<
    CorePatternKey,
    CorePatternMeta
  >;
