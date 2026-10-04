import taxonomy from "@/lib/taxonomy/taxonomy.json";

/**
 * 站点统一标签词表（唯一真相源 = ovo-taxonomy 协议，由 scripts/sync-taxonomy.mjs 同步）。
 *
 * 分层：
 * - 行为母型标签：14 个（archetype 中文名）
 * - 玩法特征标签：8 个（feature 中文名）
 * - 运营标记：推荐 / 热门（仅运营用，不属于玩法分类）
 *
 * 旧标签（废弃）通过 LEGACY_TAG_MAP 在显示层自动映射为新名，不动 meta.json 原数据。
 */

type TaxonomyDoc = {
  archetypes: { key: string; name: string }[];
  features: { key: string; name: string }[];
};

const doc = taxonomy as unknown as TaxonomyDoc;

/** 行为母型标签（14） */
export const TAG_ARCHETYPES: string[] = doc.archetypes.map((a) => a.name);

/** 玩法特征标签（8） */
export const TAG_FEATURES: string[] = doc.features.map((f) => f.name);

/** 运营标记（非玩法分类，单独分组） */
export const TAG_OPS = ["推荐", "热门"] as const;

/** 全部可选标签（行为母型 + 玩法特征 + 运营标记） */
export const availablePlayTags = [...TAG_ARCHETYPES, ...TAG_FEATURES, ...TAG_OPS] as const;

/** 兼容旧类型（历史上是 const 联合类型；现在放宽为 string，词表由上方常量约束） */
export type PlayTag = string;

/**
 * 旧标签 → 新标签映射（显示层使用，不改原数据）。
 * 依据：taxonomy/mappings/site-tags.v1.json 的消歧规则。
 */
export const LEGACY_TAG_MAP: Record<string, string> = {
  战斗: "战斗对抗",
  放置: "放置产出",
  "放置 / 建造": "建造布局",
  塔防: "建造布局", // 塔防 = 建造+战斗组合，主标签归建造布局
  数值: "数值成长",
  行进跑酷: "行进 / 跑酷",
  时机反应: "时机 / 反应",
  成长数值: "成长 / 数值",
};

/**
 * 废弃标签（显示层直接隐藏，不动原数据）：
 * - 动作：pattern 层概念，已由 meta.pattern 表达，不应再做玩法标签
 * - 状态机 / 生成：工程实现概念，不属于玩法标签
 */
export const LEGACY_DROP_TAGS = ["动作", "状态机", "生成"];

/** 显示用规范化：旧标签 → 新名；未收录的标签原样返回（兼容历史数据） */
export function normalizeTag(tag: string): string {
  return LEGACY_TAG_MAP[tag] ?? tag;
}

/** 规范化一组标签：映射 + 隐藏废弃标签 + 去重（保持顺序） */
export function normalizeTags(tags: string[]): string[] {
  const out: string[] = [];
  for (const t of tags) {
    if (LEGACY_DROP_TAGS.includes(t)) continue;
    const n = normalizeTag(t);
    if (!out.includes(n)) out.push(n);
  }
  return out;
}

/** 是否运营标记（用于展示层区分玩法标签与运营标签） */
export function isOpsTag(tag: string): boolean {
  return (TAG_OPS as readonly string[]).includes(tag);
}

/** 表单可选标签分组（分组全量可选） */
export const TAG_GROUPS: { label: string; tags: string[] }[] = [
  { label: "行为母型", tags: TAG_ARCHETYPES },
  { label: "玩法特征", tags: TAG_FEATURES },
  { label: "运营标记", tags: [...TAG_OPS] },
];

/** 标签英文标签表（键 = 规范化后的中文标签名，与 taxonomy 中文名对齐） */
export const TAG_LABELS_EN: Record<string, string> = {
  // 14 行为母型
  消除: "Match",
  合成: "Merge",
  解谜: "Puzzle",
  "行进 / 跑酷": "Runner",
  躲避: "Dodge",
  射击: "Shooter",
  战斗对抗: "Combat",
  策略决策: "Strategy",
  回合博弈: "Turn-based",
  建造布局: "Placement",
  物理: "Physics",
  "时机 / 反应": "Timing",
  "成长 / 数值": "Progression",
  模拟: "Simulation",
  // 8 玩法特征
  点击: "Click",
  放置产出: "Idle",
  网格: "Grid",
  关卡: "Levels",
  合成机制: "Merge Mechanic",
  数值成长: "Numbers",
  Roguelike: "Roguelike",
  限时: "Timed",
  // 运营标记
  推荐: "Featured",
  热门: "Hot",
  // 组合/次级标签（存量 meta 原样使用，不入 LEGACY_TAG_MAP，仅补显示名）
  棋盘: "Board",
  回合: "Turn",
};

