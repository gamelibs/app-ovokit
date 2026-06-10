"use client";

import { useState } from "react";

export type CodeSnippetItem = {
  title: string;
  language: "ts" | "tsx" | "js" | "glsl" | "json" | "mdx";
  code: string;
};

const LANGUAGES: { value: CodeSnippetItem["language"]; label: string }[] = [
  { value: "ts", label: "TypeScript" },
  { value: "tsx", label: "TSX" },
  { value: "js", label: "JavaScript" },
  { value: "glsl", label: "GLSL" },
  { value: "json", label: "JSON" },
  { value: "mdx", label: "MDX" },
];

export function CodeSnippetEditor({
  value,
  onChange,
}: {
  value: CodeSnippetItem[];
  onChange: (v: CodeSnippetItem[]) => void;
}) {
  const [items, setItems] = useState<CodeSnippetItem[]>(
    value.length > 0 ? value : [{ title: "", language: "ts", code: "" }],
  );
  const [expanded, setExpanded] = useState<number | null>(0);

  function update(newItems: CodeSnippetItem[]) {
    setItems(newItems);
    onChange(newItems.filter((it) => it.title.trim() || it.code.trim()));
  }

  function addSnippet() {
    const next = [...items, { title: "", language: "ts" as const, code: "" }];
    update(next);
    setExpanded(next.length - 1);
  }

  function removeSnippet(idx: number) {
    const next = items.filter((_, i) => i !== idx);
    update(next.length > 0 ? next : [{ title: "", language: "ts", code: "" }]);
    if (expanded === idx) setExpanded(null);
  }

  function updateField<K extends keyof CodeSnippetItem>(
    idx: number,
    field: K,
    val: CodeSnippetItem[K],
  ) {
    const next = items.map((it, i) => (i === idx ? { ...it, [field]: val } : it));
    update(next);
  }

  function moveSnippet(idx: number, dir: -1 | 1) {
    const next = [...items];
    const swap = idx + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    update(next);
  }

  return (
    <div className="space-y-3">
      {items.map((item, idx) => {
        const isOpen = expanded === idx;
        return (
          <div key={idx} className="rounded-xl sketch-border bg-paper">
            <button
              type="button"
              onClick={() => setExpanded(isOpen ? null : idx)}
              className="flex w-full items-center justify-between gap-2 p-3 text-left"
            >
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold truncate">
                  {item.title.trim() || `代码片段 ${idx + 1}`}
                </div>
                <div className="mt-0.5 text-xs text-ink-muted">
                  {LANGUAGES.find((l) => l.value === item.language)?.label ?? item.language}
                  {item.code ? ` · ${item.code.trim().split("\n").length} 行` : ""}
                </div>
              </div>
              <span className="shrink-0 text-xs text-ink-muted">{isOpen ? "▼" : "▶"}</span>
            </button>

            {isOpen ? (
              <div className="border-t border-ink-light/10 p-3 space-y-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_140px]">
                  <input
                    value={item.title}
                    onChange={(e) => updateField(idx, "title", e.target.value)}
                    placeholder="片段标题，例如：洗牌袋实现"
                    className="h-9 rounded-lg sketch-border bg-paper px-3 text-sm outline-none focus:ring-2 focus:ring-highlight-blue/60"
                  />
                  <select
                    value={item.language}
                    onChange={(e) => updateField(idx, "language", e.target.value as CodeSnippetItem["language"])}
                    className="h-9 rounded-lg sketch-border bg-paper px-3 text-sm outline-none focus:ring-2 focus:ring-highlight-blue/60"
                  >
                    {LANGUAGES.map((l) => (
                      <option key={l.value} value={l.value}>
                        {l.label}
                      </option>
                    ))}
                  </select>
                </div>

                <textarea
                  value={item.code}
                  onChange={(e) => updateField(idx, "code", e.target.value)}
                  placeholder="粘贴代码..."
                  rows={8}
                  className="w-full rounded-lg sketch-border bg-paper p-3 font-mono text-xs outline-none focus:ring-2 focus:ring-highlight-blue/60"
                />

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveSnippet(idx, -1)}
                      disabled={idx === 0}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg sketch-border bg-paper text-xs disabled:opacity-40 hover:bg-paper-warm"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveSnippet(idx, 1)}
                      disabled={idx === items.length - 1}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg sketch-border bg-paper text-xs disabled:opacity-40 hover:bg-paper-warm"
                    >
                      ↓
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeSnippet(idx)}
                    className="inline-flex h-8 items-center gap-1 rounded-lg border-2 border-highlight-red bg-paper px-3 text-xs font-semibold text-highlight-red hover:bg-highlight-red/10"
                  >
                    删除
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        );
      })}

      <button
        type="button"
        onClick={addSnippet}
        className="sketch-button sketch-button-secondary w-full"
      >
        + 添加代码片段
      </button>
    </div>
  );
}
