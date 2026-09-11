/**
 * 批次 5 英文回刷（content/plays → content/plays-en，本机 omlx 翻译）
 *
 * 依据：生产线多语言决策（生产时同步产出英文版）；存量 32 篇仅 1 篇有英文（且标题残留中文）。
 *
 * 用法：
 *   npx tsx scripts/fix-batch-5-translate-en.ts --limit 3 --dump tmp/batch5-review   # dry-run 试产 + dump 人工审查
 *   npx tsx scripts/fix-batch-5-translate-en.ts --write --limit 10                   # 写回前 10 篇
 *   npx tsx scripts/fix-batch-5-translate-en.ts --slugs gacha-pity-and-psychology
 *
 * 翻译口径（对齐生产线 ContentPack 样本 plays-en/tic-tac-toe-3d-rotation-juice，并修正其缺陷）：
 *   - 翻译：title / subtitle / corePoints / breakdown / cover.alt / coverWide.alt / codeSnippets[].title / 正文（含标题）。
 *   - 保留：slug / tags / difficulty / techStack / stats / published / demo / pattern / archetype（分类法字段保持中文词表）。
 *   - 新增：lang: "en"。codeSnippets[].code 逐字节保留。
 *
 * 每篇 2 次 LLM 调用（meta JSON + 正文 MDX），串行 + 冷却；每篇每步最多 2 次尝试。
 * 校验（不合格判失败，不写入）：
 *   meta：JSON 可解析、数组长度与中文一致、无 CJK 残留。
 *   正文：标题数量一致、代码块逐字节一致、非代码区 CJK 占比 <2%、长度 ≥ 原文 40%、无截断。
 * --write 时若 plays-en/{slug} 已存在，先整体备份到 memory/audit-fix-backups/{date}/{slug}/en/。
 */

import { promises as fs } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "..");
const LLM_BASE = (process.env.LLM_BASE_URL ?? "http://127.0.0.1:1888").replace(/\/$/, "");
const LLM_MODEL = process.env.LLM_MODEL ?? "Qwen3.5-9B-MLX-4bit";

const argv = process.argv.slice(2);
function argValue(name: string): string | null {
  const eq = argv.find((a) => a.startsWith(`--${name}=`));
  if (eq) return eq.split("=").slice(1).join("=");
  const idx = argv.indexOf(`--${name}`);
  if (idx >= 0 && argv[idx + 1] && !argv[idx + 1].startsWith("--")) return argv[idx + 1];
  return null;
}

const WRITE = argv.includes("--write");
const LIMIT = Number(argValue("limit") ?? 5);
const SLUGS = argValue("slugs")?.split(",").filter(Boolean) ?? null;
const DUMP = argValue("dump");

const CALL_GAP_MS = 3000;
const CJK_RE = /[一-鿿㐀-䶿]/g;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function callLlm(system: string, user: string, maxTokens: number): Promise<string | null> {
  try {
    const res = await fetch(`${LLM_BASE}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(300000),
      body: JSON.stringify({
        model: LLM_MODEL,
        messages: [
          { role: "system", content: `/no_think\n${system}` },
          { role: "user", content: user },
        ],
        max_tokens: maxTokens,
        temperature: 0.3,
        chat_template_kwargs: { enable_thinking: false },
      }),
    });
    if (!res.ok) {
      console.error(`  LLM HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
      return null;
    }
    const data = await res.json();
    const choice = data.choices?.[0];
    if (!choice || choice.finish_reason === "length") return null;
    return String(choice.message?.content ?? "").trim();
  } catch (err) {
    console.error(`  LLM 调用异常: ${String((err as Error)?.message ?? err)}`);
    return null;
  }
}

/* ─── meta 翻译 ─── */

const META_SYSTEM = `你是游戏玩法技术分享站的翻译编辑。把给定 JSON 里的中文字段翻译成英文。
要求：
1. 只输出合法 JSON 本身（不要 markdown 代码围栏、不要任何解释），键结构与输入完全一致。
2. title / subtitle 是面向英文读者的自然标题与摘要，信息密度高，不做逐字直译；subtitle 控制在 120~300 个英文字符。
3. corePoints / breakdown 的数组长度与顺序必须与输入完全一致。
4. 玩法名、技术名词用业界通用英文（如 match-3、merge、pity system、minimax）。
5. 数字、范围、符号保持原样（如 3~6 秒、P99、≥10%）。
6. 所有输出值必须是纯英文，禁止残留中文。`;

/* ─── meta 兜底：纯文本分节格式（9B 生成 JSON 偶有丢括号等语法错误，分节格式确定性解析）─── */

