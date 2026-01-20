import { z } from "zod";
import type { DemoDefinition } from "./types";

type Vec2 = [number, number];

export type Match3InitInput = {
  width: number;
  height: number;
  types: number;
  seed: number;
};

export type Match3State = {
  width: number;
  height: number;
  types: number;
  seed: number;
  board: number[][];
};

export type Match3Action =
  | { type: "swap"; from: Vec2; to: Vec2 }
  | { type: "reset" };

export type Match3View = {
  board: number[][];
  hint?: string;
};

function seededRandom(seed: number) {
  let s = seed >>> 0;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return (s >>> 0) / 0xffffffff;
  };
}

function makeBoard(width: number, height: number, types: number, seed: number) {
  const rand = seededRandom(seed);
  return Array.from({ length: height }, () =>
    Array.from({ length: width }, () => Math.floor(rand() * types)),
  );
}

export const match3Demo: DemoDefinition<Match3InitInput, Match3State, Match3Action, Match3View> = {
  id: "match3",
  name: "三消（最小规则试玩）",
  description: "母型玩法 Demo 模块：三消。仅定义 I/O 与状态结构，step 逻辑后续实现。",
  tags: ["demo", "match3", "archetype"],

  initHelp: "初始化棋盘：传入宽高、类型数量与 seed；返回初始 state + view。",
  initExample: { width: 8, height: 8, types: 5, seed: 42 },
  initSchema: z.object({
    width: z.number().int().min(4).max(16).default(8),
    height: z.number().int().min(4).max(16).default(8),
    types: z.number().int().min(3).max(8).default(5),
    seed: z.number().int().default(1),
  }),

  actionHelp: "交互动作：swap(交换两格) / reset(重置)。",
  actionExample: { type: "swap", from: [3, 4], to: [4, 4] },
  actionSchema: z.discriminatedUnion("type", [
    z.object({
      type: z.literal("swap"),
      from: z.tuple([z.number().int(), z.number().int()]),
      to: z.tuple([z.number().int(), z.number().int()]),
    }),
    z.object({
      type: z.literal("reset"),
    }),
  ]),

  init: (input) => {
    const board = makeBoard(input.width, input.height, input.types, input.seed);
    const state: Match3State = {
      width: input.width,
      height: input.height,
      types: input.types,
      seed: input.seed,
      board,
    };
    return {
      state,
      view: { board, hint: "step(交换/消除/下落) 逻辑待实现" },
    };
  },

  step: ({ state, action }) => {
    if (action.type === "reset") {
      const board = makeBoard(state.width, state.height, state.types, state.seed);
      const next: Match3State = { ...state, board };
      return {
        state: next,
        view: { board, hint: "已重置" },
        events: [{ type: "reset" }],
      };
    }

    return {
      state,
      view: { board: state.board, hint: "swap/消除/连锁结算待实现" },
      events: [{ type: "not_implemented", payload: { action } }],
    };
  },
};

