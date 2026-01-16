import type {
  BehaviorInstance,
  Block,
  EngineDispatch,
  PointerState,
} from "./types";

// Simple immutable mutate helper: takes a block clone and lets behaviors edit it.
function mutateBlock(block: Block, mutator: (draft: Block) => void): Block {
  const copy: Block = {
    ...block,
    shape: { ...block.shape } as Block["shape"],
    data: block.data ? { ...block.data } : undefined,
    behaviors: block.behaviors,
  };
  mutator(copy);
  return copy;
}

export function makeClickable(): BehaviorInstance {
  return {
    id: "clickable",
    onPointerUp: (block, pointer, ctx) => {
      ctx.dispatch({ type: "click", blockId: block.id, pointer });
    },
  };
}

export function makeDraggable(options?: { lockAxis?: "x" | "y"; snap?: number; bounds?: { minX?: number; minY?: number; maxX?: number; maxY?: number } }): BehaviorInstance {
  let dragging = false;
  let offset: { dx: number; dy: number } | null = null;

  const lockAxis = options?.lockAxis;
  const snap = options?.snap ?? 0;
  const bounds = options?.bounds;

  const updatePos = (
    block: Block,
    pointer: PointerState,
    ctx: { dispatch: EngineDispatch; mutate(block: Block): void },
  ) => {
    if (!dragging || !offset) return;
    const { dx, dy } = offset;
    ctx.dispatch({ type: "dragging", blockId: block.id, pointer });
    const next = mutateBlock(block, (draft) => {
      const baseX = draft.shape.type === "circle" ? draft.shape.x : draft.shape.x;
      const baseY = draft.shape.type === "circle" ? draft.shape.y : draft.shape.y;
      const nx = pointer.x - dx;
      const ny = pointer.y - dy;
      const applySnap = (v: number) => (snap > 0 ? Math.round(v / snap) * snap : v);
      const clamp = (val: number, min?: number, max?: number) => {
        if (typeof min === "number" && val < min) return min;
        if (typeof max === "number" && val > max) return max;
        return val;
      };
      if (draft.shape.type === "circle") {
        const sx = lockAxis === "y" ? baseX : applySnap(nx);
        const sy = lockAxis === "x" ? baseY : applySnap(ny);
        draft.shape.x = clamp(sx, bounds?.minX, bounds?.maxX);
        draft.shape.y = clamp(sy, bounds?.minY, bounds?.maxY);
      } else {
        const sx = lockAxis === "y" ? baseX : applySnap(nx);
        const sy = lockAxis === "x" ? baseY : applySnap(ny);
        draft.shape.x = clamp(sx, bounds?.minX, bounds?.maxX);
        draft.shape.y = clamp(sy, bounds?.minY, bounds?.maxY);
      }
    });
    ctx.mutate(next);
  };

  return {
    id: "draggable",
    onPointerDown: (block, pointer, ctx) => {
      dragging = true;
      if (block.shape.type === "circle") {
        offset = { dx: pointer.x - block.shape.x, dy: pointer.y - block.shape.y };
      } else {
        offset = { dx: pointer.x - block.shape.x, dy: pointer.y - block.shape.y };
      }
      ctx.dispatch({ type: "drag-start", blockId: block.id, pointer });
    },
    onPointerMove: (block, pointer, ctx) => {
      updatePos(block, pointer, ctx);
    },
    onPointerUp: (block, pointer, ctx) => {
      if (!dragging) return;
      updatePos(block, pointer, ctx);
      dragging = false;
      offset = null;
      ctx.dispatch({ type: "drag-end", blockId: block.id, pointer });
    },
  };
}

export function makeHoverable(): BehaviorInstance {
  return {
    id: "hoverable",
    onPointerEnter: (block, pointer, ctx) => {
      ctx.dispatch({ type: "enter", blockId: block.id, pointer });
    },
    onPointerLeave: (block, pointer, ctx) => {
      ctx.dispatch({ type: "leave", blockId: block.id, pointer });
    },
    onPointerMove: (block, pointer, ctx) => {
      ctx.dispatch({ type: "hover", blockId: block.id, pointer });
    },
  };
}
