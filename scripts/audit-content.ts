/**
 * 存量内容反推审查（结果反推执行线）
 *
 * 用法：npx tsx scripts/audit-content.ts [--base http://localhost:19600]
 *
 * 四层审查（对齐 ovo_system 上线审查 R1~R9 反推链路的存量版 + 《生产内容注意事项》）：
 *   A 数据层   —— meta.json 字段 / 封面文件 / 正文长度 / demo 资源 / 母型归属 / tag 覆盖
 *   B 渲染层   —— 页面 200 / 单 H1 / title 后缀 / description / demo 可达 / sitemap 覆盖
 *   C 内链层   —— 相关文章非空 / 母型 cluster 非空 / 英文版覆盖
 *   D 指南结构 —— 标准章节存在性 / 正文代码块 / 重复凑长度 / demo 存在性
 *
 * 问题分类（生产线体检的核心产出）：
 *   content-fix   内容修正：改 content/ 文件即可
 *   pipeline-gap  生产线缺陷：该问题应由管线门禁/适配器拦截（附建议 gate code）
 *   blocked-demo  demo iframe 指向 localhost，等静态 demo 导出
 *   site-bug      站点渲染代码问题
 *
 * 阈值对齐管线门禁：gate-structure MIN_BODY_CHARS=800 / MIN_BREAKDOWN_SECTIONS=2；
 * gate-seo-fields description 50~160。taxonomy 与 tag 映射读 ovo_system 真相源。
 * 报告落盘 memory/audits/audit-YYYY-MM-DD.json。
 */

import { promises as fs } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "..");
const OVO_SYSTEM = process.env.OVO_SYSTEM_DIR ?? "/Users/zhanghongqin/work/ovo_system";
const BASE = (process.argv.find((a) => a.startsWith("--base="))?.split("=")[1] ?? "http://localhost:19600").replace(/\/$/, "");

const MIN_BODY_CHARS = 800;
const MIN_BREAKDOWN_SECTIONS = 2;
const DESC_MIN = 50;
const DESC_MAX = 160;

/** 标题黑话黑名单（《生产内容注意事项》§四.1：标题直接说清机制，生造直译词只进正文不进标题） */
const TITLE_JARGON: Array<{ term: string; reason: string }> = [
  { term: "果汁", reason: "juice 的生造直译；应以「游戏感（juice）」形式在正文解释，不进标题" },
];
const CJK_RE = /[\u4e00-\u9fff]/;

type IssueCategory = "content-fix" | "pipeline-gap" | "blocked-demo" | "site-bug";
type Issue = {
  layer: "A" | "B" | "C" | "D";
  category: IssueCategory;
  subject: string;
  code: string;
  detail: string;
  gateCode?: string;
};

const issues: Issue[] = [];
const add = (layer: Issue["layer"], category: IssueCategory, subject: string, code: string, detail: string, gateCode?: string) =>
  issues.push({ layer, category, subject, code, detail, gateCode });

async function readJson(p: string): Promise<any | null> {
  try {
    return JSON.parse(await fs.readFile(p, "utf-8"));
  } catch {
    return null;
  }
}

async function fileExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

function mdxBodyLength(mdx: string): number {
  // 与管线口径一致：去代码块/标记符号后的有效字符数
  return mdx
    .replace(/```[\s\S]*?```/g, "")
    .replace(/[#>*`\-|[\]()!]/g, "")
    .replace(/\s+/g, "").length;
}

async function fetchText(url: string): Promise<{ status: number; body: string }> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    return { status: res.status, body: await res.text() };
  } catch {
    return { status: 0, body: "" };
  }
}

async function headStatus(url: string): Promise<number> {
  try {
    const res = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(10000) });
    return res.status;
  } catch {
    return 0;
  }
}

/* ─── 主流程 ─── */

