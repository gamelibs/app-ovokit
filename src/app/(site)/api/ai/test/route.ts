import { NextResponse } from "next/server";
import { chat } from "@/lib/ai/moonshot";

export async function POST() {
  try {
    const response = await chat({
      messages: [
        {
          role: "system",
          content:
            "你是一个游戏玩法分析助手，擅长把游戏拆解成结构化的规则、数值和代码逻辑。请用简洁的中文回答。",
        },
        {
          role: "user",
          content:
            "请分析「三消游戏」的核心玩法循环，用 3 句话概括。",
        },
      ],
      maxTokens: 256,
    });

    const content = response.choices[0]?.message?.content ?? "";
    return NextResponse.json({
      ok: true,
      model: "kimi-k2-6",
      content,
      usage: response.usage,
    });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error: e instanceof Error ? e.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
