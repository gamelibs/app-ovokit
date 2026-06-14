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

export const strategyPatternDemo: DemoDefinition<ArchetypeInit, ArchetypeState, ArchetypeAction, ArchetypeView> = {
  id: "pattern-strategy",
  name: "核心原型：数值策略（Strategy / RPG）",
  description: "Unit → Stats → Combat → Reward 的最小可玩示意：配置单位属性，自动回合制战斗。",
  tags: ["pattern", "strategy", "rpg"],

  initHelp: "seed 可选；difficulty: easy|normal|hard 可选。",
  initExample: { seed: 123, difficulty: "normal" },
  initSchema: archetypeInitSchema,

  actionHelp: "通用 action：reset/tick/primary/secondary。primary=攻击敌人；secondary=治疗自己。tick=敌人攻击并进入下一回合。",
  actionExample: { type: "primary" },
  actionSchema: archetypeActionSchema,

  init: (input) => {
    const seed = toSeed(input.seed, 305);
    const difficulty = normalizeDifficulty(input.difficulty);
    const state: ArchetypeState = {
      seed,
      difficulty,
      step: 0,
      data: {
        round: 1,
        playerHp: 20,
        playerAtk: 5,
        enemyHp: 15,
        enemyAtk: 3,
        reward: 0,
      },
    };
    const view: ArchetypeView = {
      title: "数值策略（回合战斗）",
      goal: "合理分配攻击与治疗，击败敌人获得奖励。",
      status: [
        "primary=攻击敌人（造成伤害）。",
        "secondary=治疗自己（恢复生命）。",
        "tick=敌人攻击并进入下一回合。",
      ],
      metrics: [
        metric("round", 1),
        metric("playerHp", 20),
        metric("enemyHp", 15),
        metric("reward", 0),
      ],
      controls: [
        { kind: "button", label: "攻击（primary）", action: { type: "primary" } },
        { kind: "button", label: "治疗（secondary）", action: { type: "secondary" } },
      ],
    };
    return { state, view };
  },

  step: ({ state, action }) => {
    const rng = makeRng(state.seed + state.step * 17);
    const difficultyMul = state.difficulty === "easy" ? 0.8 : state.difficulty === "hard" ? 1.3 : 1;

    let round = Number(state.data.round ?? 1);
    let playerHp = Number(state.data.playerHp ?? 20);
    let playerAtk = Number(state.data.playerAtk ?? 5);
    let enemyHp = Number(state.data.enemyHp ?? 15);
    let enemyAtk = Number(state.data.enemyAtk ?? 3);
    let reward = Number(state.data.reward ?? 0);
    let events: Array<{ type: string; payload?: unknown }> = [];

    if (action.type === "reset") {
      round = 1;
      playerHp = 20;
      playerAtk = 5;
      enemyHp = 15;
      enemyAtk = 3;
      reward = 0;
      events.push({ type: "reset" });
    } else if (action.type === "tick") {
      if (enemyHp > 0) {
        const dmg = Math.max(1, Math.round(enemyAtk * difficultyMul));
        playerHp = Math.max(0, playerHp - dmg);
        events.push({ type: "enemy_attack", payload: { dmg } });
      }
      if (playerHp > 0 && enemyHp > 0) {
        round += 1;
        // enemy scales slightly each round
        enemyAtk += 0.5;
      }
    } else if (action.type === "primary") {
      if (enemyHp > 0) {
        const crit = rng() < 0.2 ? 1.5 : 1;
        const dmg = Math.max(1, Math.round(playerAtk * crit));
        enemyHp = Math.max(0, enemyHp - dmg);
        events.push({ type: "attack", payload: { dmg, crit: crit > 1 } });
        if (enemyHp <= 0) {
          const winReward = Math.round(10 * round * difficultyMul);
          reward += winReward;
          events.push({ type: "win", payload: { reward: winReward } });
        }
      } else {
        events.push({ type: "no_enemy" });
      }
    } else if (action.type === "secondary") {
      const heal = Math.round(playerAtk * 1.5);
      playerHp = Math.min(30, playerHp + heal);
      events.push({ type: "heal", payload: { heal } });
    }

    const gameOver = playerHp <= 0;
    if (gameOver) events.push({ type: "game_over" });

    const next: ArchetypeState = {
      ...state,
      step: state.step + 1,
      data: { round, playerHp, playerAtk, enemyHp, enemyAtk, reward },
    };

    const view: ArchetypeView = {
      title: "数值策略（回合战斗）",
      goal: gameOver
        ? "战斗失败，点击重开。"
        : enemyHp <= 0
          ? `本回合获胜！获得累计奖励 ${reward}。`
          : "合理分配攻击与治疗，击败敌人获得奖励。",
      status: [
        "攻击有 20% 概率暴击；治疗量与攻击力挂钩。",
        "每回合敌人攻击力会小幅增长。",
      ],
      metrics: [
        metric("round", round),
        metric("playerHp", playerHp),
        metric("enemyHp", enemyHp),
        metric("playerAtk", playerAtk),
        metric("enemyAtk", Math.round(enemyAtk * 10) / 10),
        metric("reward", reward),
      ],
      controls: [
        { kind: "button", label: "攻击（primary）", action: { type: "primary" } },
        { kind: "button", label: "治疗（secondary）", action: { type: "secondary" } },
      ],
    };

    return { state: next, view, events };
  },
};
