/**
 * 玩法特征（Feature）
 *
 * 玩法特征是跨行为母型、跨核心循环的横向维度，描述一款游戏在体验或机制上的
 * 显著特点。与玩法行为/核心循环不同，一个玩法可以同时拥有多个特征标签。
 *
 * key 列表是代码常量（稳定分类），与 ovo_system taxonomy.v1.json features 对齐；
 * 文案内容从 `content/features/<key>/meta.json` 读取，便于版主后续在线管理。
 *
 * 工程实现特征（implementation traits，如生成/状态机）已从本层迁出，
 * 见 `src/lib/implementation-traits/`。
 */

export const featureKeys = [
  "click",
  "idle",
  "grid",
  "levels",
  "numbers",
  "merge-mechanic",
  "roguelike",
  "timed",
] as const;

export type FeatureKey = (typeof featureKeys)[number];

export function isFeatureKey(v: string): v is FeatureKey {
  return (featureKeys as readonly string[]).includes(v);
}

export type FeatureCombo = {
  formula: string;
  effect: string;
  href?: string;
};

import type { ArchetypeIntro } from "../archetypes/spec";

export type FeatureMeta = {
  /** 导语（快速认识三小段）；缺省不渲染 */
  intro?: ArchetypeIntro;
  key: FeatureKey;
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
  combos: FeatureCombo[];
  advancedWarnings: string[];
  advancedAlgoRefs: string[];
};

