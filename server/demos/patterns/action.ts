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

export const actionPatternDemo: DemoDefinition<ArchetypeInit, ArchetypeState, ArchetypeAction, ArchetypeView> = {
  id: "pattern-action",
  name: "核心原型：动作敏捷（Action / Dexterity）",
  description: "Input → Avatar → Physics → Score 的最小可玩示意：跳跃躲避障碍。",
  tags: ["pattern", "action", "dexterity"],

  initHelp: "seed 可选；difficulty: easy|normal|hard 可选。",
  initExample: { seed: 123, difficulty: "normal" },
  initSchema: archetypeInitSchema,

  actionHelp: "通用 action：reset/tick/primary/secondary。primary=跳跃躲避；secondary=加速。",
  actionExample: { type: "primary" },
  actionSchema: archetypeActionSchema,

  init: (input) => {
    const seed = toSeed(input.seed, 301);
    const difficulty = normalizeDifficulty(input.difficulty);
    const state: ArchetypeState = {
      seed,
      difficulty,
      step: 0,
      data: {
        distance: 0,
        speed: 1,
        score: 0,
        lives: 3,
        obstacleDistance: 5,
        jumping: false,
      },
    };
    const view: ArchetypeView = {
      title: "动作敏捷（跳跃躲避）",
      goal: "在合适的时机跳跃，躲避障碍，保持速度增长。",
      status: ["tick 会推进距离并随机生成障碍。", "primary=跳跃；secondary=加速（更高分但更难反应）。"],
      metrics: [
        metric("distance", 0),
        metric("speed", 1),
        metric("score", 0),
        metric("lives", 3),
      ],
      controls: [
        { kind: "button", label: "跳跃（primary）", action: { type: "primary" } },
        { kind: "button", label: "加速（secondary）", action: { type: "secondary" } },
      ],
    };
    return { state, view };
  },

  step: ({ state, action }) => {
    const rng = makeRng(state.seed + state.step * 7);
    const distance = Number(state.data.distance ?? 0);
    const speed = Number(state.data.speed ?? 1);
    const score = Number(state.data.score ?? 0);
    const lives = Number(state.data.lives ?? 3);
    const obstacleDistance = Number(state.data.obstacleDistance ?? 5);
    const jumping = Boolean(state.data.jumping ?? false);

    const difficultyMul = state.difficulty === "easy" ? 0.8 : state.difficulty === "hard" ? 1.2 : 1;
    let next = { ...state, step: state.step + 1 };
    let events: Array<{ type: string; payload?: unknown }> = [];

    if (action.type === "reset") {
      next.data = {
        distance: 0,
        speed: 1,
        score: 0,
        lives: 3,
        obstacleDistance: 5,
        jumping: false,
      };
    } else if (action.type === "tick") {
      const nextDistance = distance + speed;
      let nextObstacle = obstacleDistance - speed;
      let nextLives = lives;
      let nextScore = score;
      let nextJumping = false;

      if (nextObstacle <= 0) {
        // obstacle arrives
        if (jumping) {
          nextScore += Math.round(10 * speed);
          events.push({ type: "dodge_ok" });
        } else {
          nextLives = Math.max(0, lives - 1);
          events.push({ type: "hit" });
        }
        nextObstacle = 4 + Math.floor(rng() * 4);
      }

      next.data = {
        distance: nextDistance,
        speed: lives > 0 ? Math.min(5, speed + 0.03 * difficultyMul) : speed,
        score: nextScore,
        lives: nextLives,
        obstacleDistance: nextObstacle,
        jumping: nextJumping,
      };

      if (nextLives <= 0) {
        events.push({ type: "game_over" });
      } else {
        events.push({ type: "tick" });
      }
    } else if (action.type === "primary") {
      next.data = { ...state.data, jumping: true };
      events.push({ type: "jump" });
    } else if (action.type === "secondary") {
      next.data = { ...state.data, speed: Math.min(5, speed + 0.5) };
      events.push({ type: "speed_up" });
    }

    const finalData = next.data as Record<string, unknown>;
    const view: ArchetypeView = {
      title: "动作敏捷（跳跃躲避）",
      goal: lives > 0 ? "在合适的时机跳跃，躲避障碍，保持速度增长。" : "游戏结束，点击重开。",
      status: [
        "障碍距离归零时若未跳跃会扣生命。",
        "成功躲避得分；速度越高单次得分越多。",
      ],
      metrics: [
        metric("distance", Number(finalData.distance ?? 0)),
        metric("speed", Number(finalData.speed ?? 1)),
        metric("score", Number(finalData.score ?? 0)),
        metric("lives", Number(finalData.lives ?? 3)),
        metric("obstacle", Number(finalData.obstacleDistance ?? 5)),
      ],
      controls: [
        { kind: "button", label: "跳跃（primary）", action: { type: "primary" } },
        { kind: "button", label: "加速（secondary）", action: { type: "secondary" } },
      ],
    };

    return { state: next, view, events };
  },
};
