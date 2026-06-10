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

  return (
    <div className="h-full w-full">
      {error ? (
        <div className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      {view ? (
        <div className="grid h-full grid-rows-[auto_auto_1fr_auto] gap-3">
          <div>
            <div className="text-base font-semibold">{view.title}</div>
            <div className="mt-1 text-xs text-ink-light">
              {view.goal}
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-xl sketch-border bg-paper p-3 text-sm">
              <div className="text-xs font-semibold text-ink-light">
                状态
              </div>
              <ul className="mt-2 space-y-1 text-xs text-ink-light">
                {view.status.map((s) => (
                  <li key={s}>- {s}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl sketch-border bg-paper p-3 text-sm">
              <div className="text-xs font-semibold text-ink-light">
                指标
              </div>
              <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                {view.metrics.map((m) => (
                  <div key={m.label} className="flex items-center justify-between gap-2">
                    <dt className="text-ink-light">{m.label}</dt>
                    <dd className="font-semibold tabular-nums text-ink">
                      {m.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          <div className="rounded-xl sketch-border bg-paper p-3">
            <div className="flex flex-wrap gap-2">
              {view.controls.map((c, idx) => {
                if (c.kind === "button") {
                  return (
                    <button
                      key={`${c.label}-${idx}`}
                      type="button"
                      disabled={busy}
                      onClick={() => void step(c.action)}
                      className="h-10 rounded-xl bg-highlight-blue px-3 text-sm font-semibold text-ink disabled:opacity-60"
                    >
                      {c.label}
                    </button>
                  );
                }
                if (c.kind === "choices") {
                  return (
                    <div
                      key={`${c.label}-${idx}`}
                      className="flex flex-wrap items-center gap-2"
                    >
                      <div className="text-xs font-semibold text-ink-light">
                        {c.label}：
                      </div>
                      {c.options.slice(0, 3).map((opt, i) => (
                        <button
                          key={`${opt}-${i}`}
                          type="button"
                          disabled={busy}
                          onClick={() => void step({ type: "choice", option: i })}
                          className="h-9 rounded-full sketch-border bg-paper px-3 text-xs font-semibold text-ink hover:bg-paper-warm disabled:opacity-60"
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
                      {c.label}
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
                      />
                      <span className="tabular-nums">{c.value}</span>
                    </label>
                  );
                }
                return null;
              })}
            </div>
          </div>

          <div className="rounded-xl sketch-border bg-paper p-3 text-xs text-ink-light">
            <div className="mb-2 font-semibold">事件</div>
            {events.length ? (
              <ul className="space-y-1">
                {events.slice(0, 6).map((e, i) => (
                  <li key={`${e.type}-${i}`}>- {e.type}</li>
                ))}
              </ul>
            ) : (
              <div className="text-ink-muted">（暂无）</div>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-xl sketch-border bg-paper p-4 text-sm text-ink-light">
          {busy ? "加载中…" : "初始化…"}
        </div>
      )}
    </div>
  );
}

