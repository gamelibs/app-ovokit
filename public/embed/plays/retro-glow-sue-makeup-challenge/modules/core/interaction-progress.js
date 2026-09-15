// modules/core/interaction-progress/logic.ts
var logic_default = {
  name: "interaction-progress",
  install(ctx) {
    ctx.logger.info("[interaction-progress] install");
    ctx.system["interaction-progress"] = createAPI(ctx);
  },
  init(ctx) {
    ctx.logger.info("[interaction-progress] init");
  },
  start(ctx) {
    ctx.logger.info("[interaction-progress] start");
  },
  stop(ctx) {
    ctx.logger.info("[interaction-progress] stop");
  },
  destroy(ctx) {
    delete ctx.system["interaction-progress"];
  }
};
function createAPI(ctx) {
  const events = () => ctx.system.events;
  function getNumber(key, fallback = 0) {
    const v = ctx.data.get(key);
    return typeof v === "number" ? v : fallback;
  }
  function getString(key, fallback = "") {
    const v = ctx.data.get(key);
    return typeof v === "string" ? v : fallback;
  }
  function emit(event, payload) {
    const ev = events();
    if (ev) ev.emit(event, payload);
  }
  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }
  return {
    reset() {
      ctx.data.set("interactionTargetId", "");
      ctx.data.set("interactionToolId", "");
      ctx.data.set("interactionToolEffectiveness", 1);
      ctx.data.set("interactionProgress", 0);
      ctx.data.set("interactionTargetState", 100);
      ctx.data.set("interactionIsComplete", false);
      ctx.logger.info("[interaction-progress] reset");
    },
    selectTarget(params) {
      const targetId = (params?.targetId ?? params?.item) || getString("interactionTargetId") || getString("currentItem") || "";
      const initialState = Number(params?.initialState ?? 100);
      const totalWork = Number(params?.totalWork ?? 100);
      ctx.data.set("interactionTargetId", targetId);
      ctx.data.set("interactionTargetState", clamp(initialState, 0, 100));
      ctx.data.set("interactionProgress", 0);
      ctx.data.set("interactionIsComplete", false);
      ctx.data.set("interactionTotalWork", Math.max(1, totalWork));
      ctx.logger.info(`[interaction-progress] selectTarget ${targetId}, state=${initialState}`);
    },
    selectTool(params) {
      const toolId = params?.toolId ?? params?.tool ?? "";
      const effectiveness = Number(params?.effectiveness ?? 1);
      ctx.data.set("interactionToolId", toolId);
      ctx.data.set("interactionToolEffectiveness", clamp(effectiveness, 0.1, 10));
      ctx.logger.info(`[interaction-progress] selectTool ${toolId}, effectiveness=${effectiveness}`);
    },
    applyInteraction(params) {
      if (ctx.data.get("interactionIsComplete")) return;
      const toolId = getString("interactionToolId");
      if (!toolId) {
        ctx.logger.warn("[interaction-progress] applyInteraction skipped: no tool selected");
        return;
      }
      const effectiveness = getNumber("interactionToolEffectiveness", 1);
      const amount = Number(params?.amount ?? 10);
      const totalWork = getNumber("interactionTotalWork", 100);
      const increment = amount * effectiveness * 100 / totalWork;
      const progress = clamp(getNumber("interactionProgress", 0) + increment, 0, 100);
      const targetState = clamp(100 - progress, 0, 100);
      ctx.data.set("interactionProgress", progress);
      ctx.data.set("interactionTargetState", targetState);
      emit("interaction.progress", { toolId, progress, targetState });
      ctx.logger.info(`[interaction-progress] applyInteraction progress=${progress.toFixed(1)}`);
      if (progress >= 100) {
        ctx.data.set("interactionIsComplete", true);
        emit("interaction.complete", { targetId: getString("interactionTargetId") });
        ctx.logger.info("[interaction-progress] complete");
      }
    },
    checkComplete() {
      const progress = getNumber("interactionProgress", 0);
      const isComplete = progress >= 100;
      ctx.data.set("interactionIsComplete", isComplete);
      if (isComplete) {
        emit("interaction.complete", { targetId: getString("interactionTargetId") });
      }
    }
  };
}
export {
  logic_default as default
};
