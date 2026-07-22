"use client";

import { useState } from "react";
import { ARCHETYPE_NAME } from "@/lib/cover-gen/compose";

/**
 * 编辑页「生成封面」面板：选母型 → 生成 → 不满意「换一张」（变体递增）。
 * 生成结果为蚀刻报纸风 webp，写入 public/plays/<slug>/ 并回填表单。
 */
export function RegenCoverPanel({
  slug,
  onApplied,
}: {
  slug: string;
  onApplied: (cover: { src: string; alt: string }, coverWide: { src: string; alt: string }) => void;
}) {
  const [archetype, setArchetype] = useState<string>("");
  const [variant, setVariant] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState<string | null>(null);

  async function regen(nextVariant: number) {
    if (!slug) {
      setError("请先填写标题生成 slug");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/mod/regen-cover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          ...(archetype ? { archetype } : {}),
          variant: nextVariant,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as {
        archetype: string;
        variant: number;
        cover: string;
        coverWide: string;
      };
      setVariant(data.variant);
      setArchetype(data.archetype);
      const clean = (u: string) => u.split("?")[0];
      onApplied(
        { src: clean(data.cover), alt: slug },
        { src: clean(data.coverWide), alt: slug },
      );
      setApplied(`${ARCHETYPE_NAME[data.archetype]} · 第 ${data.variant + 1} 版`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "生成失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl sketch-border bg-paper p-3 space-y-3">
      <div className="text-xs font-semibold text-ink-muted font-kalam">生成封面（蚀刻报纸风）</div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={archetype}
          onChange={(e) => setArchetype(e.target.value)}
          className="h-8 rounded-lg sketch-border bg-paper px-2 text-xs outline-none"
        >
          <option value="">自动推断母型</option>
          {Object.entries(ARCHETYPE_NAME).map(([key, name]) => (
            <option key={key} value={key}>
              {name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => void regen(0)}
          disabled={busy}
          className="sketch-button sketch-button-secondary text-xs"
        >
          {busy ? "生成中…" : "生成封面"}
        </button>
        <button
          type="button"
          onClick={() => void regen(variant + 1)}
          disabled={busy}
          className="sketch-button text-xs"
        >
          {busy ? "生成中…" : "换一张"}
        </button>
      </div>

      {applied ? (
        <div className="text-[11px] font-semibold text-green-700">✅ 已应用：{applied}</div>
      ) : null}
      {error ? <div className="text-[11px] font-semibold text-red-600">{error}</div> : null}
    </div>
  );
}
