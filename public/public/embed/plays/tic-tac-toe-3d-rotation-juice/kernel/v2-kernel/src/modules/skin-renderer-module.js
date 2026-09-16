const SKIN_THEMES = {
    'sketch-paper': {
        label: '手稿纸（gameslog）',
        canvasBackground: '#faf7ef',
        fontFamily: 'Kalam, "Kaiti SC", "STKaiti", "Microsoft YaHei", cursive',
        text: { fill: '#1a1a1a' },
        button: {
            backgroundColor: '#faf7ef',
            color: '#1a1a1a',
            borderColor: '#1a1a1a',
            borderWidth: 2,
            borderRadius: 4,
            primaryBackgroundColor: '#ffda6a',
            primaryColor: '#1a1a1a',
        },
        rect: { backgroundColor: '#f5f1e6', borderColor: 'rgba(26,26,26,0.35)', borderWidth: 1 },
    },
};
function resolveSkinTheme(skin) {
    const key = String(skin?.theme || '').trim();
    return key && SKIN_THEMES[key] ? SKIN_THEMES[key] : null;
}
/** 主题变换：返回覆盖后的 style 视图（不改原节点） */
function themedStyle(node, theme) {
    const raw = (node.style || {});
    if (!theme || raw.noTheme === true)
        return raw;
    const out = { ...raw };
    if (theme.fontFamily && !out.fontFamily)
        out.fontFamily = theme.fontFamily;
    // 文本墨色为主题强覆盖（AI 生成的白字在纸底上不可见）；noTheme 可豁免
    if (node.type === 'text' && theme.text?.fill) {
        out.fill = theme.text.fill;
        delete out.color;
    }
    if (node.type === 'button' && theme.button) {
        const b = theme.button;
        const primary = raw.variant === 'primary';
        out.backgroundColor = primary ? (b.primaryBackgroundColor || b.backgroundColor) : b.backgroundColor;
        out.color = primary ? (b.primaryColor || b.color) : b.color;
        if (b.borderRadius != null)
            out.borderRadius = b.borderRadius;
        if (b.borderWidth) {
            out.borderWidth = b.borderWidth;
            out.borderColor = b.borderColor;
        }
    }
    if (node.type === 'rect' && theme.rect) {
        const r = theme.rect;
        if (r.backgroundColor && !out.backgroundColor && !out.fill)
            out.backgroundColor = r.backgroundColor;
        if (r.borderWidth) {
            out.borderWidth = r.borderWidth;
            out.borderColor = r.borderColor;
        }
    }
    return out;
}
function hexToNumber(value, fallback = 0x000000) {
    try {
        const hex = String(value || '').replace('#', '').trim();
        if (!hex)
            return fallback;
        const normalized = hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex;
        const parsed = parseInt(normalized, 16);
        return Number.isFinite(parsed) ? parsed : fallback;
    }
    catch {
        return fallback;
    }
}
function resolveUrl(path) {
    const resolver = (typeof window !== 'undefined' && window.__RESOLVE_URL__);
    return typeof resolver === 'function' ? resolver(path) : path;
}
async function readJson(url) {
    const response = await fetch(resolveUrl(url), { cache: 'no-store' });
    if (!response.ok)
        throw new Error(`${url} load failed: ${response.status}`);
    return response.json();
}
function cloneJson(value) {
    try {
        return JSON.parse(JSON.stringify(value));
    }
    catch {
        return value;
    }
}
function applyPrefabProps(value, props) {
    if (typeof value === 'string') {
        return value.replace(/\{\{\s*([A-Za-z0-9_.-]+)\s*\}\}/g, (_, key) => String(props?.[key] ?? ''));
    }
    if (Array.isArray(value))
        return value.map((item) => applyPrefabProps(item, props));
    if (value && typeof value === 'object') {
        const next = {};
        for (const [key, child] of Object.entries(value)) {
            next[key] = applyPrefabProps(child, props);
        }
        return next;
    }
    return value;
}
const prefabCache = new Map();
async function loadPrefabJson(prefabName) {
    if (prefabCache.has(prefabName))
        return prefabCache.get(prefabName);
    try {
        const prefab = (await readJson(`./ui/prefabs/${prefabName}.json`));
        prefabCache.set(prefabName, prefab);
        return prefab;
    }
    catch (e) {
        prefabCache.set(prefabName, null);
        return null;
    }
}
/**
 * 对容器节点应用简单布局（horizontal / vertical / grid），用于 prefab 列表/grid 排列。
 */
