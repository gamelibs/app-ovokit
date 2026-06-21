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

export const managementPatternDemo: DemoDefinition<ArchetypeInit, ArchetypeState, ArchetypeAction, ArchetypeView> = {
  id: "pattern-management",
  name: "核心原型：经营模拟（Management / Simulation）",
  description: "Building → Production → Economy → Growth 的最小可玩示意：建造建筑、产出金币、扩张规模。",
  tags: ["pattern", "management", "simulation"],

  initHelp: "seed 可选；difficulty: easy|normal|hard 可选。",
  initExample: { seed: 123, difficulty: "normal" },
  initSchema: archetypeInitSchema,

  actionHelp: "通用 action：reset/tick/primary/secondary。primary=建造新建筑；secondary=升级一座建筑。",
  actionExample: { type: "primary" },
  actionSchema: archetypeActionSchema,

  init: (input) => {
    const seed = toSeed(input.seed, 304);
    const difficulty = normalizeDifficulty(input.difficulty);
    const state: ArchetypeState = {
      seed,
      difficulty,
      step: 0,
      data: {
        money: 10,
        buildings: [1],
        income: 1,
      },
    };
    const view: ArchetypeView = {
      title: "经营模拟（建造与产出）",
      goal: "建造建筑获得收入，再投资扩张。",
      status: [
        "primary=花费金币建造新建筑（等级 1）。",
        "secondary=花费金币随机升级一座建筑。",
        "tick=结算所有建筑产出。",
      ],
      metrics: [
        metric("money", 10),
        metric("buildings", 1),
        metric("income", 1),
      ],
      controls: [
        { kind: "button", label: "建造（primary）", action: { type: "primary" } },
        { kind: "button", label: "升级（secondary）", action: { type: "secondary" } },
      ],
    };
    return { state, view };
  },

  step: ({ state, action }) => {
    const rng = makeRng(state.seed + state.step * 13);
    let money = Number(state.data.money ?? 0);
    let buildings = Array.isArray(state.data.buildings) ? [...state.data.buildings] : [1];
    let income = Number(state.data.income ?? 1);
    const events: Array<{ type: string; payload?: unknown }> = [];

    const difficultyMul = state.difficulty === "easy" ? 0.8 : state.difficulty === "hard" ? 1.3 : 1;
    const buildCost = Math.round(5 * Math.pow(1.5, buildings.length - 1) * difficultyMul);
    const upgradeCost = 8;

    if (action.type === "reset") {
      money = 10;
      buildings = [1];
      income = 1;
      events.push({ type: "reset" });
    } else if (action.type === "tick") {
      income = buildings.reduce((sum, lvl) => sum + lvl, 0);
      money += income;
      events.push({ type: "income", payload: { amount: income } });
    } else if (action.type === "primary") {
      if (money >= buildCost) {
        money -= buildCost;
        buildings.push(1);
        events.push({ type: "build", payload: { cost: buildCost } });
      } else {
        events.push({ type: "need_money" });
      }
    } else if (action.type === "secondary") {
      if (money >= upgradeCost && buildings.length > 0) {
        const idx = Math.floor(rng() * buildings.length);
        money -= upgradeCost;
        buildings[idx] = buildings[idx]! + 1;
        events.push({ type: "upgrade", payload: { idx, cost: upgradeCost } });
      } else {
        events.push({ type: "need_money" });
      }
    }

    income = buildings.reduce((sum, lvl) => sum + lvl, 0);
    const next: ArchetypeState = { ...state, step: state.step + 1, data: { money, buildings, income } };

    const view: ArchetypeView = {
      title: "经营模拟（建造与产出）",
      goal: "平衡建造与升级，让收入指数增长。",
      status: [
        `建筑: [${buildings.map((lvl, i) => `B${i + 1}:Lv.${lvl}`).join(", ")}]`,
        `下次建造花费: ${buildCost}，升级花费: ${upgradeCost}`,
      ],
      metrics: [
        metric("money", money),
        metric("buildings", buildings.length),
        metric("income", income),
      ],
      controls: [
        { kind: "button", label: `建造（-${buildCost}）`, action: { type: "primary" } },
        { kind: "button", label: `升级（-${upgradeCost}）`, action: { type: "secondary" } },
      ],
    };

    return { state: next, view, events };
  },
};