/**
 * 标签 ja/ko/es/pt 标签表（键集合与 TAG_LABELS_EN 完全一致，一个都不能少）。
 * 术语与各语言语言包（messages/{locale}.json）及 content/*-{locale} 支柱 spec 对齐。
 */
export const TAG_LABELS_I18N: Record<"ja" | "ko" | "es" | "pt", Record<string, string>> = {
  ja: {
    消除: "マッチ",
    合成: "マージ",
    解谜: "パズル",
    "行进 / 跑酷": "ランナー",
    躲避: "回避",
    射击: "シューター",
    战斗对抗: "戦闘",
    策略决策: "戦略",
    回合博弈: "ターンベース対決",
    建造布局: "配置・建設",
    物理: "物理",
    "时机 / 反应": "タイミング",
    "成长 / 数值": "成長 / 数値",
    模拟: "シミュレーション",
    点击: "クリック",
    放置产出: "放置生産",
    网格: "グリッド",
    关卡: "レベル",
    合成机制: "マージメカニクス",
    数值成长: "数値成長",
    Roguelike: "ローグライク",
    限时: "制限時間",
    推荐: "おすすめ",
    热门: "人気",
    棋盘: "ボード",
    回合: "ターン",
  },
  ko: {
    消除: "매치",
    合成: "합성",
    解谜: "퍼즐",
    "行进 / 跑酷": "러너",
    躲避: "회피",
    射击: "슈팅",
    战斗对抗: "전투",
    策略决策: "전략",
    回合博弈: "턴제 대결",
    建造布局: "배치 / 건설",
    物理: "물리",
    "时机 / 反应": "타이밍",
    "成长 / 数值": "성장 / 수치",
    模拟: "시뮬레이션",
    点击: "클릭",
    放置产出: "방치 생산",
    网格: "그리드",
    关卡: "스테이지",
    合成机制: "합성 메커니즘",
    数值成长: "수치 성장",
    Roguelike: "로그라이크",
    限时: "시간 제한",
    推荐: "추천",
    热门: "인기",
    棋盘: "보드",
    回合: "턴",
  },
  es: {
    消除: "Combinar",
    合成: "Fusión",
    解谜: "Puzle",
    "行进 / 跑酷": "Runner",
    躲避: "Esquiva",
    射击: "Disparos",
    战斗对抗: "Combate",
    策略决策: "Estrategia",
    回合博弈: "Duelo por turnos",
    建造布局: "Posicionamiento",
    物理: "Física",
    "时机 / 反应": "Ritmo",
    "成长 / 数值": "Crecimiento numérico",
    模拟: "Simulación",
    点击: "Clic",
    放置产出: "Idle",
    网格: "Cuadrícula",
    关卡: "Niveles",
    合成机制: "Mecánica de fusión",
    数值成长: "Crecimiento numérico",
    Roguelike: "Roguelike",
    限时: "Contrarreloj",
    推荐: "Recomendado",
    热门: "Popular",
    棋盘: "Tablero",
    回合: "Turno",
  },
  pt: {
    消除: "Combinar",
    合成: "Fusão",
    解谜: "Quebra-cabeça",
    "行进 / 跑酷": "Corrida",
    躲避: "Esquiva",
    射击: "Tiro",
    战斗对抗: "Combate",
    策略决策: "Estratégia",
    回合博弈: "Duelo por turnos",
    建造布局: "Posicionamento",
    物理: "Física",
    "时机 / 反应": "Timing",
    "成长 / 数值": "Crescimento numérico",
    模拟: "Simulação",
    点击: "Clique",
    放置产出: "Idle",
    网格: "Grade",
    关卡: "Fases",
    合成机制: "Mecânica de fusão",
    数值成长: "Crescimento numérico",
    Roguelike: "Roguelike",
    限时: "Tempo limitado",
    推荐: "Recomendado",
    热门: "Em alta",
    棋盘: "Tabuleiro",
    回合: "Turno",
  },
};

/**
 * 搜索索引专用别名（不进显示层，键集合独立于 TAG_LABELS_EN，不受其约束）：
 * 存量 meta 里的旧标签在显示层会被 normalize/drop，但搜索时用户按本地化热词
 * （如 ja タワーディフェンス / es Números）应能命中这些原始标签携带的内容。
 * 值为追加进搜索文档文本的 token（可含空格分隔多个词）。
 */