export const fallbackFeatures: FeatureMeta[] = [
  {
    key: "click",
    name: "点击",
    nameEn: "Clicker",
    subtitle: "通过高频点击驱动游戏进程",
    concept:
      "点击特征以玩家的连续点击作为核心输入。每次点击都会产生即时反馈（得分、资源、伤害等），并通过升级把点击效率不断提升。它是超休闲游戏最常见的输入方式之一。点击设计的核心不在「点」本身，而在反馈的节奏与放大：一次点击要有看得见的数值跳动、听得到的音效确认和跟得上的动画反馈，三者同步玩家才确认「操作有效」。当点击收益逐步升级为自动化产出时，玩法自然过渡到放置，形成从主动操作到被动收益的成长弧线，这也是点击类玩法长线留存的基本结构。",
    role:
      "点击用于制造最简单、最直接的反馈循环。它让玩家立刻理解“我做了什么”，并通过反馈密度维持心流。",
    significance:
      "掌握点击特征，有助于理解反馈节奏、点击放大和自动化过渡。它是设计低门槛、高反馈玩法的基础。",
    filterTags: ["点击", "时机 / 反应"],
    cases: ["Cookie Clicker", "Tap Titans", "点杀泰坦"],
    problemsSolved: [
      "用最低的操作成本让玩家进入状态",
      "通过连续反馈维持短时留存",
      "用升级把点击行为转化为长期目标",
    ],
    learningGoals: [
      "设计点击反馈与视觉/音效放大",
      "掌握点击效率升级曲线",
      "引入自动化机制减少疲劳",
    ],
    minimalRules: [
      "玩家通过点击产生资源或效果",
      "点击收益可以升级",
      "存在把点击转化为永久成长的途径",
    ],
    combos: [
      { formula: "点击 + 放置", effect: "主动点击与被动收益互补" },
      { formula: "点击 + 时机", effect: "在特定窗口点击获得加成" },
      { formula: "点击 + 成长", effect: "点击收益永久升级，形成长期目标" },
    ],
    advancedWarnings: [
      "纯点击容易疲劳，需提供自动化或节奏变化",
      "点击收益曲线要避免前期过慢或后期过爆",
      "注意移动端的点击热区与误触",
    ],
    advancedAlgoRefs: [
      "点击冷却与连击判定",
      "自动点击与手动点击收益平衡",
      "暴击/连击概率设计",
    ],
  },
  {
    key: "idle",
    name: "放置产出",
    nameEn: "Idle",
    subtitle: "即使不操作，系统也会持续产出",
    concept:
      "放置特征的核心在于：游戏进程不完全依赖玩家的实时输入，设施、角色或经济系统会在离线或后台持续运转，玩家只需定时回来收取收益并做升级决策。它把时间本身变成了游戏资源——等待越久，回报越丰，但好的设计必须给等待装上「上限」与「加速阀」：上限防止收益无限累积冲垮经济系统，加速阀（广告、道具、付费）把等待转化为可经营的决策点。放置常与点击、合成组合，构成超休闲游戏最经典的长线留存结构。",
    role:
      "放置用于降低玩家的操作压力，让游戏适应碎片化时间。它把“等待”本身变成玩法，并通过加速、翻倍等机制创造付费与策略空间。",
    significance:
      "掌握放置特征，意味着理解时间货币化、离线收益计算和正反馈循环。它是设计长周期、高留存游戏的重要手段。",
    filterTags: ["放置", "放置 / 建造"],
    cases: ["Cookie Clicker", "AdVenture Capitalist", "放置江湖"],
    problemsSolved: [
      "让玩家在碎片时间也能获得成长感",
      "通过等待机制创造加速/付费点",
      "降低操作门槛，扩大受众",
    ],
    learningGoals: [
      "设计离线收益与上限机制",
      "掌握时间加速与付费点设计",
      "用升级链条维持长期目标感",
    ],
    minimalRules: [
      "存在可持续产出的来源",
      "产出可被收取并用于升级",
      "升级会提升产出效率或解锁新内容",
    ],
    combos: [
      { formula: "放置 + 合成", effect: "离线产出资源，上线后合并升级" },
      { formula: "放置 + 经营", effect: "用生产链替代单一产出，增加策略深度" },
      { formula: "放置 + 点击", effect: "让玩家在主动点击和被动收益之间切换" },
    ],
    advancedWarnings: [
      "离线收益过高会消解主动操作的意义",
      "等待时间过长会让玩家流失",
      "需要防止时间作弊与刷取",
    ],
    advancedAlgoRefs: [
      "离线收益公式与上限设计",
      "时间加速与倍率系统",
      "防作弊时间校验",
    ],
  },
  {
    key: "grid",
    name: "网格",
    nameEn: "Grid",
    subtitle: "在规则化的格子空间中进行操作",
    concept:
      "网格特征以二维或三维的规则格子作为游戏空间。元素的位置、移动、匹配和消除都围绕格子展开，玩家凭空间直觉而非复杂计算做决策。网格的价值在于把抽象规则具象成可观察的空间结构：边界即约束，邻接即关系，行列即坐标系。它是消除、合成、解谜、战棋等大量玩法的基础空间形态。设计网格玩法时要尽早定义三件事：格子的数据表示（二维数组或图）、元素在格子中的合法操作、以及基于格子的胜负判定——这三者决定了后续所有系统的扩展方式。",
    role:
      "网格用于把抽象规则具象化为可观察的空间结构。它是消除、合成、解谜、战棋等众多玩法的基础空间形态。",
    significance:
      "掌握网格特征，有助于理解空间数据结构、连通性检测和关卡生成。它是把逻辑问题转化为直观操作的关键。",
    filterTags: ["网格"],
    cases: ["Candy Crush", "2048", "Tetris"],
    problemsSolved: [
      "把规则转化为可视化的空间操作",
      "用有限格子制造丰富的组合",
      "通过局面变化提供持续新鲜感",
    ],
    learningGoals: [
      "使用二维数组或图表示空间",
      "实现连通块检测与匹配判定",
      "设计关卡布局与难度曲线",
    ],
    minimalRules: [
      "定义格子空间及边界",
      "定义元素在格子中的放置/移动规则",
      "定义基于格子的胜负或得分条件",
    ],
    combos: [
      { formula: "网格 + 消除", effect: "通过位置匹配制造即时反馈" },
      { formula: "网格 + 合成", effect: "把空间位置与升级结合" },
      { formula: "网格 + 策略", effect: "用地形和站位增加决策深度" },
    ],
    advancedWarnings: [
      "网格尺寸过大或过小都会影响体验",
      "死局检测与提示机制很重要",
      "状态空间爆炸可能导致生成困难",
    ],
    advancedAlgoRefs: [
      "二维数组遍历与坐标转换",
      "连通块检测（BFS/DFS）",
      "棋盘状态评估与启发式搜索",
    ],
  },
  {
    key: "levels",
    name: "关卡",
    nameEn: "Levels",
    subtitle: "用结构化关卡推进游戏进程",
    concept:
      "关卡特征把游戏内容切分为一个个独立的、难度递增的挑战单元。每个关卡有明确的目标、约束和评分，玩家通过完成关卡解锁后续内容。关卡是控制体验节奏的核心工具：它把漫长的成长线拆成可一口气完成的小目标，让「再来一关」成为最低成本的继续理由。设计关卡时，目标要一句话说清（消除指定元素、限时到达、保护核心），难度要沿「引入机制→组合机制→压力测试」的曲线推进，失败惩罚要轻到玩家愿意立刻重试。关卡还是叙事与教学的天然载体，新机制永远应该先在低压力关卡里教会玩家。",
    role:
      "关卡用于控制玩家体验节奏，把长期目标拆解为可管理的短期挑战。它是叙事、教学和难度曲线设计的核心载体。",
    significance:
      "掌握关卡特征，有助于理解目标设计、难度分级和玩家心理预期。它是从“可玩原型”走向“完整产品”的关键。",
    filterTags: ["关卡"],
    cases: ["Angry Birds", "Candy Crush Saga", "Super Mario"],
    problemsSolved: [
      "把游戏内容组织为可消费的单元",
      "通过难度曲线维持挑战感",
      "用关卡目标引导玩家学习新机制",
    ],
    learningGoals: [
      "设计关卡目标与胜利条件",
      "掌握难度分级与 pacing",
      "用关卡进行教学与机制引入",
    ],
    minimalRules: [
      "每个关卡有明确目标",
      "关卡存在胜利/失败判定",
      "完成关卡可解锁新内容",
    ],
    combos: [
      { formula: "关卡 + 三星评分", effect: "增加重玩价值与精通空间" },
      { formula: "关卡 + 剧情", effect: "用叙事包装挑战，提升沉浸感" },
      { formula: "关卡 + 道具", effect: "在困难关卡提供辅助选择" },
    ],
    advancedWarnings: [
      "关卡难度曲线过陡会劝退玩家",
      "失败惩罚过重会影响体验",
      "关卡设计需考虑不同玩家水平",
    ],
    advancedAlgoRefs: [
      "关卡难度评估与动态调整",
      "程序化关卡生成",
      "玩家表现分析与关卡推荐",
    ],
  },
  {
    key: "numbers",
    name: "数值成长",
    nameEn: "Numbers",
    subtitle: "通过数值成长和平衡驱动体验",
    concept:
      "数值特征关注生命值、攻击力、资源、分数等可量化属性的设计。玩家通过升级、装备、技能等途径提升数值，并在战斗或经济系统中感受数值变化带来的影响。数值是「成长感」的最直接载体：一颗星、一万战力、翻倍的伤害，本质都是把进步翻译成可比较的数字。但数值也是最容易失控的系统——成本曲线过缓会让后期索然无味，过陡会让玩家觉得被卡；战斗公式过透明会被玩家彻底算死，过晦涩又会觉得不公。好的数值设计追求「可感知的成长、可预期的边界、可回滚的平衡」。",
    role:
      "数值用于把抽象的进步感转化为可量化的成长。它是 RPG、策略、经营等中度游戏的核心体验来源。",
    significance:
      "掌握数值特征，意味着理解战斗公式、成本曲线和经济平衡。它是防止游戏崩坏、维持长期吸引力的关键。",
    filterTags: ["数值", "成长 / 数值"],
    cases: ["Diablo", "Clash Royale", "原神"],
    problemsSolved: [
      "把成长感转化为可量化的属性提升",
      "用数值约束制造有意义的选择",
      "通过平衡维持策略空间",
    ],
    learningGoals: [
      "设计属性模型与战斗公式",
      "掌握成本曲线与收益曲线",
      "实现数值平衡与测试矩阵",
    ],
    minimalRules: [
      "存在可成长的数值属性",
      "数值变化会显著影响游戏表现",
      "玩家可以通过选择改变数值走向",
    ],
    combos: [
      { formula: "数值 + 策略", effect: "用数值计算支撑战前配置" },
      { formula: "数值 + Roguelike", effect: "用随机遗物放大数值差异" },
      { formula: "数值 + 社交", effect: "通过排行榜展示数值成就" },
    ],
    advancedWarnings: [
      "数值崩坏会迅速破坏游戏体验",
      "随机因素过多会让玩家失控",
      "数值成长需要与内容消耗速度匹配",
    ],
    advancedAlgoRefs: [
      "战斗公式与期望伤害计算",
      "属性权重与平衡模型",
      "经济 sinks 与 inflation 控制",
    ],
  },
  {
    key: "merge-mechanic",
    name: "合成机制",
    nameEn: "Merge Mechanic",
    subtitle: "把相同或相关的单位合并为更高级的形态",
    concept:
      "合成机制特征强调「低等级资源通过规则合并为高等级资源」的反馈。玩家不断获得基础单位，按照相同类型或特定配方进行合并，解锁更高等级、更强能力或更大产出。它是合成、进化类玩法最直观的外在表现。合成设计的难点在曲线：等级链条太短则很快见顶，太长则后期遥不可及；随机掉落若无保底，玩家会在「就差一个」的挫败中流失；离线收益若没有上限，又会被重度玩家刷穿经济。合成常与网格结合（空间即资源）、与放置结合（离线产出上线合并），是中度休闲游戏长线目标感的支柱机制。",
    role:
      "合成用于制造持续的成长感和收藏欲。它把“做小事→得大奖”的反馈放大，让玩家始终有下一个可解锁目标，非常适合超休闲和中度休闲游戏。",
    significance:
      "掌握合成特征，有助于理解经济曲线、稀缺性设计和进度心理学。开发者可以学习如何用简单的合并规则产生复杂的长期目标，并避免“前期爽、后期肝”的数值陷阱。",
    filterTags: ["合成"],
    cases: ["Merge Dragons!", "Triple Town", "合成大西瓜"],
    problemsSolved: [
      "用低频率操作维持高粘性",
      "通过等级链条提供清晰的长期目标",
      "把随机掉落与玩家选择结合，制造惊喜",
    ],
    learningGoals: [
      "设计可扩展的等级/合成配方表",
      "掌握成本曲线与产出曲线平衡",
      "处理离线收益与进度保存",
    ],
    minimalRules: [
      "存在可收集的基础资源/单位",
      "相同或符合规则的单位可以合并为更高等级",
      "高等级单位带来更高产出或更强能力",
    ],
    combos: [
      { formula: "合成 + 空间", effect: "把合并与棋盘位置结合，增加布局策略" },
      { formula: "合成 + 任务", effect: "用目标引导玩家合并特定单位，避免漫无目的" },
      { formula: "合成 + 放置", effect: "即使离线也能获得成长，降低日活压力" },
    ],
    advancedWarnings: [
      "成长曲线过陡会让后期内容遥不可及",
      "随机掉落若缺乏保底机制容易产生负面体验",
      "离线收益需要设计上限防止被刷取",
    ],
    advancedAlgoRefs: [
      "指数/多项式成本与产出曲线",
      "随机掉落表与伪随机分布",
      "离线进度计算",
    ],
  },
  {
    key: "roguelike",
    name: "Roguelike",
    nameEn: "Roguelike",
    subtitle: "随机地图、永久死亡、逐局成长",
    concept:
      "Roguelike 特征以「随机生成的关卡/遗物/敌人 + 单局内成长 + 失败或通关后重置」为核心。每局游戏都是一次新的冒险，玩家在不断尝试中积累经验与永久解锁。它的精髓在于把失败重新定义为学习：这一局拿到的组合不理想，但下一局的开局池里多了几件新遗物。设计 Roguelike 要管好三样东西：随机组合的多样性（保证每局体验不同）、单局成长的强度（保证局内有爽点）、Meta 解锁的节奏（保证失败后有念想）。随机性必须始终服务于选择，而不是取代选择——玩家输时要能说出「我选错了」，而不是「运气太差」。",
    role:
      "Roguelike 用于制造高重玩价值和“再来一局”的冲动。它把失败重新定义为学习机会，并通过随机组合创造无限策略空间。",
    significance:
      "掌握 Roguelike 特征，有助于理解随机组合、风险回报和 Meta 成长。它是设计高粘性、高重玩价值游戏的重要范式。",
    filterTags: ["Roguelike"],
    cases: ["Hades", "Slay the Spire", "以撒的结合"],
    problemsSolved: [
      "通过随机组合延长游戏生命周期",
      "把失败转化为学习而非惩罚",
      "用单局内成长制造紧张与成就感",
    ],
    learningGoals: [
      "设计随机遗物/卡牌/敌人组合",
      "掌握单局成长与永久解锁的平衡",
      "控制随机性以避免玩家失控",
    ],
    minimalRules: [
      "每局地图/敌人/奖励随机生成",
      "单局内角色会成长，但失败/通关后重置",
      "存在 Meta 解锁让玩家保留部分进度",
    ],
    combos: [
      { formula: "Roguelike + 卡牌", effect: "用牌组构建创造策略多样性" },
      { formula: "Roguelike + 动作", effect: "把操作技巧与随机构建结合" },
      { formula: "Roguelike + 生成", effect: "用程序生成创造无限地图" },
    ],
    advancedWarnings: [
      "随机性过强会让玩家感觉无力",
      "Meta 解锁过慢会降低再开动力",
      "需要防止某些组合过强破坏平衡",
    ],
    advancedAlgoRefs: [
      "Roguelike 地牢生成与房间图",
      "遗物/卡牌池设计与保底机制",
      "难度曲线与玩家胜率平衡",
    ],
  },
  {
    key: "timed",
    name: "限时",
    nameEn: "Timed",
    subtitle: "用明确的时间约束制造紧迫感",
    concept:
      "限时特征以明确的时间约束制造紧迫感。倒计时可以是整局的生存期限，可以是单关的完成时限，也可以是回合内的操作窗口——共同点是迫使玩家在压力下做决策、在风险与收益之间快速权衡。限时是最古老的难度调节器之一：同样的关卡，加倒计时就从「悠闲解谜」变成「紧张挑战」。设计限时要回答三个问题：时间从哪里扣（操作耗时、自然流逝、失误惩罚）、不够时间时玩家能做什么（延长道具、跳过关卡、降低目标）、以及倒计时结束的那一刻给玩家什么反馈（结算展示要让人看到「就差一点」）。好的限时设计制造的是紧张而不是焦虑——玩家输了会想「再快一点」，而不是「不公平」。",
    role:
      "限时用于把松散的玩法收紧成有节奏的体验。它给玩家一个明确的「此刻该做什么」，并把心流维持在略高于舒适区的压力水平上。",
    significance:
      "掌握限时特征，有助于理解压力曲线、失败归因与结算反馈设计。它是调节难度、制造紧张感和运营活动（限时挑战、每日任务）的基础工具。",
    filterTags: ["限时", "时机 / 反应"],
    cases: ["Bejeweled Blitz", "Overcooked", "Candy Crush Saga 限时关卡"],
    problemsSolved: [
      "给松散玩法注入节奏与紧迫感",
      "用时间约束低成本调节难度",
      "制造「就差一点」的重试动机",
    ],
    learningGoals: [
      "设计倒计时与加时机制的平衡",
      "掌握压力曲线与失败归因",
      "设计结算反馈让失败可接受",
    ],
    minimalRules: [
      "存在明确的时间约束（整局/单关/单回合）",
      "时间耗尽或归零触发结算",
      "玩家在时限内达成目标获得奖励",
    ],
    combos: [
      { formula: "限时 + 关卡", effect: "标准关卡的紧张变体，提高重玩价值" },
      { formula: "限时 + 数值", effect: "用时间加成道具创造经济与策略空间" },
      { formula: "限时 + Roguelike", effect: "限时压迫下的路线取舍，放大风险回报" },
    ],
    advancedWarnings: [
      "倒计时压力过强会把心流变成焦虑",
      "时间惩罚要可解释，玩家必须知道时间被什么扣掉",
      "限时活动要考虑不同时区玩家的公平性",
    ],
    advancedAlgoRefs: [
      "倒计时与帧率无关计时",
      "动态难度：剩余时间驱动的帮助机制",
      "限时结算与回放数据记录",
    ],
  },
];

