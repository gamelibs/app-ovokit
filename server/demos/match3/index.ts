import type { DemoDefinition } from "../types";
import { match3ActionSchema, match3InitSchema } from "./schemas";
import { initMatch3, stepMatch3 } from "./core";
import type { Match3Action, Match3InitInput, Match3State, Match3View } from "./types";

export const match3Demo: DemoDefinition<Match3InitInput, Match3State, Match3Action, Match3View> = {
  id: "match3",
  name: "三消（Match-3 Core）",
  description: "可试玩的最小三消：相邻交换 → 判定是否成消 → 消除 → 下落 → 补齐 → 连锁结算。",
  tags: ["demo", "match3", "archetype"],

  initHelp: "初始化棋盘：传入宽高、类型数量与 seed；返回初始 state + view。",
  initExample: { width: 8, height: 8, types: 5, seed: 42 },
  initSchema: match3InitSchema,

  actionHelp: "交互动作：swap(交换相邻两格) / reset(重置棋盘)。",
  actionExample: { type: "swap", from: [3, 4], to: [4, 4] },
  actionSchema: match3ActionSchema,

  init: (input) => {
    const { state } = initMatch3(input);
    return { state, view: { board: state.board } };
  },

  step: ({ state, action }) => {
    const result = stepMatch3(state, action);
    return {
      state: result.state,
      view: { board: result.state.board, hint: result.hint },
      events: result.events,
    };
  },
};

