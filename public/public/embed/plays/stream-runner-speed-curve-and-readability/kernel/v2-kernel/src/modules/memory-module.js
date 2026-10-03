/**
 * __OV.Memory — 运行时内存键值存储
 *
 * 支持全局读写和命名空间隔离。
 */
export default {
    name: '__OV.Memory',
    install(ctx) {
        const store = new Map();
        const namespaces = new Map();
        function getNamespace(ns) {
            let map = namespaces.get(ns);
            if (!map) {
                map = new Map();
                namespaces.set(ns, map);
            }
            return map;
        }
        ctx.system.memory = {
            get(key) {
                return store.get(key);
            },
            set(key, value) {
                store.set(key, value);
            },
            has(key) {
                return store.has(key);
            },
            delete(key) {
                return store.delete(key);
            },
            clear() {
                store.clear();
                namespaces.clear();
            },
            // ── 命名空间支持（v1 兼容） ──
            namespace(ns) {
                const map = getNamespace(ns);
                return {
                    get(key) {
                        return map.get(key);
                    },
                    set(key, value) {
                        map.set(key, value);
                    },
                    has(key) {
                        return map.has(key);
                    },
                    delete(key) {
                        return map.delete(key);
                    },
                    clear() {
                        map.clear();
                    },
                };
            },
        };
    },
};
//# sourceMappingURL=memory-module.js.map