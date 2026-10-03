/**
 * __OV.DataChannel — 聚合 Memory + Save，get 优先 Memory
 */
export default {
    name: '__OV.DataChannel',
    install(ctx) {
        const memory = ctx.system.memory;
        const save = ctx.system.save;
        const watchers = new Map();
        function notify(key, value) {
            const fns = watchers.get(key);
            if (!fns)
                return;
            for (const fn of [...fns]) {
                try {
                    fn(value);
                }
                catch { }
            }
        }
        ctx.system.dataChannel = {
            get(key) {
                const mem = memory?.get(key);
                if (mem !== undefined)
                    return mem;
                return save?.get(key);
            },
            set(key, value, persistent = false) {
                memory?.set(key, value);
                if (persistent) {
                    save?.set(key, value);
                }
                notify(key, value);
            },
            watch(key, fn) {
                if (typeof fn !== 'function')
                    return () => { };
                let set = watchers.get(key);
                if (!set) {
                    set = new Set();
                    watchers.set(key, set);
                }
                set.add(fn);
                return () => {
                    set?.delete(fn);
                    if (set && set.size === 0)
                        watchers.delete(key);
                };
            },
        };
        // 快捷访问
        ctx.data = ctx.system.dataChannel;
    },
};
//# sourceMappingURL=data-channel-module.js.map