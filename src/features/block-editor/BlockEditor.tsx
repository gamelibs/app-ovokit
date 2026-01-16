"use client";

import { useEffect, useMemo, useState } from "react";
import { BlockCanvas } from "@/components/block-kit/BlockCanvas";
import type { Block } from "@/lib/block-kit/types";
import { templates } from "./templates";
import { Tool, useBlockEditor } from "./useBlockEditor";

const toolLabels: Record<Tool, string> = {
  select: "选择/拖拽",
  rect: "矩形",
  circle: "圆形",
  pan: "平移",
};

export function BlockEditor() {
  const editor = useBlockEditor();
  const [importText, setImportText] = useState("");

  const selectedBlock: Block | null = useMemo(
    () => editor.blocks.find((b) => editor.selection.includes(b.id)) ?? null,
    [editor.blocks, editor.selection],
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          editor.redo();
        } else {
          editor.undo();
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        editor.redo();
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        if ((e.target as HTMLElement)?.tagName === "INPUT" || (e.target as HTMLElement)?.tagName === "TEXTAREA") {
          return;
        }
        editor.deleteSelected();
      }
      if (e.key === "Escape") {
        editor.setTool("select");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [editor]);

  const handleNumberChange = (value: string, fallback: number) => {
    const num = Number.parseFloat(value);
    if (Number.isFinite(num)) return num;
    return fallback;
  };

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[280px_1fr_360px]">
      {/* 左侧：工具栏与模板 */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
        <h2 className="text-sm font-semibold text-zinc-800 dark:text-white">积木工具</h2>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {(["select", "rect", "circle", "pan"] as Tool[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => editor.setTool(t)}
              className={`h-10 rounded-xl px-3 text-sm font-semibold ${
                editor.tool === t
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-zinc-50 text-zinc-800 ring-1 ring-zinc-200 hover:bg-zinc-100 dark:bg-white/5 dark:text-white dark:ring-white/10"
              }`}
            >
              {toolLabels[t]}
            </button>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-zinc-600 dark:text-zinc-300">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              className="h-4 w-4 accent-blue-600"
              checked={editor.showGrid}
              onChange={(e) => editor.setShowGrid(e.target.checked)}
            />
            显示网格
          </label>
          <label className="flex items-center gap-2">
            <span>吸附</span>
            <input
              type="number"
              min={0}
              className="h-8 w-16 rounded border border-zinc-200 bg-white px-2 text-right text-xs dark:border-white/10 dark:bg-white/5 dark:text-white"
              value={editor.snap}
              onChange={(e) => editor.setSnap(Math.max(0, handleNumberChange(e.target.value, editor.snap)))}
            />
            px
          </label>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={editor.undo}
            disabled={!editor.canUndo}
            className="inline-flex h-9 items-center justify-center rounded-lg bg-zinc-100 px-3 text-xs font-semibold text-zinc-800 hover:bg-zinc-200 disabled:opacity-50 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
          >
            撤销 ⌘Z
          </button>
          <button
            type="button"
            onClick={editor.redo}
            disabled={!editor.canRedo}
            className="inline-flex h-9 items-center justify-center rounded-lg bg-zinc-100 px-3 text-xs font-semibold text-zinc-800 hover:bg-zinc-200 disabled:opacity-50 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
          >
            重做 ⇧⌘Z
          </button>
          <button
            type="button"
            onClick={editor.duplicateSelected}
            className="inline-flex h-9 items-center justify-center rounded-lg bg-zinc-100 px-3 text-xs font-semibold text-zinc-800 hover:bg-zinc-200 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
          >
            复制选中
          </button>
          <button
            type="button"
            onClick={editor.deleteSelected}
            className="inline-flex h-9 items-center justify-center rounded-lg bg-red-50 px-3 text-xs font-semibold text-red-600 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-200 dark:hover:bg-red-500/20"
          >
            删除选中
          </button>
        </div>

        <div className="mt-5">
          <h3 className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">场景模板</h3>
          <div className="mt-2 space-y-2">
            {templates.map((tpl) => (
              <div key={tpl.id} className="rounded-lg border border-zinc-200 p-3 text-xs dark:border-white/10">
                <div className="font-semibold text-zinc-800 dark:text-white">{tpl.name}</div>
                <div className="mt-1 text-zinc-500 dark:text-zinc-300">{tpl.description}</div>
                <button
                  type="button"
                  onClick={() => editor.applyTemplate(tpl.id)}
                  className="mt-2 inline-flex h-8 items-center justify-center rounded-lg bg-blue-600 px-3 font-semibold text-white hover:bg-blue-500"
                >
                  追加到画布
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5">
          <h3 className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">导入 / 导出</h3>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={async () => {
                const json = editor.exportJson();
                await navigator.clipboard?.writeText(json);
              }}
              className="inline-flex h-9 items-center justify-center rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white hover:bg-emerald-500"
            >
              复制 JSON
            </button>
            <button
              type="button"
              onClick={() => editor.importJson(importText)}
              className="inline-flex h-9 items-center justify-center rounded-lg bg-zinc-100 px-3 text-xs font-semibold text-zinc-800 hover:bg-zinc-200 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
            >
              导入 JSON
            </button>
          </div>
          <textarea
            className="mt-2 w-full rounded-xl border border-dashed border-zinc-200 bg-zinc-50/60 p-2 text-xs text-zinc-700 focus:border-blue-500 focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white"
            rows={4}
            placeholder="粘贴 JSON 后点击导入"
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
          />
        </div>
      </section>

      {/* 中间：画布 + 事件 */}
      <section className="flex min-h-[620px] flex-col gap-3 rounded-2xl border border-zinc-200 bg-zinc-950/95 p-4 shadow-sm ring-1 ring-zinc-900">
        <div className="flex items-center justify-between text-xs text-zinc-300">
          <div className="flex items-center gap-3">
            <span>视口：{editor.canvasSize.width}×{editor.canvasSize.height}</span>
            <span>画布：{editor.worldSize.width}×{editor.worldSize.height}</span>
            <span>缩放：{Math.round(editor.scale * 100)}%</span>
            <div className="flex gap-1">
              <button
                type="button"
                className="rounded-lg bg-white/5 px-2 py-1 font-semibold hover:bg-white/10"
                onClick={() => editor.setScale((s) => Math.max(0.4, s - 0.1))}
              >
                -
              </button>
              <button
                type="button"
                className="rounded-lg bg-white/5 px-2 py-1 font-semibold hover:bg-white/10"
                onClick={() => editor.setScale((s) => Math.min(2, s + 0.1))}
              >
                +
              </button>
              <button
                type="button"
                className="rounded-lg bg-white/5 px-2 py-1 font-semibold hover:bg-white/10"
                onClick={() => {
                  editor.setScale(1);
                  editor.setOffset({
                    x: (editor.canvasSize.width - editor.worldSize.width) / 2,
                    y: (editor.canvasSize.height - editor.worldSize.height) / 2,
                  });
                }}
              >
                重置
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-white/10 px-2 py-1 font-semibold text-[11px] uppercase text-white">
              {toolLabels[editor.tool]}
            </span>
            <span className="text-zinc-500">Shift 多选 · 鼠标滚轮缩放</span>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-3 overflow-hidden rounded-xl border border-zinc-800 bg-black/60 p-3 shadow-inner">
          <div className="inline-flex rounded-lg border border-zinc-800 bg-black p-3 shadow-inner">
            <BlockCanvas
              blocks={editor.blocks}
              width={editor.canvasSize.width}
              height={editor.canvasSize.height}
              background="#0d0d0d"
              onPointerDown={editor.handlePointerDown}
              onPointerMove={editor.handlePointerMove}
              onPointerUp={editor.handlePointerUp}
              onWheel={editor.onWheel}
              offset={editor.offset}
              scale={editor.scale}
              showGrid={editor.showGrid}
              gridSize={editor.snap > 0 ? editor.snap : 20}
              highlightIds={editor.selection}
              selectionBox={editor.selectionBox}
            />
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-3">
          <h3 className="text-xs font-semibold text-zinc-200">事件 / 调试</h3>
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {editor.events.length === 0 && <p className="text-xs text-zinc-500">暂无事件</p>}
            {editor.events.map((e, idx) => (
              <div key={`${e.blockId}-${e.type}-${idx}`} className="rounded-lg border border-zinc-800 bg-black/60 px-3 py-2 text-xs text-zinc-200">
                <div className="font-semibold">{e.type}</div>
                <div className="text-zinc-400">{e.blockId} @ ({Math.round(e.pointer.x)}, {Math.round(e.pointer.y)})</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 右侧：属性面板 */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-800 dark:text-white">属性面板</h2>
          {selectedBlock && <span className="rounded-full bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-700 dark:bg-blue-500/10 dark:text-blue-200">{selectedBlock.id}</span>}
        </div>

        {!selectedBlock ? (
          <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-300">选中一个积木查看属性，或用工具栏添加新积木。</p>
        ) : (
          <div className="mt-3 space-y-3 text-sm text-zinc-700 dark:text-zinc-200">
            {(() => {
              const shape = selectedBlock.shape;
              return (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="space-y-1">
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">X</span>
                      <input
                        type="number"
                        className="w-full rounded-lg border border-zinc-200 px-2 py-1 dark:border-white/10 dark:bg-white/5 dark:text-white"
                        value={shape.x}
                        onChange={(e) => {
                          const nextX = handleNumberChange(e.target.value, shape.x);
                          editor.updateBlock(selectedBlock.id, (draft) => {
                            draft.shape = { ...draft.shape, x: nextX } as Block["shape"];
                          });
                        }}
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">Y</span>
                      <input
                        type="number"
                        className="w-full rounded-lg border border-zinc-200 px-2 py-1 dark:border-white/10 dark:bg-white/5 dark:text-white"
                        value={shape.y}
                        onChange={(e) => {
                          const nextY = handleNumberChange(e.target.value, shape.y);
                          editor.updateBlock(selectedBlock.id, (draft) => {
                            draft.shape = { ...draft.shape, y: nextY } as Block["shape"];
                          });
                        }}
                      />
                    </label>
                  </div>

                  {shape.type === "circle" ? (
                    <label className="block space-y-1">
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">半径</span>
                      <input
                        type="number"
                        min={4}
                        className="w-full rounded-lg border border-zinc-200 px-2 py-1 dark:border-white/10 dark:bg-white/5 dark:text-white"
                        value={shape.r}
                        onChange={(e) => {
                          const r = Math.max(4, handleNumberChange(e.target.value, shape.r));
                          editor.updateBlock(selectedBlock.id, (draft) => {
                            if (draft.shape.type === "circle") draft.shape.r = r;
                          });
                        }}
                      />
                    </label>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <label className="space-y-1">
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">宽度</span>
                        <input
                          type="number"
                          min={8}
                          className="w-full rounded-lg border border-zinc-200 px-2 py-1 dark:border-white/10 dark:bg-white/5 dark:text-white"
                          value={shape.w}
                          onChange={(e) => {
                            const w = Math.max(8, handleNumberChange(e.target.value, shape.w));
                            editor.updateBlock(selectedBlock.id, (draft) => {
                              if (draft.shape.type === "rect") draft.shape.w = w;
                            });
                          }}
                        />
                      </label>
                      <label className="space-y-1">
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">高度</span>
                        <input
                          type="number"
                          min={8}
                          className="w-full rounded-lg border border-zinc-200 px-2 py-1 dark:border-white/10 dark:bg-white/5 dark:text-white"
                          value={shape.h}
                          onChange={(e) => {
                            const h = Math.max(8, handleNumberChange(e.target.value, shape.h));
                            editor.updateBlock(selectedBlock.id, (draft) => {
                              if (draft.shape.type === "rect") draft.shape.h = h;
                            });
                          }}
                        />
                      </label>
                      <label className="col-span-2 space-y-1">
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">圆角</span>
                        <input
                          type="number"
                          min={0}
                          className="w-full rounded-lg border border-zinc-200 px-2 py-1 dark:border-white/10 dark:bg-white/5 dark:text-white"
                          value={shape.radius ?? 0}
                          onChange={(e) => {
                            const radius = Math.max(0, handleNumberChange(e.target.value, shape.radius ?? 0));
                            editor.updateBlock(selectedBlock.id, (draft) => {
                              if (draft.shape.type === "rect") draft.shape.radius = radius;
                            });
                          }}
                        />
                      </label>
                    </div>
                  )}
                </>
              );
            })()}

            <label className="block space-y-1">
              <span className="text-xs text-zinc-500 dark:text-zinc-400">填充色</span>
              <input
                type="color"
                className="h-9 w-full cursor-pointer rounded-lg border border-zinc-200 bg-white px-2 py-1 dark:border-white/10 dark:bg-white/5"
                value={selectedBlock.shape.fill}
                onChange={(e) => {
                  const fill = e.target.value;
                  editor.updateBlock(selectedBlock.id, (draft) => {
                    draft.shape.fill = fill;
                  });
                }}
              />
            </label>

            <label className="block space-y-1">
              <span className="text-xs text-zinc-500 dark:text-zinc-400">描边色（可选）</span>
              <input
                type="color"
                className="h-9 w-full cursor-pointer rounded-lg border border-zinc-200 bg-white px-2 py-1 dark:border-white/10 dark:bg-white/5"
                value={selectedBlock.shape.stroke ?? "#000000"}
                onChange={(e) => {
                  const stroke = e.target.value;
                  editor.updateBlock(selectedBlock.id, (draft) => {
                    draft.shape.stroke = stroke;
                  });
                }}
              />
            </label>

            <div className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700 dark:bg-blue-500/10 dark:text-blue-100">
              交互：默认绑定点击 + 悬停 + 拖拽。可在 Demo 里根据事件日志扩展自定义逻辑。
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
