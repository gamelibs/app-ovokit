"use client";

import { useEffect, useMemo, useState } from "react";

type Props = {
  slug: string;
};

function isRestartMessage(v: unknown) {
  return Boolean(
    v &&
      typeof v === "object" &&
      "type" in v &&
      (v as { type?: unknown }).type === "demo:restart",
  );
}

function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="h-full w-full overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 dark:border-white/10 dark:bg-white/5">
      <div className="border-b border-zinc-200 px-4 py-3 dark:border-white/10">
        <div className="text-sm font-semibold">{title}</div>
        {description ? (
          <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">
            {description}
          </div>
        ) : null}
      </div>
      <div className="h-[calc(100%-3.25rem)] p-4">{children}</div>
    </section>
  );
}

function GridMoveDemo() {
  const width = 9;
  const height = 9;
  const walls = useMemo(() => {
    const s = new Set<string>();
    const add = (x: number, y: number) => s.add(`${x},${y}`);
    // Border walls
    for (let x = 0; x < width; x++) {
      add(x, 0);
      add(x, height - 1);
    }
    for (let y = 0; y < height; y++) {
      add(0, y);
      add(width - 1, y);
    }
    // Some obstacles
    add(3, 3);
    add(4, 3);
    add(5, 3);
    add(3, 5);
    add(5, 5);
    return s;
  }, []);

  const [pos, setPos] = useState({ x: 1, y: 1 });

  const tryMove = (dx: number, dy: number) => {
    setPos((p) => {
      const nx = p.x + dx;
      const ny = p.y + dy;
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) return p;
      if (walls.has(`${nx},${ny}`)) return p;
      return { x: nx, y: ny };
    });
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") tryMove(0, -1);
      else if (e.key === "ArrowDown") tryMove(0, 1);
      else if (e.key === "ArrowLeft") tryMove(-1, 0);
      else if (e.key === "ArrowRight") tryMove(1, 0);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [walls]);

  return (
    <Panel
      title="网格移动（最小版）"
      description="方向键或按钮移动；墙体阻挡。用于演示“占用/阻挡”的最小闭环。"
    >
      <div className="grid h-full grid-rows-[1fr_auto] gap-4">
        <div
          className="grid aspect-square w-full max-w-[420px] grid-cols-9 overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-white/10 dark:bg-black/20"
          style={{ justifySelf: "start" }}
        >
          {Array.from({ length: width * height }).map((_, i) => {
            const x = i % width;
            const y = Math.floor(i / width);
            const isWall = walls.has(`${x},${y}`);
            const isPlayer = pos.x === x && pos.y === y;
            return (
              <div
                key={i}
                className={[
                  "relative border border-zinc-100 dark:border-white/5",
                  isWall ? "bg-zinc-900/70 dark:bg-white/10" : "bg-white dark:bg-black/10",
                ].join(" ")}
              >
                {isPlayer ? (
                  <div className="absolute inset-0 grid place-items-center">
                    <div className="h-4 w-4 rounded bg-blue-600" />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => tryMove(0, -1)}
            className="h-10 rounded-xl bg-blue-600 px-3 text-sm font-semibold text-white"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={() => tryMove(-1, 0)}
            className="h-10 rounded-xl bg-blue-600 px-3 text-sm font-semibold text-white"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => tryMove(1, 0)}
            className="h-10 rounded-xl bg-blue-600 px-3 text-sm font-semibold text-white"
          >
            →
          </button>
          <button
            type="button"
            onClick={() => tryMove(0, 1)}
            className="h-10 rounded-xl bg-blue-600 px-3 text-sm font-semibold text-white"
          >
            ↓
          </button>
          <div className="ml-auto text-xs text-zinc-600 dark:text-zinc-300">
            pos=({pos.x},{pos.y})
          </div>
        </div>
      </div>
    </Panel>
  );
}

type FsmState = "idle" | "move" | "attack" | "hitstun" | "dead";

function FsmDemo() {
  const [hp, setHp] = useState(3);
  const [hasTarget, setHasTarget] = useState(false);
  const [inRange, setInRange] = useState(false);
  const [state, setState] = useState<FsmState>("idle");
  const [log, setLog] = useState<string[]>([]);

  const pushLog = (s: string) =>
    setLog((prev) => [s, ...prev].slice(0, 6));

  const step = (event: string) => {
    setState((cur) => {
      if (cur === "dead") return cur;
      if (hp <= 0) return "dead";

      if (event === "DIE") return "dead";
      if (event === "HIT") return "hitstun";
      if (cur === "hitstun" && event === "RECOVER") return hasTarget ? "move" : "idle";

      if (cur === "idle" && event === "SEE_TARGET") return "move";
      if (cur === "move" && event === "LOST_TARGET") return "idle";
      if (cur === "move" && event === "IN_RANGE") return "attack";
      if (cur === "attack" && event === "OUT_OF_RANGE") return "move";
      if (cur === "attack" && event === "ATTACK_DONE") return inRange ? "attack" : "move";

      return cur;
    });
    pushLog(event);
  };

  useEffect(() => {
    if (hp <= 0) setState("dead");
  }, [hp]);

  return (
    <Panel
      title="战斗 FSM（最小版）"
      description="用事件按钮触发状态变化；演示“事件驱动 + 可测试转移”。"
    >
      <div className="grid h-full grid-rows-[auto_auto_1fr] gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="rounded-full bg-black/5 px-3 py-1 text-xs font-semibold text-zinc-700 dark:bg-white/10 dark:text-zinc-200">
            state: {state}
          </div>
          <div className="rounded-full bg-black/5 px-3 py-1 text-xs font-semibold text-zinc-700 dark:bg-white/10 dark:text-zinc-200">
            hp: {hp}
          </div>
          <label className="ml-auto flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300">
            <input
              type="checkbox"
              checked={hasTarget}
              onChange={(e) => setHasTarget(e.target.checked)}
            />
            有目标
          </label>
          <label className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300">
            <input
              type="checkbox"
              checked={inRange}
              onChange={(e) => setInRange(e.target.checked)}
            />
            在范围
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          {(
            [
              {
                label: "SEE_TARGET",
                onClick: () => {
                  setHasTarget(true);
                  step("SEE_TARGET");
                },
              },
              {
                label: "LOST_TARGET",
                onClick: () => {
                  setHasTarget(false);
                  setInRange(false);
                  step("LOST_TARGET");
                },
              },
              {
                label: "IN_RANGE",
                onClick: () => {
                  setInRange(true);
                  step("IN_RANGE");
                },
              },
              {
                label: "OUT_OF_RANGE",
                onClick: () => {
                  setInRange(false);
                  step("OUT_OF_RANGE");
                },
              },
              { label: "ATTACK_DONE", onClick: () => step("ATTACK_DONE") },
              {
                label: "HIT",
                onClick: () => {
                  setHp((v) => Math.max(0, v - 1));
                  step("HIT");
                },
              },
              { label: "RECOVER", onClick: () => step("RECOVER") },
              {
                label: "RESET",
                onClick: () => {
                  setHp(3);
                  setHasTarget(false);
                  setInRange(false);
                  setState("idle");
                  setLog([]);
                },
              },
            ] satisfies Array<{ label: string; onClick: () => void }>
          ).map(({ label, onClick }) => (
            <button
              key={label}
              type="button"
              onClick={onClick}
              className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 dark:border-white/10 dark:bg-black/20 dark:text-zinc-50 dark:hover:bg-white/10"
            >
              {label}
            </button>
          ))}
        </div>

        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white p-3 text-xs text-zinc-700 dark:border-white/10 dark:bg-black/20 dark:text-zinc-200">
          <div className="mb-2 font-semibold">最近事件</div>
          <ul className="space-y-1">
            {log.length ? log.map((e, i) => <li key={`${e}-${i}`}>- {e}</li>) : <li>- （无）</li>}
          </ul>
        </div>
      </div>
    </Panel>
  );
}

function TdWaveDemo() {
  const [wave, setWave] = useState(10);
  const [variant, setVariant] = useState<"swarm" | "elite">("swarm");

  const enemies = useMemo(
    () => [
      { id: "minion", cost: 1 },
      { id: "runner", cost: 2 },
      { id: "tank", cost: 5 },
      { id: "flyer", cost: 4 },
    ],
    [],
  );

  const budget = Math.round(10 + wave * 2.2 + Math.pow(wave, 1.15));

  const picked = useMemo(() => {
    const pool =
      variant === "swarm"
        ? enemies
        : enemies
            .map((e) => ({ ...e, cost: Math.max(1, Math.round(e.cost * 0.9)) }))
            .filter((e) => e.id !== "minion");
    let remaining = budget;
    const out: string[] = [];
    // Simple greedy: expensive first for elite, cheap first for swarm
    const sorted =
      variant === "elite"
        ? [...pool].sort((a, b) => b.cost - a.cost)
        : [...pool].sort((a, b) => a.cost - b.cost);
    for (const e of sorted) {
      while (remaining >= e.cost) {
        out.push(e.id);
        remaining -= e.cost;
      }
    }
    return { out, remaining };
  }, [budget, enemies, variant]);

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const id of picked.out) m.set(id, (m.get(id) ?? 0) + 1);
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  }, [picked.out]);

  return (
    <Panel
      title="塔防波次（预算 + 变体）"
      description="用一个预算函数生成本波怪物组合（示意版），用于解释“压力曲线”。"
    >
      <div className="grid h-full grid-rows-[auto_auto_1fr] gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs text-zinc-600 dark:text-zinc-300">
            波次：{wave}
            <input
              type="range"
              min={1}
              max={30}
              value={wave}
              onChange={(e) => setWave(Number(e.target.value))}
              className="ml-3 align-middle"
            />
          </label>
          <div className="rounded-full bg-black/5 px-3 py-1 text-xs font-semibold text-zinc-700 dark:bg-white/10 dark:text-zinc-200">
            budget: {budget}
          </div>
          <div className="ml-auto flex items-center gap-2">
            {(["swarm", "elite"] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setVariant(k)}
                className={[
                  "h-9 rounded-full px-3 text-xs font-semibold",
                  variant === k
                    ? "bg-blue-600 text-white"
                    : "border border-zinc-200 bg-white text-zinc-900 dark:border-white/10 dark:bg-black/20 dark:text-zinc-50",
                ].join(" ")}
              >
                {k === "swarm" ? "群怪" : "精英"}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-white/10 dark:bg-black/20">
            <div className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
              组合统计
            </div>
            <ul className="mt-2 space-y-1">
              {counts.map(([id, c]) => (
                <li key={id} className="flex items-center justify-between gap-2">
                  <span className="font-semibold">{id}</span>
                  <span className="tabular-nums text-zinc-600 dark:text-zinc-300">
                    ×{c}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-white/10 dark:bg-black/20">
            <div className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
              预算余量
            </div>
            <div className="mt-2 text-2xl font-semibold tabular-nums">
              {picked.remaining}
            </div>
            <div className="mt-2 text-xs text-zinc-600 dark:text-zinc-300">
              余量越大表示“生成规则不够充分”，需要更合理的池/权重/约束。
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white p-3 text-xs text-zinc-700 dark:border-white/10 dark:bg-black/20 dark:text-zinc-200">
          <div className="mb-2 font-semibold">示例调参建议</div>
          <ul className="space-y-1">
            <li>- 用预算控制“总体强度”，用节拍控制“瞬时压力”。</li>
            <li>- 用变体制造“识别与对策”，但要加冷却避免连坐。</li>
            <li>- 先保证可解释的波峰/波谷，再做随机变化。</li>
          </ul>
        </div>
      </div>
    </Panel>
  );
}

function MergeDemo() {
  const [tier1, setTier1] = useState(6);
  const [tier2, setTier2] = useState(1);
  const [tier3, setTier3] = useState(0);
  const [tier4, setTier4] = useState(0);

  const merge = (from: 1 | 2 | 3) => {
    if (from === 1 && tier1 >= 2) {
      setTier1((v) => v - 2);
      setTier2((v) => v + 1);
      return;
    }
    if (from === 2 && tier2 >= 2) {
      setTier2((v) => v - 2);
      setTier3((v) => v + 1);
      return;
    }
    if (from === 3 && tier3 >= 2) {
      setTier3((v) => v - 2);
      setTier4((v) => v + 1);
    }
  };

  return (
    <Panel
      title="合成升级（表驱动思维）"
      description="用最小资源计数演示“2 合 1”的合成链与节奏。"
    >
      <div className="grid h-full grid-rows-[auto_1fr] gap-4">
        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          {[
            ["u_1", tier1],
            ["u_2", tier2],
            ["u_3", tier3],
            ["u_4", tier4],
          ].map(([id, n]) => (
            <div
              key={id}
              className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-white/10 dark:bg-black/20"
            >
              <div className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                {id}
              </div>
              <div className="mt-1 text-2xl font-semibold tabular-nums">
                {n}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setTier1((v) => v + 1)}
            className="h-10 rounded-xl bg-blue-600 px-3 text-sm font-semibold text-white"
          >
            产出 u_1
          </button>
          <button
            type="button"
            onClick={() => merge(1)}
            className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 dark:border-white/10 dark:bg-black/20 dark:text-zinc-50 dark:hover:bg-white/10"
          >
            u_1 ×2 → u_2
          </button>
          <button
            type="button"
            onClick={() => merge(2)}
            className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 dark:border-white/10 dark:bg-black/20 dark:text-zinc-50 dark:hover:bg-white/10"
          >
            u_2 ×2 → u_3
          </button>
          <button
            type="button"
            onClick={() => merge(3)}
            className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 dark:border-white/10 dark:bg-black/20 dark:text-zinc-50 dark:hover:bg-white/10"
          >
            u_3 ×2 → u_4
          </button>
          <button
            type="button"
            onClick={() => (setTier1(6), setTier2(1), setTier3(0), setTier4(0))}
            className="ml-auto h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 dark:border-white/10 dark:bg-black/20 dark:text-zinc-50 dark:hover:bg-white/10"
          >
            重置
          </button>
        </div>
      </div>
    </Panel>
  );
}

function GenericDemo({ slug }: { slug: string }) {
  return (
    <Panel
      title="Demo（文本版）"
      description="该玩法暂无专用可试玩 Demo；先提供文本化结构信息。"
    >
      <div className="text-sm text-zinc-700 dark:text-zinc-200">
        <div className="font-semibold">slug</div>
        <div className="mt-2 rounded-xl border border-zinc-200 bg-white p-3 font-mono text-xs dark:border-white/10 dark:bg-black/20">
          {slug}
        </div>
        <div className="mt-4 text-xs text-zinc-600 dark:text-zinc-300">
          建议做法：先把规则与状态机/生成器做成可复用模块，再接入真实试玩。
        </div>
      </div>
    </Panel>
  );
}

export function PlayMiniDemo({ slug }: Props) {
  const [resetKey, setResetKey] = useState(0);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if (!isRestartMessage(e.data)) return;
      setResetKey((v) => v + 1);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const content = useMemo(() => {
    if (slug === "grid-movement-and-collision") return <GridMoveDemo />;
    if (slug === "finite-state-machine-for-combat") return <FsmDemo />;
    if (slug === "td-waves-and-ai-scaling") return <TdWaveDemo />;
    if (slug === "merge-level-core-loop") return <MergeDemo />;
    return <GenericDemo slug={slug} />;
  }, [slug]);

  return <div key={resetKey}>{content}</div>;
}
