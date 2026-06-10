"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type GamePhase = "idle" | "playing" | "won" | "lost";

type Props = {
  title: string;
  subtitle?: string;
  phase: GamePhase;
  loading?: boolean;
  error?: string | null;
  layout?: "aspect-video" | "fill";
  fullscreen?: boolean;
  onStageResize?: (size: { width: number; height: number }) => void;
  chrome?: "above" | "overlay";
  showRestart?: boolean;

  primaryHud?: React.ReactNode;
  secondaryHud?: React.ReactNode;

  onStart: () => void;
  onRestart: () => void;

  children: React.ReactNode;
};

export function GameShell({
  title,
  subtitle,
  phase,
  loading,
  error,
  layout = "aspect-video",
  fullscreen = true,
  onStageResize,
  chrome = "above",
  showRestart = true,
  primaryHud,
  secondaryHud,
  onStart,
  onRestart,
  children,
}: Props) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [canFullscreen, setCanFullscreen] = useState(false);

  useEffect(() => {
    const onChange = () => {
      const el = document.fullscreenElement;
      setIsFullscreen(Boolean(el && el === stageRef.current));
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  useEffect(() => {
    if (!onStageResize) return;
    const el = stageRef.current;
    if (!el) return;

    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      onStageResize({ width, height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [onStageResize]);

  useEffect(() => {
    setCanFullscreen(Boolean(fullscreen && document.fullscreenEnabled));
  }, [fullscreen]);

  const enterFullscreen = useCallback(async () => {
    const el = stageRef.current;
    if (!el) return;
    try {
      await el.requestFullscreen();
    } catch {
      // ignore
    }
  }, []);

  const exitFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
    } catch {
      // ignore
    }
  }, []);

  const overlay = useMemo(() => {
    if (phase === "idle") {
      return {
        title: "准备开始",
        desc: subtitle ?? "点击开始进入对局。",
        primary: { label: "开始", onClick: onStart },
        secondary: null as null | { label: string; onClick: () => void },
      };
    }
    if (phase === "won") {
      return {
        title: "胜利",
        desc: "目标已达成。",
        primary: { label: "再来一局", onClick: onRestart },
        secondary: null as null | { label: string; onClick: () => void },
      };
    }
    if (phase === "lost") {
      return {
        title: "失败",
        desc: "步数用尽。",
        primary: { label: "再试一次", onClick: onRestart },
        secondary: null as null | { label: string; onClick: () => void },
      };
    }
    return null;
  }, [onRestart, onStart, phase, subtitle]);

  const header = (
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div className="min-w-0">
        <div className="text-sm font-semibold text-zinc-100">{title}</div>
        {subtitle ? <div className="mt-0.5 text-xs text-ink-muted">{subtitle}</div> : null}
      </div>
      <div className="flex items-center gap-2">
        {canFullscreen ? (
          !isFullscreen ? (
            <button
              type="button"
              className="h-9 rounded-xl bg-paper/5 px-3 text-sm font-semibold text-ink ring-1 ring-white/10 hover:bg-paper/10 disabled:opacity-60"
              onClick={() => void enterFullscreen()}
              disabled={Boolean(loading)}
            >
              全屏
            </button>
          ) : (
            <button
              type="button"
              className="h-9 rounded-xl bg-paper/5 px-3 text-sm font-semibold text-ink ring-1 ring-white/10 hover:bg-paper/10 disabled:opacity-60"
              onClick={() => void exitFullscreen()}
              disabled={Boolean(loading)}
            >
              退出全屏
            </button>
          )
        ) : null}
        {secondaryHud ? (
          <div className="rounded-xl bg-ink/40 px-3 py-2 text-[11px] text-ink-muted ring-1 ring-white/10">
            {secondaryHud}
          </div>
        ) : null}
        {primaryHud ? (
          <div className="rounded-xl bg-ink/40 px-3 py-2 text-[11px] text-ink-muted ring-1 ring-white/10">
            {primaryHud}
          </div>
        ) : null}
        {showRestart ? (
          <button
            type="button"
            className="h-9 rounded-xl bg-paper/5 px-3 text-sm font-semibold text-ink ring-1 ring-white/10 hover:bg-paper/10 disabled:opacity-60"
            onClick={onRestart}
            disabled={Boolean(loading)}
          >
            重开
          </button>
        ) : null}
      </div>
    </div>
  );

  return (
    <section className={layout === "fill" ? "relative flex h-full flex-col gap-2" : "space-y-2"}>
      {chrome === "above" ? header : null}

      <div
        ref={stageRef}
        className={[
          "relative overflow-hidden rounded-2xl border border-zinc-800 bg-ink/60 shadow-inner ring-1 ring-zinc-900",
          layout === "fill" ? "min-h-0 flex-1" : "",
        ]
          .join(" ")
          .trim()}
      >
        {chrome === "overlay" ? (
          <div className="pointer-events-none absolute left-3 right-3 top-3 z-10">
            <div className="pointer-events-auto rounded-2xl bg-black/45 p-2 backdrop-blur ring-1 ring-white/10">
              {header}
            </div>
          </div>
        ) : null}
        <div className={layout === "fill" ? "h-full w-full" : "aspect-video w-full"}>{children}</div>

        {overlay ? (
          <div className="absolute inset-0 grid place-items-center bg-black/65 p-4">
            <div className="w-full max-w-[420px] rounded-2xl border border-white/10 bg-zinc-950/90 p-4 text-ink shadow-2xl">
              <div className="text-base font-semibold">{overlay.title}</div>
              <div className="mt-1 text-sm text-ink-muted">{overlay.desc}</div>
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  className="inline-flex h-10 flex-1 items-center justify-center rounded-xl bg-highlight-blue px-4 text-sm font-semibold text-ink hover:bg-highlight-blue/90 disabled:opacity-60"
                  onClick={overlay.primary.onClick}
                  disabled={Boolean(loading)}
                >
                  {loading ? "处理中..." : overlay.primary.label}
                </button>
                {overlay.secondary ? (
                  <button
                    type="button"
                    className="inline-flex h-10 items-center justify-center rounded-xl border border-white/10 bg-paper/5 px-4 text-sm font-semibold text-ink hover:bg-paper/10 disabled:opacity-60"
                    onClick={overlay.secondary.onClick}
                    disabled={Boolean(loading)}
                  >
                    {overlay.secondary.label}
                  </button>
                ) : null}
              </div>

              {error ? (
                <div className="mt-3 rounded-xl bg-highlight-red/10 px-3 py-2 text-xs text-red-200 ring-1 ring-red-500/20">
                  {error}
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {!overlay && error ? (
          <div className="absolute bottom-3 left-3 right-3 rounded-xl bg-highlight-red/10 px-3 py-2 text-xs text-red-200 ring-1 ring-red-500/20">
            {error}
          </div>
        ) : null}
      </div>
    </section>
  );
}
