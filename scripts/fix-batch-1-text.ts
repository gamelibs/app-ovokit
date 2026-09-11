/**
 * 批次 1 文案回刷（subtitle 加长 / 正文加长）
 *
 * 用法：
 *   npx tsx scripts/fix-batch-1-text.ts                     # dry-run，5 篇 subtitle 试产
 *   npx tsx scripts/fix-batch-1-text.ts --write --limit 5   # 写回前 5 篇
 *   npx tsx scripts/fix-batch-1-text.ts --only body --limit 1 --slugs 2048-variant-probability-control
 *
 * 数据源：直接扫描 content/plays（与 audit-content.ts 同口径阈值），不依赖审查报告文件，
 * 可重复跑直到两类问题清零。
 *
 * LLM：默认本机 omlx（LLM_BASE_URL / LLM_MODEL 环境变量可覆盖）。
 * 串行调用 + 间隔冷却；--write 前自动备份到 memory/audit-fix-backups/{date}/{slug}/。
 *
 * 质量校验（不合格判失败，不写入）：
 *   subtitle：去引号后 50~160 字，禁止「你要做的」开头，单段无换行。
 *   body：保留原文全部「## 」章节标题（防丢内容），有效字数 ≥1000（目标 1200，留门禁余量），
 *         不含英文思考泄漏（Thinking/Wait, 等）。
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
const ONLY = argValue("only"); // subtitle | body
const LIMIT = Number(argValue("limit") ?? 5);
const SLUGS = argValue("slugs")?.split(",").filter(Boolean) ?? null;
const DUMP = argValue("dump"); // dry-run 产出落盘目录（供人工审查）

const DESC_MIN = 50;
const DESC_MAX = 160;
const MIN_BODY_CHARS = 800; // 门禁线
const BODY_TARGET = 1200; // 生成目标（留余量）
const BODY_ACCEPT = 1000; // 验收下限
const CALL_GAP_MS = 3000;

function mdxBodyLength(mdx: string): number {
  return mdx
    .replace(/```[\s\S]*?```/g, "")
    .replace(/[#>*`\-|[\]()!]/g, "")
    .replace(/\s+/g, "").length;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function callLlm(system: string, user: string, maxTokens: number): Promise<string | null> {
  try {
    const res = await fetch(`${LLM_BASE}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(240000),
      body: JSON.stringify({
        model: LLM_MODEL,
        messages: [
          { role: "system", content: `/no_think\n${system}` },
          { role: "user", content: user },
        ],
        max_tokens: maxTokens,
        temperature: 0.7,
        chat_template_kwargs: { enable_thinking: false },
      }),
    });
    if (!res.ok) {
      console.error(`  LLM HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
      return null;
    }
    const data = await res.json();
    const choice = data.choices?.[0];
    if (!choice || choice.finish_reason === "length") return null; // 截断判失败
    return String(choice.message?.content ?? "").trim();
  } catch (err) {
    console.error(`  LLM 调用异常: ${String((err as Error)?.message ?? err)}`);
    return null;
  }
}

/* ─── subtitle ─── */

const SUBTITLE_SYSTEM = `你是游戏玩法技术分享站的 SEO 编辑。为文章写 description（页面摘要）。
要求：50~160 个汉字；讲清楚「这篇文章拆解什么玩法机制、读者能学到什么」；信息密度高，基于给定素材，禁止编造机制；
禁止空话套话；禁止以「你要做的」开头；直接陈述机制与价值。
只输出 description 本身：单段、无换行、无引号、无任何前后缀。`;

function buildSubtitleUser(meta: any): string {
  const points = Array.isArray(meta.corePoints) ? meta.corePoints.join("；") : "";
  const sections = Array.isArray(meta.breakdown) ? meta.breakdown.map((b: any) => b?.title).filter(Boolean).join(" / ") : "";
  return `文章标题：${meta.title}
现有摘要（不合格）：${meta.subtitle ?? ""}
核心要点：${points}
正文拆解章节：${sections}
标签：${(meta.tags ?? []).join("、")}`;
}

