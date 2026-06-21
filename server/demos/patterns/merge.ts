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

const MAX_SLOTS = 8;

export const mergePatternDemo: DemoDefinition<ArchetypeInit, ArchetypeState, ArchetypeAction, ArchetypeView> = {
  id: "pattern-merge",
  name: "核心原型：合成成长（Merge / Incremental）",
  description: "Resource → Merge → Level Up → Production 的最小可玩示意：收集并合并同等级资源。",
  tags: ["pattern", "merge", "incremental"],

  initHelp: "seed 可选；difficulty: easy|normal|hard 可选。",
  initExample: { seed: 123, difficulty: "normal" },
  initSchema: archetypeInitSchema,

  actionHelp: "通用 action：reset/tick/primary/secondary。primary=生成新资源；secondary=自动合并一对同级资源。",
  actionExample: { type: "primary" },
  actionSchema: archetypeActionSchema,

  init: (input) => {
    const seed = toSeed(input.seed, 303);
    const difficulty = normalizeDifficulty(input.difficulty);
    const state: ArchetypeState = {
      seed,
      difficulty,
      step: 0,
      data: {
        slots: [1, 1, 0, 0, 0, 0, 0, 0],
        production: 0,
        maxLevel: 1,
      },
    };
    const view: ArchetypeView = {
      title: "合成成长（资源合并）",
      goal: "生成资源，合并同级升级，解锁更高等级。",
      status: [
        "primary=在空位生成一个 Lv.1 资源。",
        "secondary=自动合并一对最低级资源并升级。",
        "tick=根据最高等级产出分数。",
      ],
      metrics: [
        metric("slots", 2),
        metric("maxLevel", 1),
        metric("production", 0),
      ],
      controls: [
        { kind: "button", label: "生成资源（primary）", action: { type: "primary" } },
        { kind: "button", label: "合并升级（secondary）", action: { type: "secondary" } },
      ],
    };
    return { state, view };
  },

  step: ({ state, action }) => {
    const rng = makeRng(state.seed + state.step * 11);
    let slots = Array.isArray(state.data.slots) ? [...state.data.slots] : new Array(MAX_SLOTS).fill(0);
    let production = Number(state.data.production ?? 0);
    let maxLevel = Number(state.data.maxLevel ?? 1);
    const events: Array<{ type: string; payload?: unknown }> = [];

    if (action.type === "reset") {
      slots = [1, 1, 0, 0, 0, 0, 0, 0];
      production = 0;
      maxLevel = 1;
      events.push({ type: "reset" });
    } else if (action.type === "tick") {
      production += maxLevel;
      events.push({ type: "produce", payload: { amount: maxLevel } });
    } else if (action.type === "primary") {
      const emptyIdx = slots.findIndex((v) => !v);
      if (emptyIdx >= 0) {
        slots[emptyIdx] = 1;
        events.push({ type: "spawn", payload: { idx: emptyIdx } });
      } else {
        events.push({ type: "full" });
      }
    } else if (action.type === "secondary") {
      // find lowest level with at least 2 occurrences
      const counts = new Map<number, number[]>();
      slots.forEach((lvl, idx) => {
        if (!lvl) return;
        if (!counts.has(lvl)) counts.set(lvl, []);
        counts.get(lvl)!.push(idx);
      });
      const sortedLevels = Array.from(counts.keys()).sort((a, b) => a - b);
      let merged = false;
      for (const lvl of sortedLevels) {
        const indices = counts.get(lvl)!;
        if (indices.length >= 2) {
          slots[indices[0]] = lvl + 1;
          slots[indices[1]] = 0;
          if (lvl + 1 > maxLevel) maxLevel = lvl + 1;
          merged = true;
          events.push({ type: "merge", payload: { from: lvl, to: lvl + 1 } });
          break;
        }
      }
      if (!merged) events.push({ type: "no_merge" });
    }

    const next: ArchetypeState = { ...state, step: state.step + 1, data: { slots, production, maxLevel } };

    const view: ArchetypeView = {
      title: "合成成长（资源合并）",
      goal: "填满空位，合并升级，提高产出等级。",
      status: [
        `背包: [${slots.map((v) => (v ? `Lv.${v}` : "--")).join(", ")}]`,
        "tick 会根据当前最高等级自动产出。",
      ],
      metrics: [
        metric("filled", slots.filter(Boolean).length),
        metric("maxLevel", maxLevel),
        metric("production", production),
      ],
      controls: [
        { kind: "button", label: "生成资源（primary）", action: { type: "primary" } },
        { kind: "button", label: "合并升级（secondary）", action: { type: "secondary" } },
      ],
    };

    return { state: next, view, events };
  },
};
