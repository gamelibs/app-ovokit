// modules/football/football-model/logic.ts
var apiRef;
var logic_default = {
  name: "football-model",
  install(ctx) {
    ctx.logger.info("[football-model] install");
    apiRef = createFootballAPI(ctx);
    ctx.system["football-model"] = apiRef;
    ctx.system["football/football-model"] = apiRef;
    const bus = ctx.system.events;
    bus?.on("shot.result", (payload) => {
      const p = payload ?? {};
      if (p._ovoInternal) return;
      const result = p.result ?? "miss";
      const angle = typeof p.angle === "number" ? p.angle : ctx.data.get("shotAngle") ?? 0;
      const power = typeof p.power === "number" ? p.power : ctx.data.get("shotPower") ?? 0;
      ctx.data.set("shotAngle", angle);
      ctx.data.set("shotPower", power);
      ctx.data.set("gamePhase", "shooting");
      const attempts = (ctx.data.get("attempts") ?? 0) + 1;
      ctx.data.set("attempts", attempts);
      ctx.data.set("shotResult", result);
      if (result === "goal") {
        const goals = (ctx.data.get("goals") ?? 0) + 1;
        ctx.data.set("goals", goals);
        ctx.data.set("score", goals * 100 + Math.floor(power));
      }
      ctx.logger.info("[football-model] shot.result handled", { angle, power, result, attempts });
    });
  },
  init(ctx) {
    ctx.logger.info("[football-model] init");
  },
  start(ctx) {
    ctx.logger.info("[football-model] start");
  },
  update(ctx, dt) {
    apiRef?.update(ctx, dt);
  },
  stop(ctx) {
    ctx.logger.info("[football-model] stop");
  },
  destroy(ctx) {
    ctx.logger.info("[football-model] destroy");
    delete ctx.system["football-model"];
    apiRef = void 0;
  }
};
function createFootballAPI(ctx) {
  const events = () => ctx.system.events;
  function getNumber(key, fallback = 0) {
    const value = ctx.data.get(key);
    return typeof value === "number" && !Number.isNaN(value) ? value : fallback;
  }
  return {
    /** 重置射门场景 */
    resetScene() {
      ctx.data.set("gamePhase", "aiming");
      ctx.data.set("shotAngle", 0);
      ctx.data.set("shotPower", 0);
      ctx.data.set("shotResult", "none");
      ctx.data.set("_chargeStart", 0);
      ctx.logger.info("[football-model] resetScene");
    },
    /** 更新瞄准角度 */
    updateAim(payload) {
      const angle = typeof payload?.angle === "number" ? payload.angle : getNumber("shotAngle", 0);
      ctx.data.set("shotAngle", Math.max(-80, Math.min(80, angle)));
      ctx.logger.info("[football-model] updateAim", { angle });
    },
    /** 开始蓄力 */
    startPowerCharge() {
      ctx.data.set("gamePhase", "charging");
      ctx.data.set("shotPower", 0);
      ctx.data.set("_chargeStart", performance.now());
      ctx.logger.info("[football-model] startPowerCharge");
    },
    /** 执行射门并触发 shot.result */
    executeShot(payload) {
      const angle = typeof payload?.angle === "number" ? payload.angle : getNumber("shotAngle", 0);
      const power = typeof payload?.power === "number" ? payload.power : getNumber("shotPower", 0);
      ctx.data.set("shotAngle", angle);
      ctx.data.set("shotPower", power);
      ctx.data.set("gamePhase", "shooting");
      const attempts = getNumber("attempts", 0) + 1;
      ctx.data.set("attempts", attempts);
      let result = "miss";
      if (power <= 10 || Math.abs(angle) > 75) {
        result = "miss";
      } else if (Math.abs(angle) > 55 || power > 95) {
        result = Math.random() < 0.6 ? "miss" : "save";
      } else {
        const saveChance = 0.25 + Math.abs(angle) / 200;
        result = Math.random() < saveChance ? "save" : "goal";
      }
      ctx.data.set("shotResult", result);
      if (result === "goal") {
        const goals = getNumber("goals", 0) + 1;
        ctx.data.set("goals", goals);
        ctx.data.set("score", goals * 100 + Math.floor(power));
      }
      ctx.logger.info("[football-model] executeShot", { angle, power, result, attempts });
      events()?.emit("shot.result", { result, angle, power, _ovoInternal: true });
    },
    /** 每帧更新蓄力条 */
    update(_ctx, _dt) {
      if (ctx.data.get("gamePhase") !== "charging") return;
      const start = getNumber("_chargeStart", 0);
      if (!start) return;
      const elapsed = performance.now() - start;
      const cycle = 1200;
      const progress = elapsed % cycle / cycle;
      const power = progress <= 0.5 ? progress * 200 : (1 - progress) * 200;
      ctx.data.set("shotPower", Math.round(power));
    },
    playBgMusic() {
      ctx.logger.info("[football-model] playBgMusic");
    },
    playGoalSound() {
      ctx.logger.info("[football-model] playGoalSound");
    },
    playMissSound() {
      ctx.logger.info("[football-model] playMissSound");
    },
    playSaveSound() {
      ctx.logger.info("[football-model] playSaveSound");
    },
    playShootSound() {
      ctx.logger.info("[football-model] playShootSound");
    },
    playWhistleSound() {
      ctx.logger.info("[football-model] playWhistleSound");
    },
    /** 累计射门尝试次数 */
    recordAttempt() {
      const attempts = getNumber("attempts", 0) + 1;
      ctx.data.set("attempts", attempts);
      ctx.logger.info("[football-model] recordAttempt", { attempts });
    },
    /** 累计进球次数并更新总得分 */
    recordGoal() {
      const goals = getNumber("goals", 0) + 1;
      ctx.data.set("goals", goals);
      const power = getNumber("shotPower", 0);
      const score = goals * 100 + Math.floor(power);
      ctx.data.set("score", score);
      ctx.logger.info("[football-model] recordGoal", { goals, score });
    }
  };
}
export {
  logic_default as default
};
