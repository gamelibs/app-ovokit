"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type DemoControl =
  | { kind: "button"; label: string; action: unknown }
  | { kind: "choices"; label: string; options: string[] }
  | {
      kind: "slider";
      label: string;
      key: string;
      min: number;
      max: number;
      step?: number;
      value: number;
    };

type DemoView = {
  title: string;
  goal: string;
  status: string[];
  metrics: Array<{ label: string; value: string }>;
  controls: DemoControl[];
};

type InitResult = { state: unknown; view: DemoView };
type StepResult = { state: unknown; view: DemoView; events: Array<{ type: string; payload?: unknown }> };

function isRestartMessage(v: unknown) {
  return Boolean(
    v &&
      typeof v === "object" &&
      "type" in v &&
      (v as { type?: unknown }).type === "demo:restart",
  );
}

function Button({
  children,
  onClick,
  disabled,
  variant = "primary",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary";
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={[
        "inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-semibold",
        "transition active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100",
        variant === "primary"
          ? "bg-highlight-blue text-ink hover:bg-highlight-blue/90"
          : "sketch-border bg-paper text-ink hover:bg-paper-warm",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export function ServerDemoPlayer({
  demoId,
  initInput,
}: {
  demoId: string;
  initInput?: unknown;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<unknown>(null);
  const [view, setView] = useState<DemoView | null>(null);
  const [events, setEvents] = useState<Array<{ type: string; payload?: unknown }>>([]);

  const initPayload = useMemo(() => initInput ?? {}, [initInput]);

  const init = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/demos/${encodeURIComponent(demoId)}/init`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(initPayload),
        cache: "no-store",
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as InitResult;
      setState(data.state);
      setView(data.view);
      setEvents([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Init failed");
    } finally {
      setBusy(false);
    }
  }, [demoId, initPayload]);

  const step = useCallback(
    async (action: unknown) => {
      if (!state) return;
      setBusy(true);
      setError(null);
      try {
        const res = await fetch(`/api/demos/${encodeURIComponent(demoId)}/step`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ state, action }),
          cache: "no-store",
        });
        if (!res.ok) throw new Error(await res.text());
        const data = (await res.json()) as StepResult;
        setState(data.state);
        setView(data.view);
        setEvents(data.events ?? []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Step failed");
      } finally {
        setBusy(false);
      }
    },
    [demoId, state],
  );

  useEffect(() => {
    void init();
  }, [init]);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if (!isRestartMessage(e.data)) return;
      void init();
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [init]);

  const hasTickControl = view?.controls.some(
    (c) => c.kind === "button" && String(c.label).toLowerCase().includes("tick"),
  );

  const controls = useMemo(() => {
    const list = view?.controls ?? [];
    if (list.length === 0 || hasTickControl) return list;
    return [
      ...list,
      { kind: "button" as const, label: "推进（tick）", action: { type: "tick" } },
    ];
  }, [view?.controls, hasTickControl]);

  if (error) {
    return (
      <div className="rounded-xl border-2 border-highlight-red bg-paper p-4 text-sm text-ink">
        <div className="font-semibold">Demo 初始化失败</div>
        <div className="mt-1 text-ink-light">{error}</div>
        <Button variant="secondary" onClick={() => void init()}>
          重试
        </Button>
      </div>
    );
  }

  if (!view) {
    return (
      <div className="grid h-full place-items-center rounded-xl sketch-border bg-paper p-6 text-sm text-ink-light">
        {busy ? "正在加载 Demo…" : "准备中…"}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-3 overflow-auto bg-paper p-3 text-ink sm:p-4">
      {/* Header */}
      <div className="shrink-0">
        <h1 className="text-base font-semibold text-ink sm:text-lg">{view.title}</h1>
        <p className="mt-0.5 text-xs leading-relaxed text-ink-light sm:text-sm">{view.goal}</p>
      </div>

      {/* Status + Metrics */}
      <div className="grid shrink-0 gap-3 sm:grid-cols-2">
        <div className="rounded-xl sketch-border bg-paper p-3">
          <div className="text-xs font-semibold text-ink-muted">状态</div>
          <ul className="mt-2 space-y-1 text-xs text-ink-light sm:text-sm">
            {view.status.map((s, i) => (
              <li key={i} className="whitespace-pre-wrap leading-relaxed">
                - {s}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl sketch-border bg-paper p-3">
          <div className="text-xs font-semibold text-ink-muted">指标</div>
          <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2 text-xs sm:text-sm">
            {view.metrics.map((m) => (
              <div key={m.label} className="flex items-center justify-between gap-2">
                <dt className="text-ink-light">{m.label}</dt>
                <dd className="font-semibold tabular-nums text-ink">{m.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* Controls */}
      <div className="shrink-0 rounded-xl sketch-border bg-paper p-3">
        <div className="flex flex-wrap items-center gap-2">
          {controls.map((c, idx) => {
            if (c.kind === "button") {
              return (
                <Button
                  key={`${c.label}-${idx}`}
                  variant={String(c.label).toLowerCase().includes("tick") ? "secondary" : "primary"}
                  disabled={busy}
                  onClick={() => void step(c.action)}
                >
                  {c.label}
                </Button>
              );
            }
            if (c.kind === "choices") {
              return (
                <div key={`${c.label}-${idx}`} className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-ink-light">{c.label}：</span>
                  {c.options.slice(0, 9).map((opt, i) => (
                    <button
                      key={`${opt}-${i}`}
                      type="button"
                      disabled={busy}
                      onClick={() => void step({ type: "choice", option: i })}
                      className="inline-flex h-9 items-center justify-center rounded-full sketch-border bg-paper px-3 text-xs font-semibold text-ink hover:bg-paper-warm disabled:opacity-60"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              );
            }
            if (c.kind === "slider") {
              return (
                <label
                  key={`${c.label}-${idx}`}
                  className="flex items-center gap-2 text-xs text-ink-light"
                >
                  <span className="whitespace-nowrap">{c.label}</span>
                  <input
                    type="range"
                    min={c.min}
                    max={c.max}
                    step={c.step ?? 1}
                    value={c.value}
                    disabled={busy}
                    onChange={(e) =>
                      void step({
                        type: "set",
                        key: c.key,
                        value: Number(e.target.value),
                      })
                    }
                    className="h-2 w-24 accent-highlight-blue sm:w-32"
                  />
                  <span className="tabular-nums">{c.value}</span>
                </label>
              );
            }
            return null;
          })}
        </div>
      </div>

      {/* Events */}
      <div className="min-h-0 flex-1 rounded-xl sketch-border bg-paper p-3">
        <div className="mb-2 text-xs font-semibold text-ink-muted">事件</div>
        {events.length ? (
          <ul className="max-h-28 space-y-1 overflow-auto text-xs text-ink-light sm:max-h-36 sm:text-sm">
            {events.slice(0, 20).map((e, i) => (
              <li key={`${e.type}-${i}`}>- {e.type}</li>
            ))}
          </ul>
        ) : (
          <div className="text-xs text-ink-muted">（暂无）</div>
        )}
      </div>
    </div>
  );
}
