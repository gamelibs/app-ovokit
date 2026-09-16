/**
 * __OV.ResMgr — 资源管理模块
 *
 * 资源分组、数据资源、图集、内存预算、LRU 淘汰。
 */
export default {
    name: '__OV.ResMgr',
    install(ctx) {
        const groups = new Map();
        const loadedUrls = new Set();
        const dataResources = new Map();
        let memoryBudget = 50 * 1024 * 1024; // 默认 50MB
        ctx.system.resMgr = {
            createGroup(name, urls) {
                const group = { name, urls };
                groups.set(name, group);
                return group;
            },
            getGroup(name) {
                return groups.get(name);
            },
            removeGroup(name) {
                return groups.delete(name);
            },
            markLoaded(url) {
                loadedUrls.add(url);
            },
            isLoaded(url) {
                return loadedUrls.has(url);
            },
            unload(url) {
                loadedUrls.delete(url);
            },
            getStats() {
                return {
                    groupCount: groups.size,
                    loadedCount: loadedUrls.size,
                    memoryBudget,
                };
            },
            setMemoryBudget(mb) {
                memoryBudget = mb * 1024 * 1024;
            },
            clear() {
                groups.clear();
                loadedUrls.clear();
                dataResources.clear();
            },
            // ── 数据资源管理（五子棋 level.json / gomoku-ai.json 所需） ──
            registerData(id, data) {
                dataResources.set(id, data);
            },
            getData(id) {
                return dataResources.get(id);
            },
            hasData(id) {
                return dataResources.has(id);
            },
            removeData(id) {
                return dataResources.delete(id);
            },
            getAllDataIds() {
                return Array.from(dataResources.keys());
            },
        };
        // 兼容 v1: ctx.system.resources 是 ctx.system.resMgr 的别名
        ctx.system.resources = ctx.system.resMgr;
    },
};
//# sourceMappingURL=res-mgr-module.js.map