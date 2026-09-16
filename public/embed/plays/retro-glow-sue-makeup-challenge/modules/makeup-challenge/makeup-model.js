// modules/makeup-challenge/makeup-model/logic.ts
var logic_default = {
  name: "makeup-model",
  install(ctx) {
    ctx.logger.info("[makeup-model] install");
    const api = createAPI(ctx);
    ctx.system["makeup-model"] = api;
  },
  init(ctx) {
    ctx.logger.info("[makeup-model] init");
  },
  start(ctx) {
    const api = ctx.system["makeup-model"];
    api?.onSceneStart?.(ctx.scene?.id);
  },
  stop(ctx) {
    const api = ctx.system["makeup-model"];
    api?.stopTimer?.();
  },
  destroy(ctx) {
    const api = ctx.system["makeup-model"];
    api?.stopTimer?.();
    delete ctx.system["makeup-model"];
  }
};
var DEFAULT_TIME_LIMIT = 60;
function createAPI(ctx) {
  const events = () => ctx.system.events;
  function emit(event, payload) {
    events()?.emit(event, payload);
  }
  function getNumber(key, fallback) {
    const v = ctx.data.get(key);
    return typeof v === "number" ? v : fallback;
  }
  let timerId = null;
  function stopInterval() {
    if (timerId !== null) {
      clearInterval(timerId);
      timerId = null;
    }
  }
  function startTimer() {
    stopInterval();
    const limit = getNumber("timeLimit", DEFAULT_TIME_LIMIT);
    ctx.data.set("timeLeft", limit);
    ctx.logger.info(`[makeup-model] \u8BA1\u65F6\u5F00\u59CB ${limit}s`);
    timerId = setInterval(() => {
      if (ctx.data.get("isPaused") === true) return;
      const left = getNumber("timeLeft", 0) - 1;
      ctx.data.set("timeLeft", left);
      emit("time.tick", { timeLeft: left });
      if (left <= 0) {
        stopInterval();
        ctx.logger.info("[makeup-model] \u65F6\u95F4\u5230");
        emit("time.up");
      }
    }, 1e3);
  }
  return {
    /** 计时开始（scene=start 时 gameplay 自动调用一次；重复调用会重置） */
    startTimer,
    pauseTimer() {
      ctx.data.set("isPaused", true);
      ctx.logger.info("[makeup-model] \u8BA1\u65F6\u6682\u505C");
    },
    resumeTimer() {
      ctx.data.set("isPaused", false);
      ctx.logger.info("[makeup-model] \u8BA1\u65F6\u6062\u590D");
    },
    stopTimer() {
      stopInterval();
      ctx.logger.info("[makeup-model] \u8BA1\u65F6\u505C\u6B62");
    },
    /** 准确度 = 当前交互进度（interaction-progress 已归一化 0~100） */
    calculateAccuracy() {
      const progress = getNumber("interactionProgress", 0);
      const accuracy = Math.max(0, Math.min(100, Math.round(progress)));
      ctx.data.set("accuracy", accuracy);
      ctx.logger.info(`[makeup-model] calculateAccuracy -> ${accuracy}`);
    },
    /** 音效钩子：音频系统存在则播放，缺失安全跳过 */
    playSFX(params) {
      try {
        const audio = ctx.system.audio;
        audio?.play?.(String(params?.name || "click"));
      } catch {
      }
    },
    onSceneStart(sceneId) {
      if (sceneId === "gameplay") startTimer();
    }
  };
}
export {
  logic_default as default
};
