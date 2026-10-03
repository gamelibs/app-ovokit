// modules/core/scene-renderer/templates/grid-shooter.ts
var COLORS = {
  blue: 3900150,
  green: 2278750,
  red: 15680580,
  yellow: 15381256,
  purple: 11032055,
  cyan: 440020
};
var ROWS = 14;
var COLS = 8;
var WALL_PADDING = 4;
var BUBBLE_SPEED = 900;
function hexColor(color) {
  return COLORS[color] ?? COLORS.blue;
}
function cellKey(row, col) {
  return `${row},${col}`;
}
function radians(deg) {
  return deg * Math.PI / 180;
}
function degrees(rad) {
  return rad * 180 / Math.PI;
}
function clampAngle(angle) {
  return Math.max(-80, Math.min(80, angle));
}
function isAlive(obj) {
  const d = obj;
  return d != null && d._destroyed !== true;
}
function screenToLocal(display, sx, sy) {
  const d = display;
  if (d && typeof d.toLocal === "function" && d.parent && !d._destroyed) {
    try {
      return d.toLocal({ x: sx, y: sy });
    } catch {
      return { x: sx, y: sy };
    }
  }
  return { x: sx, y: sy };
}
var GridShooterDrawer = class {
  ctx = null;
  app = null;
  pixi = null;
  worldContainer = null;
  gridContainer = null;
  launcherContainer = null;
  projectile = null;
  aimLine = null;
  hudContainer = null;
  bubbleDisplays = /* @__PURE__ */ new Map();
  animatingPops = /* @__PURE__ */ new Set();
  canvasRect = { x: 75, y: 180, w: 600, h: 540 };
  bubbleRadius = 30;
  rowHeight = 26;
  launcherBase = { x: 0, y: 0 };
  aimAngle = 0;
  pointerDown = false;
  projectileTarget = null;
  lastGrid = null;
  rows;
  cols;
  bubbleSpeed;
  wallPadding;
  constructor(options = {}) {
    this.rows = options.rows ?? ROWS;
    this.cols = options.cols ?? COLS;
    this.bubbleSpeed = options.bubbleSpeed ?? BUBBLE_SPEED;
    this.wallPadding = options.wallPadding ?? WALL_PADDING;
  }
  setup(app, ctx) {
    this.app = app;
    this.ctx = ctx;
    this.pixi = ctx.pixi || globalThis.PIXI;
    this.canvasRect = { ...ctx.canvasRect };
    if (!this.pixi) {
      ctx.events?.emit?.("renderer.error", { message: "GridShooterDrawer: PIXI namespace not available" });
      return;
    }
    this.buildWorld();
    this.syncGrid(true);
    this.updateHud();
    this.refreshDebug();
    ctx.events.on("bubble.attach", (p) => this.onBubbleAttach(p));
    ctx.events.on("bubble.pop", (p) => this.onBubblePop(p));
    ctx.events.on("cascade.trigger", () => this.syncGrid(true));
    ctx.events.on("game.over", () => this.updateHud());
  }
  update(dt, ctx) {
    if (!isAlive(this.worldContainer)) return;
    this.ctx = ctx;
    this.canvasRect = { ...ctx.canvasRect };
    this.syncGrid(false);
    this.updateProjectile(dt);
    this.updateHud();
    this.updateAimVisuals();
    for (const key of this.animatingPops) {
      const display = this.bubbleDisplays.get(key);
      if (display) {
        display.alpha = (display.alpha ?? 1) - dt * 5;
        display.scale.set((display.scale?.x ?? 1) - dt * 3);
        if (display.alpha <= 0) {
          this.gridContainer?.removeChild(display);
          this.bubbleDisplays.delete(key);
        }
      }
    }
    this.refreshDebug();
  }
  onPointerDown(pos) {
    if (!this.worldContainer) return;
    const local = screenToLocal(this.worldContainer, pos.x, pos.y);
    const b = this.canvasRect;
    if (local.x < b.x || local.x > b.x + b.w || local.y < b.y || local.y > b.y + b.h) return;
    this.pointerDown = true;
    this.aimAngle = this.computeAimFromPointer(pos.x, pos.y);
    this.ctx?.data.set("aimAngle", this.aimAngle);
    this.ctx?.events.emit("bubble.aim", { angle: this.aimAngle });
    this.updateAimVisuals();
  }
  onPointerMove(pos) {
    if (!this.pointerDown || !this.worldContainer) return;
    this.aimAngle = this.computeAimFromPointer(pos.x, pos.y);
    this.ctx?.data.set("aimAngle", this.aimAngle);
    this.ctx?.events.emit("bubble.aim", { angle: this.aimAngle });
    this.updateAimVisuals();
  }
  onPointerUp(_pos) {
    if (!this.pointerDown) return;
    this.pointerDown = false;
    const angle = clampAngle(this.aimAngle);
    const start = this.launcherPosition();
    if (!isAlive(this.projectile)) return;
    this.projectile.x = start.x;
    this.projectile.y = start.y;
    this.projectile.visible = true;
    const current = String(this.ctx?.data.get("currentBubble") ?? "blue");
    this.projectile.removeChildren?.();
    this.projectile.addChild(this.createBubbleSprite(current, this.bubbleRadius));
    this.projectileTarget = null;
    this.updateAimVisuals();
    this.ctx?.events.emit("bubble.shoot", { angle });
  }
  onDataChange(key) {
    if (key === "score" || key === "currentBubble" || key === "gameOver") {
      this.updateHud();
      this.refreshDebug();
    }
    if (key === "bubbleGrid") {
      this.syncGrid(false);
      this.refreshDebug();
    }
  }
  // ── 内部绘制 ──
  buildWorld() {
    if (!this.pixi) return;
    this.clearExistingDisplay();
    const world = new this.pixi.Container();
    world.name = "grid-shooter-world";
    const stage = this.app?.stage;
    if (stage?.addChildAt) {
      stage.addChildAt(world, 0);
    }
    this.worldContainer = world;
    const availableW = this.canvasRect.w - this.wallPadding * 2;
    this.bubbleRadius = availableW / (this.cols + 0.5) / 2;
    this.rowHeight = this.bubbleRadius * Math.sqrt(3);
    this.launcherBase = this.launcherPosition();
    world.addChild(this.createBackground());
    this.gridContainer = new this.pixi.Container();
    this.gridContainer.name = "bubble-grid";
    world.addChild(this.gridContainer);
    this.launcherContainer = this.createLauncher();
    world.addChild(this.launcherContainer);
    this.projectile = this.createProjectile();
    world.addChild(this.projectile);
    this.aimLine = this.createAimLine();
    world.addChild(this.aimLine);
    this.hudContainer = this.createHud();
    world.addChild(this.hudContainer);
    this.launcherContainer.x = this.launcherBase.x;
    this.launcherContainer.y = this.launcherBase.y;
  }
  clearExistingDisplay() {
    if (this.worldContainer && isAlive(this.worldContainer)) {
      try {
        this.worldContainer.parent?.removeChild?.(this.worldContainer);
        this.worldContainer.destroy?.({ children: true, texture: false, baseTexture: false });
      } catch {
      }
    }
    this.bubbleDisplays.clear();
    this.animatingPops.clear();
    this.projectile = null;
    this.projectileTarget = null;
  }
  createBackground() {
    const g = new this.pixi.Graphics();
    g.beginFill(988970, 0.9);
    g.drawRoundedRect(this.canvasRect.x, this.canvasRect.y, this.canvasRect.w, this.canvasRect.h, 12);
    g.endFill();
    g.lineStyle(2, 15680580, 0.6);
    const dangerY = this.canvasRect.y + this.canvasRect.h - this.bubbleRadius * 2.5;
    g.moveTo(this.canvasRect.x + 8, dangerY);
    g.lineTo(this.canvasRect.x + this.canvasRect.w - 8, dangerY);
    return g;
  }
  createBubbleSprite(color, radius) {
    const g = new this.pixi.Graphics();
    g.beginFill(hexColor(color));
    g.drawCircle(0, 0, radius - 1);
    g.endFill();
    g.beginFill(16777215, 0.25);
    g.drawCircle(-radius * 0.3, -radius * 0.3, radius * 0.25);
    g.endFill();
    g.lineStyle(1.5, 16777215, 0.35);
    g.drawCircle(0, 0, radius - 1);
    return g;
  }
  createLauncher() {
    const container = new this.pixi.Container();
    container.name = "launcher";
    const base = new this.pixi.Graphics();
    base.beginFill(3359061);
    base.drawRoundedRect(-40, -16, 80, 32, 8);
    base.endFill();
    container.addChild(base);
    const barrel = new this.pixi.Graphics();
    barrel.name = "barrel";
    barrel.beginFill(6583435);
    barrel.drawRoundedRect(-12, -60, 24, 60, 6);
    barrel.endFill();
    container.addChild(barrel);
    const nextOrb = this.createBubbleSprite("blue", this.bubbleRadius * 0.7);
    nextOrb.name = "nextOrb";
    nextOrb.y = 24;
    container.addChild(nextOrb);
    return container;
  }
  createProjectile() {
    const container = new this.pixi.Container();
    container.name = "projectile";
    container.visible = false;
    const orb = this.createBubbleSprite("blue", this.bubbleRadius);
    container.addChild(orb);
    return container;
  }
  createAimLine() {
    const g = new this.pixi.Graphics();
    g.name = "aim-line";
    g.visible = false;
    return g;
  }
  createHud() {
    const container = new this.pixi.Container();
    container.name = "hud";
    const score = new this.pixi.Text("Score: 0", {
      fontFamily: "Arial",
      fontSize: 24,
      fill: 16777215,
      align: "left"
    });
    score.name = "score";
    score.x = this.canvasRect.x + 16;
    score.y = this.canvasRect.y - 36;
    container.addChild(score);
    const current = new this.pixi.Text("Current: blue", {
      fontFamily: "Arial",
      fontSize: 18,
      fill: 16777215,
      align: "right"
    });
    current.name = "current";
    current.anchor.set(1, 0);
    current.x = this.canvasRect.x + this.canvasRect.w - 16;
    current.y = this.canvasRect.y - 36;
    container.addChild(current);
    const gameOver = new this.pixi.Text("GAME OVER", {
      fontFamily: "Arial",
      fontSize: 48,
      fill: 15680580,
      align: "center",
      fontWeight: "bold"
    });
    gameOver.name = "gameOver";
    gameOver.anchor.set(0.5);
    gameOver.x = this.canvasRect.x + this.canvasRect.w / 2;
    gameOver.y = this.canvasRect.y + this.canvasRect.h / 2;
    gameOver.visible = false;
    container.addChild(gameOver);
    return container;
  }
  // ── 坐标与计算 ──
  bubblePosition(row, col) {
    const r = this.bubbleRadius;
    const stagger = row % 2 === 1 ? r : 0;
    const x = this.canvasRect.x + this.wallPadding + r + col * (r * 2) + stagger;
    const y = this.canvasRect.y + this.wallPadding + r + row * this.rowHeight;
    return { x, y };
  }
  launcherPosition() {
    return {
      x: this.canvasRect.x + this.canvasRect.w / 2,
      y: this.canvasRect.y + this.canvasRect.h - this.bubbleRadius - 16
    };
  }
  computeAimFromPointer(px, py) {
    if (!this.worldContainer) return 0;
    const local = screenToLocal(this.worldContainer, px, py);
    const base = this.launcherPosition();
    const dx = local.x - base.x;
    const dy = local.y - base.y;
    let angle = degrees(Math.atan2(dy, dx)) + 90;
    return clampAngle(angle);
  }
  getGrid() {
    const v = this.ctx?.data.get("bubbleGrid");
    if (Array.isArray(v)) return v;
    return Array.from({ length: this.rows }, () => Array.from({ length: this.cols }, () => null));
  }
  // ── 同步与更新 ──
  syncGrid(forceRecreate = false) {
    if (!isAlive(this.gridContainer)) return;
    const grid = this.getGrid();
    const seen = /* @__PURE__ */ new Set();
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const color = grid[r]?.[c];
        if (!color) continue;
        const key = cellKey(r, c);
        seen.add(key);
        let display = this.bubbleDisplays.get(key);
        const pos = this.bubblePosition(r, c);
        if (!display || forceRecreate) {
          if (display) {
            this.gridContainer.removeChild(display);
          }
          display = this.createBubbleSprite(color, this.bubbleRadius);
          display.x = pos.x;
          display.y = pos.y;
          this.gridContainer.addChild(display);
          this.bubbleDisplays.set(key, display);
        } else {
          display.x = pos.x;
          display.y = pos.y;
        }
      }
    }
    for (const [key, display] of this.bubbleDisplays) {
      if (!seen.has(key)) {
        this.gridContainer.removeChild(display);
        this.bubbleDisplays.delete(key);
      }
    }
    this.lastGrid = grid.map((row) => [...row]);
  }
  updateHud() {
    if (!isAlive(this.hudContainer) || !this.ctx || !isAlive(this.launcherContainer)) return;
    const score = this.ctx.data.get("score") ?? 0;
    const current = this.ctx.data.get("currentBubble") ?? "blue";
    const gameOver = this.ctx.data.get("gameOver") === true;
    const scoreNode = this.hudContainer.getChildByName?.("score");
    if (scoreNode) scoreNode.text = `Score: ${score}`;
    const currentNode = this.hudContainer.getChildByName?.("current");
    if (currentNode) currentNode.text = `Current: ${current}`;
    const gameOverNode = this.hudContainer.getChildByName?.("gameOver");
    if (gameOverNode) gameOverNode.visible = gameOver;
    const nextOrb = this.launcherContainer?.getChildByName?.("nextOrb");
    if (nextOrb) {
      nextOrb.clear?.();
      nextOrb.removeChildren?.();
      const g = this.createBubbleSprite(String(current), this.bubbleRadius * 0.7);
      nextOrb.addChild(g);
    }
  }
  updateAimVisuals() {
    if (!isAlive(this.aimLine) || !isAlive(this.launcherContainer)) return;
    const angle = clampAngle(this.aimAngle);
    const rad = radians(angle - 90);
    const length = 120;
    const start = this.launcherPosition();
    const end = {
      x: start.x + Math.cos(rad) * length,
      y: start.y + Math.sin(rad) * length
    };
    const g = this.aimLine;
    g.clear();
    if (this.pointerDown || Math.abs(angle) > 1) {
      g.visible = true;
      g.lineStyle(2, 16777215, 0.6);
      g.moveTo(start.x, start.y);
      g.lineTo(end.x, end.y);
      g.beginFill(16777215, 0.6);
      g.drawCircle(end.x, end.y, 4);
      g.endFill();
    } else {
      g.visible = false;
    }
    const barrel = this.launcherContainer.getChildByName?.("barrel");
    if (barrel) barrel.rotation = radians(angle);
  }
  updateProjectile(dt) {
    if (!isAlive(this.projectile) || !this.projectile.visible || !this.projectileTarget) return;
    const dx = this.projectileTarget.x - this.projectile.x;
    const dy = this.projectileTarget.y - this.projectile.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const step = this.bubbleSpeed * dt;
    if (dist <= step) {
      this.projectile.x = this.projectileTarget.x;
      this.projectile.y = this.projectileTarget.y;
      this.projectile.visible = false;
      this.projectileTarget = null;
      this.ctx?.events.emit("bubble.landed", {});
    } else {
      this.projectile.x += dx / dist * step;
      this.projectile.y += dy / dist * step;
    }
  }
  onBubbleAttach(payload) {
    const p = payload;
    const row = Number(p.row ?? 0);
    const col = Number(p.col ?? 0);
    const pos = this.bubblePosition(row, col);
    this.projectileTarget = { row, col, x: pos.x, y: pos.y };
    if (!this.projectile?.visible) {
      this.syncGrid(true);
    }
  }
  onBubblePop(payload) {
    const p = payload;
    const positions = Array.isArray(p.positions) ? p.positions : [];
    for (const pos of positions) {
      const key = cellKey(Number(pos.row), Number(pos.col));
      const display = this.bubbleDisplays.get(key);
      if (display) {
        this.animatingPops.add(key);
      }
    }
    this.syncGrid(true);
  }
  cleanup() {
    if (this.worldContainer && isAlive(this.worldContainer)) {
      try {
        this.worldContainer.parent?.removeChild?.(this.worldContainer);
        this.worldContainer.destroy?.({ children: true, texture: false, baseTexture: false });
      } catch {
      }
    }
    this.worldContainer = null;
    this.gridContainer = null;
    this.launcherContainer = null;
    this.projectile = null;
    this.aimLine = null;
    this.hudContainer = null;
    this.bubbleDisplays.clear();
    this.animatingPops.clear();
    this.ctx = null;
  }
  refreshDebug() {
    const grid = this.getGrid();
    globalThis.__BUBBLE_DEBUG = {
      grid: grid.flatMap(
        (row, r) => row.map((color, c) => {
          const pos = this.bubblePosition(r, c);
          return {
            id: cellKey(r, c),
            row: r,
            col: c,
            color: color || null,
            x: pos.x,
            y: pos.y,
            visible: Boolean(color)
          };
        })
      ).filter((b) => b.visible),
      projectile: this.projectile?.visible ? {
        x: this.projectile.x,
        y: this.projectile.y,
        color: this.ctx?.data.get("currentBubble") ?? null,
        active: true
      } : { x: 0, y: 0, color: null, active: false },
      score: this.ctx?.data.get("score") ?? 0,
      shots: this.ctx?.data.get("shotsSinceAdvance") ?? 0,
      state: this.ctx?.data.get("gameOver") ? "gameover" : "playing"
    };
  }
};
function createGridShooterDrawer(options) {
  return new GridShooterDrawer(options);
}

