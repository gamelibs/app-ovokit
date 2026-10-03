// modules/core/scene-renderer/hud-bridge.ts
function createHudBridge(ctx) {
  const globalUnsubs = [];
  return {
    watch(keys, onChange) {
      if (typeof ctx.data.watch !== "function") {
        return void 0;
      }
      const localUnsubs = [];
      for (const key of keys) {
        const off = ctx.data.watch(key, (value) => onChange(key, value));
        localUnsubs.push(off);
        globalUnsubs.push(off);
      }
      return () => {
        for (const off of localUnsubs) {
          try {
            off();
          } catch {
          }
          const idx = globalUnsubs.indexOf(off);
          if (idx >= 0) globalUnsubs.splice(idx, 1);
        }
        localUnsubs.length = 0;
      };
    },
    destroy() {
      for (const off of globalUnsubs) {
        try {
          off();
        } catch {
        }
      }
      globalUnsubs.length = 0;
    }
  };
}

// modules/core/scene-renderer/input-bridge.ts
function toPos(payload) {
  const p = payload;
  return {
    x: typeof p?.x === "number" ? p.x : 0,
    y: typeof p?.y === "number" ? p.y : 0
  };
}
function createInputBridge(ctx) {
  const downHandlers = /* @__PURE__ */ new Set();
  const moveHandlers = /* @__PURE__ */ new Set();
  const upHandlers = /* @__PURE__ */ new Set();
  const events = ctx.system.events;
  let offDown = null;
  let offMove = null;
  let offUp = null;
  function ensureSubscribed() {
    if (!events || offDown) return;
    offDown = events.on("input:pointerDown", (payload) => {
      const pos = toPos(payload);
      for (const h of downHandlers) h(pos);
    });
    offMove = events.on("input:pointerMove", (payload) => {
      const pos = toPos(payload);
      for (const h of moveHandlers) h(pos);
    });
    offUp = events.on("input:pointerUp", (payload) => {
      const pos = toPos(payload);
      for (const h of upHandlers) h(pos);
    });
  }
  function makeRegistrar(set) {
    return (handler) => {
      ensureSubscribed();
      set.add(handler);
      return () => set.delete(handler);
    };
  }
  return {
    onPointerDown: makeRegistrar(downHandlers),
    onPointerMove: makeRegistrar(moveHandlers),
    onPointerUp: makeRegistrar(upHandlers),
    destroy() {
      try {
        offDown?.();
      } catch {
      }
      try {
        offMove?.();
      } catch {
      }
      try {
        offUp?.();
      } catch {
      }
      offDown = null;
      offMove = null;
      offUp = null;
      downHandlers.clear();
      moveHandlers.clear();
      upHandlers.clear();
    }
  };
}

// modules/core/scene-renderer/pixi-host.ts
var DEFAULT_RECT = { x: 0, y: 0, w: 750, h: 1334 };
function createPixiHost(ctx) {
  const pixi = ctx.engine?.pixi || globalThis.PIXI;
  const stage = ctx.engine?.stage;
  const app = ctx.engine?.app;
  let root = null;
  let canvasRect = { ...DEFAULT_RECT };
  function ensureRoot() {
    if (root || !stage || !pixi) return;
    const container = new pixi.Container();
    container.name = "scene-renderer-root";
    const sceneSkinContainer = stage.getChildByName?.("__sceneSkinContainer");
    if (sceneSkinContainer?.addChildAt) {
      sceneSkinContainer.addChildAt(container, 0);
    } else {
      stage.addChildAt(container, 0);
    }
    root = container;
  }
  function bindCanvasRect(targetUi) {
    const ui = targetUi || ctx.scene?.ui;
    if (!ui?.getNode) return;
    const entry = ui.getNode("game-canvas");
    if (!entry?.node) return;
    const node = entry.node;
    canvasRect = {
      x: Number(node.x) || 0,
      y: Number(node.y) || 0,
      w: Number(node.w) || DEFAULT_RECT.w,
      h: Number(node.h) || DEFAULT_RECT.h
    };
  }
  ensureRoot();
  bindCanvasRect(ctx.scene?.ui);
  return {
    get app() {
      return app;
    },
    get pixi() {
      return pixi;
    },
    get stage() {
      return stage;
    },
    get root() {
      ensureRoot();
      return root;
    },
    get canvasRect() {
      return canvasRect;
    },
    bindCanvasRect,
    destroy() {
      if (root && typeof root === "object" && root.parent) {
        root.parent.removeChild(root);
      }
      root = null;
    }
  };
}

