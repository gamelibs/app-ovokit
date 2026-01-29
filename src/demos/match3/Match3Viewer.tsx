"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { GameShell, type GamePhase } from "@/components/demos/GameShell";
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
  const [stageSize, setStageSize] = useState<{ width: number; height: number } | null>(null);

  const autoBoard = useMemo(() => {
    if (mode !== "embed") return { width: 8, height: 8 };
    if (!stageSize) return { width: 8, height: 8 };
    const { width, height } = stageSize;
    const ratio = height / Math.max(1, width);
    const isPortraitLike = ratio >= 1.15;
    if (!isPortraitLike) return { width: 8, height: 8 };

    // Portrait: width is the limiting factor; use fewer columns to enlarge cell size.
    if (ratio >= 1.6) return { width: 6, height: 12 };
    if (ratio >= 1.35) return { width: 6, height: 10 };
    return { width: 7, height: 9 };
  }, [mode, stageSize]);

  const initInput: Match3InitInput = useMemo(
    () => ({
      width: initial?.width ?? autoBoard.width,
      height: initial?.height ?? autoBoard.height,
      types: initial?.types ?? 5,
      seed: initial?.seed ?? 42,
      maxMoves: initial?.maxMoves ?? 20,
      targetScore: initial?.targetScore ?? 1200,
    }),
    [
      autoBoard.height,
      autoBoard.width,
      initial?.height,
      initial?.maxMoves,
      initial?.seed,
      initial?.targetScore,
      initial?.types,
      initial?.width,
    ],
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [phase, setPhase] = useState<GamePhase>("idle");
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
      setPhase("playing");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [initInput]);

  useEffect(() => {
    // MVP: embed 以“开始”按钮触发；避免一进来就消耗请求/打断页面。
    setLoading(false);
    setPhase("idle");
    setState(null);
    setEvents([]);
    setHint(null);
    setSelected(null);
  }, [initInput.height, initInput.maxMoves, initInput.seed, initInput.targetScore, initInput.types, initInput.width]);

  useEffect(() => {
    if (mode !== "embed") return;
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      const data = e.data as unknown;
      if (!data || typeof data !== "object") return;
      if ((data as { type?: string }).type !== "demo:restart") return;
      void boot();
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [boot, mode]);

  const doStep = useCallback(
    async (nextAction: { type: "swap"; from: Vec2; to: Vec2 } | { type: "reset" }) => {
      if (!state) return;
      if (phase === "won" || phase === "lost") return;
      setLoading(true);
      setError(null);
      try {
        const res = await match3Step(state, nextAction);
        setState(res.state);
        setHint(res.view.hint ?? null);
        setEvents(res.events);
        if (res.view.phase === "won") setPhase("won");
        else if (res.view.phase === "lost") setPhase("lost");
        else setPhase("playing");
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    },
    [phase, state],
  );

  const onCellTap = useCallback(
    (cell: Vec2) => {
      if (loading) return;
      if (!state) return;
      if (phase !== "playing") return;
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
    [doStep, loading, phase, selected, state],
  );

  const board = state?.board ?? [];
  const movesLeft = state?.movesLeft ?? initInput.maxMoves ?? 0;
  const maxMoves = state?.maxMoves ?? initInput.maxMoves ?? 0;
  const score = state?.score ?? 0;
  const targetScore = state?.targetScore ?? initInput.targetScore ?? 0;

  return (
    <section className={mode === "embed" ? "h-full w-full" : "space-y-3"}>
      <div className={mode === "embed" ? "h-full w-full" : "rounded-2xl bg-zinc-950/95 p-3 shadow-inner ring-1 ring-zinc-900"}>
        <GameShell
          title={mode === "dev" ? "三消 Demo（Match-3 Core）" : "三消 Demo"}
          subtitle={
            mode === "dev"
              ? "规则：点击一格选中 → 点击相邻格交换 → 若未成消则回退"
              : "目标：在步数用尽前达到目标分数。"
          }
          phase={phase}
          loading={loading}
          error={error}
          onStart={() => void boot()}
          onRestart={() => void boot()}
          layout={mode === "embed" ? "fill" : "aspect-video"}
          chrome={mode === "embed" ? "overlay" : "above"}
          fullscreen={mode !== "embed"}
          showRestart={mode !== "embed"}
          onStageResize={mode === "embed" ? setStageSize : undefined}
          primaryHud={
            <span className="tabular-nums">
              分数 {score}/{targetScore}
            </span>
          }
          secondaryHud={
            <span className="tabular-nums">
              步数 {movesLeft}/{maxMoves}
            </span>
          }
        >
          <div className={mode === "embed" ? "relative h-full w-full p-3 pt-20" : "relative h-full w-full p-2"}>
            <Match3Canvas board={board} selected={selected} onCellTap={onCellTap} />
            {hint ? (
              <div className="pointer-events-none absolute left-3 right-3 top-3 rounded-xl bg-black/40 px-3 py-2 text-xs text-zinc-200 ring-1 ring-white/10">
                {hint}
              </div>
            ) : null}
          </div>
        </GameShell>

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
    </section>
  );
}
