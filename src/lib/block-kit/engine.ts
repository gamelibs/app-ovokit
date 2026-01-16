import { hitTest } from "./hit-test";
import type {
  BehaviorInstance,
  Block,
  EngineDispatch,
  EngineEvent,
  PointerState,
} from "./types";

export type EngineState = {
  blocks: Block[];
  listeners: ((evt: EngineEvent) => void)[];
};

export function createEngine(initialBlocks: Block[] = []): {
  getBlocks: () => Block[];
  setBlocks: (blocks: Block[]) => void;
  onEvent: (cb: (evt: EngineEvent) => void) => () => void;
  handlePointerDown: (pointer: PointerState) => void;
  handlePointerMove: (pointer: PointerState) => void;
  handlePointerUp: (pointer: PointerState) => void;
} {
  const state: EngineState = {
    blocks: initialBlocks,
    listeners: [],
  };
  let hoveredId: string | null = null;

  const dispatch: EngineDispatch = (evt) => {
    state.listeners.forEach((cb) => cb(evt));
  };

  const mutateBlock = (targetId: string, next: Block) => {
    state.blocks = state.blocks.map((b) => (b.id === targetId ? next : b));
  };

  const findHitBlock = (pointer: PointerState): Block | null => {
    const blocks = [...state.blocks].reverse();
    for (const block of blocks) {
      if (!hitTest(block.shape, pointer.x, pointer.y)) continue;
      return block;
    }
    return null;
  };

  const pointerHandler =
    (phase: "onPointerDown" | "onPointerMove" | "onPointerUp") =>
    (pointer: PointerState) => {
      const block = findHitBlock(pointer);

      if (phase === "onPointerMove") {
        if (block?.id !== hoveredId) {
          const prev = hoveredId ? state.blocks.find((b) => b.id === hoveredId) : null;
          if (prev) {
            for (const behavior of prev.behaviors) {
              behavior.onPointerLeave?.(prev, pointer, { dispatch, mutate: (next) => mutateBlock(prev.id, next) });
            }
            dispatch({ type: "leave", blockId: prev.id, pointer });
          }
          hoveredId = block?.id ?? null;
          if (block) {
            for (const behavior of block.behaviors) {
              behavior.onPointerEnter?.(block, pointer, { dispatch, mutate: (next) => mutateBlock(block.id, next) });
            }
            dispatch({ type: "enter", blockId: block.id, pointer });
          }
        }
        if (block) {
          dispatch({ type: "hover", blockId: block.id, pointer });
        }
      }

      if (!block) return;

      for (const behavior of block.behaviors) {
        const handler = behavior[phase] as BehaviorInstance[typeof phase] | undefined;
        if (!handler) continue;
        handler(block, pointer, {
          dispatch,
          mutate: (next) => mutateBlock(block.id, next),
        });
      }
    };

  return {
    getBlocks: () => state.blocks,
    setBlocks: (blocks: Block[]) => {
      state.blocks = blocks;
    },
    onEvent: (cb: (evt: EngineEvent) => void) => {
      state.listeners.push(cb);
      return () => {
        state.listeners = state.listeners.filter((f) => f !== cb);
      };
    },
    handlePointerDown: pointerHandler("onPointerDown"),
    handlePointerMove: pointerHandler("onPointerMove"),
    handlePointerUp: pointerHandler("onPointerUp"),
  };
}
