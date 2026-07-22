/**
 * 平台游戏数据 → 发帖表单草稿的映射（阶段 3）。
 * 数据来源：ovo_system 平台管理 1021（ovoforge-v1 exportProfile）导出的 siteData。
 * 原则：全部字段来自真实导出数据；文章骨架按母型差异化（不同 archetype 章节结构不同）。
 */

export type PlatformGameListItem = {
  gameId: string;
  nameEn: string;
  nameZh: string | null;
  engine: string;
  env: string;
  previewUrl: string;
  hasSiteData: boolean;
  classification: { archetype: string | null; archetypeName: string | null; pattern: string | null } | null;
};

export type SiteData = {
  profile: string;
  game: { gameId: string; nameEn: string; nameZh: string | null; engine: string; env: string };
  intro: { essence: string; whatYouDo: string; howYouWin: string };
  classification: {
    archetype: string | null;
    archetypeName: string | null;
    pattern: string | null;
    primitives: string[];
    features: string[];
  };
  behaviorLoop: string;
  modulesUsed: { id: string; capability: string | null; role: string | null }[];
  dataStructures: Record<string, { type: string; initial: unknown; description?: string }>;
  coreParams: { primitive: string; key: string; range?: string; default: unknown; actual: unknown }[];
  keyCode: { title: string; lang: string; code: string; note: string }[];
  demo: { previewUrl: string; protocol: string[] };
  cover: { candidates: string[] };
  seoSeed: { uniqueAngles: string[] };
};

export type PlayDraft = {
  title: string;
  subtitle: string;
  slug: string;
  difficulty: "入门" | "进阶" | "硬核";
  pattern: string;
  tags: string[];
  techStack: string[];
  corePoints: string[];
  breakdown: { title: string; bullets: string[] }[];
  codeSnippets: { title: string; language: string; code: string }[];
  iframeSrc: string;
  demoNote: string;
  articleMdx: string;
  /** 血缘：该帖子由哪个平台游戏导入（一游戏一帖子的唯一性约束依据） */
  source: { platformId: string; gameId: string };
};

const FEATURE_NAME: Record<string, string> = {
  click: "点击", idle: "放置产出", grid: "网格", levels: "关卡",
  "merge-mechanic": "合成机制", numbers: "数值成长", roguelike: "Roguelike", timed: "限时",
};

const PRIMITIVE_NAME: Record<string, string> = {
  collision: "碰撞判定", compare: "比较大小", eliminate: "消除", match: "匹配连线",
  physics: "物理模拟", turn: "轮流行动", place: "放置落子", move: "移动",
  aim: "瞄准", "timing-window": "把握时机", choose: "做选择", accumulate: "累积成长",
  merge: "合并升级", spawn: "生成补充", simulate: "系统演化",
};

const ENGINE_NAME: Record<string, string> = {
  pixijs: "PixiJS", phaser: "Phaser", cocos: "Cocos", threejs: "Three.js",
};

function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

const ARCHETYPE_DIFFICULTY: Record<string, PlayDraft["difficulty"]> = {
  "turn-duel": "入门", "match-clear": "入门", timing: "入门",
  puzzle: "进阶", physics: "进阶", combat: "进阶", simulation: "进阶",
  runner: "入门", "dodge-avoid": "入门", "shoot-aim": "进阶",
  "choice-strategy": "进阶", placement: "入门", progression: "入门", "merge-unit": "入门",
};