function validateSubtitle(raw: string): string | null {
  const s = raw.replace(/^["'「『]+|["'」』]+$/g, "").replace(/\s*\n\s*/g, "").trim();
  if (s.length < DESC_MIN || s.length > DESC_MAX) return null;
  if (s.startsWith("你要做的")) return null;
  if (/thinking|wait,/i.test(s)) return null;
  return s;
}

/* ─── body ─── */

const BODY_SYSTEM = `你是游戏玩法技术分享站的作者，负责把一篇结构完整但篇幅过短的拆解文章扩写到更长。
硬性要求：
1. 完整保留原文的 Markdown 结构：一级标题、所有「## 」章节标题原样保留、顺序不变。
2. 保持原文的口语化、观点鲜明的写作风格，不要改成教科书腔。
3. 扩写方式：在每个章节内补充机制细节、设计权衡、正反例、参数思路；基于原文已有信息展开，禁止编造原文没有的具体数值/参数名。
4. 保留原文所有代码块和列表；可以新增列表，但不要新增代码块。
5. 目标正文有效字数 ${BODY_TARGET}~1800（不含 Markdown 标记）。禁止注水凑字：只补充有信息量的内容，如果原文信息支撑不到上限，宁可短一些也不要重复表达同一个观点。
只输出完整文章 Markdown 本身，不要任何解释、前言或后缀。`;

function buildBodyUser(meta: any, mdx: string): string {
  return `文章 meta 信息：
标题：${meta.title}
核心要点：${(meta.corePoints ?? []).join("；")}
拆解章节：${(meta.breakdown ?? []).map((b: any) => b?.title).filter(Boolean).join(" / ")}

原文（有效字数 ${mdxBodyLength(mdx)}，需扩写到 ≥${BODY_TARGET}）：
${mdx}`;
}

function validateBody(raw: string, original: string): string | null {
  const s = raw.trim();
  if (!s.startsWith("#")) return null;
  if (/thinking process|wait,|let me/i.test(s.slice(0, 2000))) return null;
  // 防丢内容：原文所有「## 」章节标题必须保留
  const originalHeadings = [...original.matchAll(/^##\s+.+$/gm)].map((m) => m[0].trim());
  for (const h of originalHeadings) {
    if (!s.includes(h)) return null;
  }
  if (mdxBodyLength(s) < BODY_ACCEPT) return null;
  // 防注水：超过 2400 有效字（约原文 3~4 倍以上）判不合格
  if (mdxBodyLength(s) > 2400) return null;
  return s.endsWith("\n") ? s : `${s}\n`;
}

/* ─── 主流程 ─── */

async function main() {
  console.log(`批次 1 文案回刷  model=${LLM_MODEL} base=${LLM_BASE}`);
  console.log(`mode=${ONLY ?? "subtitle+body"} limit=${LIMIT} write=${WRITE}\n`);

  const playsDir = path.join(ROOT, "content/plays");
  const slugs = (await fs.readdir(playsDir, { withFileTypes: true })).filter((e) => e.isDirectory()).map((e) => e.name);

  const targets: Array<{ slug: string; kind: "subtitle" | "body"; meta: any; metaPath: string; mdx: string | null; mdxPath: string }> = [];
  for (const slug of slugs) {
    if (SLUGS && !SLUGS.includes(slug)) continue;
    const dir = path.join(playsDir, slug);
    const metaPath = path.join(dir, "meta.json");
    const mdxPath = path.join(dir, "article.mdx");
    let meta: any = null;
    try {
      meta = JSON.parse(await fs.readFile(metaPath, "utf-8"));
    } catch {
      continue;
    }
    const mdx = await fs.readFile(mdxPath, "utf-8").catch(() => null);
    const descLen = String(meta.subtitle ?? "").length;
    const bodyLen = mdx ? mdxBodyLength(mdx) : 0;
    if (ONLY !== "body" && (descLen < DESC_MIN || descLen > DESC_MAX)) {
      targets.push({ slug, kind: "subtitle", meta, metaPath, mdx, mdxPath });
    } else if (ONLY !== "subtitle" && mdx && bodyLen < MIN_BODY_CHARS) {
      targets.push({ slug, kind: "body", meta, metaPath, mdx, mdxPath });
    }
  }

  console.log(`待处理 ${targets.length} 篇（本次上限 ${LIMIT}）\n`);
  const batch = targets.slice(0, LIMIT);
  let ok = 0;
  let failed = 0;

  for (const t of batch) {
    console.log(`── [${t.kind}] ${t.slug}`);
    const isSubtitle = t.kind === "subtitle";
    const raw = await callLlm(
      isSubtitle ? SUBTITLE_SYSTEM : BODY_SYSTEM,
      isSubtitle ? buildSubtitleUser(t.meta) : buildBodyUser(t.meta, t.mdx!),
      isSubtitle ? 400 : 4000,
    );
    if (!raw) {
      console.log("  ✗ LLM 调用失败/截断\n");
      failed += 1;
      await sleep(CALL_GAP_MS);
      continue;
    }
    const result = isSubtitle ? validateSubtitle(raw) : validateBody(raw, t.mdx!);
    if (!result) {
      console.log(`  ✗ 校验未通过（产出 ${isSubtitle ? raw.length : mdxBodyLength(raw)} 字）`);
      console.log(`  原始产出预览：${raw.slice(0, 160)}...\n`);
      failed += 1;
      await sleep(CALL_GAP_MS);
      continue;
    }

    if (isSubtitle) {
      console.log(`  ✓ 新 subtitle（${result.length} 字）：${result}`);
    } else {
      console.log(`  ✓ 新正文（有效 ${mdxBodyLength(result)} 字，原 ${mdxBodyLength(t.mdx!)}）`);
      console.log(`  开头预览：${result.slice(0, 120).replace(/\n/g, "⏎")}...`);
    }

    if (DUMP) {
      const dumpDir = path.isAbsolute(DUMP) ? DUMP : path.resolve(ROOT, DUMP);
      await fs.mkdir(dumpDir, { recursive: true });
      const ext = isSubtitle ? "txt" : "mdx";
      await fs.writeFile(path.join(dumpDir, `${t.slug}.${ext}`), `${result}\n`, "utf-8");
    }

    if (WRITE) {
      const backupDir = path.join(ROOT, "memory/audit-fix-backups", new Date().toISOString().slice(0, 10), t.slug);
      await fs.mkdir(backupDir, { recursive: true });
      await fs.copyFile(t.metaPath, path.join(backupDir, "meta.json"));
      if (isSubtitle) {
        t.meta.subtitle = result;
        await fs.writeFile(t.metaPath, `${JSON.stringify(t.meta, null, 2)}\n`, "utf-8");
        console.log("  ✍ 已写回 meta.json（原文已备份）");
      } else {
        await fs.copyFile(t.mdxPath, path.join(backupDir, "article.mdx"));
        await fs.writeFile(t.mdxPath, result, "utf-8");
        console.log("  ✍ 已写回 article.mdx（原文已备份）");
      }
    }
    console.log();
    ok += 1;
    await sleep(CALL_GAP_MS);
  }

  console.log(`完成：成功 ${ok} / 失败 ${failed} / 本次 ${batch.length}（剩余 ${targets.length - batch.length}）`);
  if (!WRITE) console.log("（dry-run，加 --write 才写回；写回前自动备份）");
}

main().catch((err) => {
  console.error("执行失败:", err);
  process.exit(1);
});