// modules/v2-game/__OV.Games.BubbleShooter.Game/logic.ts
var logic_default = {
  name: "__OV.Games.BubbleShooter.Game",
  type: "scene-private",
  version: "1.0.0",
  description: "\u6CE1\u6CE1\u5C04\u624B\u573A\u666F\u79C1\u6709\u6E32\u67D3\u5668\uFF1A\u57FA\u4E8E core/scene-renderer \u7684 grid-shooter \u6A21\u677F\u3002",
  install(ctx) {
    ctx.logger?.info?.("[BubbleShooter.Game] install");
    const renderer = ctx.system.sceneRenderer;
    if (!renderer) {
      ctx.logger?.error?.("[BubbleShooter.Game] core/scene-renderer \u672A\u5C31\u7EEA");
      return;
    }
    const drawer = createGridShooterDrawer();
    renderer.registerDrawer(drawer, [
      "bubbleGrid",
      "currentBubble",
      "nextBubble",
      "aimAngle",
      "score",
      "gameOver",
      "bubbleCount",
      "shotsSinceAdvance"
    ]);
    this._drawer = drawer;
  },
  update(_ctx, _dt) {
  },
  destroy(ctx) {
    ctx.logger?.info?.("[BubbleShooter.Game] destroy");
    const renderer = ctx.system.sceneRenderer;
    try {
      renderer?.unregisterDrawer();
    } catch (err) {
      ctx.logger?.warn?.("[BubbleShooter.Game] unregisterDrawer \u5931\u8D25", err);
    }
    delete this._drawer;
  }
};
export {
  logic_default as default
};
