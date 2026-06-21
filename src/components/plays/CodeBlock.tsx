"use client";

import { useState } from "react";

interface CodeBlockProps {
  language: string;
  code: string;
  defaultExpanded?: boolean;
}

export function CodeBlock({
  language,
  code,
  defaultExpanded = false,
}: CodeBlockProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const totalLines = code.split("\n").length;

  return (
    <div className="overflow-hidden rounded-xl sketch-border-thin bg-zinc-950 text-zinc-50">
      {/* 标题栏 */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-zinc-400">{language}</span>
          <span className="text-xs text-zinc-500">· {totalLines} 行</span>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="rounded-md px-2 py-1 text-xs font-medium text-zinc-400 transition hover:bg-white/10 hover:text-zinc-200"
        >
          {expanded ? "收起" : "查看代码"}
        </button>
      </div>

      {/* 代码区：仅在展开时显示 */}
      {expanded && (
        <pre className="overflow-x-auto p-4 text-xs leading-5">
          <code>{code}</code>
        </pre>
      )}
    </div>
  );
}
