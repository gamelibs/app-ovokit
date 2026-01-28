"use client";

import { useEffect, useMemo, useState } from "react";
import { createEngine } from "@/lib/block-kit/engine";
import type { Block, EngineEvent } from "@/lib/block-kit/types";
import { getBlockTemplate } from "@/lib/block-kit/templates";
import { BlockCanvas } from "./BlockCanvas";

type Props = {
  templateId: string;
  width?: number;
  height?: number;
  background?: string;
  layout?: "aspect" | "fill";
  showGrid?: boolean;
  gridSize?: number;
  showEvents?: boolean;
  className?: string;
};

export function BlockViewer({
  templateId,
  width = 720,
  height = 420,
  background = "#0d0d0f",
  layout = "aspect",
  showGrid = true,
  gridSize = 10,
  showEvents = false,
  className,
}: Props) {
  const template = useMemo(() => getBlockTemplate(templateId), [templateId]);
  const engine = useMemo(() => createEngine(template?.blocks ?? []), [template]);
  const [blocks, setBlocks] = useState<Block[]>(() => engine.getBlocks());
  const [events, setEvents] = useState<EngineEvent[]>([]);

  useEffect(() => {
    setBlocks(engine.getBlocks());
    setEvents([]);
    return engine.onEvent((evt) => {
      if (showEvents) setEvents((prev) => [evt, ...prev].slice(0, 6));
      if (evt.type.startsWith("drag") || evt.type === "click") {
        setBlocks(engine.getBlocks());
      }
    });
  }, [engine, showEvents]);

  const handleDown = (info: { x: number; y: number; button: number }) => {
    engine.handlePointerDown({ x: info.x, y: info.y, button: info.button });
  };
  const handleMove = (info: { x: number; y: number; button: number }) => {
    engine.handlePointerMove({ x: info.x, y: info.y, button: info.button });
  };
  const handleUp = (info: { x: number; y: number; button: number }) => {
    engine.handlePointerUp({ x: info.x, y: info.y, button: info.button });
    setBlocks(engine.getBlocks());
  };

  if (!template) {
    return (
      <div className={className}>
        <div className="grid h-full w-full place-items-center rounded-xl border border-zinc-200 bg-white text-sm text-zinc-500 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400">
          未找到模板：{templateId}
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className={layout === "fill" ? "h-full w-full" : "aspect-[12/7] w-full"}>
        <BlockCanvas
          blocks={blocks}
          width={width}
          height={height}
          fit="responsive"
          touchAction="none"
          background={background}
          onPointerDown={handleDown}
          onPointerMove={handleMove}
          onPointerUp={handleUp}
          showGrid={showGrid}
          gridSize={gridSize}
          highlightIds={[]}
        />
      </div>

      {showEvents ? (
        <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-zinc-400 sm:grid-cols-3">
          {events.length === 0 ? (
            <span className="rounded-lg bg-white/5 px-2 py-1 text-center text-zinc-500">拖拽后这里会显示事件</span>
          ) : (
            events.map((e, idx) => (
              <span key={`${e.blockId}-${idx}`} className="rounded-lg bg-white/5 px-2 py-1 font-mono">
                {e.type} · {e.blockId}
              </span>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
