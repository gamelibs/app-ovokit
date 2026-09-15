/**
 * __OV.Input — 指针事件模块
 *
 * 监听 canvas 上的 pointer 事件，通过 EventBus 分发。
 */
export default {
    name: '__OV.Input',
    install(ctx) {
        const canvas = ctx.canvas;
        const eventBus = ctx.system.events;
        if (!eventBus) {
            ctx.logger.warn('[__OV.Input] EventBus 未就绪');
            return;
        }
        function makeData(e) {
            const rect = canvas.getBoundingClientRect();
            // 使用设计尺寸（可能被 PIXI autoDensity 放大后的 canvas.width 不是设计尺寸）
            const designWidth = Number(canvas.dataset.designWidth || canvas.width);
            const designHeight = Number(canvas.dataset.designHeight || canvas.height);
            // 将 CSS 像素坐标映射到 canvas 内部逻辑坐标
            const scaleX = designWidth / rect.width;
            const scaleY = designHeight / rect.height;
            return {
                x: (e.clientX - rect.left) * scaleX,
                y: (e.clientY - rect.top) * scaleY,
                pointerId: e.pointerId,
                type: e.type === 'pointerdown' ? 'down' : e.type === 'pointerup' ? 'up' : 'move',
            };
        }
        const onPointerDown = (e) => eventBus.emit('input:pointerDown', makeData(e));
        const onPointerUp = (e) => eventBus.emit('input:pointerUp', makeData(e));
        const onPointerMove = (e) => eventBus.emit('input:pointerMove', makeData(e));
        canvas.addEventListener('pointerdown', onPointerDown);
        canvas.addEventListener('pointerup', onPointerUp);
        canvas.addEventListener('pointermove', onPointerMove);
        // 存储清理函数供 destroy 使用
        ctx.system.input = {
            ...(ctx.system.input ?? {}),
            _cleanup: () => {
                canvas.removeEventListener('pointerdown', onPointerDown);
                canvas.removeEventListener('pointerup', onPointerUp);
                canvas.removeEventListener('pointermove', onPointerMove);
            },
        };
    },
    destroy(ctx) {
        const cleanup = ctx.system.input?._cleanup;
        if (cleanup)
            cleanup();
    },
};
//# sourceMappingURL=input-module.js.map