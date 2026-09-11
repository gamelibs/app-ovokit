/**
 * 批次 2 指南结构补全（一句话本质 / 边界条件 / 设计取舍）
 *
 * 依据：ovo_system《生产内容注意事项》§四 标准结构、§2/§8/§9 章节要求。
 * 对应审查器 D 层机检项：guide-essence / guide-edge-cases / guide-tradeoffs（按 H1~H3 标题正则检测）。
 *
 * 用法：
 *   npx tsx scripts/fix-batch-2-guide-sections.ts --limit 5 --dump tmp/batch2-review   # dry-run 试产 + dump 人工审查
 *   npx tsx scripts/fix-batch-2-guide-sections.ts --write --limit 5                     # 写回前 5 篇
 *   npx tsx scripts/fix-batch-2-guide-sections.ts --slugs 2048-variant-probability-control,gacha-pity-and-psychology
 *
 * 策略（防 9B 事实漂移）：
 *   - LLM 只生成 3 个章节的正文；插入位置由脚本程序化完成，原文一字不动。
 *   - prompt 铁律：只许重组原文已有信息；边界条件以「需要处理的问题」形式列出，不得断言原游戏方案。
 *   - 机检防编造：生成文本中的反引号标识符必须全部能在原文中找到，否则判失败不写入。
 *
 * 插入位置：
 *   - 「一句话本质」紧跟 H1 标题后（指南 §2：先说明本质）。
 *   - 「边界条件」「设计取舍」追加到文末；若文章以「一句话总结」收尾，插到总结段之前（保持指南 §8→§9 顺序）。
 *
 * 质量校验（不合格判失败，不写入）：见 validateSections()。
 * LLM：默认本机 omlx Qwen3.5-9B-MLX-4bit（LLM_BASE_URL / LLM_MODEL 可覆盖）。
 * --write 前自动备份 article.mdx 到 memory/audit-fix-backups/{date}/{slug}/。
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
const DUMP = argValue("dump"); // dry-run 产出落盘目录（供人工审查）

const CALL_GAP_MS = 3000;

/* ─── 章节定义（与 audit-content.ts D 层检测正则同口径）─── */

type SectionKey = "一句话本质" | "边界条件" | "设计取舍";

const SECTION_DEFS: Array<{ key: SectionKey; detectRe: RegExp; minLen: number; maxLen: number }> = [
  { key: "一句话本质", detectRe: /一句话本质|本质/, minLen: 40, maxLen: 300 },
  { key: "边界条件", detectRe: /边界条件|边界|异常处理/, minLen: 80, maxLen: 800 },
  { key: "设计取舍", detectRe: /设计取舍|取舍|权衡|为什么这么|为什么用/, minLen: 80, maxLen: 800 },
];

// 文末追加顺序（指南 §8 → §9）
const TAIL_ORDER: SectionKey[] = ["边界条件", "设计取舍"];

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
        temperature: 0.3, // 重组型任务取低温度，压制编造倾向
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

/* ─── prompt ─── */

const SYSTEM = `你是游戏玩法技术分享站的编辑，给一篇已发布的玩法拆解文章补写标准章节。

你会收到文章完整原文，以及本次需要补写的章节清单。各章节要求：

「一句话本质」：1~3 句话，句式为「表面上它是什么；实际上核心机制是什么；本文重点解释什么」。先讲本质，不要堆题材和技术栈。

「边界条件」：列出实现该玩法时必须处理的 3~5 个真实边界，每条一句话，只列与本文机制直接相关的（例如：无效输入如何处理、重复操作如何处理、结束后是否禁输入、平局/结算如何判断、状态重置是否干净、资源/数据异常怎么办）。以「需要处理的问题」形式列出，不得断言原游戏采用了某种具体方案。

「设计取舍」：把原文已经提到的取舍整理成「收益 / 代价 / 替代」结构，至少 2 组。只复述原文已有的观点，不要新增原文没有的评价。

铁律（违反即作废）：
1. 只许重组、复述原文已有信息；禁止引入原文没有的具体数值、参数名、API、算法名、竞品名。
2. 保持原文口语化、观点鲜明的风格；禁止教科书腔、禁止空话套话。
3. 反引号代码标记中只允许出现原文里已有的标识符。

输出格式（严格遵守）：每个章节以「## 章节名」单独一行开头，章节名必须是清单里给出的原名，不要加序号或后缀。只输出要求补写的章节，不要输出任何其它文字。`;

