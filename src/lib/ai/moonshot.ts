/**
 * Kimi Code API client (Anthropic-compatible protocol)
 * Endpoint: https://api.kimi.com/coding/v1/messages
 * Headers: x-api-key, anthropic-version: 2023-06-01
 */

const API_BASE = "https://api.kimi.com/coding/v1";
const DEFAULT_MODEL = "kimi-k2-6";

export type TextBlock = { type: "text"; text: string };

export type ImageBlock = {
  type: "image";
  source: {
    type: "base64";
    media_type: "image/png" | "image/jpeg" | "image/webp";
    data: string;
  };
};

export type ContentBlock = TextBlock | ImageBlock;

export type ChatMessage = {
  role: "user" | "assistant";
  content: string | ContentBlock[];
};

export type ChatOptions = {
  model?: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
};

export type ChatResponse = {
  id: string;
  type: "message";
  role: "assistant";
  content: ContentBlock[];
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
};

function getApiKey(): string {
  const key = process.env.MOONSHOT_API_KEY;
  if (!key) {
    throw new Error("MOONSHOT_API_KEY is not set in environment");
  }
  return key;
}

export async function chat(options: ChatOptions): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": getApiKey(),
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: options.model ?? DEFAULT_MODEL,
      messages: options.messages,
      max_tokens: options.maxTokens ?? 2048,
      temperature: options.temperature ?? 0.7,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error");
    throw new Error(`Kimi Code API error (${res.status}): ${text}`);
  }

  return (await res.json()) as ChatResponse;
}

export async function* chatStream(
  options: ChatOptions,
): AsyncGenerator<string, void, unknown> {
  const res = await fetch(`${API_BASE}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": getApiKey(),
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: options.model ?? DEFAULT_MODEL,
      messages: options.messages,
      max_tokens: options.maxTokens ?? 2048,
      temperature: options.temperature ?? 0.7,
      stream: true,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error");
    throw new Error(`Kimi Code API error (${res.status}): ${text}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;
        if (trimmed === "data: [DONE]") continue;

        const jsonStr = trimmed.slice(6);
        try {
          const chunk = JSON.parse(jsonStr) as {
            type?: string;
            delta?: { type?: string; text?: string };
          };
          if (chunk.type === "content_block_delta" && chunk.delta?.text) {
            yield chunk.delta.text;
          }
        } catch {
          // ignore malformed JSON
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
