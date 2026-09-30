// modules/v2-game/__OV.Games.PacmanCity.Game/logic.ts
var WORLD_CELLS = 25;
var CELL_SIZE = 32;
var logic_default = {
  name: "__OV.Games.PacmanCity.Game",
  type: "scene-private",
  version: "1.0.0",
  description: "\u5403\u8C46\u4EBA\u57CE\u5E02\u573A\u666F\u79C1\u6709\u6E32\u67D3\u5668\uFF1A\u5728 PIXI \u4E2D\u7ED8\u5236\u57CE\u5E02\u8FF7\u5BAB\u3001\u5403\u8C46\u4EBA\u3001\u5E7D\u7075\u3001\u8C46\u70B9\u3001\u9053\u5177\u4E0E HUD\u3002",
  install(ctx) {
    ctx.logger?.info?.("[PacmanCity.Game] install");
    const state = {
      ctx,
      ready: false,
      skinBound: false,
      canvasBounds: { x: 0, y: 120, width: 750, height: 900 },
      worldContainer: null,
      mazeContainer: null,
      dotContainer: null,
      playerDisplay: null,
      enemyDisplays: /* @__PURE__ */ new Map(),
      hudContainer: null,
      joystickBase: null,
      joystickKnob: null,
      joystickActive: false,
      joystickCenterX: 0,
      joystickCenterY: 0,
      joystickRadius: 60,
      keyState: {},
      lastMoveX: 0,
      lastMoveY: 0,
      lastDots: /* @__PURE__ */ new Set(),
      lastPowerMode: false,
      offSkinReady: null,
      offPointerDown: null,
      offPointerMove: null,
      offPointerUp: null
    };
    this._state = state;
    function getCanvasSize() {
      return { width: 750, height: 1334 };
    }
    function screenToLocal(display, sx, sy) {
      if (display && typeof display.toLocal === "function") return display.toLocal({ x: sx, y: sy });
      return { x: sx, y: sy };
    }
    function getPacmanState() {
      return ctx.data.get("__pacmanState");
    }
    function getEnemies() {
      const raw = ctx.data.get("enemies");
      return Array.isArray(raw) ? raw : [];
    }
    function clearExistingDisplay() {
      if (state.worldContainer?.parent) state.worldContainer.parent.removeChild(state.worldContainer);
      if (state.joystickBase?.parent) state.joystickBase.parent.removeChild(state.joystickBase);
      if (state.joystickKnob?.parent) state.joystickKnob.parent.removeChild(state.joystickKnob);
      state.enemyDisplays.clear();
      state.lastDots.clear();
    }
    function createWorld() {
      const stage = ctx.engine?.stage;
      const pixi = ctx.engine?.pixi || globalThis.PIXI;
      if (!stage || !pixi) return;
      clearExistingDisplay();
      const world = new pixi.Container();
      world.name = "pacman-city-world";
      const sceneSkinContainer = stage.getChildByName?.("__sceneSkinContainer");
      if (sceneSkinContainer?.addChildAt) {
        sceneSkinContainer.addChildAt(world, 0);
      } else {
        stage.addChildAt(world, 0);
      }
      state.worldContainer = world;
      const bg = new pixi.Graphics();
      bg.beginFill(988970);
      bg.drawRect(0, 0, state.canvasBounds.width, state.canvasBounds.height);
      bg.endFill();
      world.addChild(bg);
      state.mazeContainer = new pixi.Container();
      state.mazeContainer.name = "maze";
      world.addChild(state.mazeContainer);
      state.dotContainer = new pixi.Container();
      state.dotContainer.name = "dots";
      world.addChild(state.dotContainer);
      state.playerDisplay = createPlayerDisplay();
      world.addChild(state.playerDisplay);
      state.hudContainer = createHud();
      world.addChild(state.hudContainer);
      drawMaze();
      syncDots(true);
      state.ready = true;
      ctx.logger?.info?.("[PacmanCity.Game] world ready");
    }
    function createPlayerDisplay() {
      const container = new PIXI.Container();
      container.name = "pacman";
      const g = new PIXI.Graphics();
      g.name = "pacmanBody";
      container.addChild(g);
      return container;
    }
    function createEnemyDisplay(id) {
      const container = new PIXI.Container();
      container.name = id;
      const g = new PIXI.Graphics();
      g.name = "enemyBody";
      container.addChild(g);
      return container;
    }
    function createHud() {
      const container = new PIXI.Container();
      container.name = "hud";
      const score = new PIXI.Text("Score: 0", { fontFamily: "Arial", fontSize: 24, fill: 16777215, align: "left" });
      score.name = "score";
      score.x = state.canvasBounds.x + 16;
      score.y = state.canvasBounds.y - 36;
      container.addChild(score);
      const lives = new PIXI.Text("Lives: 3", { fontFamily: "Arial", fontSize: 24, fill: 16777215, align: "left" });
      lives.name = "lives";
      lives.x = state.canvasBounds.x + 250;
      lives.y = state.canvasBounds.y - 36;
      container.addChild(lives);
      const timer = new PIXI.Text("Time: 120", { fontFamily: "Arial", fontSize: 24, fill: 16777215, align: "right" });
      timer.name = "timer";
      timer.anchor.set(1, 0);
      timer.x = state.canvasBounds.x + state.canvasBounds.width - 16;
      timer.y = state.canvasBounds.y - 36;
      container.addChild(timer);
      const power = new PIXI.Text("", { fontFamily: "Arial", fontSize: 20, fill: 16436245, align: "center" });
      power.name = "power";
      power.anchor.set(0.5);
      power.x = state.canvasBounds.x + state.canvasBounds.width / 2;
      power.y = state.canvasBounds.y - 40;
      container.addChild(power);
      return container;
    }
    function bindSkinNodes(targetUi) {
      const ui = targetUi || ctx.scene?.ui;
      if (!ui?.getNode) return;
      const canvasEntry = ui.getNode("game_canvas");
      if (!canvasEntry?.display) return;
      clearExistingDisplay();
      const node = canvasEntry.node || {};
      state.canvasBounds = {
        x: Number(node.x) || 0,
        y: Number(node.y) || 120,
        width: Number(node.w) || 750,
        height: Number(node.h) || 900
      };
      createWorld();
      const baseEntry = ui.getNode("joystick-base");
      const knobEntry = ui.getNode("joystick-knob");
      if (baseEntry?.display && knobEntry?.display) {
        state.joystickBase = baseEntry.display;
        state.joystickKnob = knobEntry.display;
        state.joystickCenterX = baseEntry.display.x;
        state.joystickCenterY = baseEntry.display.y;
        state.joystickRadius = Math.max(40, (baseEntry.node?.w || 120) / 2);
        drawJoystickBase(state.joystickBase);
        drawJoystickKnob(state.joystickKnob);
      } else {
        createFallbackJoystick();
      }
      state.skinBound = true;
      ctx.logger?.info?.("[PacmanCity.Game] skin bound");
    }
    function createFallbackJoystick() {
      const stage = ctx.engine?.stage;
      const pixi = ctx.engine?.pixi || globalThis.PIXI;
      if (!stage || !pixi) return;
      const size = getCanvasSize();
      const base = new pixi.Container();
      base.name = "joystick-base";
      base.x = size.width * 0.18;
      base.y = size.height * 0.85;
      stage.addChild(base);
      state.joystickBase = base;
      state.joystickCenterX = base.x;
      state.joystickCenterY = base.y;
      state.joystickRadius = 60;
      drawJoystickBase(base);
      const knob = new pixi.Container();
      knob.name = "joystick-knob";
      knob.x = base.x;
      knob.y = base.y;
      stage.addChild(knob);
      state.joystickKnob = knob;
      drawJoystickKnob(knob);
    }
    function drawJoystickBase(display) {
      if (!display || display.children?.length > 0) return;
      const g = new PIXI.Graphics();
      g.beginFill(3359061, 0.5);
      g.drawCircle(0, 0, state.joystickRadius);
      g.endFill();
      display.addChild(g);
    }
    function drawJoystickKnob(display) {
      if (!display || display.children?.length > 0) return;
      const g = new PIXI.Graphics();
      g.beginFill(959977, 0.9);
      g.drawCircle(0, 0, state.joystickRadius * 0.4);
      g.endFill();
      display.addChild(g);
    }
    function drawMaze() {
      if (!state.mazeContainer) return;
      state.mazeContainer.removeChildren();
      const g = new PIXI.Graphics();
      g.name = "mazeWalls";
      const cellSize = CELL_SIZE;
      const worldPx = WORLD_CELLS * cellSize;
      const offsetX = (state.canvasBounds.width - worldPx) / 2;
      const offsetY = (state.canvasBounds.height - worldPx) / 2;
      g.beginFill(1981066);
      for (let r = 0; r < WORLD_CELLS; r++) {
        for (let c = 0; c < WORLD_CELLS; c++) {
          const blockRow = r % 4 === 0;
          const blockCol = c % 4 === 0;
          const isWall = blockRow && blockCol ? false : blockRow || blockCol;
          if (isWall) {
            g.drawRect(
              state.canvasBounds.x + offsetX + c * cellSize,
              state.canvasBounds.y + offsetY + r * cellSize,
              cellSize,
              cellSize
            );
          }
        }
      }
      g.endFill();
      state.mazeContainer.addChild(g);
    }
    function syncDots(force = false) {
      if (!state.dotContainer) return;
      const ps = getPacmanState();
      if (!ps?.cells) return;
      const cellSize = CELL_SIZE;
      const worldPx = WORLD_CELLS * cellSize;
      const offsetX = (state.canvasBounds.width - worldPx) / 2;
      const offsetY = (state.canvasBounds.height - worldPx) / 2;
      const currentDots = /* @__PURE__ */ new Set();
      const currentPowers = /* @__PURE__ */ new Set();
      for (const cell of ps.cells) {
        if (cell.dot) currentDots.add(`${cell.r},${cell.c}`);
        if (cell.power) currentPowers.add(`${cell.r},${cell.c}`);
      }
      if (!force && setsEqual(currentDots, state.lastDots) && state.lastPowerMode === ctx.data.get("powerMode")) return;
      state.lastDots = currentDots;
      state.lastPowerMode = !!ctx.data.get("powerMode");
      state.dotContainer.removeChildren();
      const g = new PIXI.Graphics();
      g.name = "dots";
      for (const cell of ps.cells) {
        const cx = state.canvasBounds.x + offsetX + cell.c * cellSize + cellSize / 2;
        const cy = state.canvasBounds.y + offsetY + cell.r * cellSize + cellSize / 2;
        if (cell.dot) {
          g.beginFill(16639626);
          g.drawCircle(cx, cy, 3);
          g.endFill();
        } else if (cell.power) {
          g.beginFill(16436245);
          g.drawCircle(cx, cy, 8);
          g.endFill();
          g.lineStyle(2, 16436245, 0.5);
          g.drawCircle(cx, cy, 12);
          g.lineStyle(0);
        }
      }
      state.dotContainer.addChild(g);
    }
    function setsEqual(a, b) {
      if (a.size !== b.size) return false;
      for (const v of a) if (!b.has(v)) return false;
      return true;
    }
    function worldToScreen(wx, wy) {
      const cellSize = 32;
      const cols = Math.floor(state.canvasBounds.width / cellSize);
      const rows = Math.floor(state.canvasBounds.height / cellSize);
      const offsetX = (state.canvasBounds.width - cols * cellSize) / 2;
      const offsetY = (state.canvasBounds.height - rows * cellSize) / 2;
      const halfWorld = WORLD_CELLS * cellSize / 2;
      const sx = state.canvasBounds.x + offsetX + (wx + halfWorld) / cellSize * cellSize + cellSize / 2;
      const sy = state.canvasBounds.y + offsetY + (wy + halfWorld) / cellSize * cellSize + cellSize / 2;
      return { x: sx, y: sy };
    }
    function updatePlayer() {
      if (!state.playerDisplay) return;
      const x = Number(ctx.data.get("pacmanX") ?? 0);
      const y = Number(ctx.data.get("pacmanY") ?? 0);
      const angle = Number(ctx.data.get("moveAngle") ?? 0);
      const size = Number(ctx.data.get("pacmanSize") ?? 14);
      const pos = worldToScreen(x, y);
      state.playerDisplay.x = pos.x;
      state.playerDisplay.y = pos.y;
      const g = state.playerDisplay.getChildByName?.("pacmanBody");
      if (g && g instanceof PIXI.Graphics) {
        g.clear();
        g.beginFill(16436245);
        const mouth = 0.25 + Math.abs(Math.sin(Date.now() / 150)) * 0.15;
        g.arc(0, 0, size, (angle + mouth * 360) * Math.PI / 180, (angle - mouth * 360) * Math.PI / 180);
        g.lineTo(0, 0);
        g.endFill();
      }
    }
    function updateEnemies() {
      const enemies = getEnemies();
      const colors = {
        enemy_red: 15680580,
        enemy_pink: 16020150,
        enemy_cyan: 2282478,
        enemy_orange: 16486972
      };
      const seen = /* @__PURE__ */ new Set();
      for (const enemy of enemies) {
        seen.add(enemy.id);
        let display = state.enemyDisplays.get(enemy.id);
        const pos = worldToScreen(enemy.x, enemy.y);
        if (!display) {
          display = createEnemyDisplay(enemy.id);
          state.worldContainer.addChild(display);
          state.enemyDisplays.set(enemy.id, display);
        }
        display.x = pos.x;
        display.y = pos.y;
        const g = display.getChildByName?.("enemyBody");
        if (g && g instanceof PIXI.Graphics) {
          g.clear();
          const frightened = enemy.state === "frightened" || ctx.data.get("powerMode") === true;
          g.beginFill(frightened ? 3900150 : colors[enemy.id] ?? 9741240);
          g.drawCircle(0, 0, 14);
          g.endFill();
          g.beginFill(16777215);
          g.drawCircle(-5, -4, 4);
          g.drawCircle(5, -4, 4);
          g.endFill();
          g.beginFill(0);
          g.drawCircle(-5, -4, 1.5);
          g.drawCircle(5, -4, 1.5);
          g.endFill();
        }
      }
      for (const [id, display] of state.enemyDisplays) {
        if (!seen.has(id)) {
          state.worldContainer.removeChild(display);
          state.enemyDisplays.delete(id);
        }
      }
    }
    function updateHud() {
      if (!state.hudContainer) return;
      const score = ctx.data.get("score") ?? 0;
      const lives = ctx.data.get("lives") ?? 0;
      const time = ctx.data.get("timeRemaining") ?? 0;
      const powerTime = ctx.data.get("powerTime") ?? 0;
      const powerMode = ctx.data.get("powerMode") === true;
      const scoreNode = state.hudContainer.getChildByName?.("score");
      if (scoreNode) scoreNode.text = `Score: ${score}`;
      const livesNode = state.hudContainer.getChildByName?.("lives");
      if (livesNode) livesNode.text = `Lives: ${lives}`;
      const timerNode = state.hudContainer.getChildByName?.("timer");
      if (timerNode) timerNode.text = `Time: ${time}`;
      const powerNode = state.hudContainer.getChildByName?.("power");
      if (powerNode) powerNode.text = powerMode ? `POWER! ${Math.ceil(powerTime)}` : "";
      updateSkinText("score_display", `Score: ${score}`);
      updateSkinText("lives_display", `Lives: ${lives}`);
      updateSkinText("timer_display", `Time: ${time}`);
      updateSkinText("power_display", powerMode ? `POWER! ${Math.ceil(powerTime)}` : "");
    }
    function updateSkinText(id, text) {
      const ui = ctx.scene?.ui;
      if (typeof ui?.setText === "function") return ui.setText(id, text);
      return false;
    }
    function getInputVector() {
      let dx = 0;
      let dy = 0;
      if (state.keyState["ArrowUp"] || state.keyState["w"] || state.keyState["W"]) dy -= 1;
      if (state.keyState["ArrowDown"] || state.keyState["s"] || state.keyState["S"]) dy += 1;
      if (state.keyState["ArrowLeft"] || state.keyState["a"] || state.keyState["A"]) dx -= 1;
      if (state.keyState["ArrowRight"] || state.keyState["d"] || state.keyState["D"]) dx += 1;
      if (state.joystickActive && state.joystickBase) {
        const jx = state.joystickKnob.x - state.joystickBase.x;
        const jy = state.joystickKnob.y - state.joystickBase.y;
        dx += jx / state.joystickRadius;
        dy += jy / state.joystickRadius;
      }
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len > 1) return { dx: dx / len, dy: dy / len };
      if (len < 1e-3) return { dx: 0, dy: 0 };
      return { dx, dy };
    }
    function flushInput() {
      const { dx, dy } = getInputVector();
      if (Math.abs(dx - state.lastMoveX) < 0.01 && Math.abs(dy - state.lastMoveY) < 0.01) return;
      state.lastMoveX = dx;
      state.lastMoveY = dy;
      const angle = dx === 0 && dy === 0 ? 0 : Math.atan2(dy, dx) * 180 / Math.PI;
      ctx.system.events?.emit("pacman.move", { dx, dy, angle });
    }
    function updateJoystick(dx, dy) {
      const len = Math.sqrt(dx * dx + dy * dy);
      const clamped = Math.min(len, state.joystickRadius);
      const nx = len > 0 ? dx / len : 0;
      const ny = len > 0 ? dy / len : 0;
      if (state.joystickKnob) {
        state.joystickKnob.x = state.joystickBase.x + nx * clamped;
        state.joystickKnob.y = state.joystickBase.y + ny * clamped;
      }
      flushInput();
    }
    function onSkinReady(payload = {}) {
      if (state.skinBound) return;
      if (payload.sceneId !== "gameplay") return;
      bindSkinNodes(payload.ui);
    }
    function onPointerDown(payload = {}) {
      if (!state.ready || !state.joystickBase) return;
      const p = screenToLocal(state.joystickBase.parent, payload.x ?? 0, payload.y ?? 0);
      const dx = p.x - state.joystickBase.x;
      const dy = p.y - state.joystickBase.y;
      if (Math.sqrt(dx * dx + dy * dy) <= state.joystickRadius * 1.5) {
        state.joystickActive = true;
        updateJoystick(dx, dy);
      }
    }
    function onPointerMove(payload = {}) {
      if (!state.ready || !state.joystickActive || !state.joystickBase) return;
      const p = screenToLocal(state.joystickBase.parent, payload.x ?? 0, payload.y ?? 0);
      const dx = p.x - state.joystickBase.x;
      const dy = p.y - state.joystickBase.y;
      updateJoystick(dx, dy);
    }
    function onPointerUp() {
      if (!state.ready || !state.joystickActive) return;
      state.joystickActive = false;
      updateJoystick(0, 0);
    }
    function onKeyDown(evt) {
      state.keyState[evt.key] = true;
      flushInput();
    }
    function onKeyUp(evt) {
      state.keyState[evt.key] = false;
      flushInput();
    }
    function renderWorld(_dt) {
      if (!state.ready) return;
      syncDots();
      updatePlayer();
      updateEnemies();
      updateHud();
      globalThis.__PACMAN_DEBUG = globalThis.__PACMAN_DEBUG || {};
      globalThis.__PACMAN_DEBUG.renderer = {
        canvasBounds: state.canvasBounds,
        enemiesRendered: state.enemyDisplays.size,
        ready: state.ready
      };
    }
    this._renderWorld = renderWorld;
    state.offSkinReady = ctx.system.events.on("ui:skin:ready", onSkinReady);
    state.offPointerDown = ctx.system.events.on("input:pointerDown", onPointerDown);
    state.offPointerMove = ctx.system.events.on("input:pointerMove", onPointerMove);
    state.offPointerUp = ctx.system.events.on("input:pointerUp", onPointerUp);
    if (typeof window !== "undefined") {
      window.addEventListener("keydown", onKeyDown);
      window.addEventListener("keyup", onKeyUp);
      this._keyDown = onKeyDown;
      this._keyUp = onKeyUp;
    }
    bindSkinNodes(ctx.scene?.ui);
    if (!state.ready) createWorld();
  },
  update(_ctx, dt) {
    this._renderWorld?.(dt);
  },
  destroy() {
    const state = this._state;
    if (!state) return;
    state.ctx?.logger?.info?.("[PacmanCity.Game] destroy");
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
    if (typeof window !== "undefined") {
      window.removeEventListener("keydown", this._keyDown);
      window.removeEventListener("keyup", this._keyUp);
    }
    if (state.worldContainer?.parent) state.worldContainer.parent.removeChild(state.worldContainer);
    if (state.joystickBase?.parent) state.joystickBase.parent.removeChild(state.joystickBase);
    if (state.joystickKnob?.parent) state.joystickKnob.parent.removeChild(state.joystickKnob);
  }
};
export {
  logic_default as default
};