// modules/core/scene-renderer/logic.ts
var logic_default = {
  name: "core/scene-renderer",
  type: "core-module",
  version: "1.0.0",
  description: "\u516C\u5171\u573A\u666F\u6E32\u67D3\u57FA\u7840\u8BBE\u65BD\uFF1APIXI \u5BB9\u5668\u6258\u7BA1\u3001\u8F93\u5165\u8F6C\u53D1\u3001\u6570\u636E\u8BA2\u9605\u3001Drawer \u8C03\u5EA6\u3002",
  install(ctx) {
    ctx.logger?.info?.("[core/scene-renderer] install");
    const host = createPixiHost(ctx);
    const input = createInputBridge(ctx);
    const hud = createHudBridge(ctx);
    const events = ctx.system.events;
    let drawer = null;
    let setupDone = false;
    let skinReady = false;
    const globalUnsubscribes = [];
    let drawerInputUnsubs = [];
    let drawerHudUnsubs = [];
    function makeContext() {
      return {
        app: host.app,
        pixi: host.pixi,
        data: ctx.data,
        events: events || {
          emit: () => {
          },
          on: () => () => {
          },
          off: () => {
          }
        },
        canvasRect: host.canvasRect
      };
    }
    function trySetup() {
      if (setupDone || !drawer || !skinReady) return;
      try {
        drawer.setup(host.app, makeContext());
        setupDone = true;
      } catch (err) {
        ctx.logger?.error?.("[core/scene-renderer] Drawer.setup \u5931\u8D25", err);
      }
    }
    function bindInputHandlers(d) {
      if (d.onPointerDown) {
        drawerInputUnsubs.push(input.onPointerDown((pos) => d.onPointerDown?.(pos)));
      }
      if (d.onPointerMove) {
        drawerInputUnsubs.push(input.onPointerMove((pos) => d.onPointerMove?.(pos)));
      }
      if (d.onPointerUp) {
        drawerInputUnsubs.push(input.onPointerUp((pos) => d.onPointerUp?.(pos)));
      }
    }
    function unregisterDrawer() {
      if (!drawer) return;
      try {
        drawer.cleanup?.();
      } catch (err) {
        ctx.logger?.warn?.("[core/scene-renderer] Drawer.cleanup \u5931\u8D25", err);
      }
      for (const off of drawerInputUnsubs) {
        try {
          off();
        } catch {
        }
      }
      drawerInputUnsubs.length = 0;
      for (const off of drawerHudUnsubs) {
        try {
          off();
        } catch {
        }
      }
      drawerHudUnsubs.length = 0;
      drawer = null;
      setupDone = false;
    }
    function registerDrawer(d, dataKeys) {
      if (drawer) {
        ctx.logger?.warn?.("[core/scene-renderer] \u91CD\u590D\u6CE8\u518C Drawer\uFF0C\u5C06\u8986\u76D6\u4E0A\u4E00\u4E2A");
        unregisterDrawer();
      }
      drawer = d;
      bindInputHandlers(d);
      if (d.onDataChange && dataKeys && dataKeys.length > 0) {
        const off = hud.watch(dataKeys, d.onDataChange.bind(d));
        if (off) drawerHudUnsubs.push(off);
      }
      trySetup();
    }
    if (events) {
      globalUnsubscribes.push(
        events.on("ui:skin:ready", (payload) => {
          host.bindCanvasRect(payload?.ui);
          skinReady = true;
          trySetup();
        })
      );
    }
    skinReady = true;
    const api = {
      registerDrawer,
      unregisterDrawer,
      destroy: () => {
        unregisterDrawer();
        for (const off of globalUnsubscribes) {
          try {
            off();
          } catch {
          }
        }
        globalUnsubscribes.length = 0;
        hud.destroy();
        input.destroy();
        host.destroy();
      }
    };
    api._update = (dt) => {
      if (setupDone && drawer) {
        try {
          drawer.update(dt, makeContext());
        } catch (err) {
          ctx.logger?.error?.("[core/scene-renderer] Drawer.update \u5931\u8D25", err);
        }
      }
    };
    ctx.system.sceneRenderer = api;
  },
  update(ctx, dt) {
    const api = ctx.system.sceneRenderer;
    api?._update?.(dt / 1e3);
  },
  destroy(ctx) {
    const api = ctx.system.sceneRenderer;
    if (api) {
      try {
        api.destroy();
      } catch {
      }
      delete ctx.system.sceneRenderer;
    }
    ctx.logger?.info?.("[core/scene-renderer] destroy");
  }
};
export {
  logic_default as default
};
