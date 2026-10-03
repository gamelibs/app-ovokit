// modules/core/runner/logic.ts
var logic_default = {
  name: "runner",
  install(ctx) {
    ctx.logger.info("[runner] install");
    ctx.system["runner"] = createAPI(ctx);
  },
  init(ctx) {
    ctx.logger.info("[runner] init");
  },
  start(ctx) {
    ctx.logger.info("[runner] start");
    const api = ctx.system["runner"];
    if (api) api.start();
  },
  update(ctx, dt) {
    const api = ctx.system["runner"];
    if (api) api.update(dt);
  },
  stop(ctx) {
    ctx.logger.info("[runner] stop");
    const api = ctx.system["runner"];
    if (api) api.stop();
  },
  destroy(ctx) {
    delete ctx.system["runner"];
  }
};
function createAPI(ctx) {
  const events = () => ctx.system.events;
  function getNumber(key, fallback = 0) {
    const v = ctx.data.get(key);
    return typeof v === "number" ? v : fallback;
  }
  let active = false;
  let distance = 0;
  let score = 0;
  let lives = 3;
  let elapsed = 0;
  let nextObstacle = 0;
  let jumpTimer = 0;
  let slideTimer = 0;
  let speed = 10;
  function resetState() {
    active = false;
    distance = 0;
    score = 0;
    lives = getNumber("runnerLives", 3);
    elapsed = 0;
    nextObstacle = Math.max(0.8, getNumber("obstacleInterval", 2));
    jumpTimer = 0;
    slideTimer = 0;
    speed = getNumber("runnerSpeed", 10);
    ctx.data.set("runnerDistance", 0);
    ctx.data.set("runnerScore", 0);
    ctx.data.set("runnerLives", lives);
    ctx.data.set("runnerGameOver", false);
    ctx.data.set("runnerState", "idle");
  }
  function emit(event, payload) {
    const ev = events();
    if (ev) ev.emit(event, payload);
  }
  return {
    reset() {
      resetState();
      ctx.logger.info("[runner] reset");
    },
    start() {
      resetState();
      active = true;
      ctx.data.set("runnerState", "running");
      ctx.logger.info("[runner] start");
    },
    stop() {
      active = false;
      ctx.data.set("runnerState", "stopped");
    },
    jump() {
      if (!active || jumpTimer > 0 || slideTimer > 0) return;
      jumpTimer = getNumber("jumpDuration", 0.6);
      ctx.data.set("runnerState", "jumping");
      ctx.logger.info("[runner] jump");
    },
    slide() {
      if (!active || slideTimer > 0 || jumpTimer > 0) return;
      slideTimer = getNumber("slideDuration", 0.6);
      ctx.data.set("runnerState", "sliding");
      ctx.logger.info("[runner] slide");
    },
    setSpeed(params) {
      if (params?.speed !== void 0) {
        speed = Number(params.speed);
        ctx.data.set("runnerSpeed", speed);
        ctx.logger.info(`[runner] setSpeed ${speed}`);
      }
    },
    update(dt) {
      if (!active) return;
      const sdt = dt / 1e3;
      elapsed += sdt;
      if (jumpTimer > 0) {
        jumpTimer -= sdt;
        if (jumpTimer <= 0) ctx.data.set("runnerState", "running");
      }
      if (slideTimer > 0) {
        slideTimer -= sdt;
        if (slideTimer <= 0) ctx.data.set("runnerState", "running");
      }
      const currentSpeed = speed + elapsed * 0.5;
      distance += currentSpeed * sdt;
      score += currentSpeed * sdt;
      nextObstacle -= sdt;
      if (nextObstacle <= 0) {
        nextObstacle = Math.max(0.8, getNumber("obstacleInterval", 2) - elapsed * 0.05);
        const obstacleType = Math.random() > 0.5 ? "ground" : "air";
        const canAvoid = obstacleType === "ground" ? slideTimer > 0 : jumpTimer > 0;
        if (!canAvoid) {
          lives -= 1;
          ctx.data.set("runnerLives", lives);
          emit("runner.crash", { type: obstacleType, lives, distance });
          ctx.logger.info(`[runner] crash ${obstacleType}, lives=${lives}`);
          if (lives <= 0) {
            active = false;
            ctx.data.set("runnerGameOver", true);
            ctx.data.set("runnerState", "gameOver");
            emit("runner.finish", { distance, score: Math.round(score), reason: "lives-depleted" });
            return;
          }
        }
      }
      const duration = getNumber("gameDuration", 60);
      if (duration > 0 && elapsed >= duration) {
        active = false;
        ctx.data.set("runnerGameOver", true);
        ctx.data.set("runnerState", "finished");
        emit("runner.finish", { distance, score: Math.round(score), reason: "time-up" });
        return;
      }
      ctx.data.set("runnerDistance", Math.round(distance));
      ctx.data.set("runnerScore", Math.round(score));
    }
  };
}
export {
  logic_default as default
};
