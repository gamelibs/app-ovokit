"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ArchetypeSpec } from "@/lib/archetypes/spec";

function TagInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState("");
  return (
    <label className="grid gap-1">
      <span className="text-xs font-semibold text-ink-muted font-kalam">{label}</span>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            const v = input.trim();
            if (v && !value.includes(v)) {
              onChange([...value, v]);
            }
            setInput("");
          }
        }}
        className="h-10 rounded-xl sketch-border bg-paper px-3 text-sm outline-none focus:ring-2 focus:ring-highlight-blue/60"
        placeholder={placeholder || "输入后回车或逗号添加"}
      />
      <div className="mt-1 flex flex-wrap gap-1.5">
        {value.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => onChange(value.filter((x) => x !== t))}
            className="inline-flex items-center gap-1 rounded-full bg-paper-warm px-2 py-1 text-xs text-ink-light hover:bg-highlight-red/20 hover:text-ink"
          >
            {t} ×
          </button>
        ))}
      </div>
    </label>
  );
}

function ListEditor({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string[];
  onChange: (v: string[]) => void;
}) {
  return (
    <div className="grid gap-2">
      <span className="text-xs font-semibold text-ink-muted font-kalam">{label}</span>
      {value.map((item, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <input
            value={item}
            onChange={(e) => {
              const next = [...value];
              next[idx] = e.target.value;
              onChange(next);
            }}
            className="h-10 flex-1 rounded-xl sketch-border bg-paper px-3 text-sm outline-none focus:ring-2 focus:ring-highlight-blue/60"
            placeholder="..."
          />
          <button
            type="button"
            onClick={() => onChange(value.filter((_, i) => i !== idx))}
            className="inline-flex h-10 items-center justify-center rounded-xl sketch-border bg-paper px-3 text-sm font-semibold text-ink-light hover:bg-highlight-red/20"
          >
            删除
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...value, ""])}
        className="inline-flex h-9 items-center justify-center rounded-xl sketch-border bg-paper px-3 text-sm font-semibold text-ink-light hover:bg-paper-warm"
      >
        + 添加一项
      </button>
    </div>
  );
}

