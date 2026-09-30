// modules/penalty/physics-engine/logic.ts
var logic_default = {
  name: "physics-engine",
  install(ctx) {
    ctx.logger.info("[physics-engine] install");
    ctx.system["physics-engine"] = createAPI(ctx);
  },
  init(ctx) {
    ctx.logger.info("[physics-engine] init");
  },
  start(ctx) {
    ctx.logger.info("[physics-engine] start");
  },
  update(ctx, _dt) {
  },
  stop(ctx) {
    ctx.logger.info("[physics-engine] stop");
  },
  destroy(ctx) {
    delete ctx.system["physics-engine"];
  }
};
function createAPI(ctx) {
  let ballPosition = { x: 0, y: 0, z: 0 };
  let ballVelocity = { x: 0, y: 0, z: 0 };
  let isSimulating = false;
  const GOAL_WIDTH = 7.32;
  const GOAL_HEIGHT = 2.44;
  const GOAL_Z = 11;
  const BALL_RADIUS = 0.11;
  const GRAVITY = 9.8;
  const events = () => ctx.system.events;
  function resetBall() {
    ballPosition = { x: 0, y: 0, z: 0 };
    ballVelocity = { x: 0, y: 0, z: 0 };
    isSimulating = false;
  }
  function calculateInitialVelocity(angle, power) {
    const speed = 15 + power / 100 * 20;
    const angleRad = angle * Math.PI / 180;
    const vx = Math.sin(angleRad) * speed * 0.3;
    const vy = speed * 0.25 + power / 100 * 5;
    const vz = Math.cos(angleRad) * speed;
    return { x: vx, y: vy, z: vz };
  }
  function checkGoalCollision(pos) {
    if (pos.z >= GOAL_Z - BALL_RADIUS) {
      const halfWidth = GOAL_WIDTH / 2;
      const inWidth = pos.x >= -halfWidth && pos.x <= halfWidth;
      const inHeight = pos.y >= 0 && pos.y <= GOAL_HEIGHT;
      if (inWidth && inHeight) {
        return "goal";
      } else {
        const nearPostX = Math.abs(pos.x) >= halfWidth - 0.15 && Math.abs(pos.x) <= halfWidth + 0.15;
        const nearPostY = pos.y >= GOAL_HEIGHT - 0.15 && pos.y <= GOAL_HEIGHT + 0.15;
        if (nearPostX || nearPostY) {
          return "miss";
        }
        return "miss";
      }
    }
    return null;
  }
  function checkGoalkeeperCollision(pos) {
    const gkPos = ctx.data.get("goalkeeperPosition");
    if (!gkPos) return false;
    const dx = pos.x - gkPos.x;
    const dy = pos.y - gkPos.y;
    const dz = pos.z - gkPos.z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    return distance < 0.5 + BALL_RADIUS;
  }
  function updatePhysics(dt) {
    ballVelocity.y -= GRAVITY * dt;
    ballPosition.x += ballVelocity.x * dt;
    ballPosition.y += ballVelocity.y * dt;
    ballPosition.z += ballVelocity.z * dt;
    if (ballPosition.y < BALL_RADIUS) {
      ballPosition.y = BALL_RADIUS;
      ballVelocity.y *= -0.6;
      ballVelocity.x *= 0.8;
      ballVelocity.z *= 0.8;
    }
    if (checkGoalkeeperCollision(ballPosition)) {
      return { pos: ballPosition, result: "save" };
    }
    const goalResult = checkGoalCollision(ballPosition);
    if (goalResult) {
      return { pos: ballPosition, result: goalResult };
    }
    if (ballPosition.y < 0 || Math.abs(ballPosition.x) > 20 || ballPosition.z > 25) {
      return { pos: ballPosition, result: "miss" };
    }
    return { pos: ballPosition, result: null };
  }
  return {
    /**
     * 重置3D球场场景
     * 在enter-gameplay和restart-game时被调用
     */
    resetScene() {
      ctx.logger.info("[physics-engine] resetScene");
      resetBall();
      ctx.data.set("shotResult", "pending");
    },
    /**
     * 通用比赛重置别名，供曲棍球等物理对战游戏复用
     */
    resetMatch() {
      ctx.logger.info("[physics-engine] resetMatch");
      this.resetScene();
    },
    /**
     * 模拟射门物理轨迹
     * 在shot.take事件触发时被调用；同步更新比分、轮次，并在 5 轮后触发 game.over
     */
    simulateShot() {
      ctx.logger.info("[physics-engine] simulateShot");
      const rawAngle = ctx.data.get("aimAngle");
      const rawPower = ctx.data.get("power");
      const angle = typeof rawAngle === "number" ? rawAngle : 0;
      const power = typeof rawPower === "number" ? rawPower : 50;
      resetBall();
      ballVelocity = calculateInitialVelocity(angle, power);
      isSimulating = true;
      ctx.logger.info(`[physics-engine] \u5C04\u95E8\u53C2\u6570: angle=${angle}, power=${power}`);
      ctx.logger.info(`[physics-engine] \u521D\u901F\u5EA6: vx=${ballVelocity.x.toFixed(2)}, vy=${ballVelocity.y.toFixed(2)}, vz=${ballVelocity.z.toFixed(2)}`);
      const result = computeShotResult(angle, power);
      ctx.data.set("shotResult", result);
      if (result === "goal") {
        const current = Number(ctx.data.get("playerScore") ?? 0);
        ctx.data.set("playerScore", current + 1);
      } else {
        const current = Number(ctx.data.get("aiScore") ?? 0);
        ctx.data.set("aiScore", current + 1);
      }
      const round = Number(ctx.data.get("round") ?? 1);
      ctx.data.set("round", round + 1);
      ctx.logger.info(`[physics-engine] \u5C04\u95E8\u7ED3\u679C: ${result}, \u6BD4\u5206 ${ctx.data.get("playerScore")}-${ctx.data.get("aiScore")}, \u8F6E\u6B21 ${ctx.data.get("round")}`);
      if (round + 1 > 5) {
        const events3 = ctx.system.events;
        events3?.emit("game.over", { winner: ctx.data.get("gameWinner") ?? "none" });
        ctx.logger.info("[physics-engine] \u6BD4\u8D5B\u7ED3\u675F\uFF0C\u89E6\u53D1 game.over");
      }
      const events2 = ctx.system.events;
      events2?.emit("shot.result", { result });
    }
  };
  function computeShotResult(angle, power) {
    const normalizedPower = power / 100;
    const absAngle = Math.abs(angle);
    const angleDifficulty = absAngle / 45;
    let goalProbability = 0.7 * (1 - angleDifficulty * 0.5) * normalizedPower;
    if (normalizedPower < 0.3) {
      goalProbability *= normalizedPower / 0.3;
    } else if (normalizedPower > 0.9) {
      goalProbability *= 0.85;
    }
    goalProbability = Math.max(0.1, Math.min(0.9, goalProbability));
    const random = Math.random();
    if (random < goalProbability * 0.6) {
      return "goal";
    } else if (random < goalProbability * 0.6 + 0.25) {
      return "save";
    } else {
      return "miss";
    }
  }
}
export {
  logic_default as default
};
