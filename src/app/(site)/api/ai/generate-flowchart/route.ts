import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import path from "node:path";
import { MOD_COOKIE, isModeratorCookieValue } from "@/lib/mod/auth";
import { chat } from "@/lib/ai/moonshot";
import { readSourceCode, makeImageBlock, parseJsonFromResponse } from "@/lib/ai/analyze-utils";
import type { ContentBlock } from "@/lib/ai/moonshot";

const SYSTEM_PROMPT = `你是一位资深游戏技术策划，擅长从源代码中提炼游戏逻辑并绘制流程图。

任务：分析用户提供的游戏源代码，提取核心游戏循环、状态转换、胜负判定等关键逻辑，生成一个清晰的**Mermaid 流程图**。

## 分析维度
1. **游戏初始化**：资源加载、初始状态设置
2. **主游戏循环**：每一帧/每一步执行什么
3. **玩家输入处理**：如何接收和响应玩家操作
4. **游戏状态机**：各个状态之间的转换条件
5. **胜负/结束判定**：何时判定游戏结束
6. **核心算法**：碰撞检测、计分、AI 决策等

## Mermaid 语法规范
- 使用 \`graph TD\`（从上到下）或 \`graph LR\`（从左到右）
- 节点类型：
  - 普通节点：[文字]
  - 判断节点：{文字}
  - 开始/结束节点：((文字))
- 箭头标注：--> |条件|
- 子图：subgraph 标题 ... end
- 样式：可以使用 classDef 定义样式

## 输出格式
必须是**合法的 JSON 对象**，格式如下：

{
  "mermaid": "graph TD\\nA[开始游戏] --> B{玩家输入?}\\nB -->|是| C[更新状态]\\n...",
  "description": "流程图说明（中文，说明主要流程和关键节点）",
  "nodes": ["开始游戏", "玩家输入", "更新状态", ...],
  "keyLogic": "核心逻辑的文字说明"
}

注意：
- Mermaid 代码必须是合法的、可直接渲染的语法
- 只输出 JSON，不要包含 markdown 代码块标记
- 如果源代码不完整，基于已有代码合理推断`;

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

  const sourceDir = String(body.sourceDir ?? "").trim();
  const imageBase64 = String(body.imageBase64 ?? "").trim();
  const mimeType = String(body.mimeType ?? "image/png");
  const gameUrl = String(body.gameUrl ?? "").trim();

  if (!sourceDir && !imageBase64) {
    return new NextResponse("请提供源代码目录或游戏截图", { status: 400 });
  }

  try {
    const contentBlocks: ContentBlock[] = [];

    let contextText = "请分析以下游戏";
    if (gameUrl) contextText += `，游戏地址：${gameUrl}`;
    if (sourceDir) contextText += `，源代码目录：${sourceDir}`;
    contextText += "，生成游戏核心逻辑的 Mermaid 流程图。";
    contentBlocks.push({ type: "text", text: contextText });

    // 截图（可选）
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
        { role: "assistant", content: "明白了，我会仔细分析游戏源代码，提取核心逻辑并生成 Mermaid 流程图。" },
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
      mermaid: String(parsed.mermaid ?? ""),
      description: String(parsed.description ?? ""),
      nodes: Array.isArray(parsed.nodes)
        ? parsed.nodes.filter((n): n is string => typeof n === "string")
        : [],
      keyLogic: String(parsed.keyLogic ?? ""),
      usage: response.usage,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "生成失败";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
