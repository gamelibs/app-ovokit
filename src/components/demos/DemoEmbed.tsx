"use client";

import { FullscreenStage } from "@/components/demos/FullscreenStage";
import { useMemo, useRef, useState } from "react";

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
  /** 游戏画面方向：竖屏游戏用竖版容器（居中限宽），横屏用宽容器 */
  orientation?: "portrait" | "landscape";
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
  orientation = "landscape",
}: Props) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const effectiveSrc = useMemo(() => {
    if (restartStrategy !== "reload") return src;
    const sep = src.includes("?") ? "&" : "?";
    return `${src}${sep}r=${reloadToken}`;
  }, [reloadToken, restartStrategy, src]);

  function sendRestart() {
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
  }

  const stageWrapperClass =
    wrapperClassName ??
    (orientation === "portrait"
      ? // 竖屏 demo：固定高度容器（= 游戏页面自然高度），不自动伸缩
        "mx-auto w-full max-w-[760px] h-[740px]"
      : "min-h-[360px] h-[60vh] w-full sm:h-auto sm:aspect-[4/3] lg:aspect-[16/10]");

  return (
    <div className="w-full">
      {controls === "toolbar" ? (
        <div className="mb-2 flex items-center justify-end gap-2">
          {showRestart ? (
            <button
              type="button"
              onClick={sendRestart}
              className="inline-flex h-9 items-center justify-center rounded-full sketch-border bg-paper px-4 text-xs font-semibold font-kalam hover:bg-paper-warm"
            >
              重开
            </button>
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
          iframeRef={(node) => {
            iframeRef.current = node;
          }}
          controls={controls === "overlay" ? "overlay" : "none"}
        />
      </div>
    </div>
  );
}
