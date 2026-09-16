/**
 * __OV.Render — 渲染模块（简化版）
 *
 * 当前使用 2D Canvas API 作为最小可运行实现。
 * 后期替换为 PixiJS v8 Application。
 *
 * 向 ctx.system.render 暴露 RenderAPI
 */
export default {
    name: '__OV.Render',
    install(ctx) {
        const canvas = ctx.canvas;
        const c2d = canvas.getContext('2d');
        // 如果 PIXI 已初始化（预览模式），WebGL 占用了 canvas，2D context 不可得
        // 此时创建基于 PIXI 的兼容 RenderAPI，不抛出错误
        if (!c2d && ctx.engine.pixi && ctx.engine.stage) {
            const app = ctx.engine.app;
            const render = {
                canvas,
                ctx: null,
                width: ctx.width,
                height: ctx.height,
                clear(color = '#0f172a') {
                    if (app?.renderer?.background) {
                        app.renderer.background.color = color;
                    }
                },
            };
            ctx.system.render = render;
            ctx.engine.render = render;
            ctx.system.render.layers = { globalOverlay: ctx.engine.stage };
            return;
        }
        if (!c2d) {
            throw new Error('[__OV.Render] 无法获取 Canvas 2D 上下文');
        }
        const render = {
            canvas,
            ctx: c2d,
            width: ctx.width,
            height: ctx.height,
            clear(color = '#0f172a') {
                c2d.fillStyle = color;
                c2d.fillRect(0, 0, canvas.width, canvas.height);
            },
        };
        ctx.system.render = render;
        ctx.engine.render = render;
        // 如果 PIXI 已初始化（预览模式），同步暴露 PIXI 的 stage 供 SkinRenderer 使用
        if (ctx.engine.pixi && ctx.engine.stage) {
            ctx.system.render.layers = { globalOverlay: ctx.engine.stage };
        }
    },
};
//# sourceMappingURL=render-module.js.map