export const fallbackFeatureByKey: Record<FeatureKey, FeatureMeta> = Object.fromEntries(
  fallbackFeatures.map((f) => [f.key, f])
) as Record<FeatureKey, FeatureMeta>;

/**
 * 特征中文名 → key 查找表（覆盖 taxonomy 8 个官方名称）。
 * 用于 archetype 详情页等按名称引用特征的位置解析链接目标。
 */
export const featureKeyByName: Record<string, FeatureKey> = Object.fromEntries(
  fallbackFeatures.map((f) => [f.name, f.key])
) as Record<string, FeatureKey>;

/** taxonomy 特征冻结中文词 → 英文显示名（词表冻结不动，仅显示层本地化；与 taxonomy features 一一对应） */
const FEATURE_NAME_EN_BY_KEY: Record<FeatureKey, string> = {
  click: "Click",
  idle: "Idle",
  grid: "Grid",
  levels: "Levels",
  "merge-mechanic": "Merge Mechanic",
  numbers: "Numbers",
  roguelike: "Roguelike",
  timed: "Timed",
};

/** 特征名的显示层本地化：zh 显示冻结中文词（链接词表），en 显示英文名；未知名原样返回 */
export function localizeFeatureName(name: string, locale: string): string {
  const key = featureKeyByName[name];
  if (!key) return name;
  return locale === "en" ? FEATURE_NAME_EN_BY_KEY[key] : name;
}
