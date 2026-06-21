import type { DemoDefinition } from "../types";
import { z } from "zod";
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
} from "./shared";

function baseInit(input: ArchetypeInit, defaultSeed: number): ArchetypeState {
  return {
    seed: toSeed(input.seed, defaultSeed),
    difficulty: normalizeDifficulty(input.difficulty),
    step: 0,
    data: {},
  };
}

function bumpStep(state: ArchetypeState) {
  return { ...state, step: state.step + 1 };
}

function metric(label: string, value: number | string) {
  return { label, value: typeof value === "number" ? String(Math.round(value * 100) / 100) : value };
}

function withCommonControls(state: ArchetypeState, view: ArchetypeView): ArchetypeView {
  const difficultyIndex = state.difficulty === "easy" ? 0 : state.difficulty === "normal" ? 1 : 2;
  return {
    ...view,
    controls: [
      { kind: "button", label: "重开", action: { type: "reset" } },
      { kind: "button", label: "推进 1 步", action: { type: "tick" } },
      { kind: "choices", label: "难度", options: ["easy", "normal", "hard"] },
      {
        kind: "slider",
        label: "难度(滑块)",
        key: "difficultyIndex",
        min: 0,
        max: 2,
        step: 1,
        value: difficultyIndex,
      },
      ...view.controls,
    ],
  };
}

function applyDifficultyFromSet(state: ArchetypeState, action: ArchetypeAction): ArchetypeState {
  if (action.type !== "set") return state;
  if (action.key !== "difficultyIndex") return state;
  const idx = Math.max(0, Math.min(2, Math.round(action.value)));
  const difficulty = (idx === 0 ? "easy" : idx === 1 ? "normal" : "hard") as ArchetypeState["difficulty"];
  return { ...state, difficulty };
}

function stepWrapper(
  impl: (input: { state: ArchetypeState; action: ArchetypeAction }) => { state: ArchetypeState; view: ArchetypeView; events: Array<{ type: string; payload?: unknown }> },
) {
  return (input: { state: ArchetypeState; action: ArchetypeAction }) => {
    const action = input.action;
    if (action.type === "reset") {
      return impl({
        state: { ...input.state, step: 0, data: {} },
        action,
      });
    }
    if (action.type === "set") {
      return impl({
        state: applyDifficultyFromSet(input.state, action),
        action,
      });
    }
    return impl(input);
  };
}

function def(
  id: string,
  name: string,
  description: string,
  tags: string[],
  init: (input: ArchetypeInit) => { state: ArchetypeState; view: ArchetypeView },
  step: (input: { state: ArchetypeState; action: ArchetypeAction }) => { state: ArchetypeState; view: ArchetypeView; events: Array<{ type: string; payload?: unknown }> },
): DemoDefinition<ArchetypeInit, ArchetypeState, ArchetypeAction, ArchetypeView> {
  return {
    id,
    name,
    description,
    tags,
    initHelp: "seed 可选；difficulty: easy|normal|hard 可选。",
    initExample: { seed: 123, difficulty: "normal" },
    initSchema: archetypeInitSchema,
    actionHelp:
      "通用 action：reset/tick/primary/secondary/choice/set。set 可用于调整难度等参数。",
    actionExample: { type: "primary" },
    actionSchema: archetypeActionSchema,
    init,
    step: stepWrapper(step),
  };
}

