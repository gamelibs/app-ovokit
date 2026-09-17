import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { MOD_COOKIE, isModeratorCookieValue } from "@/lib/mod/auth";
import { chat } from "@/lib/ai/moonshot";
import { makeImageBlock, parseJsonFromResponse } from "@/lib/ai/analyze-utils";
import type { ContentBlock } from "@/lib/ai/moonshot";

export type SketchStyle = "wireframe" | "rough" | "colored" | "isometric";

const STYLE_PROMPTS: Record<SketchStyle, string> = {
  wireframe: `线框图风格（Wireframe）：仅用单色线条（#202020）勾勒所有 UI 元素边界。不使用填充色，只用矩形、圆形、线条的组合表达布局。线条粗细统一（1-2px）。`,
  rough: `手绘线框风格（Rough Sketch）：线条有轻微不规则感和抖动，stroke-linecap="round"。背景为米白色 #faf7ef，线条为深灰 #202020。有纸张/手绘质感。`,
  colored: `彩色填充示意图（Colored Wireframe）：不同功能区域用不同浅色填充区分（#ffda6a 浅黄、#7dcfff 浅蓝、#7dd87d 浅绿、#ff8b8b 浅红）。线条 #202020，背景 #faf7ef。`,
  isometric: `等距 3D 示意图（Isometric）：使用等距投影（30度角）展示游戏场景的三维结构。用平行四边形和菱形构建 3D 效果。浅色填充 + 深色描边。`,
};

function buildSystemPrompt(style: SketchStyle): string {
  const styleDesc = STYLE_PROMPTS[style];
  return `你是一位擅长游戏界面线框图设计的 UI/UX 设计师。

任务：根据用户提供的游戏截图，生成一个**${styleDesc} 的游戏界面示意图**（SVG 格式）。

## 通用要求
1. **布局还原**：精确还原截图中的界面布局（游戏区域、UI 面板、按钮位置等），保持各元素的相对位置和大小比例
2. **简化处理**：将复杂的游戏画面简化为几何图形和示意性图案，用矩形+标注代替复杂的游戏角色/物体
3. **标注**：在关键 UI 元素旁添加中文标注（如"开始按钮"、"分数面板"等），使用引线指向对应元素
4. **尺寸**：viewBox 根据截图比例自适应，建议宽度 400-800px
5. **SVG 必须是自包含的**：所有样式内联，不引用外部资源
6. **不要使用 <foreignObject> 或 CSS 动画**
7. **避免使用 <text> 标签**（字体渲染不稳定），用简单的几何图形+标注线代替文字

## 风格要求
${styleDesc}

## 输出格式
必须是**合法的 JSON 对象**，格式如下：

{
  "svg": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 400 600\\" width=\\"400\\" height=\\"600\\">...</svg>",
  "description": "示意图设计说明（中文）",
  "uiElements": ["开始按钮", "分数面板", "游戏区域", ...]
}

注意：只输出 JSON，不要包含 markdown 代码块标记`;
}

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
  const style = (String(body.style ?? "rough").trim() as SketchStyle) || "rough";

  if (!imageBase64) {
    return new NextResponse("请提供游戏截图", { status: 400 });
  }

  try {
    const contentBlocks: ContentBlock[] = [];

    let contextText = `请根据这张游戏截图，生成一个 ${style} 风格的游戏界面示意图（wireframe SVG）。`;
    if (gameUrl) contextText += `游戏运行地址：${gameUrl}。`;
    contentBlocks.push({ type: "text", text: contextText });
    contentBlocks.push(makeImageBlock(imageBase64, mimeType));

    const response = await chat({
      model: "kimi-k2-6",
      messages: [
        { role: "user", content: buildSystemPrompt(style) },
        { role: "assistant", content: `明白了，我会分析游戏截图并生成 ${style} 风格的游戏界面示意图。` },
        { role: "user", content: contentBlocks },
      ],
      maxTokens: 4096,
      temperature: 0.7,
    });

    const textBlock = response.content.find((c) => c.type === "text");
    const raw = textBlock?.text ?? "";

    const parsed = parseJsonFromResponse(raw) as Record<string, unknown>;

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("解析结果不是对象");
    }

    return NextResponse.json({
      ok: true,
      svg: String(parsed.svg ?? ""),
      description: String(parsed.description ?? ""),
      uiElements: Array.isArray(parsed.uiElements)
        ? parsed.uiElements.filter((e): e is string => typeof e === "string")
        : [],
      style,
      usage: response.usage,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "生成失败";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
