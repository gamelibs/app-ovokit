import type { DemoDefinition } from "../types";
import {
  archetypeActionSchema,
  archetypeInitSchema,
  makeRng,
  normalizeDifficulty,
  toSeed,
  type ArchetypeAction,
  type ArchetypeInit,
  type ArchetypeState,
  type ArchetypeView,
} from "../archetypes/shared";

function metric(label: string, value: number | string) {
  return { label, value: typeof value === "number" ? String(Math.round(value * 100) / 100) : value };
}

const SIZE = 3;
const TOTAL = SIZE * SIZE;

function indexToPos(idx: number): [number, number] {
  return [idx % SIZE, Math.floor(idx / SIZE)];
}

function flip(board: number[], idx: number): number[] {
  const [x, y] = indexToPos(idx);
  const next = [...board];
  const toggle = (i: number) => {
    if (i >= 0 && i < TOTAL) next[i] = next[i] ? 0 : 1;
  };
  toggle(idx);
  if (x > 0) toggle(idx - 1);
  if (x < SIZE - 1) toggle(idx + 1);
  if (y > 0) toggle(idx - SIZE);
  if (y < SIZE - 1) toggle(idx + SIZE);
  return next;
}

function boardStr(board: number[]): string {
  let s = "";
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      s += board[y * SIZE + x] ? "●" : "○";
    }
    s += "\n";
  }
  return s.trim();
}

export const spatialPatternDemo: DemoDefinition<ArchetypeInit, ArchetypeState, ArchetypeAction, ArchetypeView> = {
  id: "pattern-spatial",
  name: "核心原型：空间布局（Spatial / Puzzle）",
  description: "Board → Cell → Rule → State Change 的最小可玩示意：点击 cell 翻转十字。",
  tags: ["pattern", "spatial", "puzzle"],

  initHelp: "seed 可选；difficulty: easy|normal|hard 可选。",
  initExample: { seed: 123, difficulty: "normal" },
  initSchema: archetypeInitSchema,

  actionHelp: "通用 action：reset/tick/primary/choice。choice 选择 cell 索引 0-8；primary=随机翻转一格。",
  actionExample: { type: "choice", option: 4 },
  actionSchema: archetypeActionSchema,

  init: (input) => {
    const seed = toSeed(input.seed, 302);
    const difficulty = normalizeDifficulty(input.difficulty);
    const rng = makeRng(seed);
    // start from solved (all off), then apply random flips
    let board = new Array(TOTAL).fill(0);
    const flips = difficulty === "easy" ? 2 : difficulty === "hard" ? 6 : 4;
    for (let i = 0; i < flips; i++) {
      board = flip(board, Math.floor(rng() * TOTAL));
    }

    const state: ArchetypeState = {
      seed,
      difficulty,
      step: 0,
      data: { board },
    };

    const view: ArchetypeView = {
      title: "空间布局（十字翻转）",
      goal: "让 3×3 棋盘全部熄灭（○）。每次点击会翻转自己和四邻。",
      status: ["choice 选择 cell 索引 0-8；primary=随机提示一步。", "棋盘下方显示当前局面。"],
      metrics: [
        metric("lit", board.filter((v) => v).length),
        metric("steps", 0),
        metric("solved", board.every((v) => !v) ? "是" : "否"),
      ],
      controls: [
        { kind: "choices", label: "点击 cell", options: ["0", "1", "2", "3", "4", "5", "6", "7", "8"] },
        { kind: "button", label: "随机提示（primary）", action: { type: "primary" } },
      ],
    };
    return { state, view };
  },

  step: ({ state, action }) => {
    const board = Array.isArray(state.data.board) ? [...state.data.board] : new Array(TOTAL).fill(0);
    let nextBoard = board;
    const events: Array<{ type: string; payload?: unknown }> = [];

    if (action.type === "reset") {
      const rng = makeRng(state.seed);
      nextBoard = new Array(TOTAL).fill(0);
      const flips = state.difficulty === "easy" ? 2 : state.difficulty === "hard" ? 6 : 4;
      for (let i = 0; i < flips; i++) {
        nextBoard = flip(nextBoard, Math.floor(rng() * TOTAL));
      }
      events.push({ type: "reset" });
    } else if (action.type === "choice") {
      const idx = Math.max(0, Math.min(TOTAL - 1, action.option ?? 0));
      nextBoard = flip(board, idx);
      events.push({ type: "flip", payload: { idx } });
    } else if (action.type === "primary") {
      // hint: flip a random lit cell, or any cell if solved
      const lit = nextBoard.map((v, i) => (v ? i : -1)).filter((i) => i >= 0) as number[];
      const idx = lit.length ? lit[Math.floor(Math.random() * lit.length)]! : Math.floor(Math.random() * TOTAL);
      nextBoard = flip(nextBoard, idx);
      events.push({ type: "hint", payload: { idx } });
    }

    const solved = nextBoard.every((v) => !v);
    if (solved) events.push({ type: "solved" });

    const next: ArchetypeState = { ...state, step: state.step + 1, data: { board: nextBoard } };

    const view: ArchetypeView = {
      title: "空间布局（十字翻转）",
      goal: solved ? "已解决！点击重开再来一局。" : "让 3×3 棋盘全部熄灭（○）。",
      status: [boardStr(nextBoard), "每次选择会翻转该 cell 及其上下左右邻居。"],
      metrics: [
        metric("lit", nextBoard.filter((v) => v).length),
        metric("steps", next.step),
        metric("solved", solved ? "是" : "否"),
      ],
      controls: [
        { kind: "choices", label: "点击 cell", options: ["0", "1", "2", "3", "4", "5", "6", "7", "8"] },
        { kind: "button", label: "随机提示（primary）", action: { type: "primary" } },
      ],
    };

    return { state: next, view, events };
  },
};