function applyContainerLayout(node) {
    if (!node || !Array.isArray(node.children) || node.children.length === 0)
        return;
    const layout = String(node.layout || '').trim().toLowerCase();
    if (!layout || layout === 'absolute')
        return;
    const gap = Number(node.gap ?? node.gapX ?? 0);
    const padding = Number(node.padding || 0);
    const columns = Math.max(1, Number(node.columns || 0) || 1);
    let cursorX = padding;
    let cursorY = padding;
    for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        const cw = Number(child.w || 0);
        const ch = Number(child.h || 0);
        if (layout === 'horizontal') {
            child.x = cursorX;
            child.y = padding;
            cursorX += cw + gap;
        }
        else if (layout === 'vertical') {
            child.x = padding;
            child.y = cursorY;
            cursorY += ch + gap;
        }
        else if (layout === 'grid') {
            const col = i % columns;
            const row = Math.floor(i / columns);
            child.x = padding + col * (cw + gap);
            child.y = padding + row * (ch + gap);
        }
    }
}
function applyButtonInteraction(display) {
    if (!display || typeof display.on !== 'function')
        return;
    display.eventMode = 'static';
    display.cursor = 'pointer';
    const press = () => { display.alpha = 0.75; };
    const release = () => { display.alpha = 1; };
    display.on('pointerdown', press);
    display.on('pointerup', release);
    display.on('pointerupoutside', release);
    display.on('pointercancel', release);
}
function ensureSceneUiApi(sceneRuntime) {
    if (!sceneRuntime)
        return null;
    if (!sceneRuntime.ui)
        sceneRuntime.ui = {};
    if (!sceneRuntime.ui.nodes)
        sceneRuntime.ui.nodes = new Map();
    if (typeof sceneRuntime.ui.getNode !== 'function') {
        sceneRuntime.ui.getNode = (id) => sceneRuntime.ui.nodes.get(String(id || '')) || null;
    }
    return sceneRuntime.ui;
}
async function renderNode(ctx, pixi, node, parent, registry, theme = null) {
    const prefabName = String(node.prefab || (node.type === 'prefab' ? node.name || node.ref || '' : '') || '').trim();
    if (prefabName) {
        const prefab = await loadPrefabJson(prefabName);
        if (prefab?.root) {
            const props = {
                ...(prefab.defaultProps && typeof prefab.defaultProps === 'object' ? prefab.defaultProps : {}),
                ...(typeof node.props === 'object' && node.props ? node.props : {}),
            };
            const merged = applyPrefabProps(cloneJson(prefab.root), props);
            merged.id = node.id || merged.id || prefabName;
            merged.x = Number(node.x || 0) + Number(merged.x || 0);
            merged.y = Number(node.y || 0) + Number(merged.y || 0);
            if (node.w != null)
                merged.w = Number(node.w || 0) || merged.w;
            if (node.h != null)
                merged.h = Number(node.h || 0) || merged.h;
            // 将实例 props 中的布局属性透传给 prefab root
            const layoutProps = ['layout', 'gap', 'gapX', 'gapY', 'columns', 'padding'];
            for (const key of layoutProps) {
                if (node.props?.[key] != null && merged[key] == null) {
                    merged[key] = node.props[key];
                }
            }
            return renderNode(ctx, pixi, merged, parent);
        }
        ctx.logger.warn(`[SkinRenderer] prefab ${prefabName} 不存在或 root 为空`);
        return null;
    }
    applyContainerLayout(node);
    const type = node.type;
    const style = themedStyle(node, theme);
    const container = new pixi.Container();
    container.x = Number(node.x ?? 0);
    container.y = Number(node.y ?? 0);
    container.width = Number(node.w ?? 0);
    container.height = Number(node.h ?? 0);
    const nodeId = String(node.id || node.name || '');
    if (nodeId)
        container.name = nodeId;
    let display = container;
    switch (type) {
        case 'text': {
            const text = new pixi.Text(String(node.text || ''), {
                fontFamily: String(style.fontFamily || 'Microsoft YaHei, sans-serif'),
                fontSize: Number(style.fontSize ?? 18),
                fill: hexToNumber(style?.fill ?? style?.color, 0xffffff),
                align: style?.align || 'left',
                wordWrap: true,
                wordWrapWidth: Number(node.w ?? 200),
            });
            text.anchor.set(0.5, 0.5);
            text.x = Number(node.w ?? 0) / 2;
            text.y = Number(node.h ?? 0) / 2;
            container.addChild(text);
            break;
        }
        case 'image': {
            const src = resolveUrl(String(node.image || node.src || ''));
            if (src) {
                try {
                    const sprite = pixi.Sprite.from(src);
                    sprite.width = Number(node.w ?? sprite.width);
                    sprite.height = Number(node.h ?? sprite.height);
                    container.addChild(sprite);
                }
                catch (e) {
                    ctx.logger.warn(`[SkinRenderer] 图片加载失败: ${src}`, e);
                }
            }
            break;
        }
        case 'rect': {
            const graphics = new pixi.Graphics();
            const fill = hexToNumber(style?.fill ?? style?.backgroundColor, 0x334155);
            const radius = Number(style?.borderRadius ?? 0);
            const borderWidth = Number(style?.borderWidth ?? 0);
            if (borderWidth > 0 && typeof graphics.lineStyle === 'function') {
                graphics.lineStyle(borderWidth, hexToNumber(String(style?.borderColor || '#000000')));
            }
            graphics.beginFill(fill, style?.opacity == null ? 1 : Number(style.opacity));
            if (radius > 0 && typeof graphics.drawRoundedRect === 'function') {
                graphics.drawRoundedRect(0, 0, Number(node.w ?? 1), Number(node.h ?? 1), radius);
            }
            else {
                graphics.drawRect(0, 0, Number(node.w ?? 1), Number(node.h ?? 1));
            }
            graphics.endFill();
            container.addChild(graphics);
            display = graphics;
            break;
        }
        case 'button': {
            const bg = new pixi.Graphics();
            const fill = hexToNumber(style?.backgroundColor ?? '#0ea5e9', 0x0ea5e9);
            const radius = Number(style?.borderRadius ?? 8);
            const borderWidth = Number(style?.borderWidth ?? 0);
            if (borderWidth > 0 && typeof bg.lineStyle === 'function') {
                bg.lineStyle(borderWidth, hexToNumber(String(style?.borderColor || '#000000')));
            }
            bg.beginFill(fill);
            if (radius > 0) {
                bg.drawRoundedRect(0, 0, Number(node.w ?? 1), Number(node.h ?? 1), radius);
            }
            else {
                bg.drawRect(0, 0, Number(node.w ?? 1), Number(node.h ?? 1));
            }
            bg.endFill();
            container.addChild(bg);
            if (node.text) {
                const text = new pixi.Text(String(node.text), {
                    fontFamily: String(style.fontFamily || 'Microsoft YaHei, sans-serif'),
                    fontSize: Number(style?.fontSize ?? 18),
                    fill: hexToNumber(style?.color ?? '#ffffff', 0xffffff),
                    align: 'center',
                });
                text.anchor.set(0.5, 0.5);
                text.x = Number(node.w ?? 0) / 2;
                text.y = Number(node.h ?? 0) / 2;
                container.addChild(text);
            }
            applyButtonInteraction(container);
            break;
        }
        case 'container':
        default: {
            // container 默认只作为父节点
            break;
        }
    }
    if (nodeId && registry) {
        registry.set(nodeId, { node, display });
    }
    if (node.children) {
        for (const child of node.children) {
            await renderNode(ctx, pixi, child, container, registry, theme);
        }
    }
    parent.addChild(container);
    return display;
}
export default {
    name: '__OV.SkinRenderer',
    install(ctx) {
        // 皮肤容器分层：global 层常驻，scene 层随状态切换刷新。
        // 这样全局 UI（如顶部按钮）不会被普通状态皮肤覆盖。
        let globalSkinContainer = null;
        let sceneSkinContainer = null;
        function clearContainer(container) {
            if (!container)
                return;
            while (container.children && container.children.length > 0) {
                const child = container.children[0];
                container.removeChild(child);
                if (typeof child.destroy === 'function') {
                    try {
                        child.destroy({ children: true, texture: false, baseTexture: false });
                    }
                    catch { }
                }
            }
        }
        const renderer = {
            async renderSkinForScene(blueprint, sceneRuntime, target) {
                const pixi = ctx.engine.pixi;
                const stage = target || ctx.engine.stage;
                if (!pixi || !stage) {
                    ctx.logger.warn('[SkinRenderer] PIXI 未初始化');
                    return;
                }
                const globalStateId = blueprint?.design?.stateMachine?.globalState;
                const isGlobalScene = !!globalStateId && sceneRuntime.id === `${globalStateId}_scene`;
                if (!globalSkinContainer) {
                    globalSkinContainer = new pixi.Container();
                    globalSkinContainer.name = '__globalSkinContainer';
                    stage.addChild(globalSkinContainer);
                }
                if (!sceneSkinContainer) {
                    sceneSkinContainer = new pixi.Container();
                    sceneSkinContainer.name = '__sceneSkinContainer';
                    stage.addChild(sceneSkinContainer);
                }
                const skinName = sceneRuntime.skin;
                if (!skinName) {
                    ctx.logger.warn(`[SkinRenderer] 场景无皮肤: ${sceneRuntime.id}`);
                    return;
                }
                let skin = null;
                try {
                    skin = (await readJson(`./ui/skins/${skinName}.json`));
                }
                catch (e) {
                    ctx.logger.warn(`[SkinRenderer] 皮肤加载失败: ${skinName}`, e);
                    return;
                }
                const rootNode = skin.root || (skin.nodes && skin.nodes[0]);
                if (!rootNode) {
                    ctx.logger.warn(`[SkinRenderer] 皮肤无根节点: ${skinName}`);
                    return;
                }
                const sceneUi = ensureSceneUiApi(sceneRuntime);
                if (sceneUi?.nodes?.clear)
                    sceneUi.nodes.clear();
                // 主题（风格）：skin 顶层 theme 字段 → 节点样式变换 + 画布底色
                const theme = resolveSkinTheme(skin);
                if (theme?.canvasBackground) {
                    try {
                        const app = ctx.engine.app;
                        const c = hexToNumber(theme.canvasBackground);
                        // PIXI v7: renderer.background.color；v6: renderer.backgroundColor
                        if (app?.renderer?.background && 'color' in app.renderer.background)
                            app.renderer.background.color = c;
                        else if (app?.renderer && 'backgroundColor' in app.renderer)
                            app.renderer.backgroundColor = c;
                    }
                    catch { /* 背景设置失败不阻断 */ }
                }
                const previousScene = ctx.scene;
                ctx.scene = sceneRuntime;
                try {
                    if (isGlobalScene) {
                        clearContainer(globalSkinContainer);
                        await renderNode(ctx, pixi, rootNode, globalSkinContainer, sceneUi?.nodes, theme);
                        ctx.logger.info(`[SkinRenderer] 全局皮肤渲染完成: ${skinName}`);
                    }
                    else {
                        clearContainer(sceneSkinContainer);
                        await renderNode(ctx, pixi, rootNode, sceneSkinContainer, sceneUi?.nodes, theme);
                    }
                }
                finally {
                    ctx.scene = previousScene;
                }
                const payload = { sceneId: sceneRuntime.id, skinName, nodes: sceneUi?.nodes ? [...sceneUi.nodes.keys()] : [], ui: sceneRuntime.ui };
                sceneRuntime.event?.emit?.('ui:skin:ready', payload);
                ctx.system?.events?.emit?.('ui:skin:ready', payload);
            },
            clear() {
                clearContainer(globalSkinContainer);
                clearContainer(sceneSkinContainer);
            },
        };
        ctx.system.skinRenderer = renderer;
    },
};
//# sourceMappingURL=skin-renderer-module.js.map