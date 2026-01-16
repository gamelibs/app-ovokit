import { useEffect, useRef } from "react";
import type { Block } from "@/lib/block-kit/types";

type PointerInfo = {
  x: number;
  y: number;
  button: number;
  raw: PointerEvent;
};

type Props = {
  blocks: Block[];
  width: number;
  height: number;
  onPointerDown: (info: PointerInfo) => void;
  onPointerMove: (info: PointerInfo) => void;
  onPointerUp: (info: PointerInfo) => void;
  onWheel?: (deltaY: number, center: { x: number; y: number }) => void;
  offset?: { x: number; y: number };
  scale?: number;
  showGrid?: boolean;
  gridSize?: number;
  highlightIds?: string[];
  selectionBox?: { x1: number; y1: number; x2: number; y2: number } | null;
  background?: string;
};

export function BlockCanvas({
  blocks,
  width,
  height,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onWheel,
  offset = { x: 0, y: 0 },
  scale = 1,
  showGrid = false,
  gridSize = 20,
  highlightIds = [],
  selectionBox = null,
  background = "#0f0f0f",
}: Props) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * offset.x, dpr * offset.y);

    if (showGrid && gridSize > 0) {
      const viewMinX = (-offset.x) / scale;
      const viewMaxX = (width - offset.x) / scale;
      const viewMinY = (-offset.y) / scale;
      const viewMaxY = (height - offset.y) / scale;
      const startX = Math.floor(viewMinX / gridSize) * gridSize;
      const endX = Math.ceil(viewMaxX / gridSize) * gridSize;
      const startY = Math.floor(viewMinY / gridSize) * gridSize;
      const endY = Math.ceil(viewMaxY / gridSize) * gridSize;
      ctx.save();
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 1 / scale;
      for (let gx = startX; gx <= endX; gx += gridSize) {
        ctx.beginPath();
        ctx.moveTo(gx, startY);
        ctx.lineTo(gx, endY);
        ctx.stroke();
      }
      for (let gy = startY; gy <= endY; gy += gridSize) {
        ctx.beginPath();
        ctx.moveTo(startX, gy);
        ctx.lineTo(endX, gy);
        ctx.stroke();
      }
      ctx.restore();
    }

    for (const block of blocks) {
      const shape = block.shape;
      ctx.save();
      ctx.fillStyle = shape.fill;
      ctx.strokeStyle = shape.stroke ?? "rgba(0,0,0,0.2)";
      if (shape.type === "circle") {
        ctx.beginPath();
        ctx.arc(shape.x, shape.y, shape.r, 0, Math.PI * 2);
        ctx.fill();
        if (shape.stroke) ctx.stroke();
      } else {
        const r = shape.radius ?? 0;
        if (r > 0) {
          const w = shape.w;
          const h = shape.h;
          const x = shape.x;
          const y = shape.y;
          ctx.beginPath();
          ctx.moveTo(x + r, y);
          ctx.lineTo(x + w - r, y);
          ctx.quadraticCurveTo(x + w, y, x + w, y + r);
          ctx.lineTo(x + w, y + h - r);
          ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
          ctx.lineTo(x + r, y + h);
          ctx.quadraticCurveTo(x, y + h, x, y + h - r);
          ctx.lineTo(x, y + r);
          ctx.quadraticCurveTo(x, y, x + r, y);
          ctx.closePath();
          ctx.fill();
          if (shape.stroke) ctx.stroke();
        } else {
          ctx.fillRect(shape.x, shape.y, shape.w, shape.h);
          if (shape.stroke) ctx.strokeRect(shape.x, shape.y, shape.w, shape.h);
        }
      }
      ctx.restore();

      if (highlightIds.includes(block.id)) {
        ctx.save();
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 2 / scale;
        if (shape.type === "circle") {
          ctx.beginPath();
          ctx.arc(shape.x, shape.y, shape.r + 2 / scale, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          const r = shape.radius ?? 0;
          if (r > 0) {
            const w = shape.w;
            const h = shape.h;
            const x = shape.x;
            const y = shape.y;
            ctx.beginPath();
            ctx.moveTo(x + r, y);
            ctx.lineTo(x + w - r, y);
            ctx.quadraticCurveTo(x + w, y, x + w, y + r);
            ctx.lineTo(x + w, y + h - r);
            ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
            ctx.lineTo(x + r, y + h);
            ctx.quadraticCurveTo(x, y + h, x, y + h - r);
            ctx.lineTo(x, y + r);
            ctx.quadraticCurveTo(x, y, x + r, y);
            ctx.closePath();
            ctx.stroke();
          } else {
            ctx.strokeRect(shape.x, shape.y, shape.w, shape.h);
          }
        }
        ctx.restore();
      }
    }

    if (selectionBox) {
      const { x1, y1, x2, y2 } = selectionBox;
      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.strokeStyle = "rgba(56, 189, 248, 0.8)";
      ctx.fillStyle = "rgba(56, 189, 248, 0.1)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      const sx1 = x1 * scale + offset.x;
      const sy1 = y1 * scale + offset.y;
      const sx2 = x2 * scale + offset.x;
      const sy2 = y2 * scale + offset.y;
      ctx.rect(Math.min(sx1, sx2), Math.min(sy1, sy2), Math.abs(sx2 - sx1), Math.abs(sy2 - sy1));
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }, [background, blocks, gridSize, height, highlightIds, offset.x, offset.y, scale, selectionBox, showGrid, width]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const toWorld = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const localX = e.clientX - rect.left;
      const localY = e.clientY - rect.top;
      const scaleX = width / rect.width;
      const scaleY = height / rect.height;
      const x = (localX * scaleX - offset.x) / scale;
      const y = (localY * scaleY - offset.y) / scale;
      return { x, y, button: e.button, raw: e };
    };
    const down = (e: PointerEvent) => {
      const p = toWorld(e);
      onPointerDown(p);
    };
    const move = (e: PointerEvent) => {
      const p = toWorld(e);
      onPointerMove(p);
    };
    const up = (e: PointerEvent) => {
      const p = toWorld(e);
      onPointerUp(p);
    };
    const wheel = (e: WheelEvent) => {
      if (!onWheel) return;
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const localX = e.clientX - rect.left;
      const localY = e.clientY - rect.top;
      const scaleX = width / rect.width;
      const scaleY = height / rect.height;
      const x = (localX * scaleX - offset.x) / scale;
      const y = (localY * scaleY - offset.y) / scale;
      onWheel(e.deltaY, { x, y });
    };
    canvas.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    canvas.addEventListener("wheel", wheel, { passive: false });
    return () => {
      canvas.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      canvas.removeEventListener("wheel", wheel);
    };
  }, [offset.x, offset.y, onPointerDown, onPointerMove, onPointerUp, onWheel, scale]);

  return (
    <canvas
      ref={ref}
      className="flex-none rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/5"
      style={{ width, height, minWidth: width, minHeight: height }}
    />
  );
}
