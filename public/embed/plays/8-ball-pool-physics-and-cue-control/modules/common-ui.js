// modules/common-ui/logic.ts
var sceneBindings = /* @__PURE__ */ new Map();
var sceneUnsubscribers = /* @__PURE__ */ new Map();
function resolveSkinUrl(projectId, skinName) {
  const resolver = window.__RESOLVE_URL__;
  const path = `./ui/skins/${skinName}.json`;
  if (resolver) {
    return resolver(path);
  }
  return `/creative-preview/${projectId}/ui/skins/${skinName}.json`;
}
function resolvePrefabUrl(projectId, prefabName) {
  const resolver = window.__RESOLVE_URL__;
  const path = `./ui/prefabs/${prefabName}.json`;
  if (resolver) {
    return resolver(path);
  }
  return `/creative-preview/${projectId}/ui/prefabs/${prefabName}.json`;
}
function resolveFullBlueprint() {
  return window.__BLUEPRINT__ ?? {};
}
function resolveSkinForScene(_ctx, sceneId) {
  const bp = resolveFullBlueprint();
  const sceneDef = bp.design?.scenes?.find((s) => s.id === sceneId);
  if (sceneDef?.skin) return sceneDef.skin;
  const stateDef = bp.design?.stateMachine?.states?.find(
    (s) => s.scene === sceneId || s.id === sceneId
  );
  if (stateDef?.skin) return stateDef.skin;
  return void 0;
}
function collectButtonNodes(node, out, parentX = 0, parentY = 0) {
  applyContainerLayout(node);
  const x = parentX + Number(node.x ?? 0);
  const y = parentY + Number(node.y ?? 0);
  const clickable = node.event && (node.type === "button" || node.type === "grid-cell" || node.type === "image" || node.type === "container");
  if (clickable) {
    out.push({
      nodeId: node.id,
      event: node.event,
      targetState: node.targetState,
      eventParams: node.eventParams,
      x,
      y,
      w: Number(node.w ?? 120),
      h: Number(node.h ?? 48)
    });
  }
  if (node.children && node.children.length > 0) {
    for (const child of node.children) {
      collectButtonNodes(child, out, x, y);
    }
  }
}
async function loadSkinJson(ctx, skinName) {
  try {
    const url = resolveSkinUrl(ctx.blueprint.projectId, skinName);
    const resp = await fetch(url, { cache: "no-store" });
    if (!resp.ok) {
      ctx.logger.warn(`[common-ui] \u76AE\u80A4 ${skinName} \u8BF7\u6C42\u5931\u8D25: ${resp.status}`);
      return null;
    }
    return await resp.json();
  } catch (e) {
    ctx.logger.warn(`[common-ui] \u52A0\u8F7D\u76AE\u80A4 ${skinName} \u5931\u8D25`, e);
    return null;
  }
}
var prefabCache = /* @__PURE__ */ new Map();
async function loadPrefabJson(ctx, prefabName) {
  const cacheKey = `${ctx.blueprint.projectId}:${prefabName}`;
  if (prefabCache.has(cacheKey)) return prefabCache.get(cacheKey);
  try {
    const url = resolvePrefabUrl(ctx.blueprint.projectId, prefabName);
    const resp = await fetch(url, { cache: "no-store" });
    if (!resp.ok) {
      ctx.logger.warn(`[common-ui] prefab ${prefabName} \u8BF7\u6C42\u5931\u8D25: ${resp.status}`);
      prefabCache.set(cacheKey, null);
      return null;
    }
    const prefab = await resp.json();
    prefabCache.set(cacheKey, prefab);
    return prefab;
  } catch (e) {
    ctx.logger.warn(`[common-ui] \u52A0\u8F7D prefab ${prefabName} \u5931\u8D25`, e);
    prefabCache.set(cacheKey, null);
    return null;
  }
}
function substitutePrefabProps(node, props) {
  const json = JSON.stringify(node);
  const replaced = json.replace(/\{\{(\w+)\}\}/g, (_match, key) => {
    const value = props[key];
    return value !== void 0 ? String(value) : `{{${key}}}`;
  });
  return JSON.parse(replaced);
}
function applyContainerLayout(node) {
  if (!node || !Array.isArray(node.children) || node.children.length === 0) return;
  const layout = String(node.layout || "").trim().toLowerCase();
  if (!layout || layout === "absolute") return;
  const gap = Number(node.gap ?? node.gapX ?? 0);
  const padding = Number(node.padding || 0);
  const columns = Math.max(1, Number(node.columns || 0) || 1);
  let cursorX = padding;
  let cursorY = padding;
  let rowHeight = 0;
  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i];
    const cw = Number(child.w || 0);
    const ch = Number(child.h || 0);
    if (layout === "horizontal") {
      child.x = cursorX;
      child.y = padding;
      cursorX += cw + gap;
    } else if (layout === "vertical") {
      child.x = padding;
      child.y = cursorY;
      cursorY += ch + gap;
    } else if (layout === "grid") {
      const col = i % columns;
      const row = Math.floor(i / columns);
      child.x = padding + col * (cw + gap);
      child.y = padding + row * (ch + gap);
    }
  }
}
async function expandPrefabNodes(ctx, node) {
  const prefabName = String(node.prefab || (node.type === "prefab" ? node.name || node.ref : "") || "").trim();
  if (prefabName) {
    const prefab = await loadPrefabJson(ctx, prefabName);
    if (prefab?.root) {
      const props = {
        ...prefab.defaultProps || {},
        ...typeof node.props === "object" && node.props ? node.props : {}
      };
      const merged = substitutePrefabProps(prefab.root, props);
      merged.id = node.id || merged.id || prefabName;
      merged.x = Number(merged.x || 0) + Number(node.x || 0);
      merged.y = Number(merged.y || 0) + Number(node.y || 0);
      if (node.w != null) merged.w = Number(node.w || 0) || merged.w;
      if (node.h != null) merged.h = Number(node.h || 0) || merged.h;
      const layoutProps = ["layout", "gap", "gapX", "gapY", "columns", "padding"];
      for (const key of layoutProps) {
        if (node.props?.[key] != null && merged[key] == null) {
          merged[key] = node.props[key];
        }
      }
      if (Array.isArray(merged.children) && merged.children.length > 0) {
        merged.children = await Promise.all(merged.children.map((child) => expandPrefabNodes(ctx, child)));
      }
      applyContainerLayout(merged);
      return merged;
    }
    ctx.logger.warn(`[common-ui] prefab ${prefabName} \u4E0D\u5B58\u5728\u6216 root \u4E3A\u7A7A`);
  }
  const clone = { ...node };
  if (Array.isArray(node.children) && node.children.length > 0) {
    clone.children = await Promise.all(node.children.map((child) => expandPrefabNodes(ctx, child)));
  }
  applyContainerLayout(clone);
  return clone;
}
function unbindAllScenes() {
  for (const unsub of sceneUnsubscribers.values()) {
    for (const fn of unsub) {
      try {
        fn();
      } catch {
      }
    }
  }
  sceneBindings.clear();
  sceneUnsubscribers.clear();
}
function bindButtonsForScene(ctx, sceneId) {
  if (sceneBindings.has(sceneId)) return;
  unbindAllScenes();
  const events = ctx.system.events;
  if (!events) {
    ctx.logger.warn("[common-ui] EventBus \u672A\u5C31\u7EEA");
    return;
  }
  const skinName = resolveSkinForScene(ctx, sceneId);
  if (!skinName) {
    ctx.logger.warn(`[common-ui] \u573A\u666F ${sceneId} \u672A\u627E\u5230\u76AE\u80A4`);
    return;
  }
  void (async () => {
    const skin = await loadSkinJson(ctx, skinName);
    if (!skin) return;
    const bindings = [];
    const root = skin.root;
    if (root) {
      const expanded = await expandPrefabNodes(ctx, root);
      collectButtonNodes(expanded, bindings);
    }
    if (bindings.length === 0) {
      ctx.logger.info(`[common-ui] \u573A\u666F ${sceneId} \u65E0 button \u8282\u70B9`);
      return;
    }
    sceneBindings.set(sceneId, bindings);
    const unsub = events.on("input:pointerDown", (payload) => {
      const p = payload;
      for (const btn of bindings) {
        if (p.x >= btn.x && p.x <= btn.x + btn.w && p.y >= btn.y && p.y <= btn.y + btn.h) {
          ctx.logger.info(`[common-ui] \u70B9\u51FB\u6309\u94AE ${btn.nodeId}, emit ${btn.event}`);
          events.emit(btn.event, { nodeId: btn.nodeId, targetState: btn.targetState, ...btn.eventParams });
          return;
        }
      }
    });
    const list = sceneUnsubscribers.get(sceneId) ?? [];
    list.push(unsub);
    sceneUnsubscribers.set(sceneId, list);
  })();
}
function emitBootLoadedIfNeeded(ctx) {
  ctx.logger.info("[common-ui] emitBootLoadedIfNeeded called");
  const bp = resolveFullBlueprint();
  const states = bp.design?.stateMachine?.states ?? [];
  const bootState = states.find((s) => s.id === "boot");
  if (!bootState) return;
  const events = ctx.system.events;
  if (!events) return;
  const transitionEvents = Object.keys(bootState.on ?? {});
  if (transitionEvents.length === 0) return;
  const eventToEmit = transitionEvents[0];
  void ctx.tick().then(() => {
    ctx.logger.info(`[common-ui] boot \u81EA\u52A8\u63A8\u8FDB: emit ${eventToEmit}`);
    events.emit(eventToEmit, { auto: true });
  });
}
var logic_default = {
  name: "common-ui",
  install(ctx) {
    ctx.logger.info("[common-ui] install");
    ctx.system["common-ui"] = {
      bindButtonsForScene: (sceneId) => bindButtonsForScene(ctx, sceneId),
      bindButtonEvents: (sceneId) => bindButtonsForScene(ctx, sceneId || ctx.scene?.id || "")
    };
  },
  start(ctx) {
    const sceneId = ctx.scene?.id;
    ctx.logger.info(`[common-ui] start sceneId=${sceneId}`);
    if (!sceneId) return;
    if (sceneId === "boot") {
      emitBootLoadedIfNeeded(ctx);
    }
    bindButtonsForScene(ctx, sceneId);
  },
  destroy(ctx) {
    const sceneId = ctx.scene?.id;
    if (!sceneId) return;
    const unsubs = sceneUnsubscribers.get(sceneId);
    if (unsubs) {
      for (const unsub of unsubs) unsub();
      sceneUnsubscribers.delete(sceneId);
    }
    sceneBindings.delete(sceneId);
  }
};
export {
  logic_default as default
};
