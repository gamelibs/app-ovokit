"use client";

import { useState } from "react";

export type BreakdownItem = { title: string; bullets: string[] };

export function BreakdownEditor({
  value,
  onChange,
}: {
  value: BreakdownItem[];
  onChange: (v: BreakdownItem[]) => void;
}) {
  const [items, setItems] = useState<BreakdownItem[]>(
    value.length > 0 ? value : [{ title: "", bullets: [""] }],
  );

  function update(newItems: BreakdownItem[]) {
    setItems(newItems);
    onChange(newItems.filter((it) => it.title.trim() || it.bullets.some((b) => b.trim())));
  }

  function addSection() {
    update([...items, { title: "", bullets: [""] }]);
  }

  function removeSection(idx: number) {
    const next = items.filter((_, i) => i !== idx);
    update(next.length > 0 ? next : [{ title: "", bullets: [""] }]);
  }

  function updateTitle(idx: number, title: string) {
    const next = items.map((it, i) => (i === idx ? { ...it, title } : it));
    update(next);
  }

  function addBullet(sIdx: number) {
    const next = items.map((it, i) => (i === sIdx ? { ...it, bullets: [...it.bullets, ""] } : it));
    update(next);
  }

  function removeBullet(sIdx: number, bIdx: number) {
    const next = items.map((it, i) =>
      i === sIdx
        ? { ...it, bullets: it.bullets.filter((_, j) => j !== bIdx) }
        : it,
    );
    update(next);
  }

  function updateBullet(sIdx: number, bIdx: number, text: string) {
    const next = items.map((it, i) =>
      i === sIdx
        ? { ...it, bullets: it.bullets.map((b, j) => (j === bIdx ? text : b)) }
        : it,
    );
    update(next);
  }

  function moveSection(idx: number, dir: -1 | 1) {
    const next = [...items];
    const swap = idx + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    update(next);
  }

  return (
    <div className="space-y-3">
      {items.map((section, sIdx) => (
        <div key={sIdx} className="rounded-xl sketch-border bg-paper p-3">
          <div className="flex items-center gap-2">
            <input
              value={section.title}
              onChange={(e) => updateTitle(sIdx, e.target.value)}
              placeholder={`章节标题 ${sIdx + 1}`}
              className="h-9 flex-1 rounded-lg sketch-border bg-paper px-3 text-sm outline-none focus:ring-2 focus:ring-highlight-blue/60"
            />
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => moveSection(sIdx, -1)}
                disabled={sIdx === 0}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg sketch-border bg-paper text-xs disabled:opacity-40 hover:bg-paper-warm"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => moveSection(sIdx, 1)}
                disabled={sIdx === items.length - 1}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg sketch-border bg-paper text-xs disabled:opacity-40 hover:bg-paper-warm"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => removeSection(sIdx)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border-2 border-highlight-red bg-paper text-xs text-highlight-red hover:bg-highlight-red/10"
              >
                ×
              </button>
            </div>
          </div>

          <div className="mt-2 space-y-2">
            {section.bullets.map((bullet, bIdx) => (
              <div key={bIdx} className="flex items-center gap-2">
                <span className="shrink-0 text-xs text-ink-muted">•</span>
                <input
                  value={bullet}
                  onChange={(e) => updateBullet(sIdx, bIdx, e.target.value)}
                  placeholder="要点内容"
                  className="h-8 flex-1 rounded-lg sketch-border bg-paper px-2 text-sm outline-none focus:ring-2 focus:ring-highlight-blue/60"
                />
                <button
                  type="button"
                  onClick={() => removeBullet(sIdx, bIdx)}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full text-xs text-ink-light hover:text-highlight-red"
                >
                  ×
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => addBullet(sIdx)}
              className="inline-flex h-8 items-center gap-1 rounded-lg sketch-border bg-paper px-3 text-xs font-semibold text-ink-light hover:bg-paper-warm"
            >
              + 添加要点
            </button>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addSection}
        className="sketch-button sketch-button-secondary w-full"
      >
        + 添加章节
      </button>
    </div>
  );
}