function buildUser(meta: any, mdx: string, needed: SectionKey[]): string {
  const points = Array.isArray(meta.corePoints) ? meta.corePoints.join("；") : "";
  return `文章标题：${meta.title}
核心要点：${points}

需要补写的章节（只输出这些）：${needed.join("、")}

文章原文：
${mdx}`;
}

/* ─── 解析与校验 ─── */

function parseSections(raw: string, needed: SectionKey[]): Record<SectionKey, string> | null {
  // 以「## 章节名」行为分隔；章节名归一化为标准名（忽略 LLM 加的序号/后缀）
  const re = /^##\s*(一句话本质|边界条件|设计取舍).*$/gm;
  const marks = [...raw.matchAll(re)];
  if (marks.length === 0) return null;
  // 不允许出现其它 ## 标题（防 LLM 自由发挥重构文章）
  const allHeadings = [...raw.matchAll(/^#{1,6}\s+.+$/gm)];
  if (allHeadings.length !== marks.length) return null;

  const out = {} as Record<SectionKey, string>;
  for (let i = 0; i < marks.length; i++) {
    const key = marks[i][1] as SectionKey;
    const start = marks[i].index! + marks[i][0].length;
    const end = i + 1 < marks.length ? marks[i + 1].index! : raw.length;
    const content = raw.slice(start, end).trim();
    if (out[key]) return null; // 重复章节判失败
    out[key] = content;
  }
  for (const k of needed) {
    if (!out[k]) return null;
  }
  return out;
}

function extractBacktickTokens(text: string): string[] {
  return [...text.matchAll(/`([^`\n]+)`/g)].map((m) => m[1]);
}

function validateSections(
  sections: Record<SectionKey, string>,
  needed: SectionKey[],
  originalMdx: string,
): { ok: true } | { ok: false; reason: string } {
  for (const k of needed) {
    const def = SECTION_DEFS.find((d) => d.key === k)!;
    const content = sections[k];
    const len = content.replace(/\s+/g, "").length;
    if (len < def.minLen || len > def.maxLen) {
      return { ok: false, reason: `「${k}」有效字数 ${len} 不在 ${def.minLen}~${def.maxLen}` };
    }
    if (/thinking|wait,|let me|首先，我需要/i.test(content)) {
      return { ok: false, reason: `「${k}」疑似思考泄漏` };
    }
    // 防编造：反引号标识符必须来自原文
    const tokens = extractBacktickTokens(content);
    for (const t of tokens) {
      if (!originalMdx.includes(t)) {
        return { ok: false, reason: `「${k}」出现原文没有的标识符 \`${t}\`` };
      }
    }
  }
  return { ok: true };
}

/* ─── 插入（程序化，原文不动）─── */

