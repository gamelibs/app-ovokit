import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { MOD_COOKIE, isModeratorCookieValue } from "@/lib/mod/auth";
import { chat } from "@/lib/ai/moonshot";
import { makeImageBlock, parseJsonFromResponse } from "@/lib/ai/analyze-utils";
import type { ContentBlock } from "@/lib/ai/moonshot";

export type CoverStyle = "sketch" | "flat" | "pixel" | "neon" | "minimal";

const STYLE_PROMPTS: Record<CoverStyle, string> = {
  sketch: `手绘风格（Sketch）：线条要有不规则感（略带抖动），边框不要完美直线。使用温暖柔和的配色（米色 #faf7ef、浅黄 #ffda6a、浅蓝 #7dcfff、浅绿 #7dd87d、浅红 #ff8b8b）。角落可添加星星、闪光等手绘装饰。`,
  flat: `扁平插画风格（Flat Illustration）：使用简洁的几何形状，纯色填充，无描边或细描边。色彩鲜明但和谐，适合现代 UI。避免复杂的渐变和阴影。`,
  pixel: `像素艺术风格（Pixel Art）：使用 8-bit / 16-bit 像素风格，明显的像素网格感。色彩复古（高饱和度）。用方形像素块构建图形，带有怀旧游戏感。`,
  neon: `霓虹发光风格（Neon Glow）：深色背景（#0a0a1a 或 #1a0a2e），图形使用霓虹色系（亮粉 #ff00ff、亮蓝 #00ffff、亮绿 #00ff88），带有发光效果（filter: drop-shadow）。赛博朋克/科技感。`,
  minimal: `极简线条风格（Minimal Line）：仅用单色细线条（#202020 或 #888）勾勒轮廓，大面积留白。不使用填充色，只用线条表达形状。极其简洁优雅。`,
};

function buildSystemPrompt(style: CoverStyle): string {
  const styleDesc = STYLE_PROMPTS[style];
  return `你是一位专业的游戏视觉设计师，擅长多种风格的 SVG 封面设计。

任务：根据用户提供的游戏截图，分析游戏的视觉风格、主题和类型，生成一个**完整的 ${styleDesc} SVG 封面图**。

## 通用要求
1. **尺寸**：viewBox="0 0 360 480"，适合作为网站卡片封面
2. **元素**：
   - 顶部/中间：一个代表游戏主题的**插画**（基于截图内容）
   - 底部：预留标题区域（用虚线框表示"标题位置"）
   - 装饰：根据风格添加适当装饰元素
3. **不要包含文字内容**：只用图形元素，标题区域留白
4. **SVG 必须是自包含的**：所有样式内联，不引用外部资源
5. **不要使用 <foreignObject> 或 CSS 动画**

## 风格要求
${styleDesc}

## 输出格式
必须是**合法的 JSON 对象**，格式如下：

{
  "svg": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 360 480\\" width=\\"360\\" height=\\"480\\">...</svg>",
  "description": "封面设计说明（中文）",
  "theme": "游戏主题关键词"
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
  const title = String(body.title ?? "").trim();
  const style = (String(body.style ?? "sketch").trim() as CoverStyle) || "sketch";

  if (!imageBase64) {
    return new NextResponse("请提供游戏截图", { status: 400 });
  }

  try {
    const contentBlocks: ContentBlock[] = [];

    let contextText = `请根据这张游戏截图，生成一个 ${style} 风格的 SVG 封面图。`;
    if (title) contextText += `游戏标题是"${title}"，请在设计中体现这个主题。`;
    contentBlocks.push({ type: "text", text: contextText });
    contentBlocks.push(makeImageBlock(imageBase64, mimeType));

    const response = await chat({
      model: "kimi-k2-6",
      messages: [
        { role: "user", content: buildSystemPrompt(style) },
        { role: "assistant", content: `明白了，我会分析游戏截图并生成 ${style} 风格的 SVG 封面图。` },
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
      theme: String(parsed.theme ?? ""),
      style,
      usage: response.usage,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "生成失败";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
