"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BlockCanvas } from "@/components/block-kit/BlockCanvas";
import { makeClickable, makeDraggable, makeHoverable } from "@/lib/block-kit/behaviors";
import { createEngine } from "@/lib/block-kit/engine";
import type { Block, EngineEvent } from "@/lib/block-kit/types";

type Props = {
  playSlug: string;
  playTitle: string;
  showEditorCta?: boolean;
};

const initialBlocks: Block[] = [
  {
    id: "zone-a",
    shape: { type: "rect", x: 150, y: 120, w: 160, h: 110, radius: 14, fill: "#22c55e" },
    behaviors: [makeClickable(), makeHoverable(), makeDraggable({ snap: 10 })],
  },
  {
    id: "zone-b",
    shape: { type: "rect", x: 410, y: 120, w: 160, h: 110, radius: 14, fill: "#eab308" },
    behaviors: [makeClickable(), makeHoverable(), makeDraggable({ snap: 10 })],
  },
  {
    id: "piece-1",
    shape: { type: "circle", x: 210, y: 340, r: 46, fill: "#60a5fa" },
    behaviors: [makeClickable(), makeHoverable(), makeDraggable({ snap: 10 })],
  },
  {
    id: "piece-2",
    shape: { type: "rect", x: 430, y: 320, w: 120, h: 90, radius: 12, fill: "#f59e0b" },
    behaviors: [makeClickable(), makeHoverable(), makeDraggable({ snap: 10 })],
  },
];

export function InteractiveHero({ playSlug, playTitle, showEditorCta }: Props) {
  const engine = useMemo(() => createEngine(initialBlocks), []);
  const [blocks, setBlocks] = useState<Block[]>(() => engine.getBlocks());
  const [events, setEvents] = useState<EngineEvent[]>([]);

  useEffect(() => {
    return engine.onEvent((evt) => {
      setEvents((prev) => [evt, ...prev].slice(0, 6));
      if (evt.type.startsWith("drag")) {
        setBlocks(engine.getBlocks());
      }
    });
  }, [engine]);

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

  return (
    <section className="overflow-hidden rounded-3xl border border-zinc-200 bg-white/70 p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="flex-1 space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-500/10 dark:text-blue-100">
            直接上手 · 拖拽配对 Demo
          </div>
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">把积木拖到对应区域，试试交互手感</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            简单两步：按住蓝色/黄色积木，拖到同色区域；松手自动吸附，支持网格吸附与多次拖动。
          </p>
          <div className="flex flex-wrap gap-2">
            {showEditorCta ? (
              <Link
                href="/demo/blocks"
                className="inline-flex h-10 items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
              >
                进入完整编辑器
              </Link>
            ) : null}
            <a
              href={`/play/${playSlug}`}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
            >
              查看示例帖子
            </a>
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-zinc-500 dark:text-zinc-400">
            <span>示例关联：{playTitle}</span>
            <span>点击/拖拽行为可扩展事件</span>
            <span>可嵌入帖子 iframe 展示</span>
          </div>
        </div>
        <div className="flex flex-col gap-2 rounded-2xl border border-zinc-200 bg-zinc-950/95 p-3 shadow-inner ring-1 ring-zinc-900 dark:border-white/10">
          <div className="inline-flex items-center justify-between gap-3 rounded-xl bg-black/60 px-3 py-2 text-[11px] text-zinc-400">
            <span>示例：拖拽配对</span>
            <span>网格：10px</span>
            <span>缩放：100%</span>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-black/60 p-3">
            <BlockCanvas
              blocks={blocks}
              width={720}
              height={420}
              background="#0d0d0f"
              onPointerDown={handleDown}
              onPointerMove={handleMove}
              onPointerUp={handleUp}
              showGrid
              gridSize={10}
              highlightIds={[]}
            />
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-400 sm:grid-cols-3">
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
        </div>
      </div>
    </section>
  );
}
