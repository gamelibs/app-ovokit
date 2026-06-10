"use client";

import { FullscreenStage } from "@/components/demos/FullscreenStage";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Props = {
  title: string;
  src: string;
  wrapperClassName?: string;
  stageClassName?: string;
  iframeClassName?: string;
  allow?: string;
  controls?: "toolbar" | "overlay" | "none";
  showRestart?: boolean;
  restartMessage?: unknown;
  restartStrategy?: "postMessage" | "reload";
};

export function DemoEmbed({
  title,
  src,
  wrapperClassName,
  stageClassName,
  iframeClassName,
  allow,
  controls = "toolbar",
  showRestart,
  restartMessage,
  restartStrategy = "postMessage",
}: Props) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [canFullscreen, setCanFullscreen] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    const onChange = () => {
      const el = document.fullscreenElement;
      setIsFullscreen(Boolean(el && el === stageRef.current));
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  useEffect(() => {
    setCanFullscreen(Boolean(document.fullscreenEnabled));
  }, []);

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

  const effectiveSrc = useMemo(() => {
    if (restartStrategy !== "reload") return src;
    const sep = src.includes("?") ? "&" : "?";
    return `${src}${sep}r=${reloadToken}`;
  }, [reloadToken, restartStrategy, src]);

  const sendRestart = useCallback(() => {
    if (restartStrategy === "reload") {
      setReloadToken((v) => v + 1);
      return;
    }
    const msg = restartMessage ?? { type: "demo:restart" };
    try {
      iframeRef.current?.contentWindow?.postMessage(msg, window.location.origin);
    } catch {
      // ignore
    }
  }, [restartMessage, restartStrategy]);

  const stageWrapperClass =
    wrapperClassName ?? "h-[68vh] w-full sm:h-auto sm:aspect-video";

  return (
    <div className="w-full">
      {controls === "toolbar" ? (
        <div className="mb-2 flex items-center justify-end gap-2">
          {showRestart ? (
            <button
              type="button"
              onClick={sendRestart}
              className="inline-flex h-9 items-center justify-center rounded-xl sketch-border bg-paper px-3 text-sm font-semibold text-ink hover:bg-paper-warm"
            >
              重开
            </button>
          ) : null}
          {canFullscreen ? (
            !isFullscreen ? (
              <button
                type="button"
                onClick={() => void enterFullscreen()}
                className="inline-flex h-9 items-center justify-center rounded-xl bg-highlight-blue px-3 text-sm font-semibold text-ink hover:bg-highlight-blue/90"
              >
                全屏
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void exitFullscreen()}
                className="inline-flex h-9 items-center justify-center rounded-xl bg-highlight-blue px-3 text-sm font-semibold text-ink hover:bg-highlight-blue/90"
              >
                退出全屏
              </button>
            )
          ) : null}
        </div>
      ) : null}
      <div className={stageWrapperClass}>
        <FullscreenStage
          ref={stageRef}
          title={title}
          src={effectiveSrc}
          className={stageClassName}
          iframeClassName={iframeClassName}
          allow={allow}
          iframeRef={iframeRef}
          controls={controls === "overlay" ? "overlay" : "none"}
        />
      </div>
    </div>
  );
}
