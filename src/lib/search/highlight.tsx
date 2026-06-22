"use client";

import { tokenizeQuery } from "./match";

/**
 * 将文本中与查询词匹配的部分用 <mark> 高亮。
 * 返回 React 片段数组，避免使用 dangerouslySetInnerHTML。
 */
export function highlightText(text: string, query: string): React.ReactNode {
  const tokens = tokenizeQuery(query).filter((t) => t.length > 0);
  if (tokens.length === 0) return text;

  // 按长度降序，避免短 token 先匹配导致长 token 无法命中
  const sorted = [...tokens].sort((a, b) => b.length - a.length);
  const pattern = new RegExp(
    `(${sorted.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`,
    "gi",
  );

  const parts = text.split(pattern);
  return parts.map((part, i) => {
    const isMatch = sorted.some((t) => part.toLowerCase() === t);
    if (isMatch) {
      return (
        <mark
          key={`${part}-${i}`}
          className="rounded-sm bg-highlight-yellow/60 px-0.5 text-ink"
        >
          {part}
        </mark>
      );
    }
    return <span key={`${part}-${i}`}>{part}</span>;
  });
}
