/**
 * __OV.Map — 地图模块
 *
 * 支持网格/六边形地图的单元格管理、坐标转换和对象层渲染。
 */
export default {
    name: '__OV.Map',
    install(ctx) {
        let config = { width: 10, height: 10, cellSize: 32, gridType: 'square' };
        const cells = new Map();
        const layers = new Map();
        const mapConfigs = new Map();
        const tapHandlers = new Set();
        function key(r, c) {
            return `${r},${c}`;
        }
        ctx.system.map = {
            configure(cfg) {
                config = { ...config, ...cfg };
                cells.clear();
                for (let r = 0; r < config.height; r++) {
                    for (let c = 0; c < config.width; c++) {
                        cells.set(key(r, c), { x: c * config.cellSize, y: r * config.cellSize, row: r, col: c });
                    }
                }
            },
            getCell(row, col) {
                return cells.get(key(row, col));
            },
            getCellAtPixel(px, py) {
                const col = Math.floor(px / config.cellSize);
                const row = Math.floor(py / config.cellSize);
                return cells.get(key(row, col));
            },
            getNeighbors(row, col) {
                const offsets = config.gridType === 'hex'
                    ? [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, col % 2 === 0 ? -1 : 1], [1, col % 2 === 0 ? -1 : 1]]
                    : [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1], [1, -1], [1, 1]];
                const result = [];
                for (const [dr, dc] of offsets) {
                    const cell = cells.get(key(row + dr, col + dc));
                    if (cell)
                        result.push(cell);
                }
                return result;
            },
            setTerrain(row, col, terrain) {
                const cell = cells.get(key(row, col));
                if (cell)
                    cell.terrain = terrain;
            },
            getAllCells() {
                return Array.from(cells.values());
            },
            getConfig() {
                return { ...config };
            },
            // ── 对象层管理（五子棋棋子渲染所需） ──
            registerMapConfig(mapConfigId, cfg) {
                mapConfigs.set(mapConfigId, cfg);
            },
            getMapConfig(mapConfigId) {
                return mapConfigs.get(mapConfigId);
            },
            setLayer(mapId, layerId, layerCells) {
                const fullId = `${mapId}:${layerId}`;
                layers.set(fullId, { cells: layerCells });
                ctx.logger.info(`[Map] setLayer ${fullId}, cells=${layerCells.length}`);
            },
            getLayer(mapId, layerId) {
                const fullId = `${mapId}:${layerId}`;
                return layers.get(fullId)?.cells ?? [];
            },
            removeLayer(mapId, layerId) {
                const fullId = `${mapId}:${layerId}`;
                return layers.delete(fullId);
            },
            clearLayers(mapId) {
                for (const key of layers.keys()) {
                    if (key.startsWith(`${mapId}:`))
                        layers.delete(key);
                }
            },
            getAllLayers(mapId) {
                const result = {};
                for (const [key, layer] of layers) {
                    if (key.startsWith(`${mapId}:`)) {
                        const layerId = key.slice(mapId.length + 1);
                        result[layerId] = layer.cells;
                    }
                }
                return result;
            },
            // ── 点击事件 ──
            onTap(handler) {
                tapHandlers.add(handler);
                return () => tapHandlers.delete(handler);
            },
            emitTap(payload) {
                for (const h of tapHandlers)
                    h(payload);
            },
        };
    },
};
//# sourceMappingURL=map-module.js.map