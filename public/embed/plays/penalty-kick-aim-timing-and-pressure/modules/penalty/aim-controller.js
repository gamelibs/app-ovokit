// modules/penalty/aim-controller/logic.ts
var logic_default = {
  name: "aim-controller",
  install(ctx) {
    ctx.logger.info("[aim-controller] install");
    ctx.system["aim-controller"] = createAPI(ctx);
  },
  init(ctx) {
    ctx.logger.info("[aim-controller] init");
  },
  start(ctx) {
    ctx.logger.info("[aim-controller] start");
  },
  update(ctx, _dt) {
  },
  stop(ctx) {
    ctx.logger.info("[aim-controller] stop");
  },
  destroy(ctx) {
    delete ctx.system["aim-controller"];
  }
};
function createAPI(ctx) {
  const events = () => ctx.system.events;
  return {
    /**
     * 更新瞄准状态
     * 根据玩家输入更新角度和力度，并触发瞄准调整事件
     */
    updateAim(input) {
      const params = typeof input === "number" ? { angle: input, power: arguments[1] } : { angle: input?.angle ?? 0, power: input?.power ?? 50 };
      ctx.logger.info(`[aim-controller] updateAim: angle=${params.angle}, power=${params.power}`);
      ctx.data.set("aimAngle", params.angle);
      ctx.data.set("power", params.power);
    },
    /**
     * 重置瞄准状态
     * 将角度和力度恢复为默认值
     */
    reset() {
      ctx.logger.info("[aim-controller] reset");
      ctx.data.set("aimAngle", 0);
      ctx.data.set("power", 50);
    }
  };
}
export {
  logic_default as default
};
