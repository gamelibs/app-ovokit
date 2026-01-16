import { makeClickable, makeDraggable, makeHoverable } from "@/lib/block-kit/behaviors";
import type { Block } from "@/lib/block-kit/types";

const baseBehaviors = () => [makeClickable(), makeHoverable(), makeDraggable({ snap: 10 })];

const block = (id: string, shape: Block["shape"]): Block => ({
  id,
  shape,
  behaviors: baseBehaviors(),
});

export const templates: { id: string; name: string; description: string; blocks: Block[] }[] = [
  {
    id: "drag-pairs",
    name: "拖拽配对",
    description: "两个目标区 + 两个可拖拽积木，适合演示拖拽放置、吸附感。",
    blocks: [
      block("zone-a", { type: "rect", x: 120, y: 120, w: 140, h: 100, radius: 12, fill: "#0ea5e9" }),
      block("zone-b", { type: "rect", x: 340, y: 120, w: 140, h: 100, radius: 12, fill: "#eab308" }),
      block("piece-1", { type: "circle", x: 180, y: 320, r: 36, fill: "#22c55e" }),
      block("piece-2", { type: "rect", x: 360, y: 300, w: 90, h: 70, radius: 10, fill: "#f97316" }),
    ],
  },
  {
    id: "reaction-click",
    name: "点击反应",
    description: "三连击测试：适合演示点击触发、状态切换、事件日志。",
    blocks: [
      block("tap-1", { type: "circle", x: 160, y: 200, r: 40, fill: "#a855f7" }),
      block("tap-2", { type: "circle", x: 320, y: 200, r: 40, fill: "#06b6d4" }),
      block("tap-3", { type: "circle", x: 480, y: 200, r: 40, fill: "#f97316" }),
    ],
  },
  {
    id: "obstacles",
    name: "躲避/碰撞场景",
    description: "一条主角轨迹 + 多个障碍，可用于测试碰撞和移动逻辑。",
    blocks: [
      block("player", { type: "circle", x: 120, y: 260, r: 28, fill: "#38bdf8" }),
      block("wall-1", { type: "rect", x: 200, y: 140, w: 40, h: 240, radius: 8, fill: "#e4e4e7" }),
      block("wall-2", { type: "rect", x: 320, y: 100, w: 40, h: 280, radius: 8, fill: "#e4e4e7" }),
      block("wall-3", { type: "rect", x: 460, y: 120, w: 40, h: 260, radius: 8, fill: "#e4e4e7" }),
    ],
  },
];