/** 文章骨架：按母型差异化章节（反模板同质化的第一层：结构差异） */
function buildArticleMdx(gameName: string, sd: SiteData): string {
  const { intro, classification, behaviorLoop, modulesUsed, coreParams, keyCode, seoSeed } = sd;
  const primNames = classification.primitives.map((p) => PRIMITIVE_NAME[p] || p);
  const paramRows = coreParams
    .slice(0, 6)
    .map((p) => `| ${p.key} | ${String(p.actual)} | ${p.range ?? "-"} |`)
    .join("\n");
  const paramTable = paramRows
    ? `\n\n| 参数 | 本游戏取值 | 可调范围 |\n|---|---|---|\n${paramRows}`
    : "";
  const codeSection = keyCode.length
    ? `\n\n## 关键代码\n\n${keyCode
        .map((k) => `### ${k.title}\n\n\`\`\`${k.lang}\n${k.code}\n\`\`\`\n\n> ${k.note}`)
        .join("\n\n")}`
    : "";
  const angles = seoSeed.uniqueAngles.length
    ? `\n\n## 设计要点\n\n${seoSeed.uniqueAngles.map((a) => `- ${a}`).join("\n")}`
    : "";
  const modulesSection = modulesUsed.length
    ? `\n\n## 它是怎么拼出来的\n\n这个游戏由 ${modulesUsed.length} 个公共模块组成：\n\n${modulesUsed
        .map((m) => `- **${m.id}**${m.role ? `：${m.role}` : ""}`)
        .join("\n")}\n\n> 同一批模块换个规则，就是另一个游戏——这就是模块化的意义。`
    : "";

  const head = `# ${gameName}：${intro.essence}\n\n> 一句话本质：**${intro.essence}**。\n`;

  // 母型差异化结构
  if (classification.archetype === "turn-duel") {
    return `${head}
## 这个游戏怎么玩

${intro.whatYouDo}。${intro.howYouWin}。

**行为循环**：${behaviorLoop}

## 规则只有三条，但足够深

${primNames.map((p) => `- **${p}**`).join("\n")}

回合制棋盘的魅力在于：规则极简，但每一步都要想「我下这，对手下哪」。${paramTable}${modulesSection}${codeSection}${angles}

## 你能学到什么

- 棋盘类游戏的最小状态机（boot → menu → gameplay → result）
- 胜负判定如何写成纯函数（好测试、好复用）
- AI 对手其实就是「对手模型」的强度选择
`;
  }

  // 默认结构（其它母型）
  return `${head}
## 这个游戏怎么玩

${intro.whatYouDo}。${intro.howYouWin}。

**行为循环**：${behaviorLoop}

## 行为规则拆解

它由这些行为原语组成：${primNames.join("、")}。  
每个原语都对应一个可复用的公共模块——换个游戏，它们还会再出现。${paramTable}${modulesSection}${codeSection}${angles}

## 你能学到什么

- 这个游戏的核心行为规则与判定方式
- 同样的规则如何用公共模块拼出来
`;
}

export function buildPlayDraftFromSiteData(sd: SiteData, previewUrl: string): PlayDraft {
  const gameName = sd.game.nameZh || sd.game.nameEn;
  const cls = sd.classification;
  const primNames = cls.primitives.map((p) => PRIMITIVE_NAME[p] || p).filter(Boolean);

  const tags = [cls.archetypeName, ...cls.features.map((f) => FEATURE_NAME[f] || f)].filter(
    (v): v is string => Boolean(v),
  );

  const techStack = [ENGINE_NAME[sd.game.engine] ?? sd.game.engine, "TypeScript"].filter(Boolean);

  const corePoints = [...primNames.slice(0, 3), ...(sd.seoSeed.uniqueAngles[0] ? [sd.seoSeed.uniqueAngles[0]] : [])];

  const paramBullets = sd.coreParams
    .slice(0, 5)
    .map((p) => `${p.key} = ${String(p.actual)}${p.range ? `（可调 ${p.range}）` : ""}`);

  const breakdown = [
    { title: "玩法目标", bullets: [sd.intro.howYouWin || sd.intro.essence].filter(Boolean) },
    {
      title: "核心循环",
      bullets: [sd.behaviorLoop, sd.intro.whatYouDo].filter(Boolean),
    },
    ...(paramBullets.length ? [{ title: "关键参数", bullets: paramBullets }] : []),
    ...(sd.modulesUsed.length
      ? [{ title: "模块组成", bullets: sd.modulesUsed.map((m) => `${m.id}${m.role ? `：${m.role}` : ""}`) }]
      : []),
  ];

  return {
    title: `${gameName}：${sd.intro.essence}`,
    subtitle: `${sd.intro.whatYouDo}；${sd.intro.howYouWin}`.replace(/。$/, ""),
    slug: slugify(sd.game.nameEn) || `game-${sd.game.gameId}`,
    difficulty: ARCHETYPE_DIFFICULTY[cls.archetype ?? ""] ?? "入门",
    pattern: cls.pattern ?? "",
    tags,
    techStack,
    corePoints,
    breakdown,
    codeSnippets: sd.keyCode.map((k) => ({ title: k.title, language: k.lang, code: k.code })),
    iframeSrc: previewUrl,
    demoNote: sd.intro.essence,
    articleMdx: buildArticleMdx(gameName, sd),
    source: { platformId: "1021", gameId: sd.game.gameId },
  };
}
