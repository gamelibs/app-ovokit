"use client";

import { FullscreenStage } from "@/components/demos/FullscreenStage";
import { useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";

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
  /** 加载占位图标（缺省从 src 同目录推导 icon.svg） */
  iconSrc?: string;
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
  iconSrc,
}: Props) {
  const t = useTranslations("play");
  const stageRef = useRef<HTMLDivElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [loaded, setLoaded] = useState(false);

  // 加载占位图标：缺省取 iframe 同目录 icon.svg（平台静态包自带）
  const resolvedIconSrc = useMemo(() => {
    if (iconSrc) return iconSrc;
    if (!src.includes("/index.html")) return undefined;
    return `${src.slice(0, src.indexOf("/index.html"))}/icon.svg`;
  }, [iconSrc, src]);

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
      ? // 竖屏 demo：手机尺寸限宽居中（过大容器会让画布信箱化、喧宾夺主）；移动端保持同高——原子 demo 含参数面板，压扁会裁掉 HUD
        "mx-auto w-full max-w-[420px] h-[620px] relative"
      : "min-h-[360px] h-[60vh] w-full sm:h-auto sm:aspect-[4/3] lg:aspect-[16/10] relative");

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
              {t("restart")}
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
            if (!node) return;
            node.addEventListener("load", () => setLoaded(true));
            // 竞态兜底：iframe 在监听器挂上前就加载完（缓存命中）时直接判定
            try {
              if (node.contentDocument && node.contentDocument.readyState === "complete") {
                setLoaded(true);
              }
            } catch {
              // 跨域 iframe 读不到 document，只能靠 load 事件
            }
          }}
          controls={controls === "overlay" ? "overlay" : "none"}
        />
        {/* 加载占位：游戏图标 + 标题，iframe 加载完成后淡出 */}
        {!loaded ? (
          <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center rounded-xl bg-paper">
            <div className="flex flex-col items-center gap-3">
              {resolvedIconSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={resolvedIconSrc} alt="" className="h-16 w-16 rounded-xl sketch-border object-contain" />
              ) : null}
              <div className="font-kalam text-sm font-semibold text-ink">{title}</div>
              <div className="text-xs text-ink-muted animate-pulse">{t("loading")}</div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