const META_FALLBACK_SYSTEM = `你是游戏玩法技术分享站的翻译编辑。把文章字段翻译成英文，严格按下面的分段格式输出。
格式（标签行原样输出，内容紧跟标签行下一行起，不要输出任何其它文字）：

[TITLE]
<英文标题>
[SUBTITLE]
<英文摘要，120~300 个字符，单段>
[CORE_POINTS]
<每行一个要点>
[BREAKDOWN]
## <章节标题>
- <要点>
- <要点>
## <下一章节标题>
- <要点>
[COVER_ALT]
<英文 alt>
[COVERWIDE_ALT]
<英文 alt>
[CODE_SNIPPET_TITLES]
<每行一个标题>

规则：全部纯英文禁止中文；[CORE_POINTS] 行数、[BREAKDOWN] 章节数与每章要点数、[CODE_SNIPPET_TITLES] 行数必须与输入给定数量完全一致；数字、范围、符号保持原样；某字段输入为空则对应标签下留空一行。`;

function buildMetaFallbackUser(meta: any): string {
  const bd = (meta.breakdown ?? []).map((b: any, i: number) => `章节${i + 1}「${b?.title ?? ""}」需 ${(b?.bullets ?? []).length} 行要点`).join("；");
  return `待翻译字段（JSON）：
${buildMetaUser(meta)}

数量约束：CORE_POINTS 需 ${(meta.corePoints ?? []).length} 行；BREAKDOWN 需 ${(meta.breakdown ?? []).length} 个章节（${bd || "无"}）；CODE_SNIPPET_TITLES 需 ${(meta.codeSnippets ?? []).length} 行。`;
}

