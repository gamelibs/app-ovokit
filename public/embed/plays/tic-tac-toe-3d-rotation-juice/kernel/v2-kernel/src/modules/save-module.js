/**
 * __OV.Save — localStorage 持久化
 */
export default {
    name: '__OV.Save',
    install(ctx) {
        // 从完整蓝图获取 projectId，如果不可用则使用默认值
        const fullBp = window.__BLUEPRINT__;
        const prefix = `ovo_${fullBp?.projectId ?? 'unknown'}_`;
        ctx.system.save = {
            get(key) {
                try {
                    const raw = localStorage.getItem(prefix + key);
                    if (raw === null)
                        return undefined;
                    return JSON.parse(raw);
                }
                catch {
                    return undefined;
                }
            },
            set(key, value) {
                try {
                    localStorage.setItem(prefix + key, JSON.stringify(value));
                }
                catch (err) {
                    ctx.logger.warn(`[Save] 写入失败: ${key}`, err);
                }
            },
            remove(key) {
                localStorage.removeItem(prefix + key);
            },
            clear() {
                for (let i = localStorage.length - 1; i >= 0; i--) {
                    const k = localStorage.key(i);
                    if (k && k.startsWith(prefix)) {
                        localStorage.removeItem(k);
                    }
                }
            },
        };
    },
};
//# sourceMappingURL=save-module.js.map