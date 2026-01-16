import type { HitTest, Shape } from "./types";

export const hitTest: HitTest = (shape: Shape, x: number, y: number) => {
  if (shape.type === "circle") {
    const dx = x - shape.x;
    const dy = y - shape.y;
    return dx * dx + dy * dy <= shape.r * shape.r;
  }
  const withinX = x >= shape.x && x <= shape.x + shape.w;
  const withinY = y >= shape.y && y <= shape.y + shape.h;
  if (!shape.radius) return withinX && withinY;

  // Rounded rect hit test
  const rx = shape.radius;
  const cx = Math.max(shape.x + rx, Math.min(x, shape.x + shape.w - rx));
  const cy = Math.max(shape.y + rx, Math.min(y, shape.y + shape.h - rx));
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy <= rx * rx;
};