function parseMetaFallback(raw: string, src: any): { meta: any | null; reason: string } {
  const fail = (reason: string) => ({ meta: null, reason });
  const tags = ["TITLE", "SUBTITLE", "CORE_POINTS", "BREAKDOWN", "COVER_ALT", "COVERWIDE_ALT", "CODE_SNIPPET_TITLES"];
  const re = /^\[(TITLE|SUBTITLE|CORE_POINTS|BREAKDOWN|COVER_ALT|COVERWIDE_ALT|CODE_SNIPPET_TITLES)\]\s*$/gm;
  const marks = [...raw.matchAll(re)];
  if (marks.length !== tags.length) return fail(`分节标签数 ${marks.length} ≠ ${tags.length}`);
  const seg: Record<string, string> = {};
  for (let i = 0; i < marks.length; i++) {
    const start = marks[i].index! + marks[i][0].length;
    const end = i + 1 < marks.length ? marks[i + 1].index! : raw.length;
    seg[marks[i][1]] = raw.slice(start, end).trim();
  }
  const title = seg.TITLE.split("\n")[0]?.trim() ?? "";
  const subtitle = seg.SUBTITLE.replace(/\n/g, " ").trim();
  const corePoints = seg.CORE_POINTS.split("\n").map((s) => s.trim()).filter(Boolean);
  const codeSnippetTitles = seg.CODE_SNIPPET_TITLES.split("\n").map((s) => s.trim()).filter(Boolean);
  const breakdown: Array<{ title: string; bullets: string[] }> = [];
  let cur: { title: string; bullets: string[] } | null = null;
  for (const line of seg.BREAKDOWN.split("\n")) {
    const l = line.trim();
    if (l.startsWith("##")) {
      cur = { title: l.replace(/^#+\s*/, "").trim(), bullets: [] };
      breakdown.push(cur);
    } else if (l.startsWith("-") && cur) {
      cur.bullets.push(l.replace(/^-\s*/, "").trim());
    }
  }
  const srcBreakdown = src.breakdown ?? [];
  if (!title || !subtitle) return fail("title/subtitle 为空");
  if (corePoints.length !== (src.corePoints ?? []).length) return fail(`corePoints ${corePoints.length} ≠ ${(src.corePoints ?? []).length}`);
  if (breakdown.length !== srcBreakdown.length) return fail(`breakdown ${breakdown.length} ≠ ${srcBreakdown.length}`);
  for (let i = 0; i < srcBreakdown.length; i++) {
    if (breakdown[i].bullets.length !== (srcBreakdown[i]?.bullets ?? []).length)
      return fail(`breakdown[${i}] bullets ${breakdown[i].bullets.length} ≠ ${(srcBreakdown[i]?.bullets ?? []).length}`);
  }
  if (codeSnippetTitles.length !== (src.codeSnippets ?? []).length)
    return fail(`codeSnippetTitles ${codeSnippetTitles.length} ≠ ${(src.codeSnippets ?? []).length}`);
  const values: string[] = [title, subtitle, ...corePoints, seg.COVER_ALT, seg.COVERWIDE_ALT, ...codeSnippetTitles];
  for (const b of breakdown) values.push(b.title, ...b.bullets);
  const cjkHit = values.find((v) => cjkCount(v) > 0);
  if (cjkHit) return fail(`CJK 残留：「${cjkHit.slice(0, 40)}」`);
  return { meta: { title, subtitle, corePoints, breakdown, coverAlt: seg.COVER_ALT.split("\n")[0]?.trim() ?? "", coverWideAlt: seg.COVERWIDE_ALT.split("\n")[0]?.trim() ?? "", codeSnippetTitles }, reason: "" };
}

function buildMetaUser(meta: any): string {
  return JSON.stringify({
    title: meta.title ?? "",
    subtitle: meta.subtitle ?? "",
    corePoints: meta.corePoints ?? [],
    breakdown: (meta.breakdown ?? []).map((b: any) => ({ title: b?.title ?? "", bullets: b?.bullets ?? [] })),
    coverAlt: meta.cover?.alt ?? "",
    coverWideAlt: meta.coverWide?.alt ?? "",
    codeSnippetTitles: (meta.codeSnippets ?? []).map((c: any) => c?.title ?? ""),
  });
}

function cjkCount(s: string): number {
  return (s.match(CJK_RE) ?? []).length;
}

function parseMetaTranslation(raw: string, src: any): { meta: any | null; reason: string } {
  const fail = (reason: string) => ({ meta: null, reason });
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
  let t: any;
  try {
    t = JSON.parse(cleaned);
  } catch {
    return fail("JSON 解析失败");
  }
  if (!t || typeof t !== "object") return fail("非对象");
  if (typeof t.title !== "string" || !t.title || typeof t.subtitle !== "string" || !t.subtitle) return fail("title/subtitle 缺失");
  const srcBreakdown = src.breakdown ?? [];
  const srcSnippets = src.codeSnippets ?? [];
  if (!Array.isArray(t.corePoints) || t.corePoints.length !== (src.corePoints ?? []).length)
    return fail(`corePoints 长度 ${t.corePoints?.length} ≠ ${(src.corePoints ?? []).length}`);
  if (!Array.isArray(t.breakdown) || t.breakdown.length !== srcBreakdown.length)
    return fail(`breakdown 长度 ${t.breakdown?.length} ≠ ${srcBreakdown.length}`);
  for (let i = 0; i < srcBreakdown.length; i++) {
    if (!Array.isArray(t.breakdown[i]?.bullets) || t.breakdown[i].bullets.length !== (srcBreakdown[i]?.bullets ?? []).length)
      return fail(`breakdown[${i}].bullets 长度 ${t.breakdown[i]?.bullets?.length} ≠ ${(srcBreakdown[i]?.bullets ?? []).length}`);
  }
  if (!Array.isArray(t.codeSnippetTitles) || t.codeSnippetTitles.length !== srcSnippets.length)
    return fail(`codeSnippetTitles 长度 ${t.codeSnippetTitles?.length} ≠ ${srcSnippets.length}`);
  // CJK 残留检查（所有字符串值）
  const values: string[] = [t.title, t.subtitle, ...t.corePoints, t.coverAlt ?? "", t.coverWideAlt ?? "", ...t.codeSnippetTitles];
  for (const b of t.breakdown) values.push(b?.title ?? "", ...(b?.bullets ?? []));
  const cjkHit = values.find((v) => cjkCount(String(v)) > 0);
  if (cjkHit) return fail(`CJK 残留：「${String(cjkHit).slice(0, 40)}」`);
  return { meta: t, reason: "" };
}

function mergeEnMeta(zh: any, t: any): any {
  const en = { ...zh };
  en.title = t.title;
  en.subtitle = t.subtitle;
  en.corePoints = t.corePoints;
  en.breakdown = (zh.breakdown ?? []).map((b: any, i: number) => ({ ...b, title: t.breakdown[i].title, bullets: t.breakdown[i].bullets }));
  if (en.cover) en.cover = { ...en.cover, alt: t.coverAlt || t.title };
  if (en.coverWide) en.coverWide = { ...en.coverWide, alt: t.coverWideAlt || t.title };
  en.codeSnippets = (zh.codeSnippets ?? []).map((c: any, i: number) => ({ ...c, title: t.codeSnippetTitles[i] || c.title }));
  en.lang = "en";
  return en;
}

/* ─── 正文翻译 ─── */

const BODY_SYSTEM = `你是游戏玩法技术分享站的翻译编辑。把整篇中文 Markdown 文章翻译成英文。
硬性要求：
1. 完整保留 Markdown 结构：标题层级、列表、加粗、分隔线、引用原样保留，只翻译文字；标题也必须翻译成英文。
2. 代码块（\`\`\` 包围）必须逐字节保持原样，包括其中的注释与标识符；原文没有代码块就禁止新增，原文有几个就保留几个。
3. 行内反引号标识符保持原样。
4. 数字、范围、百分比保持原样（如 3~6 秒、≥10%、P99）。
5. 保持原文口语化、观点鲜明的语气；不要翻成教科书腔，不要添加原文没有的内容（包括示例代码）。
只输出翻译后的完整 Markdown 本身，不要任何解释、前言或后缀。`;

function extractCodeBlocks(mdx: string): string[] {
  return [...mdx.matchAll(/```[\s\S]*?```/g)].map((m) => m[0]);
}

function proseOf(mdx: string): string {
  return mdx.replace(/```[\s\S]*?```/g, "");
}

function validateBody(raw: string, zhMdx: string): { body: string | null; reason: string } {
  const fail = (reason: string) => ({ body: null, reason });
  if (!raw.startsWith("#")) return fail("产出未以 # 标题开头");
  const en = raw.trim();
  const zh = zhMdx.replace(/\r\n/g, "\n");
  // 结构：标题数量一致
  const zhHeadings = (zh.match(/^#{1,6}\s/gm) ?? []).length;
  const enHeadings = (en.match(/^#{1,6}\s/gm) ?? []).length;
  if (zhHeadings !== enHeadings) return fail(`标题数 ${enHeadings} ≠ 原文 ${zhHeadings}`);
  // 代码块逐字节一致
  const zhBlocks = extractCodeBlocks(zh);
  const enBlocks = extractCodeBlocks(en);
  if (zhBlocks.length !== enBlocks.length) return fail(`代码块数 ${enBlocks.length} ≠ 原文 ${zhBlocks.length}`);
  for (let i = 0; i < zhBlocks.length; i++) {
    if (zhBlocks[i] !== enBlocks[i]) return fail(`代码块 #${i + 1} 被改动`);
  }
  // 非代码区 CJK 残留 <2%
  const prose = proseOf(en);
  const cjk = cjkCount(prose);
  if (cjk > Math.max(2, prose.length * 0.02)) return fail(`CJK 残留 ${cjk} 字`);
  // 长度下限（英译字符数通常 ≥ 中文 60%，留宽余量取 40%）
  if (prose.replace(/\s+/g, "").length < proseOf(zh).replace(/\s+/g, "").length * 0.4) return fail("长度过短（< 原文 40%）");
  return { body: en.endsWith("\n") ? en : `${en}\n`, reason: "" };
}

/* ─── 主流程 ─── */

async function main() {
  console.log(`批次 5 英文回刷  model=${LLM_MODEL} base=${LLM_BASE}`);
  console.log(`limit=${LIMIT} write=${WRITE} dump=${DUMP ?? "-"}\n`);

  const zhDir = path.join(ROOT, "content/plays");
  const enDir = path.join(ROOT, "content/plays-en");
  const slugs = (await fs.readdir(zhDir, { withFileTypes: true })).filter((e) => e.isDirectory()).map((e) => e.name);

  const targets: Array<{ slug: string; meta: any; metaPath: string; mdx: string; mdxPath: string; reason: string }> = [];
  for (const slug of slugs) {
    if (SLUGS && !SLUGS.includes(slug)) continue;
    const metaPath = path.join(zhDir, slug, "meta.json");
    const mdxPath = path.join(zhDir, slug, "article.mdx");
    const meta = JSON.parse(await fs.readFile(metaPath, "utf-8"));
    const mdx = await fs.readFile(mdxPath, "utf-8").catch(() => null);
    if (!mdx) continue;
    // 目标条件：英文版缺失，或英文正文标题残留中文（旧管线样本质量不达标）
    const enMdx = await fs.readFile(path.join(enDir, slug, "article.mdx"), "utf-8").catch(() => null);
    if (!enMdx) {
      targets.push({ slug, meta, metaPath, mdx, mdxPath, reason: "缺英文版" });
    } else {
      const headings = [...enMdx.matchAll(/^#{1,6}\s+(.+)$/gm)].map((m) => m[1]).join("\n");
      if (cjkCount(headings) > 0) targets.push({ slug, meta, metaPath, mdx, mdxPath, reason: "标题残留中文" });
    }
  }

  console.log(`待处理 ${targets.length} 篇（本次上限 ${LIMIT}）\n`);
  const batch = targets.slice(0, LIMIT);
  let ok = 0;
  let failed = 0;

  for (const t of batch) {
    console.log(`── ${t.slug}（${t.reason}）`);
    let enMeta: any = null;
    let enBody: string | null = null;

    // meta 最多 3 次：前 2 次 JSON 格式，第 3 次换纯文本分节格式兜底（9B 偶发 JSON 语法错误）
    for (let attempt = 1; attempt <= 3 && !enMeta; attempt++) {
      const useFallback = attempt === 3;
      const raw = await callLlm(
        useFallback ? META_FALLBACK_SYSTEM : META_SYSTEM,
        useFallback ? buildMetaFallbackUser(t.meta) : buildMetaUser(t.meta),
        2600,
      );
      if (!raw) {
        console.log(`  ✗ meta 第 ${attempt} 次${useFallback ? "（分节兜底）" : ""}：调用失败/截断`);
        await sleep(CALL_GAP_MS);
        continue;
      }
      const parsed = useFallback ? parseMetaFallback(raw, t.meta) : parseMetaTranslation(raw, t.meta);
      enMeta = parsed.meta;
      if (!enMeta) {
        console.log(`  ✗ meta 第 ${attempt} 次${useFallback ? "（分节兜底）" : ""}：校验未通过（${parsed.reason}）`);
        console.log(`  原始产出预览：${raw.slice(0, 160).replace(/\n/g, "⏎")}...`);
        await sleep(CALL_GAP_MS);
      }
    }
    if (!enMeta) {
      console.log("  ✗ meta 三次均失败，跳过\n");
      failed += 1;
      continue;
    }
    await sleep(CALL_GAP_MS);

    for (let attempt = 1; attempt <= 2 && !enBody; attempt++) {
      const raw = await callLlm(BODY_SYSTEM, t.mdx, 4000);
      if (!raw) {
        console.log(`  ✗ 正文 第 ${attempt} 次：调用失败/截断`);
        await sleep(CALL_GAP_MS);
        continue;
      }
      const checked = validateBody(raw, t.mdx);
      enBody = checked.body;
      if (!enBody) {
        console.log(`  ✗ 正文 第 ${attempt} 次：${checked.reason}`);
        await sleep(CALL_GAP_MS);
      }
    }
    if (!enBody) {
      console.log("  ✗ 正文两次均失败，跳过\n");
      failed += 1;
      continue;
    }

    const finalMeta = mergeEnMeta(t.meta, enMeta);
    console.log(`  ✓ meta：${finalMeta.title.slice(0, 70)}`);
    console.log(`  ✓ 正文（${enBody.length} 字符）`);

    if (DUMP) {
      const dumpDir = path.isAbsolute(DUMP) ? DUMP : path.resolve(ROOT, DUMP);
      await fs.mkdir(dumpDir, { recursive: true });
      await fs.writeFile(path.join(dumpDir, `${t.slug}.meta.en.json`), `${JSON.stringify(finalMeta, null, 2)}\n`, "utf-8");
      await fs.writeFile(path.join(dumpDir, `${t.slug}.article.en.mdx`), enBody, "utf-8");
    }

    if (WRITE) {
      const outDir = path.join(enDir, t.slug);
      const existed = await fs.stat(outDir).then(() => true).catch(() => false);
      if (existed) {
        const backupDir = path.join(ROOT, "memory/audit-fix-backups", new Date().toISOString().slice(0, 10), t.slug, "en");
        await fs.mkdir(backupDir, { recursive: true });
        for (const f of await fs.readdir(outDir)) {
          await fs.copyFile(path.join(outDir, f), path.join(backupDir, f));
        }
      }
      await fs.mkdir(outDir, { recursive: true });
      await fs.writeFile(path.join(outDir, "meta.json"), `${JSON.stringify(finalMeta, null, 2)}\n`, "utf-8");
      await fs.writeFile(path.join(outDir, "article.mdx"), enBody, "utf-8");
      console.log(existed ? "  ✍ 已覆盖写回 plays-en（旧版已备份）" : "  ✍ 已写入 plays-en");
    }
    console.log();
    ok += 1;
    await sleep(CALL_GAP_MS);
  }

  console.log(`完成：成功 ${ok} / 失败 ${failed} / 本次 ${batch.length}（剩余 ${targets.length - batch.length}）`);
  if (!WRITE) console.log("（dry-run，加 --write 才写回；已存在的英文版会先备份）");
}

main().catch((err) => {
  console.error("执行失败:", err);
  process.exit(1);
});
