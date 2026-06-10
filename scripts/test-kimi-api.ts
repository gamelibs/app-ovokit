/**
 * 独立测试脚本：验证 Kimi Code API 连通性
 * 运行：npx tsx scripts/test-kimi-api.ts
 */

const API_BASE = "https://api.kimi.com/coding/v1";
const MODEL = "kimi-k2-6";

async function testChat() {
  const apiKey = process.env.MOONSHOT_API_KEY;
  if (!apiKey) {
    console.error("❌ MOONSHOT_API_KEY not found in environment");
    console.error("   请确认 .env.local 中已配置 MOONSHOT_API_KEY");
    process.exit(1);
  }

  console.log("🚀 Testing Kimi Code API...");
  console.log(`   Endpoint: ${API_BASE}/chat/completions`);
  console.log(`   Model: ${MODEL}`);
  console.log("");

  const start = Date.now();
  try {
    const res = await fetch(`${API_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: "system",
            content:
              "你是一个游戏玩法分析助手，擅长把游戏拆解成结构化的规则、数值和代码逻辑。",
          },
          {
            role: "user",
            content:
              '请分析「三消游戏」的核心玩法循环，用 3 句话概括。',
          },
        ],
        temperature: 0.7,
        max_tokens: 256,
        stream: false,
      }),
    });

    const elapsed = Date.now() - start;

    if (!res.ok) {
      const text = await res.text().catch(() => "Unknown error");
      console.error(`❌ API request failed (${res.status}) in ${elapsed}ms`);
      console.error("   Response:", text.slice(0, 500));
      process.exit(1);
    }

    const data = (await res.json()) as {
      id: string;
      choices: Array<{ message: { content: string } }>;
      usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
    };

    const content = data.choices[0]?.message?.content ?? "";

    console.log(`✅ API connected successfully in ${elapsed}ms`);
    console.log("");
    console.log("--- Response ---");
    console.log(content);
    console.log("");
    console.log("--- Usage ---");
    console.log(`   Prompt tokens:     ${data.usage?.prompt_tokens ?? "N/A"}`);
    console.log(`   Completion tokens: ${data.usage?.completion_tokens ?? "N/A"}`);
    console.log(`   Total tokens:      ${data.usage?.total_tokens ?? "N/A"}`);
    console.log("");
    console.log("🎉 Kimi Code API is ready to use!");
  } catch (e) {
    console.error(`❌ Unexpected error after ${Date.now() - start}ms`);
    console.error(e instanceof Error ? e.message : String(e));
    process.exit(1);
  }
}

async function testStream() {
  const apiKey = process.env.MOONSHOT_API_KEY;
  if (!apiKey) return;

  console.log("");
  console.log("🚀 Testing streaming mode...");

  const res = await fetch(`${API_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "user", content: "Hello" }],
      max_tokens: 20,
      stream: true,
    }),
  });

  if (!res.ok) {
    console.error("❌ Stream test failed");
    return;
  }

  const reader = res.body?.getReader();
  if (!reader) {
    console.error("❌ No response body for stream");
    return;
  }

  const decoder = new TextDecoder();
  let buffer = "";
  let chunkCount = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (line.trim() && line.startsWith("data: ") && line !== "data: [DONE]") {
        chunkCount++;
      }
    }
  }

  console.log(`✅ Stream mode works (${chunkCount} chunks received)`);
}

void testChat().then(() => testStream());
