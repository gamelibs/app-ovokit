import { useEffect, useMemo, useState } from "react";
import { makeClickable, makeDraggable, makeHoverable } from "@/lib/block-kit/behaviors";
import { createEngine } from "@/lib/block-kit/engine";
import { hitTest } from "@/lib/block-kit/hit-test";
import type { Block, EngineEvent } from "@/lib/block-kit/types";
import { templates } from "./templates";

export type Tool = "select" | "rect" | "circle" | "pan";

type PointerInfo = { x: number; y: number; button: number; raw: PointerEvent };

const cloneBlocks = (blocks: Block[]) =>
  blocks.map((b) => ({
    ...b,
    shape: { ...b.shape } as Block["shape"],
    data: b.data ? { ...b.data } : undefined,
    behaviors: b.behaviors,
  }));

const defaultBlocks: Block[] = [
  {
    id: "circle-1",
    shape: { type: "circle", x: 180, y: 200, r: 42, fill: "#a5b4fc" },
    behaviors: [makeClickable(), makeHoverable(), makeDraggable({ snap: 10 })],
  },
  {
    id: "rect-1",
    shape: { type: "rect", x: 340, y: 160, w: 160, h: 100, radius: 14, fill: "#fcd34d" },
    behaviors: [makeClickable(), makeHoverable(), makeDraggable({ snap: 10 })],
  },
];

const blockBounds = (block: Block) => {
  if (block.shape.type === "circle") {
    return {
      x1: block.shape.x - block.shape.r,
      y1: block.shape.y - block.shape.r,
      x2: block.shape.x + block.shape.r,
      y2: block.shape.y + block.shape.r,
    };
  }
  return {
    x1: block.shape.x,
    y1: block.shape.y,
    x2: block.shape.x + block.shape.w,
    y2: block.shape.y + block.shape.h,
  };
};

const intersectsBox = (
  bounds: { x1: number; y1: number; x2: number; y2: number },
  box: { x1: number; y1: number; x2: number; y2: number },
) => {
  const minX = Math.min(box.x1, box.x2);
  const maxX = Math.max(box.x1, box.x2);
  const minY = Math.min(box.y1, box.y2);
  const maxY = Math.max(box.y1, box.y2);
  return !(bounds.x2 < minX || bounds.x1 > maxX || bounds.y2 < minY || bounds.y1 > maxY);
};

