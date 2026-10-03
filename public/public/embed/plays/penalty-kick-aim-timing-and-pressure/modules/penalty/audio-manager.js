// modules/penalty/audio-manager/logic.ts
var logic_default = {
  name: "audio-manager",
  install(ctx) {
    ctx.logger.info("[audio-manager] install");
    ctx.system["audio-manager"] = createAPI(ctx);
  },
  init(ctx) {
    ctx.logger.info("[audio-manager] init");
  },
  start(ctx) {
    ctx.logger.info("[audio-manager] start");
  },
  update(ctx, _dt) {
  },
  stop(ctx) {
    ctx.logger.info("[audio-manager] stop");
    const api = ctx.system["audio-manager"];
    api?.stopAll?.();
  },
  destroy(ctx) {
    ctx.logger.info("[audio-manager] destroy");
    delete ctx.system["audio-manager"];
  }
};
function createAPI(ctx) {
  const state = {
    currentMusic: null,
    currentSfx: null,
    isMuted: false,
    volume: 1
  };
  const getAudioSystem = () => {
    return {
      play: (name, type) => {
        ctx.logger.info(`[audio-manager] \u64AD\u653E${type === "music" ? "\u97F3\u4E50" : "\u97F3\u6548"}: ${name}`);
      },
      stop: (type) => {
        ctx.logger.info(`[audio-manager] \u505C\u6B62${type === "music" ? "\u97F3\u4E50" : "\u97F3\u6548"}`);
      },
      stopAll: () => {
        ctx.logger.info("[audio-manager] \u505C\u6B62\u6240\u6709\u97F3\u9891");
      },
      setVolume: (vol) => {
        ctx.logger.info(`[audio-manager] \u8BBE\u7F6E\u97F3\u91CF: ${vol}`);
      }
    };
  };
  const getIntensityMusic = () => {
    const round = ctx.data.get("round") ?? 0;
    const playerScore = ctx.data.get("playerScore") ?? 0;
    const aiScore = ctx.data.get("aiScore") ?? 0;
    const scoreDiff = Math.abs(playerScore - aiScore);
    if (round >= 4 || scoreDiff <= 1) {
      return "intense-match-music";
    }
    return "normal-match-music";
  };
  return {
    /**
     * 播放进球欢呼音效
     * 触发时机：玩家成功进球
     */
    playGoalSound() {
      const audio = getAudioSystem();
      audio.stop("sfx");
      state.currentSfx = "goal-cheer";
      audio.play("goal-cheer", "sfx");
      const prevMusic = state.currentMusic;
      state.currentMusic = "goal-celebration-music";
      audio.play("goal-celebration-music", "music");
      ctx.logger.info("[audio-manager] \u8FDB\u7403\u6B22\u547C\u97F3\u6548\u64AD\u653E\u4E2D");
      ctx.data.set("audioState", { ...state, _prevMusic: prevMusic });
    },
    /**
     * 播放未进球音效（射偏）
     * 触发时机：玩家射门未命中球门范围
     */
    playMissSound() {
      const audio = getAudioSystem();
      audio.stop("sfx");
      state.currentSfx = "miss-whistle";
      audio.play("miss-whistle", "sfx");
      audio.play("crowd-sigh", "sfx");
      ctx.logger.info("[audio-manager] \u672A\u8FDB\u7403\u97F3\u6548\u64AD\u653E\u4E2D");
      ctx.data.set("audioState", { ...state });
    },
    /**
     * 播放扑救音效
     * 触发时机：AI守门员成功扑救
     */
    playSaveSound() {
      const audio = getAudioSystem();
      audio.stop("sfx");
      state.currentSfx = "goalkeeper-save";
      audio.play("goalkeeper-save", "sfx");
      audio.play("crowd-applause", "sfx");
      ctx.logger.info("[audio-manager] \u6251\u6551\u97F3\u6548\u64AD\u653E\u4E2D");
      ctx.data.set("audioState", { ...state });
    },
    /**
     * 播放结果页音乐
     * 触发时机：进入比赛结果页面
     */
    playResultMusic() {
      const audio = getAudioSystem();
      audio.stop("sfx");
      audio.stop("music");
      const winner = ctx.data.get("gameWinner") ?? "none";
      const playerScore = ctx.data.get("playerScore") ?? 0;
      const aiScore = ctx.data.get("aiScore") ?? 0;
      let resultMusic;
      switch (winner) {
        case "player":
          resultMusic = "victory-music";
          break;
        case "ai":
          resultMusic = "defeat-music";
          break;
        case "draw":
          resultMusic = "draw-music";
          break;
        default:
          resultMusic = "result-neutral-music";
      }
      state.currentMusic = resultMusic;
      audio.play(resultMusic, "music");
      const scoreDiff = Math.abs(playerScore - aiScore);
      if (scoreDiff >= 3) {
        audio.play("dramatic-stinger", "sfx");
      }
      ctx.logger.info(`[audio-manager] \u7ED3\u679C\u9875\u97F3\u4E50\u64AD\u653E\u4E2D: ${resultMusic}`);
      ctx.data.set("audioState", { ...state });
    },
    /**
     * 重置音频状态
     * 触发时机：游戏重新开始或返回菜单
     */
    reset() {
      const audio = getAudioSystem();
      audio.stopAll();
      state.currentMusic = null;
      state.currentSfx = null;
      state.isMuted = false;
      state.volume = 1;
      state.currentMusic = "menu-bgm";
      audio.play("menu-bgm", "music");
      ctx.logger.info("[audio-manager] \u97F3\u9891\u72B6\u6001\u5DF2\u91CD\u7F6E");
      ctx.data.set("audioState", { ...state });
    },
    /**
     * 停止所有音频（内部方法）
     */
    stopAll() {
      const audio = getAudioSystem();
      audio.stopAll();
      state.currentMusic = null;
      state.currentSfx = null;
    }
  };
}
export {
  logic_default as default
};
