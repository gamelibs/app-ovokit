"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { match3Init, match3Step } from "./api";
import { Match3Canvas } from "./Match3Canvas";
import type { Match3Event, Match3InitInput, Match3State, Vec2 } from "./types";

type Props = {
  mode: "embed" | "dev";
  initial?: Partial<Match3InitInput>;
};

function isAdjacent(a: Vec2, b: Vec2) {
  const dx = Math.abs(a[0] - b[0]);
  const dy = Math.abs(a[1] - b[1]);
  return dx + dy === 1;
}

export function Match3Viewer({ mode, initial }: Props) {
  const initInput: Match3InitInput = useMemo(
    () => ({
      width: initial?.width ?? 8,
      height: initial?.height ?? 8,
      types: initial?.types ?? 5,
      seed: initial?.seed ?? 42,
    }),
    [initial?.height, initial?.seed, initial?.types, initial?.width],
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [state, setState] = useState<Match3State | null>(null);
  const [events, setEvents] = useState<Match3Event[]>([]);
  const [selected, setSelected] = useState<Vec2 | null>(null);

  const boot = useCallback(async () => {
    setLoading(true);
    setError(null);
    setHint(null);
    setSelected(null);
    try {
      const res = await match3Init(initInput);
      setState(res.state);
      setEvents([]);
      setHint(res.view.hint ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [initInput]);

  useEffect(() => {
    void boot();
  }, [boot]);

  const doStep = useCallback(
    async (nextAction: { type: "swap"; from: Vec2; to: Vec2 } | { type: "reset" }) => {
      if (!state) return;
      setLoading(true);
      setError(null);
      try {
        const res = await match3Step(state, nextAction);
        setState(res.state);
        setHint(res.view.hint ?? null);
        setEvents(res.events);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    },
    [state],
  );

  const onCellTap = useCallback(
    (cell: Vec2) => {
      if (loading) return;
      if (!state) return;
      if (!selected) {
        setSelected(cell);
        return;
      }
      if (selected[0] === cell[0] && selected[1] === cell[1]) {
        setSelected(null);
        return;
      }
      if (!isAdjacent(selected, cell)) {
        setSelected(cell);
        return;
      }
      const from = selected;
      const to = cell;
      setSelected(null);
      void doStep({ type: "swap", from, to });
    },
    [doStep, loading, selected, state],
  );

  const board = state?.board ?? [];

  return (
    <section className={mode === "embed" ? "h-full w-full" : "space-y-3"}>
      {mode === "dev" ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm font-semibold">三消 Demo（Match-3 Core）</div>
          <div className="flex gap-2">
            <button
              type="button"
              className="h-9 rounded-xl bg-white/5 px-3 text-sm font-semibold text-white ring-1 ring-white/10 hover:bg-white/10"
              onClick={() => void doStep({ type: "reset" })}
              disabled={loading || !state}
            >
              重置
            </button>
            <button
              type="button"
              className="h-9 rounded-xl bg-blue-600 px-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
              onClick={() => void boot()}
              disabled={loading}
            >
              重新初始化
            </button>
          </div>
        </div>
      ) : null}

      <div className={mode === "embed" ? "h-full w-full" : "rounded-2xl border border-zinc-200 bg-zinc-950/95 p-3 shadow-inner ring-1 ring-zinc-900 dark:border-white/10"}>
        <div className={mode === "embed" ? "h-full w-full" : "aspect-video w-full"}>
          <Match3Canvas board={board} selected={selected} onCellTap={onCellTap} />
        </div>

        {mode === "dev" ? (
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400">
            <span>
              规则：点击一格选中 → 点击相邻格交换 → 若未成消则回退
            </span>
            <span>
              棋盘：{state?.width}×{state?.height} · 种类：{state?.types} · seed：{state?.seed}
            </span>
          </div>
        ) : null}

        {hint ? (
          <div className="mt-2 rounded-xl bg-black/40 px-3 py-2 text-xs text-zinc-300">{hint}</div>
        ) : null}

        {error ? (
          <div className="mt-2 rounded-xl bg-red-500/10 px-3 py-2 text-xs text-red-200 ring-1 ring-red-500/20">
            {error}
          </div>
        ) : null}

        {mode === "dev" ? (
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {events.length === 0 ? (
              <div className="rounded-xl bg-white/5 px-3 py-2 text-xs text-zinc-500">暂无事件（交换产生事件）</div>
            ) : (
              events.slice(0, 12).map((e, idx) => (
                <div
                  key={`${e.type}-${idx}`}
                  className="rounded-xl border border-zinc-800 bg-black/40 px-3 py-2 text-xs text-zinc-200"
                >
                  <div className="font-semibold">{e.type}</div>
                  <div className="mt-1 font-mono text-[11px] text-zinc-400">
                    {"payload" in e ? JSON.stringify(e.payload) : ""}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : null}
      </div>

      {mode === "dev" ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm text-zinc-700 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-zinc-200">
          <div className="font-semibold">管理建议</div>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>规则在服务端 demo（state/action/events）中实现，前端只渲染与发 action。</li>
            <li>展示用 iframe 使用 `/embed/demos/match3`，与页面滚动/手势隔离。</li>
            <li>后续扩展特殊块/障碍/目标，只需要扩展 state 与 events；渲染按 events 增加表现。</li>
          </ul>
        </div>
      ) : null}
    </section>
  );
}