export function ArchetypeEditForm({ spec }: { spec: ArchetypeSpec }) {
  const router = useRouter();
  const [form, setForm] = useState<ArchetypeSpec>({ ...spec });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  function update<K extends keyof ArchetypeSpec>(key: K, value: ArchetypeSpec[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setOk(false);
    try {
      const res = await fetch(`/api/mod/archetypes/${encodeURIComponent(spec.key)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(await res.text());
      setOk(true);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="rounded-2xl sketch-border bg-paper p-4">
        <div className="grid gap-3">
          <div className="grid gap-1">
            <span className="text-xs font-semibold text-ink-muted font-kalam">Key（只读）</span>
            <input
              value={spec.key}
              disabled
              className="h-10 rounded-xl sketch-border bg-paper px-3 text-sm text-ink-light opacity-60 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="grid gap-1">
              <span className="text-xs font-semibold text-ink-muted font-kalam">名称</span>
              <input
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                className="h-10 rounded-xl sketch-border bg-paper px-3 text-sm outline-none focus:ring-2 focus:ring-highlight-blue/60"
              />
            </label>
            <label className="grid gap-1">
              <span className="text-xs font-semibold text-ink-muted font-kalam">英文名</span>
              <input
                value={form.nameEn}
                onChange={(e) => update("nameEn", e.target.value)}
                className="h-10 rounded-xl sketch-border bg-paper px-3 text-sm outline-none focus:ring-2 focus:ring-highlight-blue/60"
              />
            </label>
          </div>

          <label className="grid gap-1">
            <span className="text-xs font-semibold text-ink-muted font-kalam">副标题</span>
            <input
              value={form.subtitle}
              onChange={(e) => update("subtitle", e.target.value)}
              className="h-10 rounded-xl sketch-border bg-paper px-3 text-sm outline-none focus:ring-2 focus:ring-highlight-blue/60"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-xs font-semibold text-ink-muted font-kalam">难度描述</span>
            <input
              value={form.difficulty}
              onChange={(e) => update("difficulty", e.target.value)}
              className="h-10 rounded-xl sketch-border bg-paper px-3 text-sm outline-none focus:ring-2 focus:ring-highlight-blue/60"
            />
          </label>

          <TagInput
            label="玩法特征"
            value={form.features}
            onChange={(v) => update("features", v)}
          />

          <label className="grid gap-1">
            <span className="text-xs font-semibold text-ink-muted font-kalam">Demo 规则提示</span>
            <textarea
              value={form.demoRuleHint}
              onChange={(e) => update("demoRuleHint", e.target.value)}
              rows={2}
              className="rounded-xl sketch-border bg-paper p-3 text-sm outline-none focus:ring-2 focus:ring-highlight-blue/60"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-xs font-semibold text-ink-muted font-kalam">系统循环提示</span>
            <textarea
              value={form.systemLoopHint}
              onChange={(e) => update("systemLoopHint", e.target.value)}
              rows={2}
              className="rounded-xl sketch-border bg-paper p-3 text-sm outline-none focus:ring-2 focus:ring-highlight-blue/60"
            />
          </label>
        </div>
      </div>

      <div className="rounded-2xl sketch-border bg-paper p-4">
        <div className="space-y-4">
          <ListEditor
            label="解决了什么问题"
            value={form.problemsSolved}
            onChange={(v) => update("problemsSolved", v)}
          />
          <ListEditor
            label="学习目标"
            value={form.learningGoals}
            onChange={(v) => update("learningGoals", v)}
          />
          <ListEditor
            label="最小规则集"
            value={form.minimalRules}
            onChange={(v) => update("minimalRules", v)}
          />
          <ListEditor
            label="高级设计警告"
            value={form.advancedWarnings}
            onChange={(v) => update("advancedWarnings", v)}
          />
          <ListEditor
            label="算法示例"
            value={form.advancedAlgoRefs}
            onChange={(v) => update("advancedAlgoRefs", v)}
          />
        </div>
      </div>

      <div className="rounded-2xl sketch-border bg-paper p-4">
        <div className="space-y-3">
          <div className="text-sm font-semibold">常见组合与变体</div>
          {form.combos.map((combo, idx) => (
            <div key={idx} className="grid gap-2 rounded-xl bg-paper-warm p-3">
              <div className="flex items-center gap-2">
                <input
                  value={combo.formula}
                  onChange={(e) => {
                    const next = [...form.combos];
                    next[idx] = { ...combo, formula: e.target.value };
                    update("combos", next);
                  }}
                  placeholder="组合公式，例如：消除 + 成长"
                  className="h-10 flex-1 rounded-xl sketch-border bg-paper px-3 text-sm outline-none focus:ring-2 focus:ring-highlight-blue/60"
                />
                <button
                  type="button"
                  onClick={() => update("combos", form.combos.filter((_, i) => i !== idx))}
                  className="inline-flex h-10 items-center justify-center rounded-xl sketch-border bg-paper px-3 text-sm font-semibold text-ink-light hover:bg-highlight-red/20"
                >
                  删除
                </button>
              </div>
              <textarea
                value={combo.effect}
                onChange={(e) => {
                  const next = [...form.combos];
                  next[idx] = { ...combo, effect: e.target.value };
                  update("combos", next);
                }}
                placeholder="效果说明"
                rows={2}
                className="rounded-xl sketch-border bg-paper p-3 text-sm outline-none focus:ring-2 focus:ring-highlight-blue/60"
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() => update("combos", [...form.combos, { formula: "", effect: "" }])}
            className="inline-flex h-9 items-center justify-center rounded-xl sketch-border bg-paper px-3 text-sm font-semibold text-ink-light hover:bg-paper-warm"
          >
            + 添加组合
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border-2 border-highlight-red bg-paper p-3 text-sm text-ink">
          {error}
        </div>
      ) : null}
      {ok ? (
        <div className="rounded-xl border-2 border-highlight-green bg-paper p-3 text-sm text-ink">
          ✅ 已保存
        </div>
      ) : null}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={busy}
          className="sketch-button disabled:opacity-50"
        >
          {busy ? "保存中…" : "保存母型"}
        </button>
        <Link
          href="/mod/archetypes"
          className="sketch-button sketch-button-secondary"
        >
          返回列表
        </Link>
      </div>
    </form>
  );
}
