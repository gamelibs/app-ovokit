// modules/v2-game/__OV.Games.EightBallPool.Game/logic.ts
var logic_default = {
  name: "__OV.Games.EightBallPool.Game",
  type: "scene-private",
  version: "1.0.0",
  description: "8-Ball Pool \u573A\u666F\u79C1\u6709\u6E32\u67D3\u5668\uFF1A\u5728 PIXI \u4E2D\u7ED8\u5236\u7403\u53F0\u3001\u7403\u888B\u3001\u7403\u4F53\u3001\u7403\u6746\uFF0C\u5904\u7406\u8F93\u5165\u4E0E\u51FB\u7403\u52A8\u753B\u3002",
  install(ctx) {
    ctx.logger?.info?.("[EightBallPool.Game] install");
    const TABLE_WIDTH = 600;
    const TABLE_HEIGHT = 300;
    const BALL_RADIUS = 10;
    const POCKET_RADIUS = 14;
    const state = {
      ctx,
      ready: false,
      skinBound: false,
      canvasBounds: { x: 50, y: 220, width: 650, height: 520 },
      worldContainer: null,
      tableContainer: null,
      ballsContainer: null,
      cueContainer: null,
      ballDisplays: /* @__PURE__ */ new Map(),
      textureCache: /* @__PURE__ */ new Map(),
      textureListeners: /* @__PURE__ */ new Map(),
      aiming: false,
      pointerStart: { x: 0, y: 0 },
      cueBallStart: { x: 0, y: 0 },
      aimAngle: 0,
      aimPower: 0,
      offSkinReady: null,
      offPointerDown: null,
      offPointerMove: null,
      offPointerUp: null
    };
    this._state = state;
    function getPixi() {
      return ctx.engine?.pixi || globalThis.PIXI;
    }
    function getStage() {
      return ctx.engine?.stage;
    }
    function screenToLocal(display, sx, sy) {
      if (display && typeof display.toLocal === "function") {
        return display.toLocal({ x: sx, y: sy });
      }
      return { x: sx, y: sy };
    }
    function findResourceName(pattern) {
      const bp = (typeof window !== "undefined" ? window.__BLUEPRINT__ : null) || ctx.blueprint;
      const resources = Array.isArray(bp?.resources) ? bp.resources : [];
      const r = resources.find((item) => item.type === "image" && String(item.name).includes(pattern));
      return r?.name || null;
    }
    function resolveUrl(path) {
      const resolver = typeof window !== "undefined" && window.__RESOLVE_URL__;
      return resolver ? resolver(path) : path;
    }
    function loadBallTexture(pattern, display, radius) {
      const name = findResourceName(pattern);
      if (!name) return;
      const cached = state.textureCache.get(name);
      if (cached && cached !== "loading" && cached !== "failed") {
        applyBallTexture(display, cached, radius);
        return;
      }
      if (cached === "loading") {
        const list = state.textureListeners.get(name) || [];
        list.push((texture) => applyBallTexture(display, texture, radius));
        state.textureListeners.set(name, list);
        return;
      }
      if (cached === "failed") return;
      state.textureCache.set(name, "loading");
      const url = resolveUrl(`./resources/images/${name}`);
      const pixi = getPixi();
      const loader = pixi?.Assets?.load;
      if (typeof loader !== "function") {
        state.textureCache.set(name, "failed");
        return;
      }
      loader(url).then((texture) => {
        state.textureCache.set(name, texture);
        applyBallTexture(display, texture, radius);
        const listeners = state.textureListeners.get(name);
        if (listeners) {
          listeners.forEach((cb) => cb(texture));
          state.textureListeners.delete(name);
        }
      }).catch(() => {
        state.textureCache.set(name, "failed");
        state.textureListeners.delete(name);
      });
    }
    function applyBallTexture(display, texture, radius) {
      if (!display?.container) return;
      const existing = display.sprite;
      if (existing && existing.parent) existing.parent.removeChild(existing);
      try {
        const pixi = getPixi();
        const sprite = new pixi.Sprite(texture);
        sprite.anchor.set(0.5);
        const s = radius * 2 / Math.max(texture?.width || radius * 2, 1);
        sprite.scale.set(s);
        sprite.name = "ball-sprite";
        display.container.addChildAt(sprite, 0);
        display.sprite = sprite;
        if (display.fallback && display.fallback.parent) {
          display.fallback.parent.removeChild(display.fallback);
        }
      } catch {
      }
    }
    function colorForNumber(n) {
      const hexMap = {
        0: 16777215,
        1: 16436245,
        2: 3900150,
        3: 15680580,
        4: 11032055,
        5: 16347926,
        6: 2278750,
        7: 8330525,
        8: 1120295,
        9: 16436245,
        10: 3900150,
        11: 15680580,
        12: 11032055,
        13: 16347926,
        14: 2278750,
        15: 8330525
      };
      return hexMap[n] ?? 9741240;
    }
    function createTable() {
      const container = new PIXI.Container();
      container.name = "pool-table";
      const g = new PIXI.Graphics();
      g.beginFill(6044193);
      g.drawRoundedRect(-16, -16, TABLE_WIDTH + 32, TABLE_HEIGHT + 32, 12);
      g.endFill();
      g.beginFill(1409085);
      g.drawRoundedRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT, 8);
      g.endFill();
      g.lineStyle(2, 16777215, 0.25);
      g.moveTo(TABLE_WIDTH * 0.25, 8);
      g.lineTo(TABLE_WIDTH * 0.25, TABLE_HEIGHT - 8);
      g.endFill();
      container.addChild(g);
      for (const pocket of getPockets()) {
        const pg = new PIXI.Graphics();
        pg.beginFill(0);
        pg.drawCircle(pocket.x, pocket.y, pocket.radius);
        pg.endFill();
        container.addChild(pg);
      }
      return container;
    }
    function getPockets() {
      return [
        { x: 0, y: 0, radius: POCKET_RADIUS },
        { x: TABLE_WIDTH / 2, y: 0, radius: POCKET_RADIUS },
        { x: TABLE_WIDTH, y: 0, radius: POCKET_RADIUS },
        { x: 0, y: TABLE_HEIGHT, radius: POCKET_RADIUS },
        { x: TABLE_WIDTH / 2, y: TABLE_HEIGHT, radius: POCKET_RADIUS },
        { x: TABLE_WIDTH, y: TABLE_HEIGHT, radius: POCKET_RADIUS }
      ];
    }
    function texturePatternForBall(number) {
      if (number === 0) return "cue_ball";
      if (number === 8) return "ball_8_black";
      if (number >= 1 && number <= 7) return `ball_${number}_solid`;
      if (number >= 9 && number <= 15) return `ball_${number}_stripe`;
      return "";
    }
    function createBallDisplay(ball) {
      const container = new PIXI.Container();
      container.name = `ball-${ball.id}`;
      const radius = ball.radius || BALL_RADIUS;
      const pattern = texturePatternForBall(ball.number);
      const fallback = new PIXI.Graphics();
      fallback.name = "ball-fallback";
      fallback.beginFill(colorForNumber(ball.number));
      fallback.drawCircle(0, 0, radius - 0.5);
      fallback.endFill();
      fallback.lineStyle(1, 16777215, 0.4);
      fallback.drawCircle(0, 0, radius - 0.5);
      container.addChild(fallback);
      let numberText = null;
      if (ball.number > 0) {
        numberText = new PIXI.Text(String(ball.number), {
          fontFamily: "Arial",
          fontSize: radius * 1.2,
          fill: ball.number === 8 ? 16777215 : 0,
          align: "center",
          fontWeight: "bold"
        });
        numberText.anchor.set(0.5);
        container.addChild(numberText);
      }
      container.x = ball.x;
      container.y = ball.y;
      container.visible = !ball.pocketed;
      const display = { id: ball.id, container, sprite: null, numberText, fallback };
      if (pattern) loadBallTexture(pattern, display, radius);
      return display;
    }
    function createCueDisplay() {
      const container = new PIXI.Container();
      container.name = "cue-stick";
      container.visible = false;
      const g = new PIXI.Graphics();
      g.beginFill(13935475);
      g.drawRoundedRect(0, -3, 160, 6, 3);
      g.endFill();
      g.beginFill(3900150);
      g.drawCircle(0, 0, 5);
      g.endFill();
      container.addChild(g);
      return container;
    }
    function createAimLine() {
      const g = new PIXI.Graphics();
      g.name = "aim-line";
      g.visible = false;
      return g;
    }
    function clearExistingDisplay() {
      if (state.worldContainer?.parent) {
        state.worldContainer.parent.removeChild(state.worldContainer);
      }
      state.ballDisplays.clear();
    }
    function buildWorld() {
      const stage = getStage();
      const pixi = getPixi();
      if (!stage || !pixi) return;
      clearExistingDisplay();
      const world = new pixi.Container();
      world.name = "eight-ball-world";
      const sceneSkinContainer = stage.getChildByName?.("__sceneSkinContainer");
      if (sceneSkinContainer?.addChildAt) {
        sceneSkinContainer.addChildAt(world, 0);
      } else {
        stage.addChildAt(world, 0);
      }
      state.worldContainer = world;
      const scale = Math.min(state.canvasBounds.width / (TABLE_WIDTH + 40), state.canvasBounds.height / (TABLE_HEIGHT + 40));
      world.scale.set(scale);
      world.x = state.canvasBounds.x + (state.canvasBounds.width - TABLE_WIDTH * scale) / 2;
      world.y = state.canvasBounds.y + (state.canvasBounds.height - TABLE_HEIGHT * scale) / 2;
      state.tableContainer = createTable();
      world.addChild(state.tableContainer);
      state.ballsContainer = new pixi.Container();
      state.ballsContainer.name = "balls-container";
      world.addChild(state.ballsContainer);
      state.cueContainer = createCueDisplay();
      world.addChild(state.cueContainer);
      state.ready = true;
      syncBalls(true);
      updateCueVisuals();
      ctx.logger?.info?.("[EightBallPool.Game] world ready");
    }
    function bindSkinNodes(targetUi) {
      const ui = targetUi || ctx.scene?.ui;
      if (!ui?.getNode) return;
      const canvasEntry = ui.getNode("game-canvas");
      if (!canvasEntry?.display) return;
      const node = canvasEntry.node || {};
      state.canvasBounds = {
        x: Number(node.x) || 50,
        y: Number(node.y) || 220,
        width: Number(node.w) || 650,
        height: Number(node.h) || 520
      };
      buildWorld();
      state.skinBound = true;
      ctx.logger?.info?.("[EightBallPool.Game] skin bound");
    }
    function getBalls() {
      return ctx.data.get("balls") || [];
    }
    function getCueBall() {
      return getBalls().find((b) => b.id === 0);
    }
    function syncBalls(forceRecreate = false) {
      if (!state.ready || !state.ballsContainer) return;
      const balls = getBalls();
      const seen = /* @__PURE__ */ new Set();
      for (const ball of balls) {
        seen.add(ball.id);
        let display = state.ballDisplays.get(ball.id);
        if (!display || forceRecreate) {
          if (display) {
            state.ballsContainer.removeChild(display.container);
          }
          display = createBallDisplay(ball);
          state.ballsContainer.addChild(display.container);
          state.ballDisplays.set(ball.id, display);
        }
        display.container.x = ball.x;
        display.container.y = ball.y;
        display.container.visible = !ball.pocketed;
      }
      for (const [id, display] of state.ballDisplays) {
        if (!seen.has(id)) {
          state.ballsContainer.removeChild(display.container);
          state.ballDisplays.delete(id);
        }
      }
    }
    function getAimData() {
      return {
        angle: ctx.data.get("aimAngle") ?? 0,
        power: ctx.data.get("power") ?? 0
      };
    }
    function updateCueVisuals() {
      if (!state.ready || !state.cueContainer) return;
      const cue = getCueBall();
      const ballsMoving = ctx.data.get("ballsMoving") === true;
      const aiming = ctx.data.get("aiming") === true;
      if (!cue || cue.pocketed || ballsMoving || !aiming && !state.aiming) {
        state.cueContainer.visible = false;
        return;
      }
      const { angle, power } = getAimData();
      const pullBack = Math.min(power / 18, 1) * 80;
      const cueLen = 160;
      state.cueContainer.visible = true;
      state.cueContainer.x = cue.x - Math.cos(angle) * (cueLen + BALL_RADIUS + pullBack);
      state.cueContainer.y = cue.y - Math.sin(angle) * (cueLen + BALL_RADIUS + pullBack);
      state.cueContainer.rotation = angle;
    }
    function refreshDebug() {
      const balls = getBalls();
      const cue = getCueBall();
      globalThis.__EIGHTBALL_DEBUG = {
        balls: balls.map((b) => ({
          id: b.id,
          x: b.x,
          y: b.y,
          color: b.color,
          number: b.number,
          pocketed: b.pocketed
        })),
        cueBall: cue ? { x: cue.x, y: cue.y } : { x: 0, y: 0 },
        cueAngle: ctx.data.get("aimAngle") ?? 0,
        power: ctx.data.get("power") ?? 0,
        ballsMoving: ctx.data.get("ballsMoving") === true,
        table: { width: TABLE_WIDTH, height: TABLE_HEIGHT }
      };
    }
    function onSkinReady(payload = {}) {
      if (state.skinBound) return;
      if (payload.sceneId !== "gameplay") return;
      bindSkinNodes(payload.ui);
    }
    function isPointInCanvas(local) {
      return local.x >= 0 && local.x <= TABLE_WIDTH && local.y >= 0 && local.y <= TABLE_HEIGHT;
    }
    function onPointerDown(payload = {}) {
      if (!state.ready) return;
      const cue = getCueBall();
      if (!cue || cue.pocketed) return;
      if (ctx.data.get("ballsMoving") === true) return;
      if (ctx.data.get("gamePaused") === true) return;
      const local = screenToLocal(state.worldContainer, payload.x ?? 0, payload.y ?? 0);
      if (!isPointInCanvas(local)) return;
      const dist = Math.hypot(local.x - cue.x, local.y - cue.y);
      if (dist > BALL_RADIUS * 4) return;
      state.aiming = true;
      state.pointerStart = { x: local.x, y: local.y };
      state.cueBallStart = { x: cue.x, y: cue.y };
      ctx.data.set("aiming", true);
      ctx.system.events?.emit("shot.aim", { x: local.x, y: local.y });
      updateCueVisuals();
    }
    function onPointerMove(payload = {}) {
      if (!state.ready || !state.aiming) return;
      const cue = getCueBall();
      if (!cue) return;
      const local = screenToLocal(state.worldContainer, payload.x ?? 0, payload.y ?? 0);
      const dx = local.x - cue.x;
      const dy = local.y - cue.y;
      const angle = Math.atan2(dy, dx);
      const dist = Math.hypot(dx, dy);
      const maxDrag = 150;
      const power = Math.min(dist / maxDrag, 1) * 18;
      ctx.data.set("aimAngle", angle);
      ctx.data.set("power", power);
      ctx.system.events?.emit("shot.drag", { angle, power });
      updateCueVisuals();
    }
    function onPointerUp(_payload) {
      if (!state.ready || !state.aiming) return;
      state.aiming = false;
      const power = ctx.data.get("power") ?? 0;
      const angle = ctx.data.get("aimAngle") ?? 0;
      updateCueVisuals();
      if (power > 0.5) {
        ctx.system.events?.emit("shot.release", { angle, power });
        setTimeout(() => {
          ctx.data.set("aiming", false);
        }, 0);
      } else {
        ctx.data.set("power", 0);
        ctx.data.set("aiming", false);
      }
    }
    function renderWorld(_dt) {
      if (!state.ready) return;
      syncBalls(false);
      updateCueVisuals();
      refreshDebug();
    }
    this._renderWorld = renderWorld;
    state.offSkinReady = ctx.system.events.on("ui:skin:ready", onSkinReady);
    state.offPointerDown = ctx.system.events.on("input:pointerDown", onPointerDown);
    state.offPointerMove = ctx.system.events.on("input:pointerMove", onPointerMove);
    state.offPointerUp = ctx.system.events.on("input:pointerUp", onPointerUp);
    bindSkinNodes(ctx.scene?.ui);
    if (!state.ready) buildWorld();
  },
  update(_ctx, dt) {
    this._renderWorld?.(dt / 1e3);
  },
  destroy() {
    const state = this._state;
    if (!state) return;
    state.ctx?.logger?.info?.("[EightBallPool.Game] destroy");
    try {
      state.offSkinReady?.();
    } catch {
    }
    try {
      state.offPointerDown?.();
    } catch {
    }
    try {
      state.offPointerMove?.();
    } catch {
    }
    try {
      state.offPointerUp?.();
    } catch {
    }
    if (state.worldContainer?.parent) {
      state.worldContainer.parent.removeChild(state.worldContainer);
    }
  }
};
export {
  logic_default as default
};
