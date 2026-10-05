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
    <section className="h-full w-full overflow-hidden rounded-2xl sketch-border bg-paper-warm">
      <div className="border-b border-zinc-200 px-4 py-3">
        <div className="text-sm font-semibold">{title}</div>
        {description ? (
          <div className="mt-1 text-xs text-ink-light">
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
      title="Grid Movement (Minimal)"
      description="Move with the arrow keys or buttons; walls block. Minimal loop for occupancy/collision."
    >
      <div className="grid h-full grid-rows-[1fr_auto] gap-4">
        <div
          className="grid aspect-square w-full max-w-[420px] grid-cols-9 overflow-hidden rounded-xl sketch-border bg-paper"
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
                  "relative border border-zinc-100",
                  isWall ? "bg-zinc-900/70" : "bg-paper",
                ].join(" ")}
              >
                {isPlayer ? (
                  <div className="absolute inset-0 grid place-items-center">
                    <div className="h-4 w-4 rounded bg-highlight-blue" />
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
            className="h-10 rounded-xl bg-highlight-blue px-3 text-sm font-semibold text-ink"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={() => tryMove(-1, 0)}
            className="h-10 rounded-xl bg-highlight-blue px-3 text-sm font-semibold text-ink"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => tryMove(1, 0)}
            className="h-10 rounded-xl bg-highlight-blue px-3 text-sm font-semibold text-ink"
          >
            →
          </button>
          <button
            type="button"
            onClick={() => tryMove(0, 1)}
            className="h-10 rounded-xl bg-highlight-blue px-3 text-sm font-semibold text-ink"
          >
            ↓
          </button>
          <div className="ml-auto text-xs text-ink-light">
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

  return (
    <Panel
      title="Combat FSM (Minimal)"
      description="Trigger state changes with event buttons; demonstrates event-driven, testable transitions."
    >
      <div className="grid h-full grid-rows-[auto_auto_1fr] gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="rounded-full bg-ink/5 px-3 py-1 text-xs font-semibold text-ink-light">
            state: {state}
          </div>
          <div className="rounded-full bg-ink/5 px-3 py-1 text-xs font-semibold text-ink-light">
            hp: {hp}
          </div>
          <label className="ml-auto flex items-center gap-2 text-xs text-ink-light">
            <input
              type="checkbox"
              checked={hasTarget}
              onChange={(e) => setHasTarget(e.target.checked)}
            />
            Has Target
          </label>
          <label className="flex items-center gap-2 text-xs text-ink-light">
            <input
              type="checkbox"
              checked={inRange}
              onChange={(e) => setInRange(e.target.checked)}
            />
            In Range
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
                  const nextHp = Math.max(0, hp - 1);
                  setHp(nextHp);
                  if (nextHp <= 0) setState("dead");
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
              className="h-10 rounded-xl sketch-border bg-paper px-3 text-sm font-semibold text-ink hover:bg-paper-warm"
            >
              {label}
            </button>
          ))}
        </div>

        <div className="overflow-hidden rounded-xl sketch-border bg-paper p-3 text-xs text-ink-light">
          <div className="mb-2 font-semibold">Recent Events</div>
          <ul className="space-y-1">
            {log.length ? log.map((e, i) => <li key={`${e}-${i}`}>- {e}</li>) : <li>- (none)</li>}
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
      title="TD Waves (Budget + Variants)"
      description="Generate this wave's enemy mix from a budget function (illustrative); used to explain the pressure curve."
    >
      <div className="grid h-full grid-rows-[auto_auto_1fr] gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs text-ink-light">
            Wave: {wave}
            <input
              type="range"
              min={1}
              max={30}
              value={wave}
              onChange={(e) => setWave(Number(e.target.value))}
              className="ml-3 align-middle"
            />
          </label>
          <div className="rounded-full bg-ink/5 px-3 py-1 text-xs font-semibold text-ink-light">
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
                    ? "bg-highlight-blue text-ink"
                    : "sketch-border bg-paper text-ink",
                ].join(" ")}
              >
                {k === "swarm" ? "Swarm" : "Elite"}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl sketch-border bg-paper p-3">
            <div className="text-xs font-semibold text-ink-light">
              Composition
            </div>
            <ul className="mt-2 space-y-1">
              {counts.map(([id, c]) => (
                <li key={id} className="flex items-center justify-between gap-2">
                  <span className="font-semibold">{id}</span>
                  <span className="tabular-nums text-ink-light">
                    ×{c}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl sketch-border bg-paper p-3">
            <div className="text-xs font-semibold text-ink-light">
              Budget Left
            </div>
            <div className="mt-2 text-2xl font-semibold tabular-nums">
              {picked.remaining}
            </div>
            <div className="mt-2 text-xs text-ink-light">
              A larger remainder means the generator rules are under-constrained; improve the pool, weights, and constraints.
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl sketch-border bg-paper p-3 text-xs text-ink-light">
          <div className="mb-2 font-semibold">Tuning Tips</div>
          <ul className="space-y-1">
            <li>- Use budget for overall intensity and pacing for moment-to-moment pressure.</li>
            <li>- Use variants to force recognition and counterplay; add cooldowns to avoid streaks.</li>
            <li>- Nail explainable peaks and valleys first, then add randomness.</li>
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
      title="Merge Upgrade (Table-Driven)"
      description="A minimal resource-count demo of the 2-into-1 merge chain and its pacing."
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
              className="rounded-xl sketch-border bg-paper p-3"
            >
              <div className="text-xs font-semibold text-ink-light">
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
            className="h-10 rounded-xl bg-highlight-blue px-3 text-sm font-semibold text-ink"
          >
            Produce u_1
          </button>
          <button
            type="button"
            onClick={() => merge(1)}
            className="h-10 rounded-xl sketch-border bg-paper px-3 text-sm font-semibold text-ink hover:bg-paper-warm"
          >
            u_1 ×2 → u_2
          </button>
          <button
            type="button"
            onClick={() => merge(2)}
            className="h-10 rounded-xl sketch-border bg-paper px-3 text-sm font-semibold text-ink hover:bg-paper-warm"
          >
            u_2 ×2 → u_3
          </button>
          <button
            type="button"
            onClick={() => merge(3)}
            className="h-10 rounded-xl sketch-border bg-paper px-3 text-sm font-semibold text-ink hover:bg-paper-warm"
          >
            u_3 ×2 → u_4
          </button>
          <button
            type="button"
            onClick={() => (setTier1(6), setTier2(1), setTier3(0), setTier4(0))}
            className="ml-auto h-10 rounded-xl sketch-border bg-paper px-3 text-sm font-semibold text-ink hover:bg-paper-warm"
          >
            Reset
          </button>
        </div>
      </div>
    </Panel>
  );
}

function GenericDemo({ slug }: { slug: string }) {
  return (
    <Panel
      title="Demo (Text Version)"
      description="No dedicated playable demo for this pattern yet; showing structural info as text."
    >
      <div className="text-sm text-ink-light">
        <div className="font-semibold">slug</div>
        <div className="mt-2 rounded-xl sketch-border bg-paper p-3 font-mono text-xs">
          {slug}
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