export const archetypeDemoDefinitions = [
  // 1) Match/Clear
  def(
    "arch-match-clear",
    "母型试玩：消除（Match/Clear）",
    "用“匹配→消除→连锁→反馈”演示节奏与可解释性（最小版）。",
    ["archetype", "match-clear"],
    (input) => {
      const state = baseInit(input, 101);
      const rng = makeRng(state.seed);
      state.data = { movesLeft: 12, chain: 0, entropy: 0.35 + rng() * 0.25 };
      const view: ArchetypeView = {
        title: "消除（最小节奏）",
        goal: "在有限步数内制造连锁与强反馈，同时保持“看起来随机”。",
        status: ["操作：点击“交换/消除”尝试触发连锁。", "提示：entropy 越低越容易“控盘感”。"],
        metrics: [
          metric("movesLeft", state.data.movesLeft as number),
          metric("chain", state.data.chain as number),
          metric("entropy", state.data.entropy as number),
        ],
        controls: [{ kind: "button", label: "交换/消除（primary）", action: { type: "primary" } }],
      };
      return { state, view: withCommonControls(state, view) };
    },
    ({ state, action }) => {
      const rng = makeRng(state.seed + state.step * 7 + (action.type === "primary" ? 1 : 0));
      const movesLeft = Number(state.data.movesLeft ?? 0);
      const entropy = Number(state.data.entropy ?? 0.4);
      const chain = Number(state.data.chain ?? 0);

      const next = bumpStep(state);
      let events: Array<{ type: string; payload?: unknown }> = [];

      if (action.type === "primary") {
        const nextMoves = Math.max(0, movesLeft - 1);
        const pMatch = Math.max(0.18, 0.55 - entropy * 0.65) * (state.difficulty === "easy" ? 1.15 : state.difficulty === "hard" ? 0.9 : 1);
        const matched = rng() < pMatch;
        const nextChain = matched ? Math.min(9, chain + 1 + (rng() < 0.22 ? 1 : 0)) : 0;
        const nextEntropy = Math.min(0.9, Math.max(0.08, entropy + (matched ? -0.06 : 0.04) + (rng() - 0.5) * 0.03));
        next.data = { movesLeft: nextMoves, chain: nextChain, entropy: nextEntropy };
        events = matched ? [{ type: "match", payload: { chain: nextChain } }] : [{ type: "no_match" }];
      } else if (action.type === "tick") {
        next.data = { ...state.data, entropy: Math.min(0.95, entropy + 0.01) };
      }

      const view: ArchetypeView = {
        title: "消除（最小节奏）",
        goal: "在有限步数内制造连锁与强反馈，同时保持“看起来随机”。",
        status: [
          "primary=交换/消除：概率触发 match；match 会累积 chain；失败会清空 chain。",
          "entropy 越低越“好消”；entropy 越高越“难消”。",
        ],
        metrics: [
          metric("movesLeft", next.data.movesLeft as number),
          metric("chain", next.data.chain as number),
          metric("entropy", next.data.entropy as number),
          metric("difficulty", next.difficulty),
        ],
        controls: [{ kind: "button", label: "交换/消除（primary）", action: { type: "primary" } }],
      };
      return { state: next, view: withCommonControls(next, view), events };
    },
  ),

  // 2) Dodge/Avoid
  def(
    "arch-dodge-avoid",
    "母型试玩：躲避（Dodge/Avoid）",
    "用“密度/速度/宽容度”演示‘差一点’的爽点（最小版）。",
    ["archetype", "dodge-avoid"],
    (input) => {
      const state = baseInit(input, 202);
      state.data = { time: 0, hp: 3, danger: 0.35, nearMiss: 0 };
      const view: ArchetypeView = {
        title: "躲避（近失）",
        goal: "制造‘差一点’的近失反馈，让紧张变成爽点。",
        status: ["primary=躲避一次；secondary=慢动作（降低 danger）。", "tick=时间推进，danger 会上升。"],
        metrics: [metric("hp", 3), metric("danger", 0.35), metric("nearMiss", 0)],
        controls: [
          { kind: "button", label: "躲避（primary）", action: { type: "primary" } },
          { kind: "button", label: "慢动作（secondary）", action: { type: "secondary" } },
        ],
      };
      return { state, view: withCommonControls(state, view) };
    },
    ({ state, action }) => {
      const rng = makeRng(state.seed + state.step * 13);
      const time = Number(state.data.time ?? 0);
      const hp = Number(state.data.hp ?? 3);
      const danger = Number(state.data.danger ?? 0.35);
      const nearMiss = Number(state.data.nearMiss ?? 0);

      const next = bumpStep(state);
      const events: Array<{ type: string; payload?: unknown }> = [];

      const difficultyMul = state.difficulty === "easy" ? 0.85 : state.difficulty === "hard" ? 1.15 : 1;

      if (action.type === "tick") {
        const nextTime = time + 1;
        const nextDanger = Math.min(0.95, danger + 0.04 * difficultyMul);
        // chance to take a hit if you don't dodge
        const hit = rng() < nextDanger * 0.22;
        const nextHp = hit ? Math.max(0, hp - 1) : hp;
        next.data = { time: nextTime, hp: nextHp, danger: nextDanger, nearMiss };
        if (hit) events.push({ type: "hit" });
      } else if (action.type === "primary") {
        const pNearMiss = Math.max(0.12, danger * 0.55);
        const gotNearMiss = rng() < pNearMiss;
        const nextNear = gotNearMiss ? nearMiss + 1 : nearMiss;
        const nextDanger = Math.max(0.12, danger - (gotNearMiss ? 0.06 : 0.03));
        next.data = { time, hp, danger: nextDanger, nearMiss: nextNear };
        events.push({ type: gotNearMiss ? "near_miss" : "dodge_ok" });
      } else if (action.type === "secondary") {
        next.data = { time, hp, danger: Math.max(0.08, danger - 0.12), nearMiss };
        events.push({ type: "slowmo" });
      }

      const view: ArchetypeView = {
        title: "躲避（近失）",
        goal: "制造‘差一点’的近失反馈，让紧张变成爽点。",
        status: ["tick 会让 danger 上升；danger 越高，tick 时越可能受伤。", "primary 会降低 danger，并可能触发 near-miss 反馈。"],
        metrics: [
          metric("time", next.data.time as number),
          metric("hp", next.data.hp as number),
          metric("danger", next.data.danger as number),
          metric("nearMiss", next.data.nearMiss as number),
          metric("difficulty", next.difficulty),
        ],
        controls: [
          { kind: "button", label: "躲避（primary）", action: { type: "primary" } },
          { kind: "button", label: "慢动作（secondary）", action: { type: "secondary" } },
        ],
      };
      return { state: next, view: withCommonControls(next, view), events };
    },
  ),

  // 3) Runner
  def(
    "arch-runner",
    "母型试玩：行进 / 跑酷（Runner）",
    "用“速度曲线 + 障碍密度”演示节奏（最小版）。",
    ["archetype", "runner"],
    (input) => {
      const state = baseInit(input, 303);
      state.data = { distance: 0, speed: 1.0, stamina: 1.0, mistakes: 0 };
      const view: ArchetypeView = {
        title: "Runner（节奏）",
        goal: "前期教会你活，中期让你稳，后期给你秀。",
        status: ["primary=跳跃避障；secondary=冲刺（消耗体力）。", "tick=推进距离并随机出现障碍。"],
        metrics: [
          metric("distance", 0),
          metric("speed", 1.0),
          metric("stamina", 1.0),
          metric("mistakes", 0),
        ],
        controls: [
          { kind: "button", label: "跳跃（primary）", action: { type: "primary" } },
          { kind: "button", label: "冲刺（secondary）", action: { type: "secondary" } },
        ],
      };
      return { state, view: withCommonControls(state, view) };
    },
    ({ state, action }) => {
      const rng = makeRng(state.seed + state.step * 17);
      const distance = Number(state.data.distance ?? 0);
      const speed = Number(state.data.speed ?? 1);
      const stamina = Number(state.data.stamina ?? 1);
      const mistakes = Number(state.data.mistakes ?? 0);

      const difficultyMul = state.difficulty === "easy" ? 0.9 : state.difficulty === "hard" ? 1.15 : 1;

      const next = bumpStep(state);
      const events: Array<{ type: string; payload?: unknown }> = [];

      if (action.type === "tick") {
        const obstacle = rng() < 0.22 * difficultyMul;
        const nextDistance = distance + speed * 10;
        const nextSpeed = Math.min(3.5, speed + 0.06 * difficultyMul);
        const nextStamina = Math.min(1, stamina + 0.05);
        const hit = obstacle && rng() < 0.28;
        next.data = {
          distance: nextDistance,
          speed: nextSpeed,
          stamina: nextStamina,
          mistakes: hit ? mistakes + 1 : mistakes,
        };
        events.push({ type: obstacle ? "obstacle" : "clear" });
        if (hit) events.push({ type: "hit" });
      } else if (action.type === "primary") {
        next.data = { distance, speed: Math.max(0.9, speed - 0.02), stamina, mistakes };
        events.push({ type: "jump" });
      } else if (action.type === "secondary") {
        const can = stamina >= 0.25;
        next.data = {
          distance,
          speed: can ? Math.min(4.5, speed + 0.55) : speed,
          stamina: can ? stamina - 0.25 : stamina,
          mistakes: can ? mistakes : mistakes + 1,
        };
        events.push({ type: can ? "dash" : "no_stamina" });
      }

      const view: ArchetypeView = {
        title: "Runner（节奏）",
        goal: "速度上升制造紧张，体力与失误让玩家做选择。",
        status: ["tick 推进：距离随 speed 增长；障碍概率随难度上升。", "冲刺需要体力；体力随 tick 回充。"],
        metrics: [
          metric("distance", next.data.distance as number),
          metric("speed", next.data.speed as number),
          metric("stamina", next.data.stamina as number),
          metric("mistakes", next.data.mistakes as number),
          metric("difficulty", next.difficulty),
        ],
        controls: [
          { kind: "button", label: "跳跃（primary）", action: { type: "primary" } },
          { kind: "button", label: "冲刺（secondary）", action: { type: "secondary" } },
        ],
      };
      return { state: next, view: withCommonControls(next, view), events };
    },
  ),

  // 4) Shoot/Aim
  def(
    "arch-shoot-aim",
    "母型试玩：射击（Shoot/Aim）",
    "用“命中/弹药/换弹”演示节奏与决策（最小版）。",
    ["archetype", "shoot-aim"],
    (input) => {
      const state = baseInit(input, 404);
      state.data = { ammo: 6, targets: 5, score: 0, accuracy: 0.65 };
      const view: ArchetypeView = {
        title: "射击（节奏）",
        goal: "让玩家在‘开枪/换弹/节拍窗口’之间做决策。",
        status: ["primary=射击；secondary=换弹。", "tick=刷新目标（但也会提高压力）。"],
        metrics: [metric("ammo", 6), metric("targets", 5), metric("score", 0), metric("accuracy", 0.65)],
        controls: [
          { kind: "button", label: "射击（primary）", action: { type: "primary" } },
          { kind: "button", label: "换弹（secondary）", action: { type: "secondary" } },
        ],
      };
      return { state, view: withCommonControls(state, view) };
    },
    ({ state, action }) => {
      const rng = makeRng(state.seed + state.step * 19);
      const ammo = Number(state.data.ammo ?? 0);
      const targets = Number(state.data.targets ?? 0);
      const score = Number(state.data.score ?? 0);
      const accuracy = Number(state.data.accuracy ?? 0.6);

      const difficultyMul = state.difficulty === "easy" ? 0.9 : state.difficulty === "hard" ? 1.1 : 1;
      const next = bumpStep(state);
      const events: Array<{ type: string; payload?: unknown }> = [];

      if (action.type === "primary") {
        if (ammo <= 0) {
          next.data = { ammo, targets, score, accuracy: Math.max(0.4, accuracy - 0.02) };
          events.push({ type: "dry_fire" });
        } else {
          const hit = rng() < accuracy;
          next.data = {
            ammo: ammo - 1,
            targets: Math.max(0, targets - (hit ? 1 : 0)),
            score: score + (hit ? 100 : 0),
            accuracy: Math.min(0.92, Math.max(0.35, accuracy + (hit ? 0.01 : -0.015))),
          };
          events.push({ type: hit ? "hit" : "miss" });
        }
      } else if (action.type === "secondary") {
        next.data = { ammo: 6, targets, score, accuracy };
        events.push({ type: "reload" });
      } else if (action.type === "tick") {
        const spawn = Math.max(0, Math.round((1 + rng() * 2) * difficultyMul));
        next.data = { ammo, targets: Math.min(12, targets + spawn), score, accuracy: Math.max(0.45, accuracy - 0.01) };
        events.push({ type: "spawn", payload: { spawn } });
      }

      const view: ArchetypeView = {
        title: "射击（节奏）",
        goal: "命中产生爽感；换弹制造节拍窗口；目标刷新制造压力。",
        status: ["没子弹射击会降低 accuracy（惩罚‘乱点’）。", "tick 会刷新 targets，但会轻微降低 accuracy（压力）。"],
        metrics: [
          metric("ammo", next.data.ammo as number),
          metric("targets", next.data.targets as number),
          metric("score", next.data.score as number),
          metric("accuracy", next.data.accuracy as number),
          metric("difficulty", next.difficulty),
        ],
        controls: [
          { kind: "button", label: "射击（primary）", action: { type: "primary" } },
          { kind: "button", label: "换弹（secondary）", action: { type: "secondary" } },
        ],
      };
      return { state: next, view: withCommonControls(next, view), events };
    },
  ),

  // 5) Combat
  def(
    "arch-combat",
    "母型试玩：战斗对抗（Combat）",
    "用“攻/防/硬直/资源”演示可解释的对抗（最小版）。",
    ["archetype", "combat"],
    (input) => {
      const state = baseInit(input, 505);
      state.data = { hp: 10, stamina: 5, enemyHp: 12, guard: 0 };
      const view: ArchetypeView = {
        title: "战斗（攻防节奏）",
        goal: "让玩家在‘输出’与‘生存’之间切换，并能解释为什么输。",
        status: ["primary=攻击；secondary=格挡（提高 guard）。", "tick=敌人行动（可能攻击）。"],
        metrics: [metric("hp", 10), metric("stamina", 5), metric("enemyHp", 12), metric("guard", 0)],
        controls: [
          { kind: "button", label: "攻击（primary）", action: { type: "primary" } },
          { kind: "button", label: "格挡（secondary）", action: { type: "secondary" } },
        ],
      };
      return { state, view: withCommonControls(state, view) };
    },
    ({ state, action }) => {
      const rng = makeRng(state.seed + state.step * 23);
      const hp = Number(state.data.hp ?? 0);
      const stamina = Number(state.data.stamina ?? 0);
      const enemyHp = Number(state.data.enemyHp ?? 0);
      const guard = Number(state.data.guard ?? 0);

      const difficultyMul = state.difficulty === "easy" ? 0.9 : state.difficulty === "hard" ? 1.15 : 1;
      const next = bumpStep(state);
      const events: Array<{ type: string; payload?: unknown }> = [];

      if (action.type === "primary") {
        const cost = 1;
        if (stamina < cost) {
          next.data = { hp, stamina, enemyHp, guard };
          events.push({ type: "tired" });
        } else {
          const dmg = 2 + (rng() < 0.2 ? 2 : 0);
          next.data = {
            hp,
            stamina: stamina - cost,
            enemyHp: Math.max(0, enemyHp - dmg),
            guard: Math.max(0, guard - 1),
          };
          events.push({ type: "attack", payload: { dmg } });
        }
      } else if (action.type === "secondary") {
        next.data = { hp, stamina: Math.min(6, stamina + 0.5), enemyHp, guard: Math.min(3, guard + 1) };
        events.push({ type: "block" });
      } else if (action.type === "tick") {
        const enemyAtk = rng() < 0.55 * difficultyMul;
        const rawDmg = enemyAtk ? 2 + (rng() < 0.25 ? 2 : 0) : 0;
        const mitigated = Math.max(0, rawDmg - guard);
        next.data = {
          hp: Math.max(0, hp - mitigated),
          stamina: Math.min(6, stamina + 1),
          enemyHp,
          guard: Math.max(0, guard - 1),
        };
        events.push({ type: enemyAtk ? "enemy_attack" : "enemy_wait", payload: { rawDmg, mitigated } });
      }

      const view: ArchetypeView = {
        title: "战斗（攻防节奏）",
        goal: "攻防切换要可解释：格挡减少伤害，体力限制连打。",
        status: ["tick 敌人可能攻击；guard 会减免部分伤害。", "攻击消耗 stamina；tick 会回复 stamina。"],
        metrics: [
          metric("hp", next.data.hp as number),
          metric("stamina", next.data.stamina as number),
          metric("enemyHp", next.data.enemyHp as number),
          metric("guard", next.data.guard as number),
          metric("difficulty", next.difficulty),
        ],
        controls: [
          { kind: "button", label: "攻击（primary）", action: { type: "primary" } },
          { kind: "button", label: "格挡（secondary）", action: { type: "secondary" } },
        ],
      };
      return { state: next, view: withCommonControls(next, view), events };
    },
  ),

  // 6) Placement / Build
  def(
    "arch-placement",
    "母型试玩：放置 / 建造（Placement）",
    "用“格子容量 + 组合加成”演示布局决策（最小版）。",
    ["archetype", "placement"],
    (input) => {
      const state = baseInit(input, 606);
      state.data = { slots: 9, placed: 0, synergy: 0, income: 1 };
      const view: ArchetypeView = {
        title: "放置/建造（布局）",
        goal: "有限空间内做更优布局：扩容、协同、产出节拍。",
        status: ["primary=放置一个单位；secondary=扩容（消耗协同）。", "tick=结算产出（income）。"],
        metrics: [metric("slots", 9), metric("placed", 0), metric("synergy", 0), metric("income", 1)],
        controls: [
          { kind: "button", label: "放置（primary）", action: { type: "primary" } },
          { kind: "button", label: "扩容（secondary）", action: { type: "secondary" } },
        ],
      };
      return { state, view: withCommonControls(state, view) };
    },
    ({ state, action }) => {
      const rng = makeRng(state.seed + state.step * 29);
      const slots = Number(state.data.slots ?? 0);
      const placed = Number(state.data.placed ?? 0);
      const synergy = Number(state.data.synergy ?? 0);
      const income = Number(state.data.income ?? 1);
      const difficultyMul = state.difficulty === "easy" ? 1.1 : state.difficulty === "hard" ? 0.9 : 1;

      const next = bumpStep(state);
      const events: Array<{ type: string; payload?: unknown }> = [];

      if (action.type === "primary") {
        if (placed >= slots) {
          next.data = { slots, placed, synergy, income };
          events.push({ type: "no_space" });
        } else {
          const gained = rng() < 0.45 ? 1 : 0;
          const nextPlaced = placed + 1;
          const nextSynergy = synergy + gained;
          const nextIncome = Math.min(20, income + 0.2 * difficultyMul + gained * 0.5);
          next.data = { slots, placed: nextPlaced, synergy: nextSynergy, income: nextIncome };
          events.push({ type: "place", payload: { synergyGain: gained } });
        }
      } else if (action.type === "secondary") {
        const cost = 3;
        if (synergy < cost) {
          next.data = { slots, placed, synergy, income };
          events.push({ type: "need_synergy" });
        } else {
          next.data = { slots: slots + 1, placed, synergy: synergy - cost, income };
          events.push({ type: "expand" });
        }
      } else if (action.type === "tick") {
        const money = Math.round(income * 10);
        next.data = { slots, placed, synergy, income };
        events.push({ type: "income", payload: { money } });
      }

      const view: ArchetypeView = {
        title: "放置/建造（布局）",
        goal: "空间是硬约束；协同是软目标；产出是节拍。",
        status: ["放置可能获得 synergy；synergy 可用于扩容。", "tick 结算产出（示意）。"],
        metrics: [
          metric("slots", next.data.slots as number),
          metric("placed", next.data.placed as number),
          metric("synergy", next.data.synergy as number),
          metric("income", next.data.income as number),
          metric("difficulty", next.difficulty),
        ],
        controls: [
          { kind: "button", label: "放置（primary）", action: { type: "primary" } },
          { kind: "button", label: "扩容（secondary）", action: { type: "secondary" } },
        ],
      };
      return { state: next, view: withCommonControls(next, view), events };
    },
  ),

  // 7) Choice / Strategy
  def(
    "arch-choice-strategy",
    "母型试玩：策略决策（Choice/Strategy）",
    "用“三选一 + 权重”演示决策密度与新手保护（最小版）。",
    ["archetype", "choice-strategy"],
    (input) => {
      const state = baseInit(input, 707);
      state.data = { turn: 1, power: 1, risk: 0, offered: ["加钱", "加伤", "回血"] };
      const view: ArchetypeView = {
        title: "策略决策（三选一）",
        goal: "把随机变成选择：让玩家觉得‘输赢是我选的’。",
        status: ["choice 选择一项奖励；tick 进入下一回合。", "secondary=刷新（增加 risk）。"],
        metrics: [metric("turn", 1), metric("power", 1), metric("risk", 0)],
        controls: [
          { kind: "choices", label: "本回合选择", options: state.data.offered as string[] },
          { kind: "button", label: "刷新（secondary）", action: { type: "secondary" } },
        ],
      };
      return { state, view: withCommonControls(state, view) };
    },
    ({ state, action }) => {
      const rng = makeRng(state.seed + state.step * 31);
      const turn = Number(state.data.turn ?? 1);
      const power = Number(state.data.power ?? 1);
      const risk = Number(state.data.risk ?? 0);
      const offered = (state.data.offered as string[] | undefined) ?? ["加钱", "加伤", "回血"];
      const difficultyMul = state.difficulty === "easy" ? 0.9 : state.difficulty === "hard" ? 1.2 : 1;

      const next = bumpStep(state);
      const events: Array<{ type: string; payload?: unknown }> = [];

      const makeOffer = (t: number) => {
        const pool = ["加钱", "加伤", "回血", "减风险", "抽牌", "加速"];
        const o = [] as string[];
        for (let i = 0; i < 3; i++) o.push(pool[Math.floor(rng() * pool.length)]!);
        return o.map((x) => `${x}（T${t}）`);
      };

      if (action.type === "choice") {
        const idx = Math.max(0, Math.min(2, action.option));
        const picked = offered[idx] ?? offered[0]!;
        const nextPower = power + (picked.includes("加伤") ? 1.2 : 0.4);
        const nextRisk = Math.max(0, risk + (picked.includes("加钱") ? 0.2 : -0.05));
        next.data = { turn, power: nextPower, risk: nextRisk, offered };
        events.push({ type: "picked", payload: { picked } });
      } else if (action.type === "secondary") {
        const nextRisk = risk + 0.35 * difficultyMul;
        next.data = { turn, power, risk: nextRisk, offered: makeOffer(turn) };
        events.push({ type: "reroll" });
      } else if (action.type === "tick") {
        next.data = { turn: turn + 1, power, risk: Math.min(5, Math.max(0, risk - 0.1)), offered: makeOffer(turn + 1) };
        events.push({ type: "next_turn" });
      }

      const view: ArchetypeView = {
        title: "策略决策（三选一）",
        goal: "随机事件=情绪管理；三选一=把随机变成选择。",
        status: ["choice 选择后立刻得到收益；secondary 刷新会提高 risk。", "tick 进入下一回合并生成新 offer。"],
        metrics: [
          metric("turn", next.data.turn as number),
          metric("power", next.data.power as number),
          metric("risk", next.data.risk as number),
          metric("difficulty", next.difficulty),
        ],
        controls: [
          { kind: "choices", label: "本回合选择", options: (next.data.offered as string[]) ?? [] },
          { kind: "button", label: "刷新（secondary）", action: { type: "secondary" } },
        ],
      };
      return { state: next, view: withCommonControls(next, view), events };
    },
  ),

  // 8) Physics
  def(
    "arch-physics",
    "母型试玩：物理（Physics）",
    "用“稳定判定 + 性能预算”演示物理交互（最小版）。",
    ["archetype", "physics"],
    (input) => {
      const state = baseInit(input, 808);
      state.data = { pieces: 1, budget: 10, wobble: 0 };
      const view: ArchetypeView = {
        title: "物理（切割/碎裂预算）",
        goal: "判定稳定优先；碎片数量与点数必须可控。",
        status: ["primary=切一次（增加 pieces，消耗 budget）。", "secondary=清理小碎片（回收 budget）。"],
        metrics: [metric("pieces", 1), metric("budget", 10), metric("wobble", 0)],
        controls: [
          { kind: "button", label: "切割（primary）", action: { type: "primary" } },
          { kind: "button", label: "清理（secondary）", action: { type: "secondary" } },
        ],
      };
      return { state, view: withCommonControls(state, view) };
    },
    ({ state, action }) => {
      const rng = makeRng(state.seed + state.step * 37);
      const pieces = Number(state.data.pieces ?? 1);
      const budget = Number(state.data.budget ?? 10);
      const wobble = Number(state.data.wobble ?? 0);
      const difficultyMul = state.difficulty === "easy" ? 1.15 : state.difficulty === "hard" ? 0.9 : 1;

      const next = bumpStep(state);
      const events: Array<{ type: string; payload?: unknown }> = [];

      if (action.type === "primary") {
        if (budget <= 0) {
          next.data = { pieces, budget, wobble: wobble + 1 };
          events.push({ type: "budget_exhausted" });
        } else {
          const add = 2 + (rng() < 0.25 ? 2 : 0);
          next.data = {
            pieces: Math.min(30, pieces + add),
            budget: Math.max(0, budget - 2),
            wobble: Math.max(0, wobble - 1),
          };
          events.push({ type: "cut", payload: { add } });
        }
      } else if (action.type === "secondary") {
        const cleaned = Math.min(pieces - 1, Math.round((2 + rng() * 3) * difficultyMul));
        next.data = {
          pieces: Math.max(1, pieces - cleaned),
          budget: Math.min(10, budget + 2),
          wobble: Math.max(0, wobble - 1),
        };
        events.push({ type: "cleanup", payload: { cleaned } });
      } else if (action.type === "tick") {
        const jitter = pieces > 18 ? 1 : 0;
        next.data = { pieces, budget, wobble: wobble + jitter };
        if (jitter) events.push({ type: "unstable" });
      }

      const view: ArchetypeView = {
        title: "物理（切割/碎裂预算）",
        goal: "碎片越多越爽，但预算越容易爆；要在爽与稳定之间取舍。",
        status: ["budget 是性能预算；pieces 太多会增加 wobble（不稳定）。", "清理小碎片能回收预算与稳定性。"],
        metrics: [
          metric("pieces", next.data.pieces as number),
          metric("budget", next.data.budget as number),
          metric("wobble", next.data.wobble as number),
          metric("difficulty", next.difficulty),
        ],
        controls: [
          { kind: "button", label: "切割（primary）", action: { type: "primary" } },
          { kind: "button", label: "清理（secondary）", action: { type: "secondary" } },
        ],
      };
      return { state: next, view: withCommonControls(next, view), events };
    },
  ),

  // 9) Puzzle
  def(
    "arch-puzzle",
    "母型试玩：解谜（Puzzle）",
    "用“提示强度 + 试错成本”演示解谜节奏（最小版）。",
    ["archetype", "puzzle"],
    (input) => {
      const state = baseInit(input, 909);
      state.data = { progress: 0, hints: 2, mistakes: 0, difficultyScore: 1 };
      const view: ArchetypeView = {
        title: "解谜（提示与试错）",
        goal: "让玩家在可解释的试错中获得‘啊哈’瞬间。",
        status: ["primary=尝试一步；secondary=用提示（减少 mistakes 风险）。", "tick=进入下一题（提高难度）。"],
        metrics: [metric("progress", 0), metric("hints", 2), metric("mistakes", 0), metric("difficultyScore", 1)],
        controls: [
          { kind: "button", label: "尝试（primary）", action: { type: "primary" } },
          { kind: "button", label: "提示（secondary）", action: { type: "secondary" } },
        ],
      };
      return { state, view: withCommonControls(state, view) };
    },
    ({ state, action }) => {
      const rng = makeRng(state.seed + state.step * 41);
      const progress = Number(state.data.progress ?? 0);
      const hints = Number(state.data.hints ?? 0);
      const mistakes = Number(state.data.mistakes ?? 0);
      const difficultyScore = Number(state.data.difficultyScore ?? 1);
      const difficultyMul = state.difficulty === "easy" ? 0.85 : state.difficulty === "hard" ? 1.2 : 1;

      const next = bumpStep(state);
      const events: Array<{ type: string; payload?: unknown }> = [];

      if (action.type === "primary") {
        const pOk = Math.max(0.2, 0.62 - difficultyScore * 0.12) / difficultyMul;
        const ok = rng() < pOk;
        next.data = {
          progress: Math.min(5, progress + (ok ? 1 : 0)),
          hints,
          mistakes: mistakes + (ok ? 0 : 1),
          difficultyScore,
        };
        events.push({ type: ok ? "solve_step" : "wrong" });
      } else if (action.type === "secondary") {
        if (hints <= 0) {
          next.data = { progress, hints, mistakes: mistakes + 1, difficultyScore };
          events.push({ type: "no_hint" });
        } else {
          next.data = { progress: Math.min(5, progress + 1), hints: hints - 1, mistakes, difficultyScore };
          events.push({ type: "hint" });
        }
      } else if (action.type === "tick") {
        next.data = { progress: 0, hints: Math.min(3, hints + 1), mistakes, difficultyScore: difficultyScore + 1 };
        events.push({ type: "next_puzzle" });
      }

      const view: ArchetypeView = {
        title: "解谜（提示与试错）",
        goal: "提示是节奏工具：让玩家少卡死，但仍保留成就感。",
        status: ["primary 成功概率随难度下降；错误会累积 mistakes。", "secondary 用提示直接推进一步，但提示有限。"],
        metrics: [
          metric("progress", next.data.progress as number),
          metric("hints", next.data.hints as number),
          metric("mistakes", next.data.mistakes as number),
          metric("difficultyScore", next.data.difficultyScore as number),
          metric("difficulty", next.difficulty),
        ],
        controls: [
          { kind: "button", label: "尝试（primary）", action: { type: "primary" } },
          { kind: "button", label: "提示（secondary）", action: { type: "secondary" } },
        ],
      };
      return { state: next, view: withCommonControls(next, view), events };
    },
  ),

  // 10) Progression
  def(
    "arch-progression",
    "母型试玩：成长 / 数值（Progression）",
    "用“失败即成长 + 反刷”演示局外成长节奏（最小版）。",
    ["archetype", "progression"],
    (input) => {
      const state = baseInit(input, 1010);
      state.data = { runDepth: 0, metaPower: 1, currency: 0, badStreak: 0 };
      const view: ArchetypeView = {
        title: "成长（失败即成长）",
        goal: "每局都有进度，但‘故意失败’不该最划算。",
        status: ["primary=推进一层（可能失败）；secondary=局外升级（花 currency）。", "tick=结算（失败也给少量）。"],
        metrics: [metric("runDepth", 0), metric("metaPower", 1), metric("currency", 0), metric("badStreak", 0)],
        controls: [
          { kind: "button", label: "推进（primary）", action: { type: "primary" } },
          { kind: "button", label: "升级（secondary）", action: { type: "secondary" } },
        ],
      };
      return { state, view: withCommonControls(state, view) };
    },
    ({ state, action }) => {
      const rng = makeRng(state.seed + state.step * 43);
      const runDepth = Number(state.data.runDepth ?? 0);
      const metaPower = Number(state.data.metaPower ?? 1);
      const currency = Number(state.data.currency ?? 0);
      const badStreak = Number(state.data.badStreak ?? 0);

      const difficultyMul = state.difficulty === "easy" ? 0.9 : state.difficulty === "hard" ? 1.2 : 1;

      const next = bumpStep(state);
      const events: Array<{ type: string; payload?: unknown }> = [];

      if (action.type === "primary") {
        const pFail = Math.max(0.12, 0.35 + runDepth * 0.05) * difficultyMul / Math.max(1, metaPower);
        const failed = rng() < pFail;
        next.data = {
          runDepth: failed ? 0 : runDepth + 1,
          metaPower,
          currency: currency + (failed ? 1 : 2),
          badStreak: failed ? badStreak + 1 : 0,
        };
        events.push({ type: failed ? "fail" : "advance" });
      } else if (action.type === "secondary") {
        const cost = 10;
        if (currency < cost) {
          next.data = { runDepth, metaPower, currency, badStreak };
          events.push({ type: "need_currency" });
        } else {
          next.data = { runDepth, metaPower: metaPower + 0.25, currency: currency - cost, badStreak };
          events.push({ type: "upgrade" });
        }
      } else if (action.type === "tick") {
        // pity against long bad streak: grant a small bonus
        const pity = badStreak >= 3 ? 2 : 0;
        next.data = { runDepth, metaPower, currency: currency + pity, badStreak };
        if (pity) events.push({ type: "pity", payload: { pity } });
      }

      const view: ArchetypeView = {
        title: "成长（失败即成长）",
        goal: "失败给希望；但通过 pity/里程碑防止刷失败最优。",
        status: ["推进越深失败概率越高；metaPower 会降低失败概率。", "badStreak 过高会触发 pity（示意）。"],
        metrics: [
          metric("runDepth", next.data.runDepth as number),
          metric("metaPower", next.data.metaPower as number),
          metric("currency", next.data.currency as number),
          metric("badStreak", next.data.badStreak as number),
          metric("difficulty", next.difficulty),
        ],
        controls: [
          { kind: "button", label: "推进（primary）", action: { type: "primary" } },
          { kind: "button", label: "升级（secondary）", action: { type: "secondary" } },
        ],
      };
      return { state: next, view: withCommonControls(next, view), events };
    },
  ),

  // 11) Simulation
  def(
    "arch-simulation",
    "母型试玩：模拟（Simulation）",
    "用“系统变量 + 反馈回路”演示模拟的可解释性（最小版）。",
    ["archetype", "simulation"],
    (input) => {
      const state = baseInit(input, 1111);
      state.data = { day: 1, pop: 100, money: 50, tax: 0.2, happiness: 0.7 };
      const view: ArchetypeView = {
        title: "模拟（变量与回路）",
        goal: "让玩家看到因果：变量变化→系统反馈→下一步选择。",
        status: ["tick=过一天；primary=上调税；secondary=下调税。", "税影响 money 与 happiness，happiness 影响 pop。"],
        metrics: [metric("day", 1), metric("pop", 100), metric("money", 50), metric("tax", 0.2), metric("happiness", 0.7)],
        controls: [
          { kind: "button", label: "加税（primary）", action: { type: "primary" } },
          { kind: "button", label: "减税（secondary）", action: { type: "secondary" } },
          { kind: "slider", label: "税率", key: "tax", min: 0, max: 0.6, step: 0.05, value: 0.2 },
        ],
      };
      return { state, view: withCommonControls(state, view) };
    },
    ({ state, action }) => {
      const rng = makeRng(state.seed + state.step * 47);
      const day = Number(state.data.day ?? 1);
      const pop = Number(state.data.pop ?? 100);
      const money = Number(state.data.money ?? 50);
      const tax = Number(state.data.tax ?? 0.2);
      const happiness = Number(state.data.happiness ?? 0.7);

      const difficultyMul = state.difficulty === "easy" ? 1.05 : state.difficulty === "hard" ? 0.95 : 1;

      const next = bumpStep(state);
      const events: Array<{ type: string; payload?: unknown }> = [];

      let nextTax = tax;
      if (action.type === "primary") nextTax = Math.min(0.6, tax + 0.05);
      if (action.type === "secondary") nextTax = Math.max(0, tax - 0.05);
      if (action.type === "set" && action.key === "tax") nextTax = Math.max(0, Math.min(0.6, action.value));

      if (action.type === "tick") {
        const income = pop * nextTax * 0.1;
        const mood = Math.max(0, Math.min(1, happiness - nextTax * 0.12 + (rng() - 0.5) * 0.03));
        const growth = (mood - 0.5) * 6 * difficultyMul;
        next.data = {
          day: day + 1,
          pop: Math.max(0, Math.round(pop + growth)),
          money: Math.round(money + income),
          tax: nextTax,
          happiness: mood,
        };
        events.push({ type: "day_passed", payload: { income: Math.round(income) } });
      } else {
        next.data = { day, pop, money, tax: nextTax, happiness };
        if (action.type === "primary" || action.type === "secondary" || action.type === "set") {
          events.push({ type: "policy" });
        }
      }

      const view: ArchetypeView = {
        title: "模拟（变量与回路）",
        goal: "税上升：钱更多但幸福下降；幸福决定增长。",
        status: ["tick 过一天并结算；税率越高 income 越高但 happiness 越低。", "这是最小的可解释回路示意。"],
        metrics: [
          metric("day", next.data.day as number),
          metric("pop", next.data.pop as number),
          metric("money", next.data.money as number),
          metric("tax", next.data.tax as number),
          metric("happiness", next.data.happiness as number),
          metric("difficulty", next.difficulty),
        ],
        controls: [
          { kind: "button", label: "加税（primary）", action: { type: "primary" } },
          { kind: "button", label: "减税（secondary）", action: { type: "secondary" } },
          {
            kind: "slider",
            label: "税率",
            key: "tax",
            min: 0,
            max: 0.6,
            step: 0.05,
            value: Number((next.data.tax as number) ?? 0.2),
          },
        ],
      };
      return { state: next, view: withCommonControls(next, view), events };
    },
  ),

  // 12) Timing / Reaction
  def(
    "arch-timing",
    "母型试玩：时机 / 反应（Timing）",
    "用“判定窗口 + 宽容度”演示反应爽点（最小版）。",
    ["archetype", "timing"],
    (input) => {
      const state = baseInit(input, 1212);
      state.data = { beat: 0, window: 0.25, score: 0, streak: 0 };
      const view: ArchetypeView = {
        title: "时机（判定窗口）",
        goal: "让玩家靠练习变强：窗口可调但要可解释。",
        status: ["tick=节拍推进；primary=点击判定（命中窗口得分）。", "secondary=扩大窗口（但降低奖励）。"],
        metrics: [metric("beat", 0), metric("window", 0.25), metric("score", 0), metric("streak", 0)],
        controls: [
          { kind: "button", label: "点击判定（primary）", action: { type: "primary" } },
          { kind: "button", label: "放宽窗口（secondary）", action: { type: "secondary" } },
        ],
      };
      return { state, view: withCommonControls(state, view) };
    },
    ({ state, action }) => {
      const rng = makeRng(state.seed + state.step * 53);
      const beat = Number(state.data.beat ?? 0);
      const window = Number(state.data.window ?? 0.25);
      const score = Number(state.data.score ?? 0);
      const streak = Number(state.data.streak ?? 0);

      const difficultyMul = state.difficulty === "easy" ? 1.1 : state.difficulty === "hard" ? 0.9 : 1;
      const next = bumpStep(state);
      const events: Array<{ type: string; payload?: unknown }> = [];

      if (action.type === "tick") {
        next.data = { beat: beat + 1, window: Math.max(0.08, Math.min(0.35, window - 0.01 * (difficultyMul - 1))), score, streak };
        events.push({ type: "beat" });
      } else if (action.type === "secondary") {
        next.data = { beat, window: Math.min(0.35, window + 0.04), score, streak };
        events.push({ type: "widen" });
      } else if (action.type === "primary") {
        // player taps at a random offset (simulated)
        const offset = Math.abs(rng() - 0.5) * 2; // 0..1
        const hit = offset <= window;
        const reward = hit ? Math.round(100 * (1 - window)) : 0;
        next.data = { beat, window, score: score + reward, streak: hit ? streak + 1 : 0 };
        events.push({ type: hit ? "hit" : "miss", payload: { offset } });
      }

      const view: ArchetypeView = {
        title: "时机（判定窗口）",
        goal: "窗口越小越爽，但要给新手宽容与成长空间。",
        status: ["primary 会按 offset 与 window 判定命中（示意）。", "secondary 放宽窗口会降低单次奖励（reward 与 window 反比）。"],
        metrics: [
          metric("beat", next.data.beat as number),
          metric("window", next.data.window as number),
          metric("score", next.data.score as number),
          metric("streak", next.data.streak as number),
          metric("difficulty", next.difficulty),
        ],
        controls: [
          { kind: "button", label: "点击判定（primary）", action: { type: "primary" } },
          { kind: "button", label: "放宽窗口（secondary）", action: { type: "secondary" } },
        ],
      };
      return { state: next, view: withCommonControls(next, view), events };
    },
  ),
] as DemoDefinition<unknown, unknown, unknown, unknown>[];

// Note: these are intentionally minimal, server-driven demos intended for P0 “可试玩/可解释”。