async function main() {
  console.log(`存量内容反推审查  base=${BASE}\n`);

  // taxonomy 真相源
  const taxonomy = await readJson(path.join(OVO_SYSTEM, "taxonomy/taxonomy.v1.json"));
  const mappings = await readJson(path.join(OVO_SYSTEM, "taxonomy/mappings/site-tags.v1.json"));
  if (!taxonomy || !mappings) {
    console.error(`无法读取 ovo_system taxonomy（OVO_SYSTEM_DIR=${OVO_SYSTEM}）`);
    process.exit(1);
  }
  const archetypeKeys = new Set<string>((taxonomy.archetypes ?? []).map((a: any) => a.key));
  const tagMap: Record<string, any> = mappings.tagToTaxonomy ?? {};
  const inferArchetype = (tags: string[]): string | null => {
    for (const t of tags) {
      const e = tagMap[t];
      if (e?.archetype) return e.archetype;
      if (e?.resolve?.archetype) return e.resolve.archetype;
    }
    return null;
  };

  const playsDir = path.join(ROOT, "content/plays");
  const slugs = (await fs.readdir(playsDir, { withFileTypes: true })).filter((e) => e.isDirectory()).map((e) => e.name);
  const plays: Array<{ slug: string; meta: any; mdx: string | null }> = [];

  /* ─── A 数据层 ─── */
  for (const slug of slugs) {
    const dir = path.join(playsDir, slug);
    const meta = await readJson(path.join(dir, "meta.json"));
    if (!meta) {
      add("A", "content-fix", slug, "meta-missing", "meta.json 缺失或 JSON 解析失败");
      continue;
    }
    const mdxPath = path.join(dir, "article.mdx");
    const mdx = (await fileExists(mdxPath)) ? await fs.readFile(mdxPath, "utf-8") : null;
    plays.push({ slug, meta, mdx });

    // A1 必填字段
    for (const f of ["title", "subtitle", "difficulty"] as const) {
      if (!meta[f] || !String(meta[f]).trim()) add("A", "pipeline-gap", slug, `field-${f}`, `meta.${f} 为空`, "gate-seo-fields");
    }
    if (!Array.isArray(meta.tags) || meta.tags.length === 0) add("A", "pipeline-gap", slug, "field-tags", "tags 为空", "gate-structure");
    if (!Array.isArray(meta.techStack) || meta.techStack.length === 0) add("A", "content-fix", slug, "field-techStack", "techStack 为空");
    if (!Array.isArray(meta.corePoints) || meta.corePoints.length === 0) add("A", "content-fix", slug, "field-corePoints", "corePoints 为空");
    if (!Array.isArray(meta.breakdown) || meta.breakdown.length < MIN_BREAKDOWN_SECTIONS)
      add("A", "pipeline-gap", slug, "breakdown-short", `breakdown ${meta.breakdown?.length ?? 0} 段（要求 ≥${MIN_BREAKDOWN_SECTIONS}）`, "gate-structure:breakdown");
    if (!Array.isArray(meta.codeSnippets) || meta.codeSnippets.length === 0) add("A", "content-fix", slug, "codeSnippets-empty", "codeSnippets 为空（页面「关键代码」区块将空）");

    // A2 subtitle 长度（页面 description 来源）
    const desc = String(meta.subtitle ?? "");
    if (desc.length < DESC_MIN || desc.length > DESC_MAX)
      add("A", "pipeline-gap", slug, "description-length", `subtitle 长度 ${desc.length}（要求 ${DESC_MIN}~${DESC_MAX}）`, "gate-seo-fields:description-length");

    // A2b 标题黑话（§四.1：标题直接说清机制）
    const title = String(meta.title ?? "");
    for (const { term, reason } of TITLE_JARGON) {
      if (title.includes(term))
        add("A", "content-fix", slug, "title-jargon", `标题含「${term}」：${reason}`, "gate-seo-fields:title-jargon");
    }

    // A3 封面文件
    for (const key of ["cover", "coverWide"] as const) {
      const src = meta[key]?.src;
      if (!src) {
        add("A", "content-fix", slug, `cover-${key}-missing`, `meta.${key}.src 为空`);
        continue;
      }
      if (src.startsWith("/") && !(await fileExists(path.join(ROOT, "public", src))))
        add("A", "content-fix", slug, `cover-${key}-404`, `封面文件不存在：public${src}`);
    }

    // A4 正文
    if (!mdx) add("A", "content-fix", slug, "article-missing", "article.mdx 缺失");
    else if (mdxBodyLength(mdx) < MIN_BODY_CHARS)
      add("A", "pipeline-gap", slug, "body-too-short", `正文有效字数 ${mdxBodyLength(mdx)}（要求 ≥${MIN_BODY_CHARS}）`, "gate-structure:body-too-short");

    // A5 demo 资源
    const iframeSrc: string | undefined = meta.demo?.iframeSrc;
    const videoSrc: string | undefined = meta.demo?.videoSrc;
    if (iframeSrc) {
      if (/^https?:\/\/(localhost|127\.0\.0\.1)/.test(iframeSrc))
        add("A", "blocked-demo", slug, "demo-localhost", `demo iframe 指向本地地址：${iframeSrc}（等静态 demo 导出）`);
      else if (iframeSrc.startsWith("/") && !(await fileExists(path.join(ROOT, "public", iframeSrc))))
        add("A", "content-fix", slug, "demo-404", `demo 资源不存在：public${iframeSrc}`);
    } else if (videoSrc) {
      if (videoSrc.startsWith("/") && !(await fileExists(path.join(ROOT, "public", videoSrc))))
        add("A", "content-fix", slug, "demo-video-404", `demo 视频不存在：public${videoSrc}`);
    }

    // A6 母型归属
    const explicit = meta.archetype && archetypeKeys.has(meta.archetype) ? meta.archetype : null;
    if (meta.archetype && !archetypeKeys.has(meta.archetype))
      add("A", "content-fix", slug, "archetype-unknown", `meta.archetype「${meta.archetype}」不在 taxonomy 14 母型中`);
    if (!explicit && !inferArchetype(meta.tags ?? []))
      add("A", "pipeline-gap", slug, "archetype-unattributed", "无显式 archetype 且 tags 无法推断母型（详情页无母型回链）", "gate-structure:archetype-refs");

    // A7 未映射 tag
    for (const t of meta.tags ?? []) {
      if (!tagMap[t]) add("A", "pipeline-gap", slug, "tag-unmapped", `tag「${t}」不在 site-tags 映射表`, "taxonomy:site-tags 映射补录");
    }
  }

  // plays-en 覆盖（C 层前置数据）
  const enDir = path.join(ROOT, "content/plays-en");
  const enSlugs = new Set(
    (await fs.readdir(enDir, { withFileTypes: true }).catch(() => [] as any[])).filter((e: any) => e.isDirectory?.()).map((e: any) => e.name),
  );

  /* ─── B 渲染层 ─── */
  const home = await fetchText(`${BASE}/`);
  if (home.status !== 200) add("B", "site-bug", "/", "home-500", `首页 HTTP ${home.status}`);

  const sitemap = await fetchText(`${BASE}/sitemap.xml`);
  const sitemapBody = sitemap.body ?? "";

  for (const { slug, meta } of plays) {
    const { status, body } = await fetchText(`${BASE}/play/${slug}`);
    if (status !== 200) {
      add("B", "site-bug", slug, "page-not-200", `/play/${slug} HTTP ${status}`);
      continue;
    }
    const h1Count = (body.match(/<h1[\s>]/g) ?? []).length;
    if (h1Count !== 1) add("B", "site-bug", slug, "h1-count", `<h1> 数量 ${h1Count}（要求恰好 1）`);
    const title = body.match(/<title>([^<]*)<\/title>/)?.[1] ?? "";
    if (!title.endsWith(" - GamesLog")) add("B", "site-bug", slug, "title-suffix", `title 后缀异常：「${title}」`);
    const descMatch = body.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? "";
    if (descMatch.length < DESC_MIN || descMatch.length > DESC_MAX)
      add("B", "pipeline-gap", slug, "render-description-length", `渲染 description 长度 ${descMatch.length}`, "gate-seo-fields:description-length");
    const iframeSrc: string | undefined = meta.demo?.iframeSrc;
    if (iframeSrc?.startsWith("/")) {
      const st = await headStatus(`${BASE}${iframeSrc}`);
      if (st !== 200) add("B", "content-fix", slug, "demo-render-404", `demo 资源线上不可达（HTTP ${st}）：${iframeSrc}`);
    }
    if (!sitemapBody.includes(`/play/${slug}`)) add("B", "site-bug", slug, "sitemap-missing", "sitemap.xml 未收录该页");
  }

  // 母型/模式/特征页 200 + sitemap
  for (const key of archetypeKeys) {
    const { status } = await fetchText(`${BASE}/archetypes/${key}`);
    if (status !== 200) add("B", "site-bug", `archetype:${key}`, "archetype-not-200", `/archetypes/${key} HTTP ${status}`);
    if (!sitemapBody.includes(`/archetypes/${key}`)) add("B", "site-bug", `archetype:${key}`, "sitemap-missing", "sitemap.xml 未收录母型页");
  }
  for (const [dir, route] of [["patterns", "/patterns"], ["features", "/features"]] as const) {
    const keys = (await fs.readdir(path.join(ROOT, "content", dir), { withFileTypes: true })).filter((e) => e.isDirectory()).map((e) => e.name);
    for (const key of keys) {
      const { status } = await fetchText(`${BASE}${route}/${key}`);
      if (status !== 200) add("B", "site-bug", `${dir}:${key}`, `${dir}-not-200`, `${route}/${key} HTTP ${status}`);
    }
  }

  /* ─── C 内链层 ─── */
  for (const { slug, meta } of plays) {
    const tags = new Set<string>(meta.tags ?? []);
    const related = plays.filter((p) => p.slug !== slug && (p.meta.tags ?? []).some((t: string) => tags.has(t)));
    if (related.length === 0) add("C", "content-fix", slug, "no-related", "与其它文章零 tag 重叠（相关文章区块为空）");
  }
  for (const key of archetypeKeys) {
    const count = plays.filter(({ meta }) => {
      const explicit = meta.archetype && archetypeKeys.has(meta.archetype) ? meta.archetype : null;
      return (explicit ?? inferArchetype(meta.tags ?? [])) === key;
    }).length;
    if (count === 0) add("C", "content-fix", `archetype:${key}`, "pillar-empty", "母型页无任何文章回链（空集群）");
  }
  const enMissing = plays.filter((p) => !enSlugs.has(p.slug));
  if (enMissing.length > 0)
    add("C", "pipeline-gap", "plays-en", "en-coverage", `英文版覆盖 ${enSlugs.size}/${plays.length}，缺 ${enMissing.length} 篇`, "generator-translator 存量回刷");

  /* ─── EN 译文质量机检（A 层扩展：英文版 meta 中文残留 + subtitle 长度）─── */
  for (const eslug of enSlugs) {
    const emeta = await readJson(path.join(enDir, eslug, "meta.json"));
    if (!emeta) continue;
    const cjkFields: string[] = [];
    if ((emeta.tags ?? []).some((t: string) => CJK_RE.test(t))) cjkFields.push("tags");
    if (CJK_RE.test(String(emeta.difficulty ?? ""))) cjkFields.push("difficulty");
    if (CJK_RE.test(String(emeta.demo?.note ?? ""))) cjkFields.push("demo.note");
    if (cjkFields.length)
      add("A", "content-fix", `en:${eslug}`, "en-meta-cjk", `英文版 meta 含中文字段：${cjkFields.join("、")}`, "generator-translator:localized-meta");
    const edesc = String(emeta.subtitle ?? "");
    if (edesc.length < DESC_MIN || edesc.length > DESC_MAX)
      add("A", "pipeline-gap", `en:${eslug}`, "en-description-length", `EN subtitle 长度 ${edesc.length}（要求 ${DESC_MIN}~${DESC_MAX}）`, "gate-seo-fields:description-length");
  }

  /* ─── D 指南结构层（ovo_system《生产内容注意事项》§四/§七 机检项）─── */
  // 「相关玩法」「Demo」由站点渲染块覆盖（tag 重叠 / meta.demo），分别在 C 层与 A5 检查，此处不重复。
  const GUIDE_SECTIONS: Array<{ code: string; label: string; re: RegExp }> = [
    { code: "guide-essence", label: "一句话本质", re: /一句话本质|本质/ },
    { code: "guide-loop", label: "玩法循环", re: /玩法循环|核心循环|行为循环/ },
    { code: "guide-experience", label: "玩家实际经历", re: /玩家实际经历|玩家经历|实际经历|玩家体验|实际操作/ },
    { code: "guide-mechanics", label: "核心机制拆解", re: /机制拆解|核心机制|机制分析/ },
    { code: "guide-data-model", label: "数据模型", re: /数据模型|数据结构|状态模型/ },
    { code: "guide-implementation", label: "关键实现", re: /关键实现|关键代码|代码实现|实现细节/ },
    { code: "guide-edge-cases", label: "边界条件", re: /边界条件|边界|异常处理/ },
    { code: "guide-tradeoffs", label: "设计取舍", re: /设计取舍|取舍|权衡|为什么这么|为什么用/ },
    { code: "guide-primitives", label: "可迁移的玩法原语", re: /可迁移|原语|复用|迁移/ },
  ];
  for (const { slug, meta, mdx } of plays) {
    if (!mdx) continue; // article-missing 已在 A 层报过
    const headings = [...mdx.matchAll(/^#{1,3}\s+(.+)$/gm)].map((m) => m[1]).join("\n");
    for (const sec of GUIDE_SECTIONS) {
      if (!sec.re.test(headings))
        add("D", "content-fix", slug, sec.code, `缺「${sec.label}」章节（指南 §四 标准结构）`, `gate-guide-structure:${sec.code}`);
    }
    const codeBlocks = (mdx.match(/^```/gm) ?? []).length / 2;
    if (codeBlocks < 1)
      add("D", "content-fix", slug, "guide-code-missing", "正文无代码块（指南：1~3 段关键代码证明观点）", "gate-guide-structure:code");
    const sentences = mdx
      .replace(/```[\s\S]*?```/g, "")
      .split(/[。!?!?\n]/)
      .map((s) => s.trim())
      .filter((s) => s.length >= 12);
    const seen = new Map<string, number>();
    for (const s of sentences) seen.set(s, (seen.get(s) ?? 0) + 1);
    const repeated = [...seen.entries()].filter(([, n]) => n >= 3);
    if (repeated.length > 0)
      add("D", "content-fix", slug, "guide-body-repetition", `句子重复 ≥3 次：「${repeated[0][0].slice(0, 40)}…」×${repeated[0][1]}`, "gate-guide-structure:repetition");
    const hasDemo = Boolean(meta.demo?.iframeSrc || meta.demo?.videoSrc || meta.demo?.htmlSrc);
    if (!hasDemo) add("D", "content-fix", slug, "guide-demo-missing", "meta.demo 为空（文章无可操作验证入口）", "gate-guide-structure:demo");
  }

  /* ─── 汇总输出 ─── */
  const byCat = (c: IssueCategory) => issues.filter((i) => i.category === c);
  console.log(`文章 ${plays.length} 篇 | 母型 ${archetypeKeys.size} | 问题 ${issues.length} 个`);
  console.log(`  content-fix（内容修正）: ${byCat("content-fix").length}`);
  console.log(`  pipeline-gap（生产线缺陷）: ${byCat("pipeline-gap").length}`);
  console.log(`  blocked-demo（localhost 阻塞）: ${byCat("blocked-demo").length}`);
  console.log(`  site-bug（站点代码）: ${byCat("site-bug").length}\n`);

  const grouped = new Map<string, Issue[]>();
  for (const i of issues) {
    const k = `${i.category}:${i.code}`;
    grouped.set(k, [...(grouped.get(k) ?? []), i]);
  }
  for (const [k, list] of [...grouped.entries()].sort((a, b) => b[1].length - a[1].length)) {
    console.log(`[${k}] × ${list.length}`);
    console.log(`  例：${list[0].subject} — ${list[0].detail}`);
    if (list[0].gateCode) console.log(`  建议门禁：${list[0].gateCode}`);
  }

  const outDir = path.join(ROOT, "memory/audits");
  await fs.mkdir(outDir, { recursive: true });
  const outFile = path.join(outDir, `audit-${new Date().toISOString().slice(0, 10)}.json`);
  await fs.writeFile(
    outFile,
    JSON.stringify({ base: BASE, at: new Date().toISOString(), playCount: plays.length, issues }, null, 2),
  );
  console.log(`\n报告已写入 ${path.relative(ROOT, outFile)}`);
}

main().catch((err) => {
  console.error("审查执行失败:", err);
  process.exit(1);
});