export const TAG_SEARCH_ALIASES_I18N: Record<"en" | "ja" | "ko" | "es" | "pt", Record<string, string>> = {
  en: {
    塔防: "Tower Defense",
    动作: "Action",
    放置: "Idle",
    数值: "Numbers",
    状态机: "State Machine",
    生成: "Generation",
    战斗: "Combat",
    消除: "Match-3",
  },
  ja: {
    塔防: "タワーディフェンス",
    动作: "アクション",
    放置: "放置",
    数值: "数値",
    状态机: "ステートマシン",
    生成: "生成",
    战斗: "戦闘",
    消除: "マッチ3",
  },
  ko: {
    塔防: "타워 디펜스",
    动作: "액션",
    放置: "방치",
    数值: "수치",
    状态机: "상태 머신",
    生成: "생성",
    战斗: "전투",
    消除: "매치3",
  },
  es: {
    塔防: "Tower defense",
    动作: "Acción",
    放置: "Idle",
    数值: "Números",
    状态机: "Máquina de estados",
    生成: "Generación",
    战斗: "Combate",
  },
  pt: {
    塔防: "Tower defense",
    动作: "Ação",
    放置: "Idle",
    数值: "Números",
    状态机: "Máquina de estados",
    生成: "Geração",
    战斗: "Combate",
  },
};

/**
 * 一组原始标签的搜索别名 token（搜索索引用）：
 * 每个原始标签取 显示层本地化名 + 旧标签别名（当前 locale 与 en），去重保序。
 * zh-CN 返回空数组（中文原文已在搜索文本里）。
 */
export function searchAliasesForTags(tags: string[], locale: string): string[] {
  if (locale === "zh-CN") return [];
  const out: string[] = [];
  const push = (v: string | undefined) => {
    if (!v) return;
    for (const token of v.split(/\s+/).filter((t) => /[\p{L}\p{N}]/u.test(t))) {
      if (!out.includes(token)) out.push(token);
    }
  };
  const aliasTable = TAG_SEARCH_ALIASES_I18N[locale as keyof typeof TAG_SEARCH_ALIASES_I18N];
  for (const raw of tags) {
    if (isDroppedTag(raw)) {
      // 废弃标签显示层隐藏，但搜索仍应能命中（别名表有值才加）
      push(aliasTable?.[raw]);
      push(TAG_SEARCH_ALIASES_I18N.en[raw]);
      continue;
    }
    push(localizeTag(raw, locale));
    if (locale !== "en") push(localizeTag(raw, "en"));
    push(aliasTable?.[raw]);
    if (locale !== "en") push(TAG_SEARCH_ALIASES_I18N.en[raw]);
  }
  return out;
}

/** 是否废弃标签（显示层隐藏） */
export function isDroppedTag(tag: string): boolean {
  return LEGACY_DROP_TAGS.includes(tag);
}

/** 显示用本地化：先规范化（旧标签映射），再按 locale 出对应语言标签；查不到回退英文表再回退原名；废弃标签返回空串（调用方隐藏） */
export function localizeTag(tag: string, locale: string): string {
  if (isDroppedTag(tag)) return "";
  const normalized = normalizeTag(tag);
  if (locale === "zh-CN") return normalized;
  if (locale !== "en") {
    const table = TAG_LABELS_I18N[locale as keyof typeof TAG_LABELS_I18N];
    const hit = table?.[normalized];
    if (hit) return hit;
  }
  return TAG_LABELS_EN[normalized] ?? normalized;
}

export function localizeTags(tags: string[], locale: string): string[] {
  return normalizeTags(tags).map((t) => localizeTag(t, locale));
}

/** 难度中文值 → 英文（数据存量为中文，仅显示层转换） */
export const DIFFICULTY_LABELS_EN: Record<string, string> = {
  入门: "Beginner",
  进阶: "Advanced",
  硬核: "Hardcore",
};

/** 难度 ja/ko/es/pt 标签表（键覆盖 zh 与 en 存量值——en 目录难度记英文，回退命中时也需本地化） */
export const DIFFICULTY_LABELS_I18N: Record<"ja" | "ko" | "es" | "pt", Record<string, string>> = {
  ja: { 入门: "入門", 进阶: "中級", 硬核: "ハードコア", Beginner: "入門", Advanced: "中級", Hardcore: "ハードコア" },
  ko: { 入门: "초급", 进阶: "고급", 硬核: "하드코어", Beginner: "초급", Advanced: "고급", Hardcore: "하드코어" },
  es: { 入门: "Principiante", 进阶: "Avanzado", 硬核: "Hardcore", Beginner: "Principiante", Advanced: "Avanzado", Hardcore: "Hardcore" },
  pt: { 入门: "Iniciante", 进阶: "Avançado", 硬核: "Hardcore", Beginner: "Iniciante", Advanced: "Avançado", Hardcore: "Hardcore" },
};

export function localizeDifficulty(value: string, locale: string): string {
  if (locale === "zh-CN") return value;
  if (locale !== "en") {
    const hit = DIFFICULTY_LABELS_I18N[locale as keyof typeof DIFFICULTY_LABELS_I18N]?.[value];
    if (hit) return hit;
  }
  return DIFFICULTY_LABELS_EN[value] ?? value;
}
