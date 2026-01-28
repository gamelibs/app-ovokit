"use client";

import { useEffect, useMemo, useRef } from "react";
import { match3Palette } from "./palette";
import type { Vec2 } from "./types";

type Props = {
  board: number[][];
  selected: Vec2 | null;
  onCellTap: (cell: Vec2) => void;
  className?: string;
};

export function Match3Canvas({ board, selected, onCellTap, className }: Props) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  const size = useMemo(() => {
    const h = board.length;
    const w = h > 0 ? board[0]!.length : 0;
    return { w, h };
  }, [board]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;

    const cssWidth = canvas.clientWidth;
    const cssHeight = canvas.clientHeight;
    const width = Math.max(1, Math.floor(cssWidth * dpr));
    const height = Math.max(1, Math.floor(cssHeight * dpr));
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = "#0b0b0d";
    ctx.fillRect(0, 0, width, height);

    const cols = size.w;
    const rows = size.h;
    if (cols <= 0 || rows <= 0) return;

    const pad = 12 * dpr;
    const availableW = width - pad * 2;
    const availableH = height - pad * 2;
    const cell = Math.floor(Math.min(availableW / cols, availableH / rows));

    const gridW = cell * cols;
    const gridH = cell * rows;
    const ox = Math.floor((width - gridW) / 2);
    const oy = Math.floor((height - gridH) / 2);

    ctx.save();
    ctx.translate(ox, oy);

    ctx.strokeStyle = "rgba(255,255,255,0.07)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= cols; x++) {
      ctx.beginPath();
      ctx.moveTo(x * cell, 0);
      ctx.lineTo(x * cell, gridH);
      ctx.stroke();
    }
    for (let y = 0; y <= rows; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * cell);
      ctx.lineTo(gridW, y * cell);
      ctx.stroke();
    }

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const v = board[y]![x]!;
        const color = match3Palette[v % match3Palette.length] ?? "#9ca3af";
        const r = Math.max(6, Math.floor(cell * 0.18));
        const cx = x * cell + Math.floor(cell / 2);
        const cy = y * cell + Math.floor(cell / 2);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect(cx - Math.floor(cell * 0.38), cy - Math.floor(cell * 0.38), Math.floor(cell * 0.76), Math.floor(cell * 0.76), r);
        ctx.fill();
      }
    }

    if (selected) {
      const [sx, sy] = selected;
      ctx.strokeStyle = "rgba(56, 189, 248, 0.95)";
      ctx.lineWidth = Math.max(2, Math.floor(2 * dpr));
      ctx.strokeRect(sx * cell + 2, sy * cell + 2, cell - 4, cell - 4);
    }

    ctx.restore();
  }, [board, selected, size.h, size.w]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    const pick = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const cols = size.w;
      const rows = size.h;
      if (cols <= 0 || rows <= 0) return null;

      const dpr = window.devicePixelRatio || 1;
      const width = rect.width * dpr;
      const height = rect.height * dpr;

      const pad = 12 * dpr;
      const availableW = width - pad * 2;
      const availableH = height - pad * 2;
      const cell = Math.floor(Math.min(availableW / cols, availableH / rows));
      const gridW = cell * cols;
      const gridH = cell * rows;
      const ox = (width - gridW) / 2;
      const oy = (height - gridH) / 2;

      const x = Math.floor(((px * dpr) - ox) / cell);
      const y = Math.floor(((py * dpr) - oy) / cell);
      if (x < 0 || y < 0 || x >= cols || y >= rows) return null;
      return [x, y] as Vec2;
    };

    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "touch") e.preventDefault();
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {
        // noop
      }
      const cell = pick(e);
      if (cell) onCellTap(cell);
    };

    canvas.addEventListener("pointerdown", onDown, { passive: false });
    return () => canvas.removeEventListener("pointerdown", onDown);
  }, [onCellTap, size.h, size.w]);

  return (
    <canvas
      ref={ref}
      className={[
        "h-full w-full rounded-xl border border-zinc-800 bg-black/60 shadow-inner",
        "select-none overscroll-contain",
        className ?? "",
      ]
        .join(" ")
        .trim()}
      style={{ touchAction: "none" }}
    />
  );
}
