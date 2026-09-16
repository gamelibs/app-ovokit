/**
 * __OV.LayerUI — UI 图层树模块
 *
 * 管理 UI 图层的 zIndex、可见性、透明度。
 * 向 ctx.system.layerUI 暴露图层管理 API。
 */
export default {
    name: '__OV.LayerUI',
    install(ctx) {
        const layers = new Map();
        const layerOrder = [];
        function sortLayers() {
            layerOrder.sort((a, b) => (layers.get(a)?.zIndex ?? 0) - (layers.get(b)?.zIndex ?? 0));
        }
        ctx.system.layerUI = {
            create(id, zIndex = 0) {
                const layer = { id, zIndex, visible: true, alpha: 1 };
                layers.set(id, layer);
                if (!layerOrder.includes(id))
                    layerOrder.push(id);
                sortLayers();
                return layer;
            },
            get(id) {
                return layers.get(id);
            },
            remove(id) {
                const idx = layerOrder.indexOf(id);
                if (idx !== -1)
                    layerOrder.splice(idx, 1);
                return layers.delete(id);
            },
            setZIndex(id, zIndex) {
                const layer = layers.get(id);
                if (layer) {
                    layer.zIndex = zIndex;
                    sortLayers();
                }
            },
            setVisible(id, visible) {
                const layer = layers.get(id);
                if (layer)
                    layer.visible = visible;
            },
            setAlpha(id, alpha) {
                const layer = layers.get(id);
                if (layer)
                    layer.alpha = Math.max(0, Math.min(1, alpha));
            },
            sort() {
                sortLayers();
            },
            getOrder() {
                return layerOrder.slice();
            },
            clear() {
                layers.clear();
                layerOrder.length = 0;
            },
        };
    },
};
//# sourceMappingURL=layer-ui-module.js.map