function insertSections(mdx: string, sections: Partial<Record<SectionKey, string>>): string {
  // content/plays 的 mdx 多为 CRLF 行尾；JS 正则的 `.` 不匹配 \r，统一转 LF 处理后再转回，
  // 避免插入逻辑在 CRLF 文件上静默失效。
  const eol = mdx.includes("\r\n") ? "\r\n" : "\n";
  let out = (mdx.endsWith("\n") ? mdx : `${mdx}${eol}`).replace(/\r\n/g, "\n");

  if (sections["一句话本质"]) {
    out = out.replace(/^(# [^\n]+\n)/, `$1\n## 一句话本质\n\n${sections["一句话本质"]}\n`);
  }

  const tail = TAIL_ORDER.filter((k) => sections[k]);
  if (tail.length > 0) {
    const block = tail.map((k) => `## ${k}\n\n${sections[k]}`).join("\n\n");
    const lines = out.split("\n");
    // 找文末「一句话总结」收尾行，把新章节插到它之前
    let summaryIdx = -1;
    for (let i = lines.length - 1; i >= 0; i--) {
      const l = lines[i].trim();
      if (!l) continue;
      if (/^(一句话总结|总结)[:：]/.test(l)) summaryIdx = i;
      break; // 只看最后一个非空行
    }
    if (summaryIdx >= 0) {
      lines.splice(summaryIdx, 0, block, "");
      out = lines.join("\n");
    } else {
      out = `${out.replace(/\n+$/, "")}\n\n${block}\n`;
    }
  }
  return eol === "\r\n" ? out.replace(/\n/g, "\r\n") : out;
}

/* ─── 主流程 ─── */

async function main() {
  console.log(`批次 2 指南结构补全  model=${LLM_MODEL} base=${LLM_BASE}`);
  console.log(`limit=${LIMIT} write=${WRITE} dump=${DUMP ?? "-"}\n`);

  const playsDir = path.join(ROOT, "content/plays");
  const slugs = (await fs.readdir(playsDir, { withFileTypes: true })).filter((e) => e.isDirectory()).map((e) => e.name);

  const targets: Array<{ slug: string; needed: SectionKey[]; meta: any; mdx: string; mdxPath: string }> = [];
  for (const slug of slugs) {
    if (SLUGS && !SLUGS.includes(slug)) continue;
    const dir = path.join(playsDir, slug);
    const mdxPath = path.join(dir, "article.mdx");
    const mdx = await fs.readFile(mdxPath, "utf-8").catch(() => null);
    if (!mdx) continue;
    const meta = JSON.parse(await fs.readFile(path.join(dir, "meta.json"), "utf-8"));
    const headings = [...mdx.matchAll(/^#{1,3}\s+(.+)$/gm)].map((m) => m[1]).join("\n");
    const needed = SECTION_DEFS.filter((d) => !d.detectRe.test(headings)).map((d) => d.key);
    if (needed.length > 0) targets.push({ slug, needed, meta, mdx, mdxPath });
  }

  console.log(`待处理 ${targets.length} 篇（本次上限 ${LIMIT}）\n`);
  const batch = targets.slice(0, LIMIT);
  let ok = 0;
  let failed = 0;

  for (const t of batch) {
    console.log(`── ${t.slug}  缺: ${t.needed.join(" / ")}`);
    // 每篇最多 2 次尝试：9B 输出有随机性，一次校验失败（如反编造护栏误伤）重试一次通常能过
    let sections: Record<SectionKey, string> | null = null;
    for (let attempt = 1; attempt <= 2 && !sections; attempt++) {
      const raw = await callLlm(SYSTEM, buildUser(t.meta, t.mdx, t.needed), 2500);
      if (!raw) {
        console.log(`  ✗ 第 ${attempt} 次：LLM 调用失败/截断`);
        await sleep(CALL_GAP_MS);
        continue;
      }
      const parsed = parseSections(raw, t.needed);
      if (!parsed) {
        console.log(`  ✗ 第 ${attempt} 次：解析失败（章节格式不符）`);
        console.log(`  原始产出预览：${raw.slice(0, 200).replace(/\n/g, "⏎")}...`);
        await sleep(CALL_GAP_MS);
        continue;
      }
      const check = validateSections(parsed, t.needed, t.mdx);
      if (!check.ok) {
        console.log(`  ✗ 第 ${attempt} 次：校验未通过：${check.reason}`);
        await sleep(CALL_GAP_MS);
        continue;
      }
      sections = parsed;
    }
    if (!sections) {
      console.log("  ✗ 两次尝试均失败，跳过\n");
      failed += 1;
      continue;
    }

    const patched = insertSections(t.mdx, sections);
    for (const k of t.needed) {
      console.log(`  ✓ ${k}（${sections[k].replace(/\s+/g, "").length} 字）`);
    }

    if (DUMP) {
      const dumpDir = path.isAbsolute(DUMP) ? DUMP : path.resolve(ROOT, DUMP);
      await fs.mkdir(dumpDir, { recursive: true });
      await fs.writeFile(path.join(dumpDir, `${t.slug}.patched.mdx`), patched, "utf-8");
    }

    if (WRITE) {
      const backupDir = path.join(ROOT, "memory/audit-fix-backups", new Date().toISOString().slice(0, 10), t.slug);
      await fs.mkdir(backupDir, { recursive: true });
      await fs.copyFile(t.mdxPath, path.join(backupDir, "article.mdx"));
      await fs.writeFile(t.mdxPath, patched, "utf-8");
      console.log("  ✍ 已写回 article.mdx（原文已备份）");
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
