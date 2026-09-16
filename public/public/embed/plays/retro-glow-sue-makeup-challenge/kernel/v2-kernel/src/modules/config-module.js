/**
 * __OV.Config — 配置与外部库加载模块
 *
 * 当前简化实现：提供配置存储和外部脚本加载能力。
 * 后期扩展：支持动态加载 PIXI.js 等外部库。
 */
export default {
    name: '__OV.Config',
    install(ctx) {
        const configStore = new Map();
        ctx.system.config = {
            get(key) {
                return configStore.get(key);
            },
            set(key, value) {
                configStore.set(key, value);
            },
            loadScript(src) {
                return new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = src;
                    script.onload = () => resolve();
                    script.onerror = () => reject(new Error(`加载脚本失败: ${src}`));
                    document.head.appendChild(script);
                });
            },
        };
    },
};
//# sourceMappingURL=config-module.js.map