export function useBlockEditor(initialBlocks?: Block[]) {
  const engine = useMemo(() => createEngine(initialBlocks ?? defaultBlocks), [initialBlocks]);
  const [blocks, setBlocks] = useState<Block[]>(() => cloneBlocks(engine.getBlocks()));
  const [selection, setSelection] = useState<string[]>([]);
  const [tool, setTool] = useState<Tool>("select");
  const canvasSize = { width: 960, height: 640 };
  const worldSize = { width: 2048, height: 2048 };
  const [offset, setOffset] = useState(() => {
    const start = { x: (canvasSize.width - worldSize.width) / 2, y: (canvasSize.height - worldSize.height) / 2 };
    return start;
  });
  const [scale, setScale] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const [snap, setSnap] = useState(10);
  const [events, setEvents] = useState<EngineEvent[]>([]);
  const [selectionBox, setSelectionBox] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const [boxStart, setBoxStart] = useState<{ x: number; y: number } | null>(null);
  const [history, setHistory] = useState<Block[][]>([cloneBlocks(engine.getBlocks())]);
  const [future, setFuture] = useState<Block[][]>([]);
  const [panStart, setPanStart] = useState<{ x: number; y: number; origin: { x: number; y: number } } | null>(null);

  useEffect(() => {
    const unsubscribe = engine.onEvent((evt) => {
      setEvents((prev) => [evt, ...prev].slice(0, 10));
      if (evt.type === "click") {
        setSelection([evt.blockId]);
      }
      if (evt.type === "dragging" || evt.type === "drag-end") {
        setBlocks(cloneBlocks(engine.getBlocks()));
      }
      if (evt.type === "drag-end") {
        commit(cloneBlocks(engine.getBlocks()));
      }
    });
    return unsubscribe;
  }, [engine]);

  const commit = (nextBlocks: Block[]) => {
    const snapshot = cloneBlocks(nextBlocks);
    setBlocks(snapshot);
    engine.setBlocks(snapshot);
    setHistory((prev) => {
      const arr = [...prev, snapshot];
      return arr.slice(-40);
    });
    setFuture([]);
  };

  const findTopBlock = (x: number, y: number) => [...blocks].reverse().find((b) => hitTest(b.shape, x, y));

  const createBlock = (shape: Block["shape"]) => ({
    id: `${shape.type}-${Date.now()}`,
    shape,
    behaviors: [makeClickable(), makeHoverable(), makeDraggable({ snap })],
  });

  const clampOffset = (val: { x: number; y: number }) => {
    const pad = 200;
    const minX = canvasSize.width - worldSize.width - pad;
    const minY = canvasSize.height - worldSize.height - pad;
    const maxX = pad;
    const maxY = pad;
    return {
      x: Math.min(maxX, Math.max(minX, val.x)),
      y: Math.min(maxY, Math.max(minY, val.y)),
    };
  };

  const setOffsetClamped = (next: { x: number; y: number } | ((prev: { x: number; y: number }) => { x: number; y: number })) => {
    setOffset((prev) => {
      const value = typeof next === "function" ? (next as (p: { x: number; y: number }) => { x: number; y: number })(prev) : next;
      return clampOffset(value);
    });
  };

  const startPan = (clientX: number, clientY: number) => {
    setPanStart({ x: clientX, y: clientY, origin: offset });
  };

  const handlePointerDown = (info: PointerInfo) => {
    if (tool === "pan") {
      startPan(info.raw.clientX, info.raw.clientY);
      return;
    }
    if (tool === "rect") {
      const w = 160;
      const h = 100;
      const radius = 12;
      const snappedX = snap > 0 ? Math.round(info.x / snap) * snap : info.x;
      const snappedY = snap > 0 ? Math.round(info.y / snap) * snap : info.y;
      const newBlock = createBlock({
        type: "rect",
        x: snappedX - w / 2,
        y: snappedY - h / 2,
        w,
        h,
        radius,
        fill: "#facc15",
      });
      const next = [...blocks, newBlock];
      commit(next);
      setSelection([newBlock.id]);
      setTool("select");
      return;
    }
    if (tool === "circle") {
      const r = 48;
      const snappedX = snap > 0 ? Math.round(info.x / snap) * snap : info.x;
      const snappedY = snap > 0 ? Math.round(info.y / snap) * snap : info.y;
      const newBlock = createBlock({
        type: "circle",
        x: snappedX,
        y: snappedY,
        r,
        fill: "#93c5fd",
      });
      const next = [...blocks, newBlock];
      commit(next);
      setSelection([newBlock.id]);
      setTool("select");
      return;
    }
    const hit = findTopBlock(info.x, info.y);
    if (hit) {
      setSelection((prev) => {
        if (info.raw.shiftKey) {
          if (prev.includes(hit.id)) {
            return prev;
          }
          return [...prev, hit.id];
        }
        return [hit.id];
      });
      engine.handlePointerDown({ x: info.x, y: info.y, button: info.button });
    } else {
      setSelection([]);
      if (info.raw.shiftKey) {
        setBoxStart({ x: info.x, y: info.y });
        setSelectionBox({ x1: info.x, y1: info.y, x2: info.x, y2: info.y });
      } else {
        startPan(info.raw.clientX, info.raw.clientY);
      }
    }
  };

  const handlePointerMove = (info: PointerInfo) => {
    if (panStart) {
      const dx = info.raw.clientX - panStart.x;
      const dy = info.raw.clientY - panStart.y;
      setOffsetClamped({ x: panStart.origin.x + dx, y: panStart.origin.y + dy });
      return;
    }
    if (boxStart) {
      const box = { x1: boxStart.x, y1: boxStart.y, x2: info.x, y2: info.y };
      setSelectionBox(box);
      const ids = blocks.filter((b) => intersectsBox(blockBounds(b), box)).map((b) => b.id);
      setSelection(ids);
      return;
    }
    engine.handlePointerMove({ x: info.x, y: info.y, button: info.button });
  };

  const handlePointerUp = (info: PointerInfo) => {
    if (panStart) {
      setPanStart(null);
    }
    if (boxStart) {
      const box = { x1: boxStart.x, y1: boxStart.y, x2: info.x, y2: info.y };
      const ids = blocks.filter((b) => intersectsBox(blockBounds(b), box)).map((b) => b.id);
      setSelection(ids);
      setBoxStart(null);
      setSelectionBox(null);
      return;
    }
    engine.handlePointerUp({ x: info.x, y: info.y, button: info.button });
  };

  const deleteSelected = () => {
    if (selection.length === 0) return;
    const next = blocks.filter((b) => !selection.includes(b.id));
    commit(next);
    setSelection([]);
  };

  const duplicateSelected = () => {
    if (selection.length === 0) return;
    const delta = 16;
    const next: Block[] = [...blocks];
    selection.forEach((id) => {
      const target = blocks.find((b) => b.id === id);
      if (!target) return;
      const clone: Block = {
        id: `${id}-copy-${Date.now()}`,
        shape:
          target.shape.type === "circle"
            ? { ...target.shape, x: target.shape.x + delta, y: target.shape.y + delta }
            : { ...target.shape, x: target.shape.x + delta, y: target.shape.y + delta },
        behaviors: [makeClickable(), makeHoverable(), makeDraggable({ snap })],
        data: target.data ? { ...target.data } : undefined,
      };
      next.push(clone);
    });
    commit(next);
  };

  const updateBlock = (id: string, mutator: (draft: Block) => void) => {
    const next = blocks.map((b) => {
      if (b.id !== id) return b;
      const copy: Block = {
        ...b,
        shape: { ...b.shape } as Block["shape"],
        data: b.data ? { ...b.data } : undefined,
      };
      mutator(copy);
      copy.behaviors = b.behaviors;
      return copy;
    });
    commit(next);
  };

  const applyTemplate = (templateId: string) => {
    const tpl = templates.find((t) => t.id === templateId);
    if (!tpl) return;
    const idSuffix = Date.now();
    const placed = tpl.blocks.map((b, idx) => ({
      ...b,
      id: `${b.id}-${idSuffix}-${idx}`,
      shape: { ...b.shape } as Block["shape"],
      behaviors: [makeClickable(), makeHoverable(), makeDraggable({ snap })],
    }));
    commit([...blocks, ...placed]);
    setSelection(placed.map((b) => b.id));
  };

  const exportJson = () => {
    return JSON.stringify(
      {
        viewport: { width: canvasSize.width, height: canvasSize.height, offset },
        blocks: blocks.map((b) => ({
          id: b.id,
          shape: b.shape,
          data: b.data,
        })),
      },
      null,
      2,
    );
  };

  const importJson = (payload: string) => {
    try {
      const parsed = JSON.parse(payload) as
        | {
            viewport?: { width?: number; height?: number; offset?: { x: number; y: number } };
            blocks: { id: string; shape: Block["shape"]; data?: Record<string, unknown> }[];
          }
        | { id: string; shape: Block["shape"]; data?: Record<string, unknown> }[];

      const blockList = Array.isArray(parsed)
        ? parsed
        : Array.isArray((parsed as any).blocks)
          ? (parsed as any).blocks
          : [];

      const hydrated: Block[] = blockList.map((item: { id: string; shape: Block["shape"]; data?: Record<string, unknown> }) => ({
        id: item.id,
        shape: item.shape,
        data: item.data,
        behaviors: [makeClickable(), makeHoverable(), makeDraggable({ snap })],
      }));
      if (hydrated.length > 0) {
        commit(hydrated);
      }
      if (!Array.isArray(parsed) && parsed.viewport?.offset) {
        setOffsetClamped(parsed.viewport.offset);
      }
      setSelection([]);
    } catch (e) {
      console.error("导入失败", e);
    }
  };

  const undo = () => {
    if (history.length <= 1) return;
    const prev = history[history.length - 2];
    setFuture((f) => [history[history.length - 1], ...f]);
    setHistory((h) => h.slice(0, -1));
    setBlocks(prev);
    engine.setBlocks(prev);
  };

  const redo = () => {
    if (future.length === 0) return;
    const [next, ...rest] = future;
    setFuture(rest);
    setHistory((h) => [...h, next]);
    setBlocks(next);
    engine.setBlocks(next);
  };

  const onWheel = (deltaY: number, center: { x: number; y: number }) => {
    const nextScale = Math.min(2, Math.max(0.4, scale + (deltaY > 0 ? -0.08 : 0.08)));
    const scaleRatio = nextScale / scale;
    setScale(nextScale);
    // keep focal point in place
    setOffsetClamped((prev) => ({
      x: center.x * (1 - scaleRatio) * scale + prev.x,
      y: center.y * (1 - scaleRatio) * scale + prev.y,
    }));
  };

  return {
    canvasSize,
    worldSize,
    blocks,
    selection,
    tool,
    setTool,
    offset,
    setOffset: setOffsetClamped,
    scale,
    setScale,
    showGrid,
    setShowGrid,
    snap,
    setSnap,
    events,
    selectionBox,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    deleteSelected,
    duplicateSelected,
    updateBlock,
    applyTemplate,
    exportJson,
    importJson,
    undo,
    redo,
    canUndo: history.length > 1,
    canRedo: future.length > 0,
    onWheel,
  };
}
