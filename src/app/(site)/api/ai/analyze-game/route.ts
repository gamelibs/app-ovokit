import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import path from "node:path";
import { MOD_COOKIE, isModeratorCookieValue } from "@/lib/mod/auth";
import { chat } from "@/lib/ai/moonshot";
import { readSourceCode, makeImageBlock, parseJsonFromResponse } from "@/lib/ai/analyze-utils";
import { availablePlayTags } from "@/lib/content/play-tags";
import type { ContentBlock } from "@/lib/ai/moonshot";

const SYSTEM_PROMPT = `你是一位资深的游戏玩法分析师和技术策划。请结合用户提供的游戏截图和源代码，输出一份完整的结构化游戏玩法分析报告。

输出必须是**合法的 JSON 对象**，不要包含 markdown 代码块标记。格式如下：

{
  "title": "游戏标题（中文，简洁有力）",
  "subtitle": "一句话概括玩法核心 + 技术实现价值",
  "slug": "英文 slug，小写字母和连字符",
  "tags": ["从预定义标签中选择 2-4 个"],
  "difficulty": "入门|进阶|硬核",
  "techStack": ["TypeScript", "推荐的技术栈"],
  "corePoints": ["核心技术点 1", "核心技术点 2"],
  "breakdown": [
    { "title": "玩法目标", "bullets": ["玩家需要做什么"] },
    { "title": "核心循环", "bullets": ["输入 → 判定 → 反馈"] },
    { "title": "胜负/进度判定", "bullets": ["如何判定成功/失败"] },
    { "title": "数值/难度曲线", "bullets": ["关键数值设计"] }
  ],
  "codeSnippets": [
    { "title": "关键算法", "language": "ts", "code": "// 从源码中提取或重写\\nfunction coreLogic() {}" }
  ],
  "flowchartMermaid": "graph TD\\nA[开始] --> B{玩家输入}\\nB -->|有效| C[执行判定]\\nB -->|无效| D[提示错误]",
  "article": "# 标题\\n\\n## 概述\\n...\\n\\n## 核心机制\\n...\\n\\n## 代码实现\\n...\\n\\n## 总结\\n...",
  "coverTemplate": "从以下选择最适合的模板: puzzle|gem|gamepad|blocks|tower|runner|card|lightbulb|sun|star"
}

预定义标签（从中选择）：${availablePlayTags.join("、")}

分析维度：
1. 游戏类型识别（消除/合成/塔防/跑酷/解谜/战斗等）
2. 玩家输入方式（点击/拖拽/滑动/键盘）
3. 核心交互循环（输入 → 判定 → 反馈 → 状态更新）
4. 胜负/进度判定规则
5. 数值系统设计（分数/生命值/倒计时/升级等）
6. 关卡/波次/难度曲线（如有）
7. 视觉/音效反馈机制
8. 源代码中的关键算法和数据结构
9. 可复用的技术实现要点

如果信息有限，请基于可见元素进行合理推断，并在 article 中注明"基于截图和源码分析"。

注意：codeSnippets 中的代码应该从源代码中提取最关键的部分，或者用伪代码展示核心逻辑。`;

export async function POST(req: Request) {
  const c = await cookies();
  const isModerator = isModeratorCookieValue(c.get(MOD_COOKIE)?.value);
  if (!isModerator) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return new NextResponse("Invalid JSON", { status: 400 });
  }

  const imageBase64 = String(body.imageBase64 ?? "").trim();
  const mimeType = String(body.mimeType ?? "image/png");
  const gameUrl = String(body.gameUrl ?? "").trim();
  const sourceDir = String(body.sourceDir ?? "").trim();

  if (!imageBase64 && !sourceDir) {
    return new NextResponse("请提供游戏截图或源代码目录", { status: 400 });
  }

  try {
    const contentBlocks: ContentBlock[] = [];

    let contextText = "请分析以下游戏";
    if (gameUrl) contextText += `，游戏地址：${gameUrl}`;
    if (sourceDir) contextText += `，源代码目录：${sourceDir}`;
    contextText += "。输出完整的 JSON 结构化分析报告。";
    contentBlocks.push({ type: "text", text: contextText });

    // 截图
    if (imageBase64) {
      contentBlocks.push(makeImageBlock(imageBase64, mimeType));
    }

    // 源代码
    if (sourceDir) {
      const absDir = path.resolve(sourceDir);
      const files = await readSourceCode(absDir);
      if (files.length > 0) {
        let codeText = "\n\n=== 游戏源代码 ===\n";
        for (const f of files) {
          codeText += `\n--- ${f.path} ---\n${f.content.slice(0, 2000)}\n`;
        }
        contentBlocks.push({ type: "text", text: codeText });
      }
    }

    const response = await chat({
      model: "kimi-k2-6",
      messages: [
        { role: "user", content: SYSTEM_PROMPT },
        { role: "assistant", content: "明白了，我会仔细分析游戏截图和源代码，输出完整的结构化 JSON 报告。" },
        { role: "user", content: contentBlocks },
      ],
      maxTokens: 4096,
      temperature: 0.6,
    });

    const textBlock = response.content.find((c) => c.type === "text");
    const raw = textBlock?.text ?? "";

    const parsed = parseJsonFromResponse(raw) as Record<string, unknown>;

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("解析结果不是对象");
    }

    return NextResponse.json({
      ok: true,
      data: parsed,
      usage: response.usage,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "分析失败";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
