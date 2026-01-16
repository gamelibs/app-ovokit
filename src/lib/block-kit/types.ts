export type Shape =
  | { type: "circle"; x: number; y: number; r: number; fill: string; stroke?: string }
  | { type: "rect"; x: number; y: number; w: number; h: number; fill: string; stroke?: string; radius?: number };

export type Block = {
  id: string;
  shape: Shape;
  data?: Record<string, unknown>;
  behaviors: BehaviorInstance[];
};

export type PointerState = {
  x: number;
  y: number;
  button: number;
};

export type EngineEvent =
  | { type: "click"; blockId: string; pointer: PointerState }
  | { type: "drag-start"; blockId: string; pointer: PointerState }
  | { type: "dragging"; blockId: string; pointer: PointerState }
  | { type: "drag-end"; blockId: string; pointer: PointerState }
  | { type: "hover"; blockId: string; pointer: PointerState }
  | { type: "enter"; blockId: string; pointer: PointerState }
  | { type: "leave"; blockId: string; pointer: PointerState };

export type EngineDispatch = (evt: EngineEvent) => void;

export type BehaviorInstance = {
  id: string;
  onPointerDown?: (
    block: Block,
    pointer: PointerState,
    ctx: { dispatch: EngineDispatch; mutate(block: Block): void },
  ) => void;
  onPointerMove?: (
    block: Block,
    pointer: PointerState,
    ctx: { dispatch: EngineDispatch; mutate(block: Block): void },
  ) => void;
  onPointerUp?: (
    block: Block,
    pointer: PointerState,
    ctx: { dispatch: EngineDispatch; mutate(block: Block): void },
  ) => void;
  onPointerEnter?: (
    block: Block,
    pointer: PointerState,
    ctx: { dispatch: EngineDispatch; mutate(block: Block): void },
  ) => void;
  onPointerLeave?: (
    block: Block,
    pointer: PointerState,
    ctx: { dispatch: EngineDispatch; mutate(block: Block): void },
  ) => void;
};

export type HitTest = (shape: Shape, x: number, y: number) => boolean;
