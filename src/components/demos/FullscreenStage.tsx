"use client";

import { forwardRef, useCallback, useEffect, useRef, useState } from "react";

type Props = {
  title: string;
  src: string;
  className?: string;
  iframeClassName?: string;
  allow?: string;
  controls?: "overlay" | "none";
  iframeRef?: ((node: HTMLIFrameElement | null) => void) | { current: HTMLIFrameElement | null } | null;
  preventScroll?: boolean;
};

export const FullscreenStage = forwardRef<HTMLDivElement, Props>(function FullscreenStage(
  { title, src, className, iframeClassName, allow, controls = "overlay", iframeRef, preventScroll = true }: Props,
  forwardedRef,
) {
  const localRef = useRef<HTMLDivElement | null>(null);
  const containerRef = localRef;
  const localIframeRef = useRef<HTMLIFrameElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [canFullscreen, setCanFullscreen] = useState(false);

  useEffect(() => {
    const onChange = () => {
      const el = document.fullscreenElement;
      setIsFullscreen(Boolean(el && el === containerRef.current));
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  useEffect(() => {
    setCanFullscreen(Boolean(document.fullscreenEnabled));
  }, []);

  const enterFullscreen = useCallback(async () => {
    const el = containerRef.current;
    if (!el) return;
    try {
      await el.requestFullscreen();
    } catch {
      // ignore: fullscreen may be blocked by browser policy
    }
  }, []);

  const exitFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!preventScroll) return;
    const el = containerRef.current;
    if (!el) return;

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
    };

    el.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => {
      el.removeEventListener("touchmove", onTouchMove);
    };
  }, [preventScroll]);

  useEffect(() => {
    if (!preventScroll) return;
    const iframe = localIframeRef.current;
    if (!iframe) return;

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
    };

    // Some mobile browsers don't bubble touch events from <iframe> to its parent reliably;
    // bind directly on the iframe element to stop page scrolling while swiping in the demo.
    iframe.addEventListener("touchmove", onTouchMove, { passive: false });
    iframe.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      iframe.removeEventListener("touchmove", onTouchMove);
      iframe.removeEventListener("wheel", onWheel);
    };
  }, [preventScroll, src]);

  return (
    <div
      ref={(node) => {
        localRef.current = node;
        if (typeof forwardedRef === "function") forwardedRef(node);
        else if (forwardedRef) forwardedRef.current = node;
      }}
      className={[
        "relative overflow-hidden rounded-2xl sketch-border bg-paper-warm",
        "h-full w-full",
        "overscroll-contain",
        className ?? "",
      ]
        .join(" ")
        .trim()}
      style={preventScroll ? { touchAction: "none" } : undefined}
    >
      {controls === "overlay" && canFullscreen ? (
        <div className="absolute right-3 top-3 z-10 flex gap-2">
          {!isFullscreen ? (
            <button
              type="button"
              onClick={() => void enterFullscreen()}
              className="inline-flex h-9 items-center justify-center rounded-xl bg-ink/50 px-3 text-xs font-semibold text-ink ring-1 ring-white/10 backdrop-blur hover:bg-ink/60"
            >
              全屏
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void exitFullscreen()}
              className="inline-flex h-9 items-center justify-center rounded-xl bg-ink/50 px-3 text-xs font-semibold text-ink ring-1 ring-white/10 backdrop-blur hover:bg-ink/60"
            >
              退出全屏
            </button>
          )}
        </div>
      ) : null}

      <iframe
        title={title}
        src={src}
        ref={(node) => {
          localIframeRef.current = node;
          if (typeof iframeRef === "function") iframeRef(node);
          else if (iframeRef) iframeRef.current = node;
        }}
        className={["h-full w-full", "overscroll-contain", iframeClassName ?? ""].join(" ").trim()}
        style={preventScroll ? { touchAction: "none" } : undefined}
        scrolling="no"
        allow={allow ?? "fullscreen; gamepad; autoplay"}
      />
    </div>
  );